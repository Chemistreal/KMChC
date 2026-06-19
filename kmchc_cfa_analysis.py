# -*- coding: utf-8 -*-
"""
KMChC 요인구조·측정불변성 (Stage 3, CFA)
========================================
ETL long 출력을 먹고 리커트 구인의 확인적 요인분석을 한다 (semopy).

  python kmchc_cfa_analysis.py --long kmchc_long.csv --out cfa_report.md

내용
  · 측정모형(구인별 잠재요인) 적합 → 적합도(CFI/TLI/RMSEA/chi2-df)
  · 표준화 적재량(저적재 플래그) · 요인 상관(판별타당도)
  · 측정불변성: 학년별 configural 적합 + 적재량 집단 간 비교

주의: 개념(C)은 이분 문항이라 여기 제외(→ Stage 4 IRT/WLSMV). 소표본은 잠정(N≥300~500 권장).
"""
import argparse, warnings
import numpy as np, pandas as pd
import semopy

LIK_REL = {"ladder","context","general","relative","internalize"}
LBL = {"interest":"INTEREST","efficacy":"EFFICACY","anxiety":"ANXIETY","value":"VALUE",
       "metacog":"METACOG","approach":"APPROACH","coping":"COPING"}
def lab(c): return LBL.get(c, str(c).upper().replace("-","_"))

def f(x, nd=3):
    try:
        if x is None or (isinstance(x, float) and np.isnan(x)): return "—"
        return ("%."+str(nd)+"f") % x
    except: return "—"

def safe_id(s): return str(s).replace("-", "_").replace(".", "_")

def load_wide(df):
    lik = df[(df.cell_role == "val") & (df.kind.isin(LIK_REL))].copy()
    lik["v"] = pd.to_numeric(lik["scored"], errors="coerce")
    lik["sid"] = lik["item_id"].map(safe_id)
    con_items = {c: sorted(g["sid"].unique()) for c, g in lik.groupby("construct") if c}
    W = lik.pivot_table(index="student_id", columns="sid", values="v", aggfunc="first")
    grade = df.groupby("student_id")["grade"].first()
    inv = {safe_id(i): i for i in df["item_id"].unique()}
    return W, con_items, grade, inv

def spec_from(con_items, min_items=3):
    lines = []; used = {}
    for c, items in con_items.items():
        if len(items) >= min_items:
            used[c] = items; lines.append("%s =~ %s" % (lab(c), " + ".join(items)))
    return "\n".join(lines), used

def fit_stats(m):
    try:
        s = semopy.calc_stats(m); row = s.iloc[0]
        g = lambda k: float(row[k]) if (k in row.index and pd.notna(row[k])) else np.nan
        return dict(chi2=g("chi2"), dof=g("DoF"), cfi=g("CFI"), tli=g("TLI"),
                    rmsea=g("RMSEA"), nfi=g("NFI"), gfi=g("GFI"), aic=g("AIC"), bic=g("BIC"))
    except Exception:
        return {}

def std_col(ins):
    for c in ["Est. Std", "Std. Est", "Estimate Std", "est_std", "Est.Std"]:
        if c in ins.columns: return c
    return "Estimate"

def fit_cfa(spec, data):
    m = semopy.Model(spec)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        m.fit(data)
    return m

def report(df, out):
    W, con_items, grade, inv = load_wide(df)
    spec, used = spec_from(con_items)
    L = []; line = L.append
    line("# KMChC 요인구조·측정불변성 (Stage 3, CFA)")
    line("> 리커트 구인 측정모형 (semopy). **소표본은 잠정** — N≥300~500 권장. 개념(C)은 이분이라 제외(→ Stage 4).")
    line("\n## 0. 측정모형")
    line("```\n" + spec + "\n```")
    cols = [it for its in used.values() for it in its]
    Wc = W[cols].dropna()
    line("적합 사례수 N=%d · 관측문항 %d · 잠재요인 %d" % (Wc.shape[0], Wc.shape[1], len(used)))

    try:
        m = fit_cfa(spec, Wc)
    except Exception as e:
        line("\n**CFA 적합 실패**: %s" % e)
        open(out, "w", encoding="utf-8").write("\n".join(L)); return used

    st = fit_stats(m)
    ins = m.inspect(std_est=True); sc = std_col(ins)
    load = ins[ins["op"] == "~"][["lval", "rval", sc]]
    cov = ins[(ins["op"] == "~~") & (ins["lval"] != ins["rval"])][["lval", "rval", sc]]

    # 1. 적합도
    line("\n## 1. 전체 적합도")
    def jhi(v, good, acc): return "—" if np.isnan(v) else ("✅" if v >= good else ("△" if v >= acc else "✗"))
    def jlo(v, good, acc): return "—" if np.isnan(v) else ("✅" if v <= good else ("△" if v <= acc else "✗"))
    line("| 지표 | 값 | 기준 | 판정 |"); line("|---|---|---|---|")
    line("| CFI | %s | ≥0.95 (≥0.90) | %s |" % (f(st.get("cfi", np.nan)), jhi(st.get("cfi", np.nan), .95, .90)))
    line("| TLI | %s | ≥0.95 (≥0.90) | %s |" % (f(st.get("tli", np.nan)), jhi(st.get("tli", np.nan), .95, .90)))
    line("| RMSEA | %s | ≤0.06 (≤0.08) | %s |" % (f(st.get("rmsea", np.nan)), jlo(st.get("rmsea", np.nan), .06, .08)))
    c2, dof = st.get("chi2", np.nan), st.get("dof", np.nan)
    cd = (c2/dof) if (dof and not np.isnan(c2) and dof > 0) else np.nan
    line("| χ²/df | %s | <3 | %s |" % (f(cd, 2), jlo(cd, 3, 5)))

    # 2. 적재량
    line("\n## 2. 표준화 적재량")
    for c, items in used.items():
        line("\n**%s**" % lab(c))
        line("| 문항 | 표준 적재량 | 판정 |"); line("|---|---|---|")
        sub = load[load["lval"].isin(items)]
        for _, r in sub.iterrows():
            v = r[sc]; fl = "✅" if abs(v) >= .5 else ("△" if abs(v) >= .4 else "✗ 저적재")
            line("| %s | %s | %s |" % (inv.get(r["lval"], r["lval"]), f(v), fl))

    # 3. 요인 상관
    line("\n## 3. 요인 상관 (판별타당도)")
    line("*|r|>0.85면 두 요인 구분이 모호.*")
    if len(cov):
        line("| 요인1 | 요인2 | 상관 | 판정 |"); line("|---|---|---|---|")
        for _, r in cov.iterrows():
            v = r[sc]; line("| %s | %s | %s | %s |" % (r["lval"], r["rval"], f(v), "✗ 과상관" if abs(v) > .85 else "✅"))

    # 4. 측정불변성
    line("\n## 4. 측정불변성 — 학년별 (configural + 적재량 비교)")
    line("*같은 모형을 집단별 적합 → 적합도·적재량 비교. 정식 metric/scalar(ΔCFI≤0.01)은 다집단 제약모형 필요(lavaan 권장).*")
    line("| 학년 | N | CFI | RMSEA |"); line("|---|---|---|---|")
    gl = {}
    for gv in sorted(set(grade.dropna())):
        ids = grade[grade == gv].index; sub = Wc[Wc.index.isin(ids)]
        if sub.shape[0] < 40:
            line("| %s | %d | (표본 부족) | |" % (gv, sub.shape[0])); continue
        try:
            mm = fit_cfa(spec, sub); ss = fit_stats(mm)
            ii = mm.inspect(std_est=True); scn = std_col(ii)
            line("| %s | %d | %s | %s |" % (gv, sub.shape[0], f(ss.get("cfi", np.nan)), f(ss.get("rmsea", np.nan))))
            gl[gv] = ii[ii["op"] == "~"].set_index("lval")[scn]
        except Exception:
            line("| %s | %d | 적합 실패 | |" % (gv, sub.shape[0]))
    if len(gl) >= 2:
        ks = list(gl.keys()); common = set.intersection(*[set(v.index) for v in gl.values()])
        diffs = []
        for it in common:
            vals = [abs(gl[k].get(it, np.nan)) for k in ks]; vals = [v for v in vals if not np.isnan(v)]
            if len(vals) >= 2: diffs.append((it, max(vals)-min(vals)))
        diffs.sort(key=lambda x: -x[1])
        line("\n적재량 집단 간 차이 큰 문항(상위): " + ", ".join("%s(Δ=%.2f)" % (inv.get(i, i), d) for i, d in diffs[:8]))
        line("→ Δ가 큰 문항은 metric 불변성 위반 후보. 정식 검정 권장.")

    line("\n---\n*다음: 측정불변성 확인 후 Stage 4(IRT 보정: GRM/2PL/NRM).*")
    open(out, "w", encoding="utf-8").write("\n".join(L))
    return used

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--long", required=True)
    ap.add_argument("--out", default="cfa_report.md")
    a = ap.parse_args()
    df = pd.read_csv(a.long, dtype=str).fillna("")
    used = report(df, a.out)
    print("리포트:", a.out, "| 요인:", [lab(c) for c in used])

if __name__ == "__main__":
    main()
