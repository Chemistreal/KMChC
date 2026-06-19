# KMChC 진단 — 산출물 전체 인덱스

오프라인 검사지·시간계측 앱부터 **Stage 1~5 심리측정 분석 체인**까지. 8개 분석 도구가 한 파이프라인으로 연결되고 시뮬레이션 검증을 통과함. 모든 파일은 `/mnt/user-data/outputs/`.

---

## 1. 오프라인 검사지 & 설문앱

| 파일 | 크기 | 내용 |
|---|---|---|
| `중학화학대회_정밀학습진단_설문지_OMR.pdf` | 332KB | 표지 1p + 설문 5p(블록 A·B·C·D·V별 분할) + OMR 1p = 7페이지 |
| `index.html` | 203KB | 설문앱 — 문항별 반응시간 계측 패치(가시성 dwell + 응답시각, `_rt` 임베드, 시트 스키마 무변경) |

## 2. 개선 로드맵

| 파일 | 내용 |
|---|---|
| `KMChC_max_improvement_roadmap.md` | ROI 무시 12단계 성숙도 사다리 (측정과학→인지진단→타당도→적응형→생태계) |

## 3. Stage 1 — 데이터 토대

| 파일 | 내용 | 검증 |
|---|---|---|
| `KMChC_codebook_v0.csv` | 99문항 코드북(구인·정답키·오답지 오개념·역채점 자동 채움) | — |
| `KMChC_codebook_workbook.xlsx` | 주석용 워크북(KC·난이도 드롭다운, 고정창, 자동필터) | 0오류 |
| `kmchc_etl.py` | 응답(온라인 blob·OMR 자릿수) → long/wide | 온라인↔OMR 캡처값 일치 |
| `KMChC_sampling_consent_plan.md` | 표집(N≥200→1,000)·동의서·체크리스트 | — |
| `kmchc_dq_report.py` | 데이터 품질 리포트(결측·반응시간·타당도) | 불량응답 포착 |
| `kmchc_simulate.py` | 잠재특성 시뮬레이터(점검용 가짜 데이터) | — |
| `kmchc_long_demo.csv` / `kmchc_wide_demo.csv` | ETL 데모 출력(골든 샘플) | — |

## 4. Stage 2~5 — 분석 도구

| 파일 | 내용 | 검증(시뮬레이션) |
|---|---|---|
| `kmchc_ctt_analysis.py` | 고전 문항분석(난이도·변별·α/KR-20·오답지) | 개념 α=0.88, 오답지 정상 패턴 |
| `kmchc_cfa_analysis.py` | 확인적 요인분석·측정불변성 | CFI=0.958·RMSEA=0.051, 판별타당도 양호 |
| `kmchc_irt_analysis.py` | IRT 보정(2PL·GRM 문항은행) | 주변신뢰도 0.88, 검사정보 θ=0 최대 |
| `kmchc_cdm_analysis.py` | 인지진단(Q-행렬·DINA 오개념 프로파일) | slip/guess 정확 복원, KC 프로파일 산출 |

## 5. 실행 가이드

| 파일 | 내용 |
|---|---|
| `README_analysis_pipeline.md` | 전체 파이프라인(흐름도·의존성·실행순서·데이터 규약·로드맵 매핑) |
| `INDEX.md` | (이 문서) 산출물 전체 인덱스 |

---

## 기존 배포 시스템 (이전 작업, 유지)

- **앱·리포트**: `관리자.html` · `report.html` · `answers.html` · `리포트링크생성기.html` · `리포트_고급_미리보기.html` · `분석_대시보드.html`
- **백엔드**: `AppsScript_GitHub빠른조회_정리본.gs`(중복 함수 정리본) · `AppsScript_shortid.gs` · `README_빠른조회.md`
- **이전 PDF**: `검사지_v2.pdf` · `OMR_v2.pdf`
- **가이드/설계**: `배포가이드_GitHubPages.md` · `결과수집_설치가이드.md` · `화학유형진단_설계서.md` 등

---

## 파이프라인 한눈에

```
[설문앱 index.html]  ─ base64 응답(+_rt 시간) ─┐
[OMR 종이 → 관리자]  ─ 블록별 자릿수 디코드 ───┤
                                               ▼
                                    [ kmchc_etl.py ]  응답 → long / wide
                                               │ long.csv
            ┌──────────────┬──────────────┬────┴──────────┬──────────────┐
            ▼              ▼              ▼               ▼              ▼
      dq_report        ctt_analysis   cfa_analysis    irt_analysis   cdm_analysis
      (품질)           (CTT)          (요인구조)       (IRT)          (인지진단)
```

## 의존성

```bash
pip install numpy pandas      # 공통
pip install semopy            # CFA (Stage 3)
pip install girth             # IRT (Stage 4)
```

## 실행 순서

```bash
# 0) 점검용 가짜 데이터 (실데이터 없을 때)
python kmchc_simulate.py --items items.json --n 600 --out long.csv
# 1) 실데이터 ETL
python kmchc_etl.py --items items.json --sheet 결과_export.csv --out-long long.csv --out-wide wide.csv
# 2~6)
python kmchc_dq_report.py   --long long.csv --out dq.md
python kmchc_ctt_analysis.py --long long.csv --out ctt.md --csv item_stats.csv
python kmchc_cfa_analysis.py --long long.csv --out cfa.md
python kmchc_irt_analysis.py --long long.csv --out irt.md --csv irt_params.csv
python kmchc_cdm_analysis.py --long long.csv --items items.json --out cdm.md --csv mastery.csv
```

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

## 다음 할 일 (코드 아님, 운영)

1. **표본 수집** N≥200(파일럿)→500~1,000+ : 동의서·층화 따라.
2. **코드북 KC 주석**: 워크북의 `KC_formal`·`exp_difficulty` 채우기 → 타당한 Q-행렬(`--qmatrix`).
3. **결측 정책 통일**: 온라인 빈 확신도 vs OMR 강제값.
4. 수집되면 위 실행 순서대로 → 불량문항 정리 → 재보정.

## 주의

- 모든 통계는 표본·모형 의존. 소표본/시뮬레이션 결과는 잠정.
- IRT·CDM은 N과 Q-행렬 타당성에 민감 → 충분한 데이터에서 재적합·적합도 점검 필수.
- 정식 측정불변성(ΔCFI)·NRM(오답지 정보)·이분 WLSMV는 R `lavaan`/`mirt` 권장.
