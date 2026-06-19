# KMChC 진단 — 분석 파이프라인 실행 가이드

심리측정·인지진단 도구 모음 (로드맵 Stage 1~5). 응답 데이터를 받아 **데이터 정비 → 고전 문항분석 → 요인구조 → IRT 보정 → 인지진단**까지 한 줄기로 처리한다. 모든 스크립트는 시뮬레이션으로 검증 완료.

> 실데이터가 없으면 `kmchc_simulate.py`로 가짜(잠재특성) 데이터를 만들어 전 단계를 점검할 수 있다.

---

## 데이터 흐름

```
[설문앱 index.html]  ─ base64 응답(+_rt 시간) ─┐
[OMR 종이 → 관리자]  ─ 블록별 자릿수 디코드 ───┤
                                               ▼
                                    ┌──────────────────┐
                                    │  kmchc_etl.py    │  응답 → long / wide
                                    └──────────────────┘
                                               │ long.csv (칸 단위: raw·scored·정답·오개념·확신·rt)
            ┌──────────────┬──────────────┬────┴──────────┬──────────────┐
            ▼              ▼              ▼               ▼              ▼
   kmchc_dq_report   kmchc_ctt_      kmchc_cfa_      kmchc_irt_     kmchc_cdm_
   .py (품질)        analysis.py     analysis.py     analysis.py    analysis.py
                     (난이도·변별     (요인구조·       (2PL·GRM       (Q-행렬·DINA
                      ·신뢰도·오답지)  측정불변성)      문항은행)       오개념 프로파일)
```

코드북(`KMChC_codebook_v0.csv` / `_workbook.xlsx`)이 문항 메타·KC·Q-행렬의 단일 진실원천이다.

---

## 의존성 / 설치

```bash
pip install numpy pandas            # 공통
pip install semopy                  # CFA (Stage 3)
pip install girth                   # IRT (Stage 4)
# kmchc_etl / kmchc_dq_report / kmchc_simulate / kmchc_cdm : 표준 라이브러리 + numpy·pandas만
```

---

## 구성 요소

| 파일 | 역할 | 입력 | 출력 | 의존 |
|---|---|---|---|---|
| `kmchc_etl.py` | 응답(온라인 blob·OMR 자릿수) → 분석표 | items.json, 시트 export | long.csv, wide.csv | (표준) |
| `kmchc_simulate.py` | 잠재특성 가짜 데이터 생성(점검용) | items.json | long.csv | numpy |
| `kmchc_dq_report.py` | 데이터 품질 리포트 | long.csv | dq_report.md | (표준) |
| `kmchc_ctt_analysis.py` | 고전 문항분석(난이도·변별·α·오답지) | long.csv | ctt.md, item_stats.csv | numpy·pandas |
| `kmchc_cfa_analysis.py` | 확인적 요인분석·측정불변성 | long.csv | cfa.md | semopy |
| `kmchc_irt_analysis.py` | IRT 보정(2PL·GRM) | long.csv | irt.md, irt_params.csv | girth |
| `kmchc_cdm_analysis.py` | 인지진단(Q-행렬·DINA) | long.csv, items.json | cdm.md, mastery.csv | numpy·pandas |
| `KMChC_codebook_v0.csv` | 문항 코드북(자동 채움) | — | — | — |
| `KMChC_codebook_workbook.xlsx` | 주석용 워크북(KC·난이도 드롭다운) | — | — | — |
| `KMChC_sampling_consent_plan.md` | 표집·동의 계획서 | — | — | — |
| `KMChC_max_improvement_roadmap.md` | 12단계 개선 로드맵 | — | — | — |

데이터 수집 프런트엔드(별도): `index.html`(설문앱, 문항별 시간 계측 포함), `중학화학대회_정밀학습진단_설문지_OMR.pdf`(오프라인 7p), `관리자.html`·`report.html`·Apps Script(백엔드).

---

## 빠른 실행 (순서)

```bash
# 0) (실데이터 없을 때) 점검용 가짜 데이터
python kmchc_simulate.py --items items.json --n 600 --out long.csv

# 1) 실데이터: 시트 export를 long/wide로
python kmchc_etl.py --items items.json --sheet 결과_export.csv --out-long long.csv --out-wide wide.csv

# 2) 데이터 품질 점검 (수집 직후 필수)
python kmchc_dq_report.py --long long.csv --out dq_report.md

# 3) 고전 문항분석
python kmchc_ctt_analysis.py --long long.csv --out ctt.md --csv item_stats.csv

# 4) 요인구조·측정불변성  (N≥300~500)
python kmchc_cfa_analysis.py --long long.csv --out cfa.md

# 5) IRT 보정  (N≥500)
python kmchc_irt_analysis.py --long long.csv --out irt.md --csv irt_params.csv

# 6) 인지진단(오개념 프로파일)
python kmchc_cdm_analysis.py --long long.csv --items items.json --out cdm.md --csv mastery.csv
```

---

## 데이터 규약

- **응답 blob**(온라인): `base64(JSON)` — 문항 id별 응답 + 예약키 `_rt`(`{dwell, ans}` 문항별 시간). 엔진·리포트는 `_rt` 무시(ITEMS만 순회)하므로 시트 스키마 변경 없음.
- **응답 구조**: 리커트=정수 1~5 / 양자택일·시나리오=0기준 인덱스 / 오개념=`{t1, conf, t2}`(t2는 온라인 전용) / 최선최악=`{most, least}` / 과대주장=체크 인덱스 배열.
- **OMR 자릿수**: 블록별 A20·B28·C64·D15·V13 = 140칸. `kmchc_etl.decode_omr`이 OMRCodec.decode 재현. 온라인↔OMR 캡처값 일치 검증됨.
- **long 칼럼**: student_id·source·item_id·block·kind·construct·cell_id·cell_role·raw·scored(역채점 적용)·label·correct·misconception·confidence·is_fake·dwell_ms·answer_at_ms.
- **wide**: raw 숫자 행렬(IRT 입력형). 역채점·재코딩은 다운스트림에서.

### ⚠ 결측 정책 (통일 필요)
- **확신도 결측**: 온라인은 비울 수 있고 OMR은 값 강제 → 정책 통일 필요(온라인 필수화 *또는* 결측 명시 코드).
- **t2(이유)**: 온라인 전용, OMR 미수집 → 오프라인 응시자는 추론 데이터 없음.

---

## 로드맵 매핑

| Stage | 내용 | 도구 | 상태 |
|---|---|---|---|
| 1 | 데이터·계측 토대 | etl·codebook·반응시간·표집/동의·dq | ✅ |
| 2 | 고전 문항분석·신뢰도 | ctt_analysis | ✅ |
| 3 | 요인구조·측정불변성 | cfa_analysis | ✅ |
| 4 | IRT 보정 | irt_analysis | ✅ |
| 5 | 인지진단·Q-행렬 | cdm_analysis | ✅ |
| 6+ | 규준·CAT·과정데이터·예측처방 | (미착수) | 실데이터 필요 |

---

## 다음 할 일 (코드 아님, 운영)

1. **표본 수집** N≥200(파일럿)→500~1,000+ : `KMChC_sampling_consent_plan.md`의 동의·층화 따라.
2. **코드북 KC 주석**: `KMChC_codebook_workbook.xlsx`의 `KC_formal`·`exp_difficulty` 채우기 → 타당한 Q-행렬(`--qmatrix`).
3. **결측 정책 통일**(위 ⚠).
4. 수집되면 위 2~6 순서대로 실행 → 불량문항 정리 → 재보정.

## 주의

- 모든 통계는 **표본·모형 의존**. 소표본/시뮬레이션 결과는 잠정.
- IRT·CDM은 N과 Q-행렬 타당성에 민감 → 충분한 데이터에서 재적합·적합도 점검 필수.
- 정식 측정불변성(ΔCFI)·NRM(오답지 정보)·이분 WLSMV는 R `lavaan`/`mirt` 권장.
