# KMChC 화학 정밀 학습진단 — 인수인계 문서 (HANDOFF)

> ⚠ **이 글은 지금 저장소가 아니라 zip 으로 넘기던 시절의 구조를 적는다**
> (2026-08-10 확인). 여기 나오는 `live_system/` · `apps_script/` ·
> `offline_pdf/` 세 폴더는 **이 저장소에 없다.** 화면도 8장이 아니라 7장이다
> (`분석_대시보드.html` 은 레거시라 빠졌다). 설계가 어디서 왔는지를 보려면
> 읽되, **설명서로 쓰지 않는다** — 지금 모습은 `README.md` 에 있다.

> 이 문서 하나로 새 채팅 세션에서 프로젝트를 그대로 이어갈 수 있게 작성했습니다.
> 새 세션의 Claude(또는 담당자)는 **먼저 이 문서를 끝까지 읽고**, 그다음 `live_system/`의
> HTML을 열어보면 됩니다. "필요 이상으로 전부" 담아 달라는 요청에 따라 현행/레거시/데이터/스크립트/문서를 모두 포함했습니다.

---

## 0. 30초 요약

- **무엇**: 중학 화학대회(KMChC) 대비, 학생의 **학습 유형(16유형) · 개념 오개념 · 응답 타당도**를 진단하는 웹 시스템 + 오프라인 지필 세트.
- **운영자**: 조준모T (다원교육 영재관, 대치동). 브랜드 CHEMISTREAL. 30명 정원 프리미엄 모델, 올림피아드 지향 고객.
- **핵심 산출물**: (1) 배포된 8개 HTML 웹앱, (2) Google Apps Script 백엔드, (3) 오프라인 PDF(문제지+OMR).
- **지금 상태**: 콘텐츠·코드·멘트 3중 전수 검증 완료. 최근 세션에서 (a) 대치동 학부모 페르소나 7단계 리뷰 반영, (b) 관리자 고속입력 추가, (c) 오프라인 PDF를 가독성·한장 OMR로 재설계까지 마침.
- **현행 최종본**: 웹은 `live_system/`의 8개 HTML, 앱스크립트는 `apps_script/AppsScript_GitHub빠른조회_정리본.gs`, 오프라인은 `offline_pdf/KMChC_offline_v7.pdf`(+단독 OMR `KMChC_OMR_1page_v7.pdf`).

---

## 1. 라이브 시스템 (배포 정보)

- **GitHub Pages**: https://chemistreal.github.io/KMChC/
- **저장소**: github.com/Chemistreal/KMChC  (수정 후 이 8개 HTML을 그대로 덮어쓰기하면 반영)
- **Apps Script /exec**: `https://script.google.com/macros/s/AKfycbxdD_pKlNZaHyce2mUsDcmTspMW4uh--wOr3MggvDABEDs7n64re6DLYEVOlh8ANE9-/exec`
- **Google Sheet ID**: `1KA_vEikeHCsDTp2EUujXlxWiTJdV23KgGv0jrbu_2Gs`  (탭 이름: `결과`)
- **재배포 규칙(중요)**: Apps Script 수정 시 반드시 **배포 → 배포 관리 → 편집 → 새 버전**으로 재배포. "새 배포"를 누르면 /exec URL이 바뀌어 모든 HTML의 엔드포인트가 깨집니다.

### 배포된 8개 HTML (전부 `live_system/`)
| 파일 | 역할 | 엔진 임베드 |
|---|---|---|
| `index.html` | 학생용 설문 앱(초6~중3, 약 15분). 완료 시 Apps Script로 POST. | ✅ |
| `report.html` | 학부모용 종합 리포트. `?id=` 또는 `?d=`로 로드. | ✅ |
| `리포트_고급_미리보기.html` | 조준모T 내부 미리보기(임베드 데모 1건 포함). | ✅ |
| `관리자.html` | OMR 수기 입력 도구(고속입력 포함) + 채점/저장. `?d=` 로드. | ✅ |
| `answers.html` | 문항별 원응답 로그(학부모/교사용). | ✅(부분) |
| `분석_v2.html` | v2 문항셋 **검증 대시보드**(CSV 업로드→신뢰도/문항품질). | 데이터대기 |
| `분석_대시보드.html` | **레거시** 대시보드(구 문항셋). v2 데이터엔 쓰지 말 것. | 레거시 |
| `리포트링크생성기.html` | 시트 행 붙여넣기→학부모 링크 생성(엔진 미임베드, 독립 도구). | ❌ |

> **배포 현황(2026-07-06 실측, Pages md5 대조)**: index·report·answers·미리보기·분석_v2는 배포본=이 zip과 **일치**. `관리자.html`은 **이 zip이 최신**(⚡고속입력 포함)이고 배포본은 고속입력 이전 버전 → 재업로드 필요. `리포트링크생성기.html`·`분석_대시보드.html`은 Pages에서 **404(미배포)** — 링크생성기는 수정본(관리자 ID 인식 버그 픽스)으로 업로드 권장, 분석_대시보드는 레거시라 선택.

> **엔진 동기화 규칙**: `report.html / 리포트_고급_미리보기.html / index.html / 관리자.html` 네 파일은 각각 **엔진 전체 사본(computeV2/renderReportV2/TYPES/TYPE_INFO/TRACKS_V2/parentFAQ/SIGNEXT/OMRCodec 등)을 통째로 품고** 있습니다. 엔진 텍스트를 고칠 땐 **네 파일 전부**에 같은 수정을 적용해야 합니다(count==N 어서션 권장). `answers.html`도 일부 공유.
> **자동 감지(2026 추가)**: `tests/engine-sync.js`가 네 파일의 엔진 심볼을 추출해 서로 다르면 실패합니다. `node tests/engine-sync.js`로 로컬 확인 가능하고, push·PR마다 GitHub Actions(`엔진 동기화 검사`)가 자동으로 돌려 하나만 고치고 빠뜨리면 빨간불이 뜹니다. 엔진 심볼을 새로 추가하면 `tests/engine-sync.js`의 `SYMBOLS` 목록에도 넣어 주세요.

---

## 2. 데이터 흐름 & 아키텍처

```
학생: index.html 설문 → (POST) → Apps Script doPost
  → LockService로 동시성 보호 → Google Sheet '결과'에 1행 저장
  → 짧은 리포트 ID(r+16hex) 생성 → (옵션) GitHub report-data/ID.json 발행
  → {ok, id, shortUrl} 반환

학부모: report.html?id=<ID>
  → report-data/ID.json 우선 시도(정적, 빠름) → 없으면 doGet?action=get JSONP 폴백(시트 조회)
  → computeV2(응답)로 유형/오개념/타당도/트랙 계산 → renderReportV2로 렌더

관리자: 관리자.html에서 OMR을 보고 수기 입력(또는 고속입력) → 같은 응답 blob 구성 → 채점/저장
```

### 리포트 엔진 핵심 개념
- **16유형**: 4개 2×2 축의 4글자 코드(예: GJTD, SJRD). 축=lens(G/S)·think(J/B)·drive(T/R)·approach(D/M), 축당 7문항. 코드 첫 글자 G/S(현상 vs 구조 렌즈) 등. 유형명은 `source_data/types.json` 참조.
- **오개념(C블록)**: 각 오답이 명명된 오개념 태그(예: 용해=소멸)에 매핑. 리포트가 "이렇게 고쳐요"로 집 실험+소크라테스 질문 제시.
- **응답 타당도(V블록)**: 3단계 라벨 **고신뢰 / 주의 / 신중 해석**. 계산식:
  `weak = (SD>=8) + (과대주장>=1) + (불일치>=1) + (직선응답) + (과속) ; tag = (주의력실패 || weak>=2) ? '신중 해석' : (weak===1 ? '주의' : '고신뢰')`
  - 주의력 문항 V-AT 정답=3('보통'). V-OC 용어 중 가짜 2개(역응결 분해, 단일가 환원수) = 과대주장.
- **진학 트랙**: 과학고/영재고/자사고·의대/올림피아드 등. 적합도(fit)는 등수가 아니라 "지금 신호의 방향".

### OMR 코덱 (지필 ↔ 관리자 입력 좌표계)
- `관리자.html`의 `OMRCodec.buildSpec(ITEMS)` → **140개 셀**. `BLOCK_ORDER=['A','B','C','D','V']`.
- 셀 역할: A/B/D-MC/D-SC/V-likert=단일, **C=t1(답)+conf(확신) 2칸**, D-ML=most+least 2칸, V-OC=용어별 oc 1칸.
- **지필 PDF의 칸 번호 = 이 셀 좌표계**와 동일. 그래서 관리자 고속입력이 "C블록 12번째 자리" 같은 안내를 정확히 낼 수 있음.
- `source_data/cells.json`에 현재 140셀 스펙(id/block/role/max/termIdx) 저장.

---

## 3. 표준 규칙 (STANDING CONVENTIONS)

이 프로젝트에서 지켜온 규칙. 새 세션도 따를 것.
- **엔진 수정은 4개 파일 동기화**(위 §1). 문자열 교체 시 각 파일 `count==N` 어서션 후 적용.
- **파일명은 되도록 유지**(report.html, 관리자.html, 리포트_고급_미리보기.html 등 기존 한글명 그대로). 새 산출물의 파일명은 ASCII 권장(파이프라인 안정).
- **한글은 리터럴 UTF-8**로. `\uXXXX` 이스케이프는 기호(·—''※▸ 등)에만, 한글엔 금지.
- **em-dash(—)는 이 프로젝트에선 허용**(다른 프로젝트와 다름). 단 남용은 지양.
- **턴마다 바뀐 파일만** 내보내기(present_files).
- **검증은 눈대중 금지, 실측**: 아래 §5 기법 사용.
- 커서/이름 등 개인정보를 URL/코드에 상수로 박지 않기. 학부모 발송 링크는 시트 shortUrl(`?id=`) 우선(이름 미노출).

---

## 4. 최근 세션에서 한 일 (직전 작업 이력)

### (A) 대치동 학부모 페르소나 7단계 리뷰 — report 엔진 전면 점검
회의적·입시지향(과고/영재고/의대·올림피아드) 학부모 관점으로 7단계 리뷰 후 수정 반영(4개 엔진 파일):
1. 첫 10초 신뢰: 올림피아드 트랙 배지 줄바꿈 수정(`white-space:nowrap`).
2. Barnum 테스트: 프로필별로 마무리 문장이 갈리도록 P(51) 배열을 top.fit 조건부로 교체.
3. 입시 번역: 물리 적합도 면책을 **항상 보이는 트랙 안내문**으로 노출 + 스냅샷 숫자에 "적합도는 등수가 아니라 방향" 서브라인.
4. 타당도 심문: 신뢰도 라벨이 3단계로 판별됨을 검증(보일러플레이트 아님). **데모 튜닝**: 미리보기 임베드 데모의 V-OC에서 가짜용어 제거 → 샘플이 '고신뢰'로 시연되게.
5. 실행성: SIGNEXT 액션 중 추상적이던 `analysis`를 "왜 이 답인지 근거를 단계별로 설명하게 하기"로 구체화.
6. **영업 의도(전환의 분수령)**: 올림피아드 프레이밍이 모든 학생에게 무조건 노출되던 것을 **적합도 연동 + 역량/상품 분리**로 재설계.
7. 공유/프라이버시: 푸터 프라이버시 문구를 "가족 외 공유 삼가"→**"학생 본인·가족·지도 선생님과만 공유, 공개(SNS·카페) 금지"**로(과외쌤 공유 허용). report/미리보기/answers 3파일.
   - **올림피아드 재조정(중요 뉘앙스)**: "대회보다 기초부터"(밀어냄)가 올림피아드 학부모에게 "괜히 보냈나"로 읽힐 수 있어, 적합 낮은 학생 문구를 **"이 기초가 올림피아드로 가는 출발점"**(같은 길·정직한 단계)으로 바꿈. 적합 높으면 강하게 권장. → 세 부류(올림피아드 학부모/회의론자/조준모T 포지셔닝) 모두 성립.

### (B) 관리자.html 고속입력 추가
- 블록 칸 위 **⚡ 고속 입력** 패널. OMR 보며 숫자만 연타하면 셀 순서대로 자동 기입 + **자동 다음 이동**(블록 다 차면 다음 블록 포커스), 칸별 1~max 범위 검증, ⌫ 되돌리기, '가장 나=가장 먼' 경고, 진행바, 완료 시 채점버튼 유도. 기존 채점/저장 경로 무변경.

### (C) 오프라인 PDF 재설계 (현행 v7)
- **문제지**: 단일 컬럼(단 안 나눔), **한 문항/한 보기 = 한 줄**(nowrap, 잘림·줄넘김 0을 실측으로 보장, 10.5px), 표지에 다원 로고.
- **OMR**: **A4 한 장 완결**, 3열, **C는 답(위)/확신(아래) 상하 2줄**, 번호·버블 잘림 0(세 가지 독립 측정으로 확인), 결합본에서 **마지막 홀수 페이지**(양면 인쇄 시 낱장 분리).
- 산출: `offline_pdf/KMChC_offline_v7.pdf`(11p), `offline_pdf/KMChC_OMR_1page_v7.pdf`(단독).

### (D) 그 밖의 최근 수정
- D-ML 지시문 통일: "— 가장 나 / 가장 아님" → **"— 가장 나에 가까운 것 / 가장 먼 것"**(6개 파일).
- 리포트링크생성기 파서 버그 수정: 현행 31열 시트 레이아웃 자동 감지 + ID 캡처 + `?id=` 짧은 링크 우선(구버전 행은 `?d=` 폴백).
- 인쇄 시 접힌 트랙 해설이 안 나오던 문제 → `beforeprint`에서 모든 `<details>` 펼치고 `afterprint`에서 복원(4개 파일).


### (E) 인수인계 오류 정비 (2026-07-06)
- 이 문서의 /exec URL 오타(wOr9→wOr3)·유형 축 수(6→4) 정정. wOr3는 실호출로 정상 확인(시트 38건).
- `docs/report_v2.js`가 라이브 4개 HTML보다 구버전(페르소나 리뷰 미반영)이던 것을 **라이브 블록 재이식으로 동기화**(md5 `74373cce72` 일치). engine_v2.js는 원래 동기 상태.
- `배포전점검.js` 수리: 대상 폴더 인자화(`node 배포전점검.js [폴더]`), 구식 "by 조준모" 엔진 체크를 정적 마스트헤드·풋터 크레딧 검사로 교체 → 현행 라이브 세트로 **79항목 전체 통과**.
- `리포트링크생성기.html` 버그 픽스: 관리자 생성 ID(r+base36)가 `[0-9a-f]` 정규식에 걸리지 않아 짧은 `?id=` 링크가 생성되지 않던 문제 → `r[0-9a-z]{8,}`로 완화(2곳), AppsScript·관리자·구형 3종 행 파싱 실측 통과.
- `kmchc_etl.py` 버그 픽스: OMR 경로가 items 파일의 배열 순서에 의존해 설계순(★items.json)으로 돌리면 캡처 불일치 → `load_items`에 BLOCK_ORDER 안정 정렬 추가(JS OMRCodec과 동일 규칙). 양쪽 순서 입력 모두 골든 ✅, 기존 `kmchc_long_demo.csv`와 산출물 바이트 동일.
- `items_LIVE.json` 재생성: D-ML2~4 구스템("가장 나 / 가장 아님")이 남아 있던 구 스냅샷 → 라이브 ITEMS의 ABCDV 정렬본으로 갱신(내용=items.json, 순서만 OMR용).
- `docs/진단_v2_문항.md`·`source_data/진단_v2_문항.md` D-ML 스템 3곳 최신화, `결과수집_설치가이드.md`에 레거시(v1) 경고 배너 추가(현행 백엔드를 구버전 .gs로 덮어쓰는 사고 방지).

---

## 5. 검증 기법 (새 세션도 이 방식 유지 권장)

- **Playwright(chromium) 설치돼 있음**(python). 모바일: `new_page(viewport={'width':390,'height':844}, device_scale_factor=2)`.
- **엔진을 UI 없이 렌더**: report.html로 goto 후 `page.evaluate`로 `computeV2(ans, meta, ITEMS)` → `renderReportV2(r)`를 직접 호출해 결과 HTML/텍스트를 얻음. 전역 available: `ITEMS, TYPES, computeV2, renderReportV2, trackScores2`. (`OMRCodec`은 관리자.html에만.)
- **오탈자/레이아웃 실측**:
  - 문장 붙음 가짜양성 주의: innerText는 블록 경계를 이어붙임 → 진짜 붙음은 **innerHTML에서 `[가-힣]\.[가-힣]`(태그 없이)** 로 판별.
  - **가로 넘침/잘림**: 각 행의 **모든 자손 boundingRect.right ≤ 행(열)의 right** 인지 검사(`.rbz` scrollWidth만 보면 flex+text-align 때문에 놓침 — 실제로 겪은 함정).
  - **PDF 실물 확인**: 렌더한 PNG에서 페이지 우측 여백(≈9mm)의 잉크 비율이 0%인지(넘침 없음).
- **PDF 생성**: playwright `page.pdf(format='A4', print_background=True, margin=0)`. 조립: `pypdf`(PdfWriter, add_blank_page로 패리티). 래스터화 확인: `pdftoppm`.

---

## 6. 알려진 상태 / 휴면 기능 / 다음 후보

- **GitHub 빠른경로 = 활성(2026-07-06 실측)**: /exec doGet 진단에서 `GITHUB_TOKEN 스크립트 속성 확인됨`으로 응답 — 제출 시 `report-data/ID.json` 발행이 동작 중이며 report/answers는 정적 JSON 우선 → JSONP 폴백. (토큰이 사라지면 발행만 건너뛰고 JSONP로 계속 동작.)
- **엔드포인트 개방**: doPost가 TOKEN 없이 수신(설문 수집 엔드포인트엔 통상적, 비공개 URL 의존). 스팸이 우려되면 간단한 서명/허니팟 추가 여지.
- **콘텐츠 안정성**: 99문항·16유형·트랙·오개념 멘트는 배포 품질로 판정됨(억지 개선 지양). 문항 문구는 **측정 의미(응답 분포 비교 가능성)와 직결**되므로 임의 변경 자제.
- **후보 개선(선택)**: 데이터 100명↑ 축적 시 분석 파이프라인(§7)으로 규준·타당도 '확정' 전환 / 특정 블록 지필 글자 확대 / OMR 블록별 색 구분 등.

---

## 7. 분석 파이프라인 (`analysis_pipeline/`)

시트 결과 CSV가 쌓이면 심리측정 분석을 돌리는 파이썬 스크립트 모음(설계·검증용):
- `kmchc_etl.py` (정리/롱변환), `kmchc_dq_report.py`(데이터품질), `kmchc_ctt_analysis.py`(고전검사이론/신뢰도), `kmchc_irt_analysis.py`(문항반응이론), `kmchc_cfa_analysis.py`(확인적요인분석), `kmchc_cdm_analysis.py`(인지진단), `kmchc_simulate.py`(시뮬레이션).
- 데모 데이터: `source_data/kmchc_wide_demo.csv`, `kmchc_long_demo.csv`. 코드북: `source_data/KMChC_codebook_*`.
- 사용법 개요: `docs/README_analysis_pipeline.md`.

---

## 8. 이 zip 안내 (폴더 구조)

```
KMChC_handoff/
  HANDOFF.md                ← 지금 이 문서(먼저 읽기)
  MANIFEST.md               ← 전체 파일 목록/현행·레거시 표시
  live_system/              ← 배포된 8개 HTML (현행 최종본)
  apps_script/              ← 현행 .gs + 리드미 (_legacy에 구버전)
  offline_pdf/              ← 현행 v7 PDF (_legacy에 v3~v6·구검사지)
  source_data/             ← 라이브 엔진에서 뽑은 items/types/cells + 코드북 + 데모CSV
  analysis_pipeline/        ← 심리측정 분석 파이썬 + 리드미
  assets/                   ← dawon_logo.png, og 이미지, QR 등
  docs/                     ← 설계서·가이드 등 모든 .md
```

## 9. 새 세션 시작 프롬프트(권장 예시)

> "첨부 zip은 KMChC 화학 진단 시스템의 인수인계 자료야. HANDOFF.md를 먼저 읽고, live_system의 4개 엔진 파일이 동기화돼 있다는 점을 기억해줘. 오늘은 [원하는 작업]을 하려고 해. 수정 전 항상 실측 검증(§5)하고, 바뀐 파일만 내보내줘."

— 작성: 직전 세션 Claude · 갱신 시각 기준 현행본은 웹 8종·앱스크립트 정리본·오프라인 v7.
