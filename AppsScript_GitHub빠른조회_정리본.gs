/*****************************************************************
 *  화학 학습 진단 — 결과 수집 + 짧은 리포트 ID + GitHub 빠른 조회 (정리본)
 *
 *  이 코드 전체로 Apps Script 기존 코드를 교체하세요.
 *  (중복 정의를 제거하고, 시간 보호·자동 백필이 있는 정상 버전으로 통일했습니다.)
 *
 *  기능
 *  1. 결과 탭에 학생 응답 저장
 *  2. 각 행마다 ID 자동 생성 + 짧은 리포트 주소 자동 생성
 *  3. report.html?id=... 조회용 JSONP API 제공 (시트 폴백)
 *  4. 저장할 때 GitHub Pages용 report-data/ID.json 파일 생성 (빠른 경로)
 *  5. 기존 학생 행도 ID 생성 + GitHub JSON 발행 가능
 *
 *  GitHub 빠른 조회를 쓰려면 스크립트 속성에 아래 값을 넣으세요.
 *  - 이름: GITHUB_TOKEN
 *  - 값: GitHub fine-grained token (Chemistreal/KMChC, Contents = Read and write)
 *
 *  적용 후 반드시:
 *  [배포] → [배포 관리] → 활성 배포 연필 → 버전: "새 버전" → [배포]
 *****************************************************************/

var SHEET_ID   = "1KA_vEikeHCsDTp2EUujXlxWiTJdV23KgGv0jrbu_2Gs";
var SHEET_NAME = "결과";
var TOKEN      = "";

var REPORT_BASE_URL = "https://chemistreal.github.io/KMChC/report.html";
var REPORT_DATA_DIR = "report-data";

var GITHUB_OWNER  = "Chemistreal";
var GITHUB_REPO   = "KMChC";
var GITHUB_BRANCH = "main";

var HEADERS = [
  "ID", "짧은리포트주소",
  "시각", "이름", "학년", "구분",
  "흥미단계", "효능감단계", "메타인지단계", "가치내면화", "심층표층(lean)", "접근1순위", "유형", "개념직관",
  "보존", "입자", "변화",
  "현상불안", "기호불안", "정량불안", "실험불안", "일반불안",
  "신뢰도", "SD", "과대주장", "불일치", "주의력실패", "직선응답", "과속",
  "소요(초)", "응답원본"
];

function ss_() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet_(ss) {
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sh.setFrozenRows(1);
    return sh;
  }

  for (var i = 0; i < HEADERS.length; i++) {
    ensureHeaderAtEnd_(sh, HEADERS[i]);
  }

  sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight("bold");
  sh.setFrozenRows(1);
  return sh;
}

function getHeaders_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}

function makeReportId_() {
  return "r" + Utilities.getUuid().replace(/-/g, "").slice(0, 16);
}

function makeShortUrl_(id) {
  return REPORT_BASE_URL + "?id=" + encodeURIComponent(id);
}

function rowObjectFrom_(d) {
  if (!d.id) d.id = makeReportId_();
  var shortUrl = makeShortUrl_(d.id);

  return {
    "ID": d.id || "",
    "짧은리포트주소": shortUrl,

    "시각": d.ts || new Date(),
    "이름": d.name || "",
    "학년": d.grade || "",
    "구분": d.demo ? "데모" : "실제",

    "흥미단계": zeroOK_(d.interest_stage),
    "효능감단계": zeroOK_(d.efficacy_stage),
    "메타인지단계": zeroOK_(d.metacog_stage),
    "가치내면화": zeroOK_(d.value_intern),
    "심층표층(lean)": zeroOK_(d.lean),
    "접근1순위": d.approach_top || "",
    "유형": d.type || "",
    "개념직관": zeroOK_(d.concept),

    "보존": d.intu_cons || "",
    "입자": d.intu_part || "",
    "변화": d.intu_chg || "",

    "현상불안": zeroOK_(d.ax_phenom),
    "기호불안": zeroOK_(d.ax_symbol),
    "정량불안": zeroOK_(d.ax_quant),
    "실험불안": zeroOK_(d.ax_lab),
    "일반불안": zeroOK_(d.ax_general),

    "신뢰도": d.validity_tag || "",
    "SD": zeroOK_(d.sd),
    "과대주장": zeroOK_(d.overclaim),
    "불일치": zeroOK_(d.inconsistency),
    "주의력실패": zeroOK_(d.attentionFail),
    "직선응답": zeroOK_(d.straightLine),
    "과속": zeroOK_(d.tooFast),

    "소요(초)": zeroOK_(d.elapsed),
    "응답원본": d.answers || ""
  };
}

function zeroOK_(v) {
  return (v === 0 || v === "0") ? 0 : (v || "");
}

function appendData_(d) {
  var sh = ensureSheet_(ss_());
  var obj = rowObjectFrom_(d);
  var headers = getHeaders_(sh);

  var row = headers.map(function(h) {
    return Object.prototype.hasOwnProperty.call(obj, h) ? obj[h] : "";
  });

  sh.appendRow(row);
  SpreadsheetApp.flush();

  var github = publishReportJsonSafe_(obj["ID"], obj["이름"], obj["학년"], obj["응답원본"]);

  return {
    id: obj["ID"],
    shortUrl: obj["짧은리포트주소"],
    row: sh.getLastRow(),
    github: github
  };
}

function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);

    var d = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    if (TOKEN && d.token !== TOKEN) {
      return jsonOut_({ ok: false, error: "forbidden" });
    }

    var saved = appendData_(d);

    return jsonOut_({
      ok: true,
      id: saved.id,
      shortUrl: saved.shortUrl,
      github: saved.github
    });

  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });

  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};

  if (p.action === "get") {
    return getReportById_(p);
  }

  var L = ["[화학진단 수집 엔드포인트 진단]"];

  try {
    var ss = ss_();

    if (!ss) {
      L.push("[X] 스프레드시트를 찾지 못했습니다. SHEET_ID 확인 후 새 버전 재배포.");
    } else {
      L.push("[OK] 연결된 문서: " + ss.getName());

      var sh = ss.getSheetByName(SHEET_NAME);

      if (!sh) {
        L.push("[안내] '" + SHEET_NAME + "' 탭 없음 — 첫 제출 때 자동 생성됩니다.");
      } else {
        L.push("[OK] '" + SHEET_NAME + "' 탭에 현재 " + Math.max(0, sh.getLastRow() - 1) + "건 기록됨.");

        var headers = getHeaders_(sh);
        var idCol = headerIndex_(headers, ["ID", "id"]);
        var answerCol = headerIndex_(headers, ["응답원본", "answers", "answer"]);

        if (idCol >= 0) L.push("[OK] ID 열 확인됨.");
        else L.push("[X] ID 열 없음.");

        if (answerCol >= 0) L.push("[OK] 응답원본 열 확인됨.");
        else L.push("[X] 응답원본 열 없음.");
      }

      var ghToken = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
      if (ghToken) L.push("[OK] GITHUB_TOKEN 스크립트 속성 확인됨.");
      else L.push("[주의] GITHUB_TOKEN 없음 — 짧은 링크는 열리지만 GitHub 빠른 조회 파일은 생성되지 않습니다(JSONP 폴백으로 동작).");

      L.push("[OK] 엔드포인트 정상. 시크릿 창에서도 이 화면이 보이면 권한 정상.");
    }

  } catch (err) {
    L.push("[X] 오류: " + err);
  }

  return ContentService.createTextOutput(L.join("\n"));
}

function getReportById_(p) {
  var id = String(p.id || "").trim();
  var callback = String(p.callback || "").trim();

  if (!id) {
    return jsonpOut_({ ok: false, error: "missing_id" }, callback);
  }

  var cache = CacheService.getScriptCache();
  var cacheKey = "report:" + id;
  var cached = cache.get(cacheKey);

  if (cached) {
    return jsonpOut_(JSON.parse(cached), callback);
  }

  var found = findReportRowById_(id);

  if (!found) {
    return jsonpOut_({ ok: false, error: "not_found" }, callback);
  }

  if (!found.answers) {
    return jsonpOut_({
      ok: false,
      error: "empty_answers",
      id: id,
      name: found.name || "",
      grade: found.grade || ""
    }, callback);
  }

  var result = {
    ok: true,
    id: id,
    name: found.name || "",
    grade: found.grade || "",
    answers: found.answers || ""
  };

  cache.put(cacheKey, JSON.stringify(result), 21600);
  return jsonpOut_(result, callback);
}

function findReportRowById_(id) {
  var sh = ensureSheet_(ss_());
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();

  if (lastRow < 2) return null;

  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];

  var idCol = headerIndex_(headers, ["ID", "id"]);
  var nameCol = headerIndex_(headers, ["이름", "name"]);
  var gradeCol = headerIndex_(headers, ["학년", "grade"]);
  var answerCol = headerIndex_(headers, ["응답원본", "answers", "answer"]);

  if (idCol < 0) throw new Error("'ID' 열을 찾지 못했습니다.");
  if (answerCol < 0) throw new Error("'응답원본' 열을 찾지 못했습니다.");

  var idRange = sh.getRange(2, idCol + 1, lastRow - 1, 1);
  var finder = idRange.createTextFinder(id).matchEntireCell(true);
  var cells = finder.findAll();

  if (!cells || cells.length === 0) return null;

  var targetRow = cells[cells.length - 1].getRow();
  var row = sh.getRange(targetRow, 1, 1, lastCol).getValues()[0];

  return {
    id: String(row[idCol] || ""),
    name: nameCol >= 0 ? String(row[nameCol] || "") : "",
    grade: gradeCol >= 0 ? String(row[gradeCol] || "") : "",
    answers: answerCol >= 0 ? String(row[answerCol] || "") : ""
  };
}

function backfillOldReportIds() {
  var ss = ss_();
  var sh = ensureSheet_(ss);

  if (sh.getLastRow() < 2) {
    Logger.log("[안내] 기존 데이터 행이 없습니다.");
    return;
  }

  ensureHeaderAtEnd_(sh, "ID");
  ensureHeaderAtEnd_(sh, "짧은리포트주소");

  var values = sh.getDataRange().getValues();
  var headers = values[0];

  var idCol = headerIndex_(headers, ["ID", "id"]);
  var linkCol = headerIndex_(headers, ["짧은리포트주소", "리포트주소", "short_url"]);
  var answerCol = headerIndex_(headers, ["응답원본", "answers", "answer"]);

  if (idCol < 0) throw new Error("'ID' 열을 찾지 못했습니다.");
  if (linkCol < 0) throw new Error("'짧은리포트주소' 열을 찾지 못했습니다.");
  if (answerCol < 0) throw new Error("'응답원본' 열을 찾지 못했습니다.");

  var used = {};

  for (var r = 1; r < values.length; r++) {
    var oldId = String(values[r][idCol] || "").trim();
    if (oldId) used[oldId] = true;
  }

  var made = 0;
  var skipped = 0;
  var linked = 0;

  for (var r2 = 1; r2 < values.length; r2++) {
    var answerRaw = String(values[r2][answerCol] || "").trim();

    if (!answerRaw) {
      skipped++;
      continue;
    }

    var id = String(values[r2][idCol] || "").trim();

    if (!id) {
      do {
        id = makeReportId_();
      } while (used[id]);

      used[id] = true;
      sh.getRange(r2 + 1, idCol + 1).setValue(id);
      made++;
    }

    sh.getRange(r2 + 1, linkCol + 1).setValue(makeShortUrl_(id));
    linked++;
  }

  SpreadsheetApp.flush();

  Logger.log("[OK] 기존 리포트 ID 생성 완료");
  Logger.log("새로 만든 ID 수: " + made);
  Logger.log("짧은 주소 생성/갱신 수: " + linked);
  Logger.log("응답원본 없음으로 건너뜀: " + skipped);
}

function publishExistingReportsToGithub() {
  var token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_TOKEN 스크립트 속성이 없습니다.");

  backfillOldReportIds();

  var sh = ensureSheet_(ss_());
  var values = sh.getDataRange().getValues();
  var headers = values[0];

  var idCol = headerIndex_(headers, ["ID", "id"]);
  var nameCol = headerIndex_(headers, ["이름", "name"]);
  var gradeCol = headerIndex_(headers, ["학년", "grade"]);
  var answerCol = headerIndex_(headers, ["응답원본", "answers", "answer"]);

  if (idCol < 0) throw new Error("ID 열 없음");
  if (answerCol < 0) throw new Error("응답원본 열 없음");

  var made = 0;
  var skipped = 0;
  var failed = 0;
  var start = Date.now();

  for (var r = 1; r < values.length; r++) {
    if (Date.now() - start > 300000) {
      Logger.log("[안내] 실행 시간 보호를 위해 중단했습니다. 다시 실행하면 이어서 발행할 수 있습니다.");
      break;
    }

    var id = String(values[r][idCol] || "").trim();
    var answers = String(values[r][answerCol] || "").trim();

    if (!id || !answers) {
      skipped++;
      continue;
    }

    var name = nameCol >= 0 ? String(values[r][nameCol] || "") : "";
    var grade = gradeCol >= 0 ? String(values[r][gradeCol] || "") : "";

    try {
      saveReportJsonToGithub_(id, name, grade, answers);
      made++;
      Utilities.sleep(300);
    } catch (err) {
      failed++;
      Logger.log("[X] GitHub 발행 실패 row " + (r + 1) + " / ID " + id + " / " + err);
    }
  }

  Logger.log("[OK] 기존 리포트 GitHub JSON 발행 작업 완료");
  Logger.log("발행/갱신 수: " + made);
  Logger.log("건너뜀: " + skipped);
  Logger.log("실패: " + failed);
}

function publishReportJsonSafe_(id, name, grade, answers) {
  try {
    if (!answers) return { ok: false, skipped: true, reason: "empty_answers" };

    var token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
    if (!token) return { ok: false, skipped: true, reason: "missing_github_token" };

    saveReportJsonToGithub_(id, name, grade, answers);
    return { ok: true };

  } catch (err) {
    Logger.log("[X] GitHub JSON 저장 실패: " + err);
    return { ok: false, error: String(err) };
  }
}

function saveReportJsonToGithub_(id, name, grade, answers) {
  if (!id || !answers) return;

  var payloadObj = {
    id: id,
    name: name || "",
    grade: grade || "",
    answers: answers || "",
    savedAt: new Date().toISOString(),
    source: "KMChC-report-data-v1"
  };

  var path = REPORT_DATA_DIR + "/" + id + ".json";
  putGithubFile_(path, JSON.stringify(payloadObj));
}

function putGithubFile_(path, text) {
  var token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_TOKEN 스크립트 속성이 없습니다.");

  var apiUrl = githubContentApiUrl_(path);
  var sha = githubGetFileSha_(path);

  var payload = {
    message: "Publish report data " + path,
    content: Utilities.base64Encode(Utilities.newBlob(text, "application/json").getBytes()),
    branch: GITHUB_BRANCH
  };

  if (sha) payload.sha = sha;

  var res = UrlFetchApp.fetch(apiUrl, {
    method: "put",
    contentType: "application/json",
    headers: githubHeaders_(),
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("GitHub 저장 실패: " + code + " / " + res.getContentText());
  }
}

function githubGetFileSha_(path) {
  var apiUrl = githubContentApiUrl_(path) + "?ref=" + encodeURIComponent(GITHUB_BRANCH);

  var res = UrlFetchApp.fetch(apiUrl, {
    method: "get",
    headers: githubHeaders_(),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  if (code === 404) return "";
  if (code < 200 || code >= 300) {
    throw new Error("GitHub 파일 조회 실패: " + code + " / " + res.getContentText());
  }

  var obj = JSON.parse(res.getContentText());
  return obj.sha || "";
}

function githubContentApiUrl_(path) {
  return "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/" + encodeGithubPath_(path);
}

function encodeGithubPath_(path) {
  return String(path).split("/").map(encodeURIComponent).join("/");
}

function githubHeaders_() {
  var token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  return {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

function ensureHeaderAtEnd_(sh, headerName) {
  var lastCol = sh.getLastColumn();

  if (lastCol < 1) {
    sh.getRange(1, 1).setValue(headerName);
    sh.getRange(1, 1).setFontWeight("bold");
    return;
  }

  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];

  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === headerName) return;
  }

  sh.getRange(1, lastCol + 1).setValue(headerName);
  sh.getRange(1, lastCol + 1).setFontWeight("bold");
}

function headerIndex_(headers, names) {
  for (var n = 0; n < names.length; n++) {
    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === names[n]) return i;
    }
  }
  return -1;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonpOut_(obj, callback) {
  var json = JSON.stringify(obj);

  if (/^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback || "")) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===== 점검·유지보수용 함수 (수동 실행) ===== */

function testWrite() {
  var saved = appendData_({
    ts: new Date(),
    name: "테스트",
    grade: "중1",
    demo: 1,

    interest_stage: 2,
    efficacy_stage: 2,
    metacog_stage: 2,
    value_intern: 50,
    lean: 0,
    approach_top: "deep",
    type: "SBTM",
    concept: 50,

    intu_cons: "양호",
    intu_part: "흔들림",
    intu_chg: "양호",

    ax_phenom: 30,
    ax_symbol: 70,
    ax_quant: 50,
    ax_lab: 20,
    ax_general: 50,

    validity_tag: "고신뢰",
    sd: 4,
    overclaim: 0,
    inconsistency: 0,
    attentionFail: 0,
    straightLine: 0,
    tooFast: 0,

    elapsed: 600,
    answers: ""
  });

  Logger.log("[OK] 테스트 행 기록");
  Logger.log("ID: " + saved.id);
  Logger.log("짧은리포트주소: " + saved.shortUrl);
  Logger.log("GitHub: " + JSON.stringify(saved.github));
}

function checkSheetNames() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  Logger.log(ss.getSheets().map(function(s) { return s.getName(); }));
}

function testGetFirstId() {
  var sh = ensureSheet_(ss_());
  var values = sh.getDataRange().getValues();

  if (values.length < 2) {
    Logger.log("[안내] 데이터 행이 없습니다.");
    return;
  }

  var headers = values[0];
  var idCol = headerIndex_(headers, ["ID", "id"]);

  if (idCol < 0) {
    Logger.log("[X] ID 열 없음");
    return;
  }

  for (var r = 1; r < values.length; r++) {
    var id = String(values[r][idCol] || "").trim();

    if (id) {
      var found = findReportRowById_(id);
      Logger.log("[OK] 첫 번째 ID 조회 테스트");
      Logger.log("ID: " + id);
      Logger.log("이름: " + found.name);
      Logger.log("학년: " + found.grade);
      Logger.log("응답원본 길이: " + String(found.answers || "").length);
      Logger.log("짧은리포트주소: " + makeShortUrl_(id));
      return;
    }
  }

  Logger.log("[안내] ID가 있는 행이 없습니다.");
}

function testGithubToken() {
  var token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_TOKEN 스크립트 속성이 없습니다.");

  var testId = "test_" + new Date().getTime();
  putGithubFile_(REPORT_DATA_DIR + "/" + testId + ".json", JSON.stringify({ ok: true, id: testId, savedAt: new Date().toISOString() }));
  Logger.log("[OK] GitHub 저장 테스트 성공: " + REPORT_DATA_DIR + "/" + testId + ".json");
}
