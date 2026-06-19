# -*- coding: utf-8 -*-
"""
KMChC IRT 보정 (Stage 4)
========================
ETL long 출력을 먹고 문항반응이론으로 문항을 보정한다 (girth).

  python kmchc_irt_analysis.py --long kmchc_long.csv --out irt_report.md --csv irt_params.csv

내용
  · 개념이해(C, 이분) → 2PL: 변별 a · 곤란도 b · 검사정보곡선 · 주변신뢰도 · EAP θ
  · 리커트 구인 → 등급반응모형(GRM): 기울기 a · 단계 임계값 b1..b4 (역전 임계값 플래그)
NRM(명목반응, 오답지별 정보)은 girth 미지원 → 향후 R `mirt`/전용 구현.
주의: IRT 보정은 N이 충분(≥500 권장)해야 안정. 소표본/데모는 잠정.
"""
import argparse, warnings
import numpy as np, pandas as pd
import girth

LIK_REL = {"ladder","context","general","relative","internalize"}
MISS = girth.INVALID_RESPONSE

def f(x, nd=2):
    try:
        if x is None or (isinstance(x, float) and np.isnan(x)): return "—"
        return ("%."+str(nd)+"f") % x
    except: return "—"

def disc_band(a):
    if np.isnan(a): return "—"
    if a < 0.65: return "저변별"
    if a <= 1.34: return "보통"
    return "높음"

def to_girth(W, items):
    M = W[items].to_numpy(dtype=float)
    M = np.where(np.isnan(M), MISS, M)
    return M.astype(int).T   # 행=문항, 열=응답자

def drop_constant(W, items):
    keep, dropped = [], []
    for it in items:
        v = pd.to_numeric(W[it], errors="coerce").dropna()
        (keep if v.nunique() > 1 else dropped).append(it)
    return keep, dropped

def test_information_2pl(a, b, thetas):
    rows = []
    for th in thetas:
        P = 1/(1+np.exp(-a*(th-b))); I = float(np.sum(a**2 * P * (1-P)))
        se = (1/np.sqrt(I)) if I > 0 else np.nan
        rows.append((th, I, se))
    return rows

def report(df, out_md, out_csv):
    L = []; line = L.append
    params = []
    line("# KMChC IRT 보정 (Stage 4)")
    line("> girth. **소표본은 잠정** — 안정 보정엔 N≥500 권장.")

    # ---------- 개념이해 2PL ----------
    c = df[df.cell_role == "t1"].copy(); c["v"] = pd.to_numeric(c["correct"], errors="coerce")
    Wc = c.pivot_table(index="student_id", columns="item_id", values="v", aggfunc="first")
    Cids = sorted(Wc.columns)
    keep, dropped = drop_constant(Wc, Cids)
    line("\n## 1. 개념이해(C) — 2PL")
    if len(keep) >= 3:
        data = to_girth(Wc, keep)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            try:
                est = girth.twopl_mml(data)
                a = np.ravel(est["Discrimination"]).astype(float)
                b = np.ravel(est["Difficulty"]).astype(float)
                theta = np.ravel(girth.ability_eap(data, est["Difficulty"], est["Discrimination"]))
            except Exception as e:
                a = b = theta = None; line("**2PL 적합 실패**: %s" % e)
        if a is not None:
            # 검사정보 / 주변신뢰도
            grid = test_information_2pl(a, b, [-2,-1,0,1,2])
            I0 = [I for th,I,se in grid if th == 0][0]
            rel = I0/(1+I0) if I0 > 0 else np.nan
            line("적합 문항 %d개, 응답자 %d명. **주변신뢰도(θ=0)≈%s**" % (len(keep), data.shape[1], f(rel)))
            line("\n검사정보곡선:")
            line("| θ | 정보 I(θ) | 표준오차 SE |"); line("|---|---|---|")
            for th, I, se in grid: line("| %+d | %s | %s |" % (th, f(I), f(se)))
            line("\n문항 모수:")
            line("| 문항 | 변별 a | 곤란도 b | 변별등급 | 플래그 |"); line("|---|---|---|---|---|")
            order = np.argsort(b)
            for j in order:
                it = keep[j]; fl = []
                if a[j] < 0.5: fl.append("저변별")
                if abs(b[j]) > 3: fl.append("극단난이도")
                line("| %s | %s | %s | %s | %s |" % (it, f(a[j]), f(b[j]), disc_band(a[j]), ", ".join(fl) or "—"))
                params.append(dict(scale="개념(2PL)", item=it, a=a[j], b1=b[j], model="2PL"))
            line("\nθ 분포: 평균 %s, 표준편차 %s, 범위 [%s, %s]" %
                 (f(theta.mean()), f(theta.std()), f(theta.min()), f(theta.max())))
        if dropped: line("\n*무변별(전원 동일응답) 제외: %s*" % ", ".join(dropped))
    else:
        line("- 적합 가능한 C 문항 부족.")

    # ---------- 리커트 GRM ----------
    lik = df[(df.cell_role == "val") & (df.kind.isin(LIK_REL))].copy()
    lik["v"] = pd.to_numeric(lik["scored"], errors="coerce")
    cons = {con: sorted(g["item_id"].unique()) for con, g in lik.groupby("construct") if con}
    Wl = lik.pivot_table(index="student_id", columns="item_id", values="v", aggfunc="first")
    line("\n## 2. 리커트 구인 — 등급반응모형(GRM)")
    for con, items in cons.items():
        keep, dropped = drop_constant(Wl, items)
        if len(keep) < 3:
            line("\n**%s**: 문항 부족(적합 생략)" % con); continue
        data = to_girth(Wl, keep)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            try:
                g = girth.grm_mml(data)
                a = np.ravel(g["Discrimination"]).astype(float)
                B = np.array(g["Difficulty"], dtype=float)   # 문항 x (K-1) 임계값
            except Exception as e:
                line("\n**%s**: GRM 적합 실패 — %s" % (con, str(e)[:70])); continue
        line("\n**%s** (문항 %d, N=%d)" % (con, len(keep), data.shape[1]))
        nth = B.shape[1] if B.ndim == 2 else 1
        line("| 문항 | 기울기 a | " + " | ".join("b%d" % (i+1) for i in range(nth)) + " | 플래그 |")
        line("|---|---|" + "---|"*nth + "---|")
        for j, it in enumerate(keep):
            thr = B[j] if B.ndim == 2 else [B[j]]
            fl = []
            if a[j] < 0.5: fl.append("저기울기")
            if any(np.diff(thr) <= 0): fl.append("임계값 역전")
            line("| %s | %s | %s | %s |" % (it, f(a[j]), " | ".join(f(t) for t in thr), ", ".join(fl) or "—"))
            params.append(dict(scale="%s(GRM)" % con, item=it, a=a[j],
                               **{("b%d"%(i+1)): thr[i] for i in range(len(thr))}, model="GRM"))
        if dropped: line("*무변별 제외: %s*" % ", ".join(dropped))

    line("\n## 3. 다음 단계")
    line("- 오답지별 정보(NRM)·이분 WLSMV는 R `mirt`/전용 구현 권장.")
    line("- 보정된 문항은행 → **Stage 5(인지진단 Q-행렬)·Stage 7(적응형 CAT)**의 입력.")
    line("\n---\n*IRT 모수는 표본·모형 의존. 충분한 N에서 재보정·적합도 점검 필요.*")

    open(out_md, "w", encoding="utf-8").write("\n".join(L))
    if params: pd.DataFrame(params).to_csv(out_csv, index=False, encoding="utf-8-sig")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--long", required=True)
    ap.add_argument("--out", default="irt_report.md")
    ap.add_argument("--csv", default="kmchc_irt_params.csv")
    a = ap.parse_args()
    df = pd.read_csv(a.long, dtype=str).fillna("")
    report(df, a.out, a.csv)
    print("리포트:", a.out, "| 모수:", a.csv)

if __name__ == "__main__":
    main()
