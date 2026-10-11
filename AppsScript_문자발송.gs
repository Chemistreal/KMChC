/*****************************************************************
 *  문자발송 탭 — 「결과」 탭을 읽어 학부모에게 보낼 리포트 문자를 한 줄씩 만든다.
 *  DT 시트의 「문자발송」 탭과 같은 짜임(맨 아래가 최신, 문자 칸을 복사해 붙여 넣기).
 *
 *  붙이는 법 (처음 한 번)
 *   1. 시트 → 확장 프로그램 → Apps Script
 *   2. 왼쪽 「파일」 옆 + → 스크립트 → 이름: 문자발송 → 이 파일 내용을 통째로 붙여 넣고 저장
 *      (기존 코드 파일은 건드리지 않는다. 웹앱 재배포도 필요 없다.)
 *   3. 위 함수 고르기에서 setupKmMsgTrigger → [실행] (권한 허용)
 *      → 탭이 바로 만들어지고, 그 뒤로 10분마다 저절로 새로 고쳐진다.
 *   4. 시트를 다시 열면 메뉴 「문자발송 → 지금 새로 고침」 이 생긴다.
 *
 *  규칙
 *   · 「구분」 이 데모인 행, 이름이 빈 행은 뺀다.
 *   · 같은 학생(이름+학년)이 여러 번 냈으면 **가장 최근 행에만** 문자를 둔다.
 *     앞선 행은 상태에 「이전 제출」 이라고만 적는다(옛 링크를 잘못 보내지 않게).
 *   · 신뢰도가 「신중 해석」 인 행은 상태를 「확인 후 발송」 으로 칠한다 — 리포트를 먼저 열어 보고 보낸다.
 *   · 링크는 결과 탭의 「짧은리포트주소」 를 그대로 쓴다(없으면 ID 로 만든다).
 *****************************************************************/

var KM_MSG_TAB = '문자발송';
var KM_MSG_SRC = '결과';
var KM_MSG_SHEET_ID = '1KA_vEikeHCsDTp2EUujXlxWiTJdV23KgGv0jrbu_2Gs';
var KM_MSG_REPORT = 'https://chemistreal.github.io/KMChC/report.html';

function kmMsgText_(name, link) {
  return '[다원교육 영재관 · 화학 조준모]\n'
    + name + ' 학생 중학 화학대회 정밀 학습진단 결과입니다.\n'
    + '· 학습 유형, 헷갈리는 개념, 응답 신뢰도를 함께 분석했습니다(시험 점수가 아닙니다).\n'
    + '아래 링크에서 결과와 집에서 도와줄 방법을 확인하세요.\n'
    + '링크는 학생 본인·가족·지도 선생님과만 나눠 주세요.\n'
    + link;
}

function kmMsgCol_(headers, names) {
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || '').trim();
    if (names.indexOf(h) >= 0) return i;
  }
  return -1;
}

function kmMsgLink_(shortUrl, id, name, grade) {
  var u = String(shortUrl || '').trim();
  if (u) return u;
  id = String(id || '').trim();
  if (!id) return '';
  u = KM_MSG_REPORT + '?id=' + encodeURIComponent(id);
  if (name) u += '&n=' + encodeURIComponent(name);
  if (grade) u += '&g=' + encodeURIComponent(grade);
  return u;
}

/* 결과 탭 값(머리줄 포함)을 받아 문자발송 탭에 쓸 줄들을 낸다. 시트 없이도 시험할 수 있게 떼어 둔다. */
function kmMsgRows_(values) {
  if (!values || values.length < 2) return [];
  var H = values[0];
  var c = {
    id: kmMsgCol_(H, ['ID']), url: kmMsgCol_(H, ['짧은리포트주소']), t: kmMsgCol_(H, ['시각']),
    name: kmMsgCol_(H, ['이름']), grade: kmMsgCol_(H, ['학년']), kind: kmMsgCol_(H, ['구분']),
    val: kmMsgCol_(H, ['신뢰도']), type: kmMsgCol_(H, ['유형'])
  };
  if (c.name < 0) throw new Error("'" + KM_MSG_SRC + "' 탭 머리줄에 「이름」 칸이 없습니다.");
  var g = function (r, k) { return c[k] >= 0 ? r[c[k]] : ''; };
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    var name = String(g(r, 'name') || '').trim();
    if (!name) continue;
    if (String(g(r, 'kind') || '').trim() === '데모') continue;
    var grade = String(g(r, 'grade') || '').trim();
    rows.push({
      name: name, grade: grade, t: g(r, 't'), val: String(g(r, 'val') || '').trim(),
      link: kmMsgLink_(g(r, 'url'), g(r, 'id'), name, grade),
      key: name.replace(/\s+/g, '') + '#' + grade
    });
  }
  var lastOf = {};
  rows.forEach(function (o, k) { lastOf[o.key] = k; });   // 결과 탭은 아래로 쌓인다 — 같은 학생의 마지막 줄이 최신
  return rows.map(function (o, k) {
    if (lastOf[o.key] !== k) return { name: o.name, grade: o.grade, t: o.t, val: o.val, status: '이전 제출', msg: '' };
    if (!o.link) return { name: o.name, grade: o.grade, t: o.t, val: o.val, status: '링크 없음', msg: '' };
    var st = o.val === '신중 해석' ? '확인 후 발송' : '보낼 것';
    return { name: o.name, grade: o.grade, t: o.t, val: o.val, status: st, msg: kmMsgText_(o.name, o.link) };
  });
}

/* 실행용: 「결과」 를 읽어 「문자발송」 탭을 다시 만든다. */
function buildKmMsgSheet() {
  var ss = KM_MSG_SHEET_ID ? SpreadsheetApp.openById(KM_MSG_SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var src = ss.getSheetByName(KM_MSG_SRC);
  if (!src || src.getLastRow() < 2) { Logger.log("'" + KM_MSG_SRC + "' 탭에 데이터가 없습니다."); return; }
  var values = src.getRange(1, 1, src.getLastRow(), src.getLastColumn()).getValues();
  var out = kmMsgRows_(values);
  var sh = ss.getSheetByName(KM_MSG_TAB) || ss.insertSheet(KM_MSG_TAB);
  sh.clear();
  var body = [['이름', '학년', '제출시각', '신뢰도', '상태', '리포트 문자']];
  out.forEach(function (o) { body.push([o.name, o.grade, o.t || '', o.val, o.status, o.msg]); });
  sh.getRange(1, 1, body.length, 6).setValues(body);
  if (out.length) {
    var bg = [], fc = [];
    out.forEach(function (o) {
      if (o.status === '보낼 것') { bg.push(['#C6EFCE']); fc.push(['#0B6E39']); }
      else if (o.status === '확인 후 발송') { bg.push(['#FFF2CC']); fc.push(['#8A6A2F']); }
      else { bg.push(['#EEEEEE']); fc.push(['#777777']); }
    });
    sh.getRange(2, 5, out.length, 1).setBackgrounds(bg).setFontColors(fc);
    sh.getRange(2, 6, out.length, 1).setWrap(true).setVerticalAlignment('top');
  }
  try {
    sh.getRange(1, 1, 1, 6).setFontWeight('bold'); sh.setFrozenRows(1);
    sh.setColumnWidth(1, 80); sh.setColumnWidth(2, 60); sh.setColumnWidth(3, 124);
    sh.setColumnWidth(4, 82); sh.setColumnWidth(5, 92); sh.setColumnWidth(6, 540);
  } catch (e) {}
  SpreadsheetApp.flush();
  Logger.log(KM_MSG_TAB + ': ' + out.length + '행 (보낼 것 ' + out.filter(function (o) { return o.status === '보낼 것'; }).length + ')');
}

/* 처음 한 번 실행: 탭을 바로 만들고 10분 간격 자동 갱신을 건다(중복은 지운다). */
function setupKmMsgTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'buildKmMsgSheet') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('buildKmMsgSheet').timeBased().everyMinutes(10).create();
  buildKmMsgSheet();
  Logger.log('문자발송 탭 생성 + 10분 간격 자동 갱신 설치');
}

/* 시트 메뉴: 새 제출을 바로 보고 싶을 때 */
function onOpen() {
  try { SpreadsheetApp.getUi().createMenu('문자발송').addItem('지금 새로 고침', 'buildKmMsgSheet').addToUi(); } catch (e) {}
}
