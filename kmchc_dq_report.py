# -*- coding: utf-8 -*-
"""
KMChC 데이터 품질 리포트 생성기 (Stage 1)
==========================================
ETL의 long 출력(kmchc_etl.py --out-long)을 먹고, 데이터 품질 리포트(.md)를 낸다.
실데이터가 없으면 빈 표가 나오므로, 응답이 쌓인 뒤 돌리면 자동으로 채워진다.

  python kmchc_dq_report.py --long kmchc_long.csv --out dq_report.md

리포트 섹션
  1. 표본 구성        N, 학년·source별 분포
  2. 완료·결측        문항별 결측률, 학생 완료율, 빈 확신도(C)
  3. 반응시간         dwell 중앙값, <1s 비율, 과속 응답자 (rapid-guessing)
  4. 타당도 플래그    주의력 실패·과대주장·SD·직선응답
  5. 문항 사전점검    리커트 평균/분산(바닥·천장·무변별), 오개념 정답률 p, 양자택일 분포
"""
import csv, argparse, statistics as st
from collections import defaultdict, Counter

LIK_KINDS = {"ladder","context","general","relative","internalize","sd","consistency"}
PRIMARY = {"val","t1","most"}   # 문항 응답 여부 판단용 1차 셀

def load_long(path):
    rows=[]
    with open(path, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f): rows.append(r)
    return rows

def numf(x):
    try: return float(x)
    except: return None

def pct(n, d): return (100.0*n/d) if d else 0.0

def build(rows):
    students = sorted({r["student_id"] for r in rows})
    N = len(students)
    by_item = defaultdict(list); by_student = defaultdict(list)
    for r in rows:
        by_item[r["item_id"]].append(r); by_student[r["student_id"]].append(r)
    L = []  # 리포트 라인
    def h(t): L.append("\n## "+t)
    def line(t=""): L.append(t)

    L.append("# KMChC 데이터 품질 리포트")
    line("> ETL long 출력 기반 자동 생성. (응답 N=%d)" % N)

    # ---- 1. 표본 ----
    h("1. 표본 구성")
    line("- 응답자 수(N): **%d**" % N)
    grades = Counter(r["grade"] for r in rows if r["cell_role"] in PRIMARY)
    # 학생당 1회 카운트
    sg = {}; ss = {}
    for r in rows:
        sg.setdefault(r["student_id"], r.get("grade","")); ss.setdefault(r["student_id"], r.get("source",""))
    line("- 학년 분포: " + (", ".join("%s=%d"%(k or "(미상)",v) for k,v in Counter(sg.values()).most_common()) or "—"))
    line("- 경로(source) 분포: " + (", ".join("%s=%d"%(k or "?",v) for k,v in Counter(ss.values()).most_common()) or "—"))

    # ---- 2. 완료·결측 ----
    h("2. 완료 · 결측")
    items = sorted(by_item.keys(), key=lambda i: int(by_item[i][0]["q_no"]))
    # 학생별 응답 문항 수(1차 셀 raw 비공백)
    answered = defaultdict(int)
    for sid, rs in by_student.items():
        seen=set()
        for r in rs:
            if r["cell_role"] in PRIMARY and r["raw"] not in ("", None):
                seen.add(r["item_id"])
        answered[sid]=len(seen)
    nitems = len(items)
    comp = [answered[s]/nitems for s in students] if nitems else []
    if comp:
        line("- 평균 완료율: **%.1f%%** (문항 %d개 기준), 최소 %.0f%% · 최대 %.0f%%" %
             (100*sum(comp)/len(comp), nitems, 100*min(comp), 100*max(comp)))
        incomplete = sum(1 for c in comp if c < 0.95)
        line("- 미완료(95%% 미만) 응답자: **%d명**" % incomplete)
    # 문항별 결측률 상위
    miss=[]
    for iid in items:
        rs=[r for r in by_item[iid] if r["cell_role"] in PRIMARY]
        if not rs: continue
        m=sum(1 for r in rs if r["raw"] in ("",None))
        miss.append((iid, pct(m,len(rs)), rs[0]["block"]))
    miss.sort(key=lambda x:-x[1])
    top=[m for m in miss if m[1]>0][:8]
    if top:
        line("\n결측률 상위 문항:")
        line("| 문항 | 블록 | 결측률 |"); line("|---|---|---|")
        for iid,p,b in top: line("| %s | %s | %.1f%% |"%(iid,b,p))
    else:
        line("- 1차 응답 결측 없음.")
    # 빈 확신도 (C)
    conf_rows=[r for r in rows if r["cell_role"]=="conf"]
    if conf_rows:
        blank=sum(1 for r in conf_rows if r["confidence"] in ("",None) and r["raw"] in ("",None))
        line("- 개념(C) 확신도 결측: **%.1f%%** (%d/%d) — 온라인 선택 누락 또는 OMR 강제값과의 정책 불일치 점검" %
             (pct(blank,len(conf_rows)), blank, len(conf_rows)))

    # ---- 3. 반응시간 ----
    h("3. 반응시간 (rapid-guessing)")
    dw=[(r["item_id"], numf(r["dwell_ms"])) for r in rows if r["cell_role"] in PRIMARY and numf(r["dwell_ms"]) is not None]
    if dw:
        allv=[v for _,v in dw]
        line("- dwell 기록된 응답: %d건 (온라인). 전체 중앙값 **%.0f ms**, 1분위 %.0f ms" %
             (len(dw), st.median(allv), st.quantiles(allv, n=4)[0] if len(allv)>=4 else min(allv)))
        fast=sum(1 for v in allv if v<1000)
        line("- **<1s(안 읽음 의심) 비율: %.1f%%** (%d건)" % (pct(fast,len(allv)), fast))
        # 학생별 평균 dwell → 과속 응답자
        sd=defaultdict(list)
        for r in rows:
            if r["cell_role"] in PRIMARY and numf(r["dwell_ms"]) is not None:
                sd[r["student_id"]].append(numf(r["dwell_ms"]))
        slow_thr=1500
        rushers=[s for s,vs in sd.items() if vs and (sum(vs)/len(vs))<slow_thr]
        line("- 평균 dwell < %dms 인 **과속 응답자: %d명**" % (slow_thr, len(rushers)))
    else:
        line("- dwell 기록 없음 (오프라인 전용이거나 계측 이전 데이터).")

    # ---- 4. 타당도 ----
    h("4. 타당도 플래그")
    # 주의력
    att=[r for r in rows if r["kind"]=="attention"]
    if att:
        fail=sum(1 for r in att if "오답" in (r["label"] or ""))
        line("- 주의력(지시) 실패: **%.1f%%** (%d/%d)" % (pct(fail,len(att)), fail, len(att)))
    # 과대주장 (가짜 용어 체크)
    ocf=[r for r in rows if r["cell_role"].startswith("oc") and r.get("is_fake")=="가짜"]
    if ocf:
        bys=defaultdict(int)
        for r in ocf:
            if str(r["raw"])=="1": bys[r["student_id"]]+=1
        over=sum(1 for s in students if bys.get(s,0)>=1)
        line("- 과대주장(가짜 용어 ≥1개 체크): **%d명** (%.1f%%)" % (over, pct(over,N)))
    # SD 고동의
    sdr=[r for r in rows if r["kind"]=="sd"]
    if sdr:
        bys=defaultdict(list)
        for r in sdr:
            v=numf(r["raw"]);
            if v is not None: bys[r["student_id"]].append(v)
        high=sum(1 for s,vs in bys.items() if vs and (sum(vs)/len(vs))>=4)
        line("- 사회적 바람직성(SD 평균≥4): **%d명**" % high)
    # 직선응답
    straight=0
    for sid, rs in by_student.items():
        vals=[numf(r["raw"]) for r in rs if r["kind"] in LIK_KINDS and r["cell_role"]=="val" and numf(r["raw"]) is not None]
        if len(vals)>=15:
            c=Counter(vals); share=c.most_common(1)[0][1]/len(vals)
            if share>=0.85: straight+=1
    line("- 직선응답(리커트 ≥15문항, 한 값 85%%↑): **%d명**" % straight)

    # ---- 5. 문항 사전점검 ----
    h("5. 문항 사전점검 (소표본 주의)")
    # 리커트 평균/분산
    flags=[]
    for iid in items:
        rs=[r for r in by_item[iid] if r["cell_role"]=="val" and r["kind"] in LIK_KINDS]
        vals=[numf(r["scored"]) for r in rs if numf(r["scored"]) is not None]
        if len(vals)>=5:
            m=sum(vals)/len(vals); s=st.pstdev(vals)
            tag=[]
            if m<1.5: tag.append("바닥")
            if m>4.5: tag.append("천장")
            if s<0.3: tag.append("무변별")
            if tag: flags.append((iid,m,s,",".join(tag)))
    if flags:
        line("리커트 주의 문항:")
        line("| 문항 | 평균 | 표준편차 | 플래그 |"); line("|---|---|---|---|")
        for iid,m,s,t in flags[:12]: line("| %s | %.2f | %.2f | %s |"%(iid,m,s,t))
    else:
        line("- 리커트 바닥/천장/무변별 플래그 없음(또는 표본 부족).")
    # 오개념 정답률 p
    pr=[]
    for iid in items:
        rs=[r for r in by_item[iid] if r["cell_role"]=="t1"]
        cs=[int(r["correct"]) for r in rs if r["correct"] in ("0","1")]
        if len(cs)>=5: pr.append((iid, sum(cs)/len(cs), len(cs)))
    if pr:
        pr.sort(key=lambda x:x[1])
        line("\n오개념 문항 정답률 p (낮은 순 일부):")
        line("| 문항 | p | N |"); line("|---|---|---|")
        for iid,p,n in pr[:8]: line("| %s | %.2f | %d |"%(iid,p,n))

    line("\n---")
    line("*소표본에서는 모든 통계가 잠정적이다. N이 충분해진 뒤(파일럿 ≥200) Stage 2 고전 문항분석으로 이행한다.*")
    return "\n".join(L)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--long", required=True)
    ap.add_argument("--out", default="dq_report.md")
    a=ap.parse_args()
    rows=load_long(a.long)
    md=build(rows)
    open(a.out,"w",encoding="utf-8").write(md)
    print("리포트 생성:", a.out, "(%d 문자)"%len(md))

if __name__=="__main__":
    main()
