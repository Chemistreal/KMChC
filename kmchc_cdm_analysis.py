# -*- coding: utf-8 -*-
"""
KMChC 인지진단 (Stage 5, DINA + Q-행렬)
=======================================
ETL long 출력을 먹고 개념(C) 응답으로 인지진단을 한다 — 학생별 '오개념 프로파일'.
CDM 라이브러리 의존 없이 DINA EM을 numpy로 직접 구현.

  python kmchc_cdm_analysis.py --long kmchc_long.csv --items items.json \
         --out cdm_report.md --csv kmchc_mastery.csv [--qmatrix qmatrix.csv]

Q-행렬: 기본은 문항의 intu(보존/입자/변화)로 잠정 생성(단일 속성).
        --qmatrix 로 주석된 코드북 기반 Q-행렬(다속성 가능)을 넣으면 그것을 사용.
주의: 인지진단은 Q-행렬 타당성과 N에 민감. 소표본/잠정 Q는 잠정 결과.
"""
import argparse, json, itertools
import numpy as np, pandas as pd

def f(x, nd=2):
    try:
        if x is None or (isinstance(x, float) and np.isnan(x)): return "—"
        return ("%."+str(nd)+"f") % x
    except: return "—"

def kind_of(it):
    return it.get("kind") or ("forced16" if it["block"]=="B" else ("misconception" if it["block"]=="C" else "?"))

def build_qmatrix(items, qpath=None):
    Citems = [it for it in items if kind_of(it) == "misconception"]
    cids = [it["id"] for it in Citems]
    if qpath:
        q = pd.read_csv(qpath, index_col=0)
        q = q.reindex(cids).fillna(0)
        return cids, list(q.columns), q.to_numpy(dtype=int)
    # intu 기반 단일속성
    KCs = sorted({it.get("intu") for it in Citems if it.get("intu")})
    Q = np.zeros((len(cids), len(KCs)), dtype=int)
    for i, it in enumerate(Citems):
        if it.get("intu") in KCs: Q[i, KCs.index(it["intu"])] = 1
    return cids, KCs, Q

def dina_em(X, Q, max_iter=300, tol=1e-5):
    N, J = X.shape; K = Q.shape[1]; L = 2**K
    A = np.array([[ (l >> k) & 1 for k in range(K)] for l in range(L)], dtype=int)   # L x K
    eta = np.zeros((L, J))
    for j in range(J):
        req = Q[j] == 1
        eta[:, j] = (A[:, req] == 1).all(axis=1).astype(float) if req.any() else 1.0
    s = np.full(J, 0.2); g = np.full(J, 0.2); pi = np.full(L, 1.0/L)
    mask = (~np.isnan(X)).astype(float); Xf = np.nan_to_num(X, nan=0.0)
    prev = -np.inf; it = 0
    for it in range(max_iter):
        P = np.clip(np.where(eta == 1, 1-s, g), 1e-6, 1-1e-6)         # L x J
        logP, log1P = np.log(P), np.log(1-P)
        LL = (Xf*mask) @ logP.T + ((1-Xf)*mask) @ log1P.T            # N x L
        LL += np.log(pi)[None, :]
        m = LL.max(axis=1, keepdims=True)
        post = np.exp(LL - m); post /= post.sum(axis=1, keepdims=True)
        ll = float((m.squeeze() + np.log(np.exp(LL - m).sum(axis=1))).sum())
        pi = np.clip(post.mean(axis=0), 1e-6, 1); pi /= pi.sum()
        w_eta = post @ eta                                           # N x J  (P(eta=1))
        n1 = (w_eta*mask).sum(0); r1 = (w_eta*mask*Xf).sum(0)
        n0 = ((1-w_eta)*mask).sum(0); r0 = ((1-w_eta)*mask*Xf).sum(0)
        with np.errstate(divide="ignore", invalid="ignore"):
            s = np.clip(1 - r1/np.where(n1 > 0, n1, np.nan), 1e-3, 0.6)
            g = np.clip(r0/np.where(n0 > 0, n0, np.nan), 1e-3, 0.6)
        s = np.nan_to_num(s, nan=0.2); g = np.nan_to_num(g, nan=0.2)
        if abs(ll - prev) < tol: break
        prev = ll
    mastery = post @ A                                              # N x K  P(attr=1)
    return dict(s=s, g=g, pi=pi, post=post, A=A, mastery=mastery, ll=ll, iters=it+1, K=K, L=L)

def report(df, items, out_md, out_csv, qpath=None):
    cids, KCs, Q = build_qmatrix(items, qpath)
    if len(KCs) > 12:
        # 프로파일 2^K 폭발 방지
        pass
    # 개념 응답 행렬
    c = df[df.cell_role == "t1"].copy(); c["v"] = pd.to_numeric(c["correct"], errors="coerce")
    W = c.pivot_table(index="student_id", columns="item_id", values="v", aggfunc="first")
    cids = [i for i in cids if i in W.columns]
    Qd = pd.DataFrame(Q, index=[it["id"] for it in items if kind_of(it)=="misconception"], columns=KCs).reindex(cids)
    X = W[cids].to_numpy(dtype=float)
    res = dina_em(X, Qd.to_numpy(dtype=int))

    L = []; line = L.append
    line("# KMChC 인지진단 (Stage 5, DINA)")
    line("> Q-행렬 기반 학생별 오개념(개념 숙달) 프로파일. **잠정 Q·소표본은 잠정**.")
    line("\n## 0. Q-행렬 (지식요소)")
    line("지식요소(KC): %s" % ", ".join(KCs))
    line("문항 수 %d · KC %d · 잠재 프로파일 2^%d=%d개" % (len(cids), len(KCs), res["K"], res["L"]))
    cnt = Qd.sum(axis=0).astype(int)
    line("\n| KC | 측정 문항수 |"); line("|---|---|")
    for kc in KCs: line("| %s | %d |" % (kc, int(cnt[kc])))
    line("\n*기본 Q는 intu 단일속성. 코드북 KC_formal 주석으로 다속성·정교화 가능(--qmatrix).*")

    # 문항 모수
    line("\n## 1. 문항 모수 (slip·guess)")
    line("*slip=숙달자가 틀릴 확률, guess=비숙달자가 맞힐 확률. 둘 다 낮을수록 좋은 문항(>0.4 점검).*")
    line("| 문항 | KC | slip s | guess g | 플래그 |"); line("|---|---|---|---|---|")
    s, g = res["s"], res["g"]
    for i, it in enumerate(cids):
        kc = KCs[int(np.argmax(Qd.loc[it].to_numpy()))] if Qd.loc[it].sum() else "—"
        fl = []
        if s[i] > 0.4: fl.append("높은 slip")
        if g[i] > 0.4: fl.append("높은 guess")
        if (1-s[i]) <= g[i]: fl.append("비단조!")
        line("| %s | %s | %s | %s | %s |" % (it, kc, f(s[i]), f(g[i]), ", ".join(fl) or "—"))

    # KC 숙달 분포
    line("\n## 2. KC 숙달 분포")
    M = res["mastery"]                       # N x K  P(attr=1)
    line("| KC | 평균 숙달확률 | 숙달자 비율(>0.5) |"); line("|---|---|---|")
    for k, kc in enumerate(KCs):
        line("| %s | %s | %.0f%% |" % (kc, f(M[:, k].mean()), 100*np.mean(M[:, k] > 0.5)))

    # 프로파일 분포
    line("\n## 3. 프로파일 분포 (상위)")
    A = res["A"]; pi = res["pi"]
    idx = np.argsort(-pi)[:8]
    line("| 프로파일(%s) | 비율 |" % "·".join(KCs)); line("|---|---|")
    for l in idx:
        prof = "".join(str(x) for x in A[l]); line("| %s | %.0f%% |" % (prof, 100*pi[l]))

    line("\n## 4. 적합/요약")
    line("- 로그우도 %s, EM 반복 %d회, 응답자 %d명." % (f(res["ll"], 1), res["iters"], X.shape[0]))
    line("- 예시(앞 3명) KC 숙달확률:")
    sids = list(W.index)[:3]
    for n, sid in enumerate(sids):
        line("  - %s: %s" % (sid, ", ".join("%s=%.2f" % (kc, M[n, k]) for k, kc in enumerate(KCs))))

    line("\n## 5. 다음 단계")
    line("- 코드북 KC_formal 주석으로 **타당한 Q-행렬**(다속성) 확정 → 재적합.")
    line("- Q-행렬 적합도/오분류(예: Q-행렬 검증)·G-DINA로 확장.")
    line("- 학생별 KC 프로파일 → 리포트의 '오개념 진단' + 처방(Stage 9) 입력.")
    line("\n---\n*DINA는 Q-행렬 타당성에 민감. 주석된 Q와 충분한 N에서 재적합 필요.*")

    open(out_md, "w", encoding="utf-8").write("\n".join(L))
    # per-student mastery CSV
    out = pd.DataFrame(M, index=W.index, columns=["P_"+k for k in KCs])
    out["MAP_profile"] = ["".join(str(int(M[i, k] > 0.5)) for k in range(len(KCs))) for i in range(M.shape[0])]
    out.to_csv(out_csv, encoding="utf-8-sig")
    return KCs

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--long", required=True)
    ap.add_argument("--items", default="items.json")
    ap.add_argument("--out", default="cdm_report.md")
    ap.add_argument("--csv", default="kmchc_mastery.csv")
    ap.add_argument("--qmatrix", default=None)
    a = ap.parse_args()
    df = pd.read_csv(a.long, dtype=str).fillna("")
    items = json.load(open(a.items, encoding="utf-8"))
    kcs = report(df, items, a.out, a.csv, a.qmatrix)
    print("리포트:", a.out, "| 숙달:", a.csv, "| KC:", kcs)

if __name__ == "__main__":
    main()
