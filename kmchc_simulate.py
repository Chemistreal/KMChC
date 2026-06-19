# -*- coding: utf-8 -*-
"""
KMChC 응답 시뮬레이터 (테스트 데이터 생성)
=========================================
잠재특성 모형으로 합성 응답을 만든다 — 실데이터 전 도구(ETL·DQ·CTT) 점검용.
랜덤이 아니라 능력 theta(개념)·구인 특성을 부여하므로 신뢰도/변별도가 의미 있게 나온다.

  python kmchc_simulate.py --items items.json --n 150 --out kmchc_long_sim.csv

주의: 전부 가짜 데이터. 실제 학생 데이터가 아니다.
"""
import argparse, random, math
from kmchc_etl import load_items, q_index, to_long, write_long, kind_of, LIKERT

LIK_CON = {"ladder","context","general","relative","internalize"}

def logistic(x): return 1.0/(1.0+math.exp(-x))

def key_idx(it):
    for i, o in enumerate(it["t1"]):
        if o.get("key"): return i
    return 0

def simulate(items, qidx, N=150, seed=7, bad_frac=0.10):
    random.seed(seed)
    Cids = [it["id"] for it in items if kind_of(it) == "misconception"]
    bdiff = {iid: random.gauss(0, 0.8) for iid in Cids}     # 문항 곤란도
    cons = sorted({it.get("con") for it in items if kind_of(it) in LIK_CON and it.get("con")})
    nbad = int(N*bad_frac); rows = []
    for s in range(N):
        sid = "R%03d" % (s+1)
        bad = s >= N - nbad
        prof = random.choice(["rush", "straight"]) if bad else "normal"
        theta = random.gauss(0, 1)
        trait = {c: random.gauss(0, 1) for c in cons}
        ans = {}; rd = {}; ra = {}; t = 0
        for it in items:
            k = kind_of(it); iid = it["id"]
            if k in LIKERT:
                if k == "attention":
                    v = it.get("answer", 3) if (not bad and random.random() < 0.95) else random.randint(1, 5)
                elif prof == "straight":
                    v = 4
                elif k in LIK_CON and it.get("con") in trait:
                    aligned = 3 + 1.15*trait[it["con"]] + random.gauss(0, 0.7)
                    aligned = min(5, max(1, int(round(aligned))))
                    v = (6 - aligned) if it.get("rev") else aligned     # 역문항은 반대로 마킹
                else:
                    v = random.randint(1, 5)
                ans[iid] = int(v)
            elif k == "forced16":
                ans[iid] = random.randint(0, len(it["o"]) - 1)
            elif k == "scenario":
                ans[iid] = random.randint(0, len(it["opts"]) - 1)
            elif k == "misconception":
                ki = key_idx(it)
                correct = (random.random() < 0.25) if prof == "rush" else (random.random() < logistic(theta - bdiff[iid]))
                if correct:
                    t1 = ki
                else:
                    t1 = random.choice([j for j in range(len(it["t1"])) if j != ki])
                d = {"t1": t1, "t2": random.randint(0, len(it.get("t2", [1])) - 1)}
                base = 3 if correct else 1                                # 확신도-정답 상관(보정)
                d["conf"] = min(3, max(1, base + random.randint(-1, 1)))
                if random.random() < 0.10: d.pop("conf")                  # 일부 결측
                ans[iid] = d
            elif k == "mostleast":
                nn = len(it["set"]); mo = random.randint(0, nn-1)
                le = random.choice([j for j in range(nn) if j != mo]); ans[iid] = {"most": mo, "least": le}
            elif k == "overclaim":
                ch = []
                for ti, term in enumerate(it["terms"]):
                    p = 0.80 if term["real"] else (0.50 if bad else 0.10)
                    if random.random() < p: ch.append(ti)
                ans[iid] = ch
            dwell = random.randint(300, 900) if prof == "rush" else random.randint(1800, 16000)
            t += dwell + random.randint(200, 1200); rd[iid] = dwell; ra[iid] = t
        ans["_rt"] = {"dwell": rd, "ans": ra}
        rows += to_long(ans, items, qidx, {"student_id": sid, "grade": random.choice(["중1","중2","중3"]), "source": "online"})
    return rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--items", default="items.json")
    ap.add_argument("--n", type=int, default=150)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default="kmchc_long_sim.csv")
    a = ap.parse_args()
    items, _ = load_items(a.items); qidx = q_index(items)
    rows = simulate(items, qidx, a.n, a.seed)
    write_long(rows, a.out)
    print("시뮬레이션 N=%d → %s (long %d행) [가짜 데이터]" % (a.n, a.out, len(rows)))

if __name__ == "__main__":
    main()
