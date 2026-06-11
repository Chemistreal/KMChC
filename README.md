KMChC 빠른 리포트 조회 적용 순서

1. Apps Script
- 기존 코드 전체 삭제
- AppsScript_fastgithub.gs 전체 붙여넣기
- 저장

2. GitHub Token 설정
- GitHub에서 Fine-grained personal access token 생성
- Repository access: Chemistreal/KMChC
- Repository permissions: Contents = Read and write
- Apps Script → 프로젝트 설정 → 스크립트 속성 → 속성 추가
  이름: GITHUB_TOKEN
  값: 발급받은 토큰

3. Apps Script 함수 실행
- testGithubToken 실행: GitHub report-data/test_숫자.json 생성 확인
- backfillOldReportIds 실행: 기존 학생 ID와 짧은리포트주소 생성
- publishExistingReportsToGithub 실행: 기존 학생 report-data/ID.json 발행

4. Apps Script 재배포
- 배포 → 배포 관리 → 활성 배포 연필 → 버전: 새 버전 → 배포
- URL은 기존 URL 유지

5. GitHub 파일 교체
- report_fast.html → report.html 로 이름 변경 후 업로드/교체
- answers_fast.html → answers.html 로 이름 변경 후 업로드/교체
- 관리자_shortid_v2.html → 관리자.html 로 이름 변경 후 업로드/교체
- index_shortid.html → index.html 로 이름 변경 후 업로드/교체

6. 확인
- 결과 탭의 짧은리포트주소를 시크릿 창에서 열기
- 정상 속도: GitHub JSON 파일이 생성된 뒤에는 보통 1~3초, 환경에 따라 5초 안팎
- 저장 직후 바로 열면 GitHub Pages 반영 전이라 한 번 느릴 수 있음. 몇 초 뒤 다시 열면 빨라짐.
