/* ============================================================
   창구가 죽어도 학부모가 빈 화면을 보지 않는다
   ------------------------------------------------------------
   이 리포트는 **앱스크립트 창구**에서 자료를 받아 그린다. 그 창구는 구글
   쪽이라 우리가 못 고치는 이유로 죽을 수 있다 — 배포 중이거나, 할당량을
   넘겼거나, 학원 망이 구글로 못 나가거나.

   그때 학부모가 무엇을 보는가는 여태 **아무도 안 쟀다**
   (`docs/앱별-전수조사.md` 4절 셋째 칸 — "앱스크립트 창구가 죽었을 때").
   exam·DT 에는 검사가 있었고 여기와 KMChC 에는 없었다.

   재어 보니 성했다(2026-08-10). 끊김·침묵·오류 셋 다 화면이 뜬다.

       report.html   292자 · "저장된 리포트를…" 안내가 뜬다
       index.html    진단 대문이 그대로 뜬다

   **0인 채로 두려고** 둔다. 이 자가 잡는 것은 두 가지다.

     ① 창구가 죽었을 때 화면이 **빈 흰 종이**가 되는 것
     ② 죽은 줄 모르고 **아무 말도 안 하는 것** — 학부모는 자기 휴대폰이
        고장 난 줄 안다. 무슨 일인지 말해야 다음 걸음(선생님께 연락)이 나온다

   ⚠ 죽는 방식을 **세 가지**로 본다. 하나만 보면 나머지에서 다르게 죽는다.
       끊김(abort) · 침묵(대답 없음) · 오류(500)
     특히 **침묵**이 중요하다 — 끊기면 브라우저가 곧바로 포기하지만, 침묵은
     화면이 영영 기다린다.

   실행:
       PLAYWRIGHT_MODULE=… CHROMIUM_PATH=… node tests/gate-down.js
   ============================================================ */
'use strict';
const { spawn } = require('child_process');
const path = require('path');

const PLAYWRIGHT = process.env.PLAYWRIGHT_MODULE || 'playwright';
const CHROMIUM = process.env.CHROMIUM_PATH || undefined;
const PORT = Number(process.env.PORT || 8959);
const ROOT = path.join(__dirname, '..');
const SETTLE = 9000;        // 침묵한 창구를 기다리다 포기할 시간을 준다
const MIN_TEXT = 60;        // 이보다 적으면 사실상 빈 화면이다

/* 사람에게 **무슨 일인지** 말하는가. 낱말을 늘어놓는 대신 뜻으로 묶는다. */
const SAYS = /오류|실패|다시|잠시|불러오|연결|없습니다|문제가|선생님께/;

const PAGES = [
  ['report.html?id=r00000000', '학부모 성적표 (문자로 나간다)'],
  ['index.html', '진단 대문'],
  ['answers.html', '문항별 응답 기록'],
];
const WAYS = [
  ['dead', '끊김 — 창구가 곧바로 거절한다'],
  ['hang', '침묵 — 아무 대답도 없다 (화면이 영영 기다릴 수 있다)'],
  ['error', '오류 — 500 을 돌려준다'],
];

let fail = 0;
const chk = (n, ok, extra) => {
  console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (extra ? '  ' + extra : ''));
  if (!ok) fail++;
};

let chromium;
try { ({ chromium } = require(PLAYWRIGHT)); }
catch (e) {
  if (process.env.REQUIRE_BROWSER) {
    console.log('실패: playwright 를 찾지 못했다 (REQUIRE_BROWSER 가 켜져 있다)');
    process.exit(1);
  }
  console.log('건너뜀: playwright 를 찾지 못했다'); process.exit(0);
}

(async () => {
  const srv = spawn(process.execPath, ['-e', `
    const http=require('http'),fs=require('fs'),p=require('path');
    const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css'};
    http.createServer((q,s)=>{
      const f=p.join(${JSON.stringify(ROOT)}, decodeURIComponent(q.url.split('?')[0]));
      fs.readFile(f,(e,d)=>e?(s.writeHead(404),s.end()):(s.writeHead(200,{'Content-Type':T[p.extname(f)]||'text/plain'}),s.end(d)));
    }).listen(${PORT});
  `], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));

  const browser = await chromium.launch(Object.assign(
    { args: ['--no-sandbox'] }, CHROMIUM ? { executablePath: CHROMIUM } : {}));

  try {
    for (const [way, wayLabel] of WAYS) {
      console.log(`\n── ${wayLabel} ──`);
      for (const [page, label] of PAGES) {
        const ctx = await browser.newContext({ serviceWorkers: 'block' });
        const p = await ctx.newPage();
        p.on('pageerror', () => {});
        await p.route('**://script.google.com/**', route => {
          if (way === 'dead') return route.abort();
          if (way === 'error') return route.fulfill({ status: 500,
            contentType: 'text/plain', body: 'boom' });
          return;                       // 침묵 — 일부러 아무 답도 안 준다
        });
        await p.goto(`http://localhost:${PORT}/${page}`,
                     { waitUntil: 'domcontentloaded', timeout: 40000 }).catch(() => {});
        await p.waitForTimeout(SETTLE);
        const r = await p.evaluate(() => {
          const t = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
          return { len: t.length, text: t };
        }).catch(() => ({ len: 0, text: '' }));
        console.log(`  ${label} · 글자 ${r.len}자`);
        chk(`${page} 이 빈 화면이 되지 않는다`, r.len >= MIN_TEXT, `(${r.len}자)`);
        chk(`${page} 이 무슨 일인지 말한다`, SAYS.test(r.text) || r.len > 400,
            SAYS.test(r.text) ? '' : '(안내 문구를 못 찾았다)');
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    srv.kill();
  }

  console.log(fail ? `\n실패 ${fail}건` : '\n창구가 죽어도 화면이 뜨고 사정을 말한다.');
  process.exit(fail ? 1 : 0);
})();
