/* ============================================================
   KMChC 엔진 동기화(드리프트) 검사
   ------------------------------------------------------------
   index/report/관리자/리포트_고급_미리보기 네 파일은 채점·리포트 엔진을
   각자 통째로 복제해서 품는다(단일 HTML 설계). 하나만 고치고 나머지를
   빠뜨리면 페이지마다 결과가 달라지는데 아무도 모른다.
   이 검사는 엔진 심볼을 파일별로 추출해 서로 다르면 실패시킨다.

   실행:  node tests/engine-sync.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// 네 파일이 반드시 동일하게 품어야 하는 엔진 심볼(함수/데이터)
const SYMBOLS = [
  'computeV2', 'renderReportV2', 'parentFAQHTML', 'typeStability',
  'TYPES', 'TYPE_INFO', 'TRACKS_V2', 'SIGNEXT', 'copeScene', 'esc', 'escT'
];
// 엔진을 품는 파일들(리포트를 렌더하는 화면). answers.html은 일부만 공유하므로 제외.
const FILES = ['index.html', 'report.html', '관리자.html', '리포트_고급_미리보기.html'];

function readFile(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }

// 심볼 정의를 소스에서 추출: function NAME(){...} 또는 var NAME = ...;  (깊이 0에서 종료)
function extract(src, name) {
  let at = src.search(new RegExp('function\\s+' + name + '\\s*\\('));
  let isFn = at >= 0;
  if (!isFn) at = src.search(new RegExp('(?:var|let|const)\\s+' + name + '\\s*='));
  if (at < 0) return null;
  let i = src.indexOf(isFn ? '{' : '=', at);
  if (i < 0) return null;
  if (isFn) {
    let depth = 0, j = i;
    for (; j < src.length; j++) { const c = src[j]; if (c === '{') depth++; else if (c === '}' && --depth === 0) { j++; break; } }
    return src.slice(at, j);
  }
  // var/const: '=' 다음부터 깊이 0의 ';' 까지 (문자열/괄호 안의 ; 무시는 근사 — 괄호 깊이로 처리)
  let depth = 0, j = i + 1, inStr = null;
  for (; j < src.length; j++) {
    const c = src[j], p = src[j - 1];
    if (inStr) { if (c === inStr && p !== '\\') inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (c === ';' && depth === 0) { j++; break; }
  }
  return src.slice(at, j);
}
function norm(s) { return s.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/[ \t]*\n[ \t]*/g, '\n').trim(); }

const srcs = {}; FILES.forEach(f => srcs[f] = readFile(f));
let fail = 0, checked = 0;
const ref = FILES[0];

SYMBOLS.forEach(sym => {
  const base = extract(srcs[ref], sym);
  /* ⚠ 여기가 **조용히 건너뛰던 자리**였다. 기준 파일에서 심볼 이름이 바뀌면
       '건너뜀' 만 찍고 종료 코드 0 으로 끝났다 — 그러면 그 심볼은 네 화면에서
       갈려도 아무도 모른다. 2026-08-10 에 같은 꼴로 두 번 데였다(브라우저 검사가
       설치보다 앞에 걸려 조용히 건너뛰었고, 그 사이 지운 화면을 재고 있었다).
       **건너뛴 것은 초록으로 세지 않는다.** 목록이 낡았으면 목록을 고치고,
       코드에서 없어졌으면 왜인지 본다 — 어느 쪽이든 사람이 봐야 한다.
       지금은 열한 개가 다 있어 이 줄은 안 탄다(33쌍 비교, 전부 일치). */
  if (base == null) {
    console.log('  FAIL ' + sym + ' — 기준(' + ref + ')에 **없다**. '
                + '이름이 바뀌었으면 SYMBOLS 를 고치고, 없어졌으면 왜인지 본다');
    fail++; return;
  }
  const nb = norm(base);
  FILES.slice(1).forEach(f => {
    const cur = extract(srcs[f], sym);
    if (cur == null) { console.log('  FAIL ' + sym + ' — ' + f + '에 없음(기준엔 있음)'); fail++; return; }
    checked++;
    if (norm(cur) !== nb) {
      console.log('  FAIL ' + sym + ' — ' + f + ' ↔ ' + ref + ' 내용 다름(드리프트)');
      fail++;
    }
  });
});

console.log('\n비교 ' + checked + '쌍 · 심볼 ' + SYMBOLS.length + '개 · ' + (fail ? fail + '건 드리프트 ❌' : '전부 일치 ✅'));
process.exit(fail ? 1 : 0);
