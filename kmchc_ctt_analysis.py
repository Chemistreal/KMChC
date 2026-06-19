# -*- coding: utf-8 -*-
"""
KMChC 고전 문항분석 (Stage 2)
==============================
ETL long 출력을 먹고 CTT 지표를 낸다 — 난이도·변별도·신뢰도(KR-20/α·ω)·오답지 분석.

  python kmchc_ctt_analysis.py --long kmchc_long.csv --out ctt_report.md --csv item_stats.csv

척도
  · 개념이해(C)  : 정답(0/1) → KR-20, 점이연 변별도, 난이도 p, 오답지 분석
  · 리커트 구인  : 구인별 α/ω, 수정 문항-총점 상관, α-삭제시, 평균/표준편차
  · B/범주형     : 분포만 기술(아이프시브·범주형은 Stage 3+에서 별도 처리)

소표본 경고: N이 충분(파일럿 ≥200)해진 뒤 해석. 데모/소표본 통계는 잠정.
"""
import argparse
import numpy as np, pandas as pd

LIK_REL = {"ladder","context","general","relative","internalize"}  # 신뢰도용 리커트 종류

def f(x, nd=2):
    try:
        if x is None or (isinstance(x,float) and (np.isnan(x))): return "—"
        return ("%."+str(nd)+"f") % x
    except: return "—"

def to_num(s): return pd.to_numeric(s, errors="coerce")

def cronbach_alpha(M):
    k = M.shape[1]
    if k < 2 or M.shape[0] < 3: return np.nan
    vi = M.var(axis=0, ddof=1).sum(); vt = M.sum(axis=1).var(ddof=1)
    return (k/(k-1))*(1 - vi/vt) if vt > 0 else np.nan

def omega_pca(M):
    if M.shape[1] < 2 or M.shape[0] < 3: return np.nan
    R = np.corrcoef(M, rowvar=False)
    if np.isnan(R).any(): return np.nan
    w, v = np.linalg.eigh(R); i = int(np.argmax(w))
    lam = v[:, i] * np.sqrt(max(w[i], 0.0))
    if lam.sum() < 0: lam = -lam
    lam = np.clip(lam, -0.999, 0.999)
    s = lam.sum(); uniq = (1 - lam**2).sum()
    return s*s/(s*s + uniq) if (s*s + uniq) > 0 else np.nan

def corr(a, b):
    if len(a) < 3 or np.std(a) == 0 or np.std(b) == 0: return np.nan
    return float(np.corrcoef(a, b)[0, 1])

def wide(df, mask, value_col):
    sub = df[mask].copy(); sub["v"] = to_num(sub[value_col])
    return sub.pivot_table(index="student_id", columns="item_id", values="v", aggfunc="first")

def analyze(W, name):
    items = list(W.columns)
    # 문항 순서를 q_no로
    Wc = W.dropna(axis=0, how="any")
    M = Wc.to_numpy(dtype=float)
    n = M.shape[0]
    alpha = cronbach_alpha(M); omega = omega_pca(M)
    rows = []
    for j, it in enumerate(items):
        col = to_num(W[it]).dropna()
        diff = col.mean() if len(col) else np.nan
        sd = col.std(ddof=1) if len(col) > 1 else np.nan
        if n > 2 and M.shape[1] > 1:
            rest = M.sum(axis=1) - M[:, j]
            disc = corr(M[:, j], rest)
            aid = cronbach_alpha(np.delete(M, j, axis=1)) if M.shape[1] > 2 else np.nan
        else:
            disc = aid = np.nan
        rows.append(dict(scale=name, item=it, n=int(len(col)),
                         difficulty=diff, sd=sd, discrimination=disc, alpha_if_deleted=aid))
    return dict(name=name, k=len(items), n=n, alpha=alpha, omega=omega, rows=rows)

def distractor(df):
    c = df[df.cell_role == "t1"].copy(); c["correct"] = to_num(c["correct"])
    tot = c.groupby("student_id")["correct"].sum()            # 개념 총점(문항 포함, 약식)
    out = {}
    for it, g in c.groupby("item_id"):
        n = len(g); opts = []
        for key, gg in g.groupby(["raw", "label", "misconception"], dropna=False):
            raw, label, misc = key
            ms = tot.reindex(gg["student_id"]).mean()
            opts.append((str(raw), label or "", misc or "", len(gg), len(gg)/n if n else 0, ms))
        out[it] = sorted(opts, key=lambda x: x[0])
    return out

def build_report(df):
    L = []; line = L.append
    students = df["student_id"].nunique()
    line("# KMChC 고전 문항분석 (Stage 2)")
    line("> ETL long 입력. 응답 N=%d. **소표본은 잠정** — 파일럿 ≥200에서 해석." % students)

    # ----- 척도 신뢰도 -----
    line("\n## 1. 척도 신뢰도")
    scales = []
    # 개념이해
    Wc = wide(df, df.cell_role == "t1", "correct")
    if Wc.shape[1] > 0: scales.append(analyze(Wc, "개념이해(C)"))
    # 리커트 구인별
    lik = df[(df.cell_role == "val") & (df.kind.isin(LIK_REL))]
    for con, g in lik.groupby("construct"):
        if not con: continue
        W = wide(g, g.index.notna() if False else g["construct"] == con, "scored") if False else \
            g.assign(v=to_num(g["scored"])).pivot_table(index="student_id", columns="item_id", values="v", aggfunc="first")
        if W.shape[1] >= 2: scales.append(analyze(W, "리커트:%s" % con))
    line("| 척도 | 문항수 k | 사례수 N(listwise) | α (KR-20) | ω (근사) |")
    line("|---|---|---|---|---|")
    for s in scales:
        line("| %s | %d | %d | %s | %s |" % (s["name"], s["k"], s["n"], f(s["alpha"]), f(s["omega"])))
    line("\n*α≥0.7 양호(척도용)·≥0.8 우수. ω는 단일요인 PCA 근사(정식 ω는 Stage 3 CFA).*")

    # ----- 개념이해 문항 통계 -----
    cs = next((s for s in scales if s["name"].startswith("개념이해")), None)
    if cs:
        line("\n## 2. 개념이해(C) 문항 통계")
        line("| 문항 | N | 난이도 p | 변별도(점이연) | α-삭제시 | 플래그 |")
        line("|---|---|---|---|---|---|")
        for r in sorted(cs["rows"], key=lambda x: (x["difficulty"] if not np.isnan(x["difficulty"]) else 9)):
            fl = []
            p, d = r["difficulty"], r["discrimination"]
            if not np.isnan(p) and p < 0.20: fl.append("너무 어려움")
            if not np.isnan(p) and p > 0.95: fl.append("너무 쉬움")
            if not np.isnan(d) and d < 0: fl.append("역변별!")
            elif not np.isnan(d) and d < 0.15: fl.append("저변별")
            line("| %s | %d | %s | %s | %s | %s |" % (r["item"], r["n"], f(p), f(d), f(r["alpha_if_deleted"]), ", ".join(fl) or "—"))

        # ----- 오답지 분석 -----
        line("\n## 3. 오답지 분석 (C)")
        line("*선택자 평균점수: 정답지>오답지여야 정상. 오답지가 더 높으면 키/문항 점검.*")
        dd = distractor(df)
        order = [r["item"] for r in sorted(cs["rows"], key=lambda x: x["item"])]
        for it in order[:12]:  # 처음 12문항만 (전체는 CSV로)
            line("\n**%s**" % it)
            line("| 보기(raw) | 의미 | 오개념 | 선택률 | 선택자 평균점수 |")
            line("|---|---|---|---|---|")
            for raw, label, misc, cnt, prop, ms in dd.get(it, []):
                line("| %s | %s | %s | %.0f%% | %s |" % (raw, label, misc, 100*prop, f(ms)))
        if len(order) > 12: line("\n*(나머지 문항 오답지 분포는 item_stats CSV 및 long에서 확인)*")

    # ----- 리커트 문항 통계 -----
    likscales = [s for s in scales if s["name"].startswith("리커트")]
    if likscales:
        line("\n## 4. 리커트 구인별 문항 통계")
        for s in likscales:
            line("\n**%s** (α=%s, ω=%s, N=%d)" % (s["name"], f(s["alpha"]), f(s["omega"]), s["n"]))
            line("| 문항 | N | 평균 | 표준편차 | 수정 문항-총점 r | α-삭제시 | 플래그 |")
            line("|---|---|---|---|---|---|---|")
            for r in s["rows"]:
                fl = []
                if not np.isnan(r["discrimination"]) and r["discrimination"] < 0.30: fl.append("저변별")
                if not np.isnan(r["sd"]) and r["sd"] < 0.30: fl.append("무변별")
                if not np.isnan(r["difficulty"]) and r["difficulty"] < 1.5: fl.append("바닥")
                if not np.isnan(r["difficulty"]) and r["difficulty"] > 4.5: fl.append("천장")
                line("| %s | %d | %s | %s | %s | %s | %s |" % (
                    r["item"], r["n"], f(r["difficulty"]), f(r["sd"]), f(r["discrimination"]), f(r["alpha_if_deleted"]), ", ".join(fl) or "—"))

    # ----- 종합 불량문항 후보 -----
    line("\n## 5. 점검 후보 (요약)")
    bad = []
    for s in scales:
        for r in s["rows"]:
            d = r["discrimination"]
            if (not np.isnan(d) and d < (0.15 if s["name"].startswith("개념") else 0.30)) or (not np.isnan(d) and d < 0):
                bad.append((s["name"], r["item"], f(d)))
    if bad:
        line("저변별/역변별 후보: " + ", ".join("%s(%s, r=%s)" % (b[1], b[0], b[2]) for b in bad[:20]))
    else:
        line("- 뚜렷한 저변별 문항 없음(또는 표본 부족).")
    line("\n---\n*다음: 충분한 N에서 Stage 3(요인구조·측정불변성 CFA) → Stage 4(IRT 보정).*")
    return "\n".join(L), scales

def item_stats_csv(scales, path):
    rows = []
    for s in scales:
        for r in s["rows"]:
            rows.append(r)
    pd.DataFrame(rows).to_csv(path, index=False, encoding="utf-8-sig")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--long", required=True)
    ap.add_argument("--out", default="ctt_report.md")
    ap.add_argument("--csv", default="kmchc_item_stats.csv")
    a = ap.parse_args()
    df = pd.read_csv(a.long, dtype=str).fillna("")
    md, scales = build_report(df)
    open(a.out, "w", encoding="utf-8").write(md)
    item_stats_csv(scales, a.csv)
    print("리포트:", a.out, "| 문항통계:", a.csv, "| 척도:", [s["name"] for s in scales])

if __name__ == "__main__":
    main()
