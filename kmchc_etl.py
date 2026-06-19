# -*- coding: utf-8 -*-
"""
KMChC ETL — 응답 → long-format 분석 테이블
================================================
Stage 1 산출물. 두 경로의 응답을 하나의 분석가능 표로 통합한다.

  (1) 온라인 설문:  시트 '응답원본'(base64 JSON) → answers 객체
  (2) 오프라인 OMR: 관리자 블록별 자릿수 문자열   → answers 객체  (OMRCodec.decode 재현)

두 경로 모두 동일한 answers 구조를 거쳐 long table 로 펼친다.
문항 메타(items.json)와 조인해 raw 값과 '채점/라벨' 값을 함께 낸다.

사용 예
  python kmchc_etl.py --items items.json --sheet 결과_export.csv --out-long long.csv --out-wide wide.csv
  python kmchc_etl.py --items items.json --demo          # 골든 샘플 자체검증
"""
import json, csv, base64, argparse, sys, os

BLOCK_ORDER = ["A", "B", "C", "D", "V"]
LIKERT = ["ladder","context","general","relative","internalize","sd","consistency","attention"]

# ---------- 문항 메타 ----------
def load_items(path):
    items = json.load(open(path, encoding="utf-8"))
    return items, {it["id"]: it for it in items}

def kind_of(it):
    return it.get("kind") or ("forced16" if it["block"]=="B" else ("misconception" if it["block"]=="C" else "?"))

def q_index(items):
    return {it["id"]: i+1 for i, it in enumerate(items)}  # BLOCK_ORDER 정렬 가정(items.json이 그 순서)

# ---------- OMR 셀 사양 (buildSpec 재현) ----------
def build_spec(items):
    cells = []
    for it in items:
        k = kind_of(it); b = it["block"]; iid = it["id"]
        if k in LIKERT:
            cells.append({"id":iid,"block":b,"role":"val","kind":k,"max":5})
        elif k == "scenario":
            cells.append({"id":iid,"block":b,"role":"val","kind":k,"max":len(it["opts"])})
        elif k == "forced16":
            cells.append({"id":iid,"block":b,"role":"val","kind":k,"max":len(it["o"])})
        elif k == "mostleast":
            cells.append({"id":iid,"block":b,"role":"most","kind":k,"max":len(it["set"])})
            cells.append({"id":iid,"block":b,"role":"least","kind":k,"max":len(it["set"])})
        elif k == "misconception":
            cells.append({"id":iid,"block":b,"role":"t1","kind":k,"max":len(it["t1"])})
            cells.append({"id":iid,"block":b,"role":"conf","kind":k,"max":3})
        elif k == "overclaim":
            for ti,_ in enumerate(it["terms"]):
                cells.append({"id":iid,"block":b,"role":"oc","kind":k,"max":2,"termIdx":ti})
    return cells

# ---------- 디코더 ----------
def decode_b64(blob):
    """온라인 설문의 base64 JSON → answers 객체"""
    if not blob:
        return {}
    raw = base64.b64decode(blob).decode("utf-8")
    return json.loads(raw)

def decode_omr(block_strings, items):
    """관리자 블록별 자릿수 문자열({'A':'...','B':...}) → answers 객체 (OMRCodec.decode 재현)"""
    spec = build_spec(items)
    full = "".join("".join(ch for ch in (block_strings.get(b,"") or "") if ch.isdigit()) for b in BLOCK_ORDER)
    ds = [int(c) for c in full]
    if len(ds) != len(spec):
        raise ValueError("자릿수 불일치: 입력 %d개, 사양 %d개" % (len(ds), len(spec)))
    ans = {}
    for cell, d in zip(spec, ds):
        iid, role, kind = cell["id"], cell["role"], cell["kind"]
        if role == "val":
            ans[iid] = d if kind in LIKERT else d-1           # 리커트=값, 그 외=0기준 인덱스
        elif role == "most":  ans.setdefault(iid,{})["most"] = d-1
        elif role == "least": ans.setdefault(iid,{})["least"] = d-1
        elif role == "t1":    ans.setdefault(iid,{})["t1"] = d-1
        elif role == "conf":  ans.setdefault(iid,{})["conf"] = d
        elif role == "oc":
            ans.setdefault(iid, [])
            if d == 1: ans[iid].append(cell["termIdx"])
    return ans

def encode_omr(answers, items):
    """answers → 블록별 자릿수 문자열 (검증/정답키 생성용, OMRCodec.encode 재현)"""
    spec = build_spec(items); per = {b:"" for b in BLOCK_ORDER}
    for cell in spec:
        a = answers.get(cell["id"]); r = cell["role"]; k = cell["kind"]
        if r == "val":   d = str(a) if k in LIKERT else str((a or 0)+1)
        elif r == "most":  d = str((a.get("most",0) if isinstance(a,dict) else 0)+1)
        elif r == "least": d = str((a.get("least",0) if isinstance(a,dict) else 0)+1)
        elif r == "t1":    d = str((a.get("t1",0) if isinstance(a,dict) else 0)+1)
        elif r == "conf":  d = str(a.get("conf",1) if isinstance(a,dict) else 1)
        elif r == "oc":    d = "1" if (isinstance(a,list) and cell["termIdx"] in a) else "2"
        else: d = "1"
        per[cell["block"]] += d
    return per

# ---------- long 변환 (메타 조인 + 채점/라벨) ----------
def cell_rows(answers, it, qno, smeta):
    """한 문항의 answers를 셀 단위 long 행들로. raw + scored + label + 채점."""
    k = kind_of(it); iid = it["id"]; b = it["block"]; a = answers.get(iid)
    base = dict(smeta); base.update({"item_id":iid,"q_no":qno,"block":b,"kind":k,
                                     "construct": it.get("con") or it.get("axis") or it.get("intu") or ""})
    out = []
    def row(role, raw, scored="", label="", correct="", misc="", conf="", fake=""):
        r = dict(base); r.update({"cell_id":"%s_%s"%(iid,role),"cell_role":role,
            "raw":raw,"scored":scored,"label":label,"correct":correct,
            "misconception":misc,"confidence":conf,"is_fake":fake}); out.append(r)

    if k in LIKERT:
        v = a if isinstance(a,(int,float)) else ""
        sc = (6-v) if (it.get("rev") and isinstance(v,int)) else v          # 역채점 적용
        lab = ""
        if k=="attention" and isinstance(v,int): lab = "정답" if v==it.get("answer") else "오답(부주의)"
        row("val", v, sc, lab)
    elif k=="forced16":
        idx = a if isinstance(a,int) else ""
        pole = it["o"][idx]["p"] if isinstance(idx,int) and 0<=idx<len(it["o"]) else ""
        row("val", (idx+1) if isinstance(idx,int) else "", pole, pole)
    elif k=="scenario":
        idx = a if isinstance(a,int) else ""
        code = it["optcode"][idx] if isinstance(idx,int) and 0<=idx<len(it["optcode"]) else ""
        row("val", (idx+1) if isinstance(idx,int) else "", code, code)
    elif k=="mostleast":
        mo = a.get("most") if isinstance(a,dict) else None
        le = a.get("least") if isinstance(a,dict) else None
        row("most", (mo+1) if isinstance(mo,int) else "", it["setcon"][mo] if isinstance(mo,int) else "", it["setcon"][mo] if isinstance(mo,int) else "")
        row("least",(le+1) if isinstance(le,int) else "", it["setcon"][le] if isinstance(le,int) else "", it["setcon"][le] if isinstance(le,int) else "")
    elif k=="misconception":
        t1 = a.get("t1") if isinstance(a,dict) else None
        cf = a.get("conf") if isinstance(a,dict) else None
        if isinstance(t1,int) and 0<=t1<len(it["t1"]):
            o = it["t1"][t1]; corr = 1 if o.get("key") else 0
            misc = o.get("m","") if not o.get("key") else ""
            lab = "정답" if o.get("key") else ("모름" if o.get("u") else o.get("m",""))
            row("t1", t1+1, corr, lab, corr, misc)
        else:
            row("t1","","","")
        row("conf", cf if isinstance(cf,int) else "", cf if isinstance(cf,int) else "", {1:"낮음",2:"보통",3:"높음"}.get(cf,""), conf=cf if isinstance(cf,int) else "")
    elif k=="overclaim":
        checked = a if isinstance(a,list) else []
        for ti,term in enumerate(it["terms"]):
            mark = 1 if ti in checked else 0
            row("oc%d"%ti, 1 if mark else 2, mark, term["t"], fake=("가짜" if not term["real"] else "진짜"))
    return out

LONG_COLS = ["student_id","grade","source","item_id","q_no","block","kind","construct",
             "cell_id","cell_role","raw","scored","label","correct","misconception","confidence","is_fake","dwell_ms","answer_at_ms"]

def to_long(answers, items, qidx, smeta):
    rt = answers.get("_rt") if isinstance(answers.get("_rt"), dict) else {}
    dwell = rt.get("dwell", {}) if isinstance(rt, dict) else {}
    ats = rt.get("ans", {}) if isinstance(rt, dict) else {}
    rows = []
    for it in items:
        rs = cell_rows(answers, it, qidx[it["id"]], smeta)
        d = dwell.get(it["id"], ""); a = ats.get(it["id"], "")
        for r in rs:
            r["dwell_ms"] = d; r["answer_at_ms"] = a
        rows += rs
    return rows

# ---------- 시트 CSV 처리 ----------
def _find_col(header, names):
    for n in names:
        for i,h in enumerate(header):
            if str(h).strip()==n: return i
    return -1

def process_sheet_csv(path, items, qidx, include_demo=False):
    rows=[]; rd=list(csv.reader(open(path,encoding="utf-8-sig")))
    if not rd: return rows
    header=rd[0]
    ci_ans=_find_col(header,["응답원본","answers","answer"])
    ci_id =_find_col(header,["ID","id","student_id"])
    ci_gr =_find_col(header,["학년","grade"])
    ci_kind=_find_col(header,["구분"])
    if ci_ans<0: raise ValueError("'응답원본' 컬럼을 찾지 못했습니다.")
    for r in rd[1:]:
        if not include_demo and ci_kind>=0 and len(r)>ci_kind and str(r[ci_kind]).strip()=="데모":
            continue
        blob=r[ci_ans] if len(r)>ci_ans else ""
        if not blob: continue
        try: ans=decode_b64(blob)
        except Exception as e: print("  [건너뜀] 디코드 실패:",e,file=sys.stderr); continue
        sm={"student_id": r[ci_id] if ci_id>=0 and len(r)>ci_id else "",
            "grade": r[ci_gr] if ci_gr>=0 and len(r)>ci_gr else "", "source":"online"}
        rows += to_long(ans, items, qidx, sm)
    return rows

def write_long(rows, path):
    with open(path,"w",encoding="utf-8-sig",newline="") as f:
        w=csv.DictWriter(f,fieldnames=LONG_COLS,extrasaction="ignore"); w.writeheader(); w.writerows(rows)

def write_wide(rows, path):
    # raw(원자료 숫자) 행렬 — 역채점/재코딩은 코드북 기준으로 다운스트림 적용
    students={}
    for r in rows:
        students.setdefault(r["student_id"],{})[r["cell_id"]]=r["raw"]
    cellids=sorted({r["cell_id"] for r in rows})
    with open(path,"w",encoding="utf-8-sig",newline="") as f:
        w=csv.writer(f); w.writerow(["student_id"]+cellids)
        for sid,d in students.items(): w.writerow([sid]+[d.get(c,"") for c in cellids])

# ---------- 데모 (골든 자체검증) ----------
def demo(items, idx, qidx):
    print("=== 골든 자체검증 ===")
    gold = "/tmp/_b64.txt"
    if not os.path.exists(gold):
        print("골든 b64 없음(/tmp/_b64.txt) — 데모 생략"); return
    blob = open(gold).read().strip()
    ans_online = decode_b64(blob)
    print("온라인 blob 디코드: 문항", len(ans_online), "개")
    blocks = encode_omr(ans_online, items)               # answers→OMR 자릿수
    ans_omr = decode_omr(blocks, items)                  # OMR 자릿수→answers
    # 캡처 필드 일치 검사: t2(온라인 전용)·온라인 빈 확신도(OMR은 강제) 제외
    def captured(a):
        out = {}
        for k, v in a.items():
            if isinstance(v, dict):
                out[k] = {kk: vv for kk, vv in v.items() if kk != "t2"}
            else:
                out[k] = v
        return out
    co, cm = captured(ans_online), captured(ans_omr)
    blank_conf = 0
    for k, v in co.items():                               # 온라인이 확신도 비웠으면 OMR 쪽 conf도 비교에서 제외
        if isinstance(v, dict) and "conf" not in v and isinstance(cm.get(k), dict):
            cm[k] = {kk: vv for kk, vv in cm[k].items() if kk != "conf"}
            blank_conf += 1
    ok = co == cm
    print("OMR 자릿수:", {b: len(s) for b, s in blocks.items()}, "총", sum(len(s) for s in blocks.values()))
    print("온라인↔OMR 캡처값 일치:", "✅" if ok else "❌", "(t2·빈 확신도 제외)")
    # 데이터 품질 메모
    t2_items = sum(1 for v in ans_online.values() if isinstance(v, dict) and "t2" in v)
    print("데이터 품질 메모: 온라인 전용 t2(이유) 보유 문항 %d개 — OMR 미수집." % t2_items)
    print("                  온라인 빈 확신도 %d개 — OMR은 빈칸 불가(값 강제). 결측 정책 통일 필요." % blank_conf)
    long_rows = to_long(ans_online, items, qidx, {"student_id":"GOLDEN","grade":"중2","source":"online"})
    print("long 행수:", len(long_rows), "(=칸 수)")
    syn = dict(ans_online); syn["_rt"] = {"dwell":{"A-IN1":4200,"C1":15300,"V-AT":900},
                                          "ans":{"A-IN1":4200,"C1":61000,"V-AT":210000}}
    srows = to_long(syn, items, qidx, {"student_id":"SYNTH-RT","grade":"중2","source":"online"})
    print("rt 파이프라인 확인(합성 _rt):")
    for r in srows:
        if r["item_id"] in ("A-IN1","C1","V-AT") and r["cell_role"] in ("val","t1"):
            print("  %-6s dwell_ms=%-6s answer_at_ms=%s" % (r["item_id"], r["dwell_ms"], r["answer_at_ms"]))
    write_long(long_rows, "/mnt/user-data/outputs/kmchc_long_demo.csv")
    write_wide(long_rows, "/mnt/user-data/outputs/kmchc_wide_demo.csv")
    print("데모 출력: kmchc_long_demo.csv, kmchc_wide_demo.csv")
    print("\n--- long 샘플(개념·정답·오개념 보이는 C 문항) ---")
    shown=0
    for r in long_rows:
        if r["block"]=="C" and r["cell_role"]=="t1":
            print("  %s %s raw=%s 정답=%s 오개념=%s"%(r["item_id"],r["construct"][:14],r["raw"],r["correct"],r["misconception"]))
            shown+=1
            if shown>=5: break

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--items",default="items.json")
    ap.add_argument("--sheet")
    ap.add_argument("--out-long",default="kmchc_long.csv")
    ap.add_argument("--out-wide",default="kmchc_wide.csv")
    ap.add_argument("--include-demo",action="store_true",help="구분=데모 행도 포함")
    ap.add_argument("--demo",action="store_true",help="골든 샘플 자체검증만")
    a=ap.parse_args()
    items, idx = load_items(a.items); qidx=q_index(items)
    if a.demo:
        demo(items, idx, qidx); return
    if not a.sheet:
        print("입력(--sheet) 없음. 자체검증만 실행합니다."); demo(items, idx, qidx); return
    rows=process_sheet_csv(a.sheet, items, qidx, a.include_demo)
    write_long(rows, a.out_long); write_wide(rows, a.out_wide)
    n=len({r["student_id"] for r in rows})
    print("학생 %d명 / long %d행 → %s, %s"%(n,len(rows),a.out_long,a.out_wide))

if __name__=="__main__":
    main()
