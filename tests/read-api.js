/* ============================================================
   명단 읽기 창구 검사 (순수 node)
   ------------------------------------------------------------
   통합 셸(exam/hub.html)이 세 앱의 명단을 한 화면에 합쳐 보여 준다. 그런데
   여기만 읽을 창구가 없어서, KMChC 를 본 학생은 셸에 **아예 안 나왔다** —
   같은 학생인데 파이널·DT 에서만 보이니 '이 학생의 전 과목 기록' 이 반쪽이었다.

   ?action=names 로 명단을 준다. 여기서 지키는 것:
   - 창구가 doGet 에 실제로 걸려 있다(함수만 있고 안 걸면 없는 것과 같다)
   - 응답 원본을 내보내지 않는다. 셸에 필요한 것은 누가 언제 봤나뿐이다
   - 이름이 없는 줄은 빼고 준다(셸이 붙일 데가 없다)
   - 헤더 이름이 바뀌어도 견디게 후보를 여럿 본다(headerIndex_)
   - 읽기만 한다 — 이 창구가 시트를 고치면 안 된다

   실행:  node tests/read-api.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const GS = fs.readFileSync(path.join(ROOT, 'AppsScript_GitHub빠른조회_정리본.gs'), 'utf8');

let fail = 0;
const chk = (n, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? '  PASS  ' : '  FAIL  ') + n +
    (ok ? '' : `  → ${JSON.stringify(got)} (기대 ${JSON.stringify(want)})`));
  if (!ok) fail++;
};
function cut(name) {
  const at = GS.search(new RegExp(`^function ${name}\\(`, 'm'));
  if (at < 0) throw new Error(`${name} 을 못 찾았다`);
  let d = 0;
  for (let j = GS.indexOf('{', at); j < GS.length; j++) {
    if (GS[j] === '{') d++;
    else if (GS[j] === '}') { d--; if (!d) return GS.slice(at, j + 1); }
  }
  throw new Error(`${name} 의 끝을 못 찾았다`);
}

console.log('── 창구가 실제로 걸려 있다 ──');
{
  chk('doGet 이 names 를 받는다',
      /if \(p\.action === "names"\) \{\s*\n\s*return rosterOut_\(p\);/.test(GS), true);
  chk('리포트 조회는 그대로', /if \(p\.action === "get"\)/.test(GS), true);
  const fn = cut('rosterOut_');
  /* 응답 원본까지 실어 보내면 주소만 길어지고, 셸이 가질 이유가 없는 것을
     갖게 된다. 셸에 필요한 것은 누가 언제 봤고 리포트가 어디 있나뿐이다. */
  chk('응답 원본을 내보내지 않는다', /응답원본|answers/.test(fn), false);
  chk('시트를 고치지 않는다', /setValue|appendRow|getRange\([^)]*\)\.set/.test(fn), false);
  chk('헤더 이름 후보를 여럿 본다', /headerIndex_\(headers, \["이름", "name"\]\)/.test(fn), true);
  chk('JSONP 로 답한다', /jsonpOut_\(\{ ok: true, students: out/.test(fn), true);
  chk('실패도 JSONP 로 답한다', /jsonpOut_\(\{ ok: false, error/.test(fn), true);
}

console.log('\n── 시트를 읽어 명단을 만든다 ──');
{
  /* 앱스크립트를 그대로 못 돌리니 시트만 흉내 낸다. 실제 헤더 이름을 쓴다 —
     열 이름이 바뀌면 여기서 걸린다. */
  const HEAD = ['ID', '짧은리포트주소', '시각', '이름', '학년', '구분', '응답원본'];
  const ROWS = [
    ['r1', 'https://x/report.html?id=r1', new Date(2026, 2, 1), '김서준', '2', '중등', '1,2,3'],
    ['r2', 'https://x/report.html?id=r2', new Date(2026, 2, 2), '  이하윤 ', '3', '중등', '4,5,6'],
    ['r3', '', '', '', '', '', '7,8,9'],                    // 이름이 없다 — 빼야 한다
  ];
  const sheet = {
    getLastRow: () => ROWS.length + 1,
    getLastColumn: () => HEAD.length,
    getRange: (r, c, nr, nc) => ({
      getValues: () => (r === 1 ? [HEAD] : ROWS.slice(r - 2, r - 2 + nr).map(x => x.slice(c - 1, c - 1 + nc))),
    }),
  };
  let out = null;
  const ctx = {
    console, Date,
    SHEET_NAME: '결과',
    ss_: () => ({ getSheetByName: n => (n === '결과' ? sheet : null) }),
    jsonpOut_: (obj) => { out = obj; return obj; },
  };
  vm.createContext(ctx);
  vm.runInContext([cut('headerIndex_'), cut('rosterOut_')].join('\n'), ctx);

  ctx.rosterOut_({ callback: 'cb' });
  chk('응답이 정상', out.ok, true);
  chk('이름 없는 줄은 뺀다', out.n, 2);
  chk('이름 앞뒤 공백을 턴다', out.students.map(s => s.name), ['김서준', '이하윤']);
  chk('학년을 준다', out.students.map(s => s.grade), ['2', '3']);
  chk('리포트 주소를 준다', out.students[0].link, 'https://x/report.html?id=r1');
  chk('아이디를 준다', out.students[0].id, 'r1');
  chk('시각을 숫자로 준다', out.students[0].ts, new Date(2026, 2, 1).getTime());
  chk('시각이 없으면 0', out.students.every(s => typeof s.ts === 'number'), true);
  // 셸에 응답을 흘리면 안 된다
  chk('응답 원본이 안 실린다',
      Object.keys(out.students[0]).sort(), ['grade', 'id', 'kind', 'link', 'name', 'ts']);

  // 탭이 아직 없을 수도 있다(첫 제출 전). 그때도 죽지 않아야 한다.
  ctx.ss_ = () => ({ getSheetByName: () => null });
  ctx.rosterOut_({ callback: 'cb' });
  chk('탭이 없어도 안 죽는다', [out.ok, out.n], [true, 0]);

  // 시트를 못 읽는 상황에서도 셸이 기다리다 멈추면 안 된다
  ctx.ss_ = () => { throw new Error('권한 없음'); };
  ctx.rosterOut_({ callback: 'cb' });
  chk('읽기가 엎어져도 답은 한다', out.ok, false);
  chk('왜 안 됐는지 말한다', /권한 없음/.test(out.error), true);
}

console.log(fail ? `\n${fail}개 실패` : '\n모두 통과');
process.exit(fail ? 1 : 0);
