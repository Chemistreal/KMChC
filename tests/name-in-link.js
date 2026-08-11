/* ============================================================
   **이름은 파일이 아니라 주소에 실린다** (브라우저 필요)
   ------------------------------------------------------------
   2026-08-11, 선생님이 「가」로 정하셨다 — *앞으로 저장되는 것부터 이름을
   파일에서 빼고 링크에 싣는다.*

   왜 그랬나
   ---------
   이 저장소는 공개다(GitHub Pages 를 쓴다). 그런데 `report-data/<id>.json`
   에 실명·학년·응답이 통째로 들어 있어서, **주소를 몰라도 GitHub 에서 그냥
   읽혔다.** 여섯 주에 쉰세 명이 쌓였다.

   고칠 방법이 이미 절반 놓여 있었다 — `report.html` 이 원래부터

       function render(ans, name, grade){ setLinks(name || nm, grade || gr); … }

   즉 **파일에 이름이 없으면 주소의 이름으로 넘어간다.** 그래서 화면은 한 줄도
   안 고치고, Apps Script 가 파일에 안 넣고 링크에 싣게만 바꿨다.

   이 검사가 지키는 것
   -------------------
     ① 이름이 없는 새 파일(v2)이라도, 주소에 `&n=` 이 있으면 **이름이 뜬다**
     ② 이름이 든 옛 파일(v1)은 `&n=` 이 없어도 **그대로 이름이 뜬다**
        — 이미 학부모 손에 가 있는 링크다. 이게 깨지면 안 된다
     ③ 성적표 ↔ 해설 사이를 오갈 때 **이름을 들고 다닌다**
        (안 그러면 해설 화면만 이름을 잃는다)

   ⚠ 파일에 이름이 안 들어가는지 자체는 `tools/public_names.py` 가 잰다.
     여기는 **그렇게 해도 학부모 화면이 성한가**를 본다.

   실행:
       PLAYWRIGHT_MODULE=… CHROMIUM_PATH=… node tests/name-in-link.js
   ============================================================ */
'use strict';

const PLAYWRIGHT = process.env.PLAYWRIGHT_MODULE || 'playwright';
const PORT = Number(process.env.PORT || 8961);
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.dirname(__dirname);

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

/* 저장소의 report-data/ 를 그대로 쓰지 않는다 — 거기에는 **실제 학생**이 들어
   있고, 검사가 실제 이름에 기대면 그 학생이 지워지는 날 검사도 같이 깨진다.
   대신 두 꼴(v1·v2)을 손으로 지어 낸다. */
const V1 = { id: 'rtestv1', name: '홍길동', grade: '중2', answers: null,
             savedAt: '2026-01-01T00:00:00.000Z', source: 'KMChC-report-data-v1' };
const V2 = { id: 'rtestv2', answers: null,
             savedAt: '2026-08-11T00:00:00.000Z', source: 'KMChC-report-data-v2' };

function realAnswers() {
  /* 응답 원본은 지어 내면 리포트가 안 그려진다. 저장소에 있는 것 **하나**를
     빌리되 이름·학년은 안 쓴다 — 우리가 보려는 것은 이름이 어디서 오는가다. */
  const dir = path.join(ROOT, 'report-data');
  for (const f of fs.readdirSync(dir)) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (j && typeof j.answers === 'string' && j.answers.length > 100) return j.answers;
    } catch (e) { /* 넘어간다 */ }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const u = decodeURIComponent((req.url || '/').split('?')[0]);
  const m = /^\/report-data\/(rtestv[12])\.json$/.exec(u);
  if (m) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(m[1] === 'rtestv1' ? V1 : V2));
    return;
  }
  const p = path.join(ROOT, u === '/' ? 'index.html' : u.replace(/^\//, ''));
  fs.readFile(p, (err, buf) => {
    if (err) { res.writeHead(404); res.end('no'); return; }
    const ext = path.extname(p);
    res.writeHead(200, { 'content-type':
      ext === '.html' ? 'text/html; charset=utf-8'
      : ext === '.json' ? 'application/json' : 'text/plain' });
    res.end(buf);
  });
});

(async () => {
  const ans = realAnswers();
  if (!ans) { console.log('건너뜀: 빌려 올 응답 원본을 못 찾았다'); process.exit(0); }
  V1.answers = ans; V2.answers = ans;

  await new Promise(r => server.listen(PORT, r));
  const BASE = `http://localhost:${PORT}/`;

  const browser = await chromium.launch(Object.assign({ args: ['--no-sandbox'] },
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**://script.google.com/**', r => r.abort());
  const errs = [];

  async function open(url) {
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e).slice(0, 90)));
    await p.goto(url, { waitUntil: 'load', timeout: 40000 });
    await p.waitForFunction(
      () => { const h = document.getElementById('repName');
              return !!(h && (h.textContent || '').trim()); },
      null, { timeout: 20000 }).catch(() => {});
    return p;
  }

  console.log('\n── 새 파일(v2, 이름 없음) + 주소에 이름 ──');
  let p = await open(BASE + 'report.html?id=rtestv2&n=' + encodeURIComponent('강해든') + '&g=중2');
  let r = await p.evaluate(() => ({
    who: (document.getElementById('repName') || {}).textContent || '',
    title: document.title,
    toAnswers: (document.getElementById('toAnswers') || {}).href || ''
  }));
  chk('학부모 화면에 이름이 뜬다', /강해든/.test(r.who), `"${r.who.trim()}"`);
  chk('창 제목에도 이름이 붙는다', /강해든/.test(r.title), true);
  chk('해설로 갈 때 이름을 들고 간다', /[?&]n=/.test(r.toAnswers),
      r.toAnswers.replace(/^https?:\/\/[^/]+\//, '…/'));
  await p.close();

  console.log('\n── 옛 파일(v1, 이름 있음) + 주소에 이름 없음 ──');
  p = await open(BASE + 'report.html?id=rtestv1');
  r = await p.evaluate(() => ({
    who: (document.getElementById('repName') || {}).textContent || ''
  }));
  chk('이미 보낸 링크는 그대로 이름이 뜬다', /홍길동/.test(r.who), `"${r.who.trim()}"`);
  await p.close();

  console.log('\n── 해설 화면도 같은 규칙인가 ──');
  p = await open(BASE + 'answers.html?id=rtestv2&n=' + encodeURIComponent('강해든') + '&g=중2');
  r = await p.evaluate(() => ({
    who: (document.getElementById('repName') || {}).textContent || '',
    toReport: (document.getElementById('toReport') || {}).href || ''
  }));
  chk('해설 화면에 이름이 뜬다', /강해든/.test(r.who), `"${r.who.trim()}"`);
  chk('성적표로 돌아갈 때도 이름을 들고 간다', /[?&]n=/.test(r.toReport), true);
  await p.close();

  console.log('\n── 링크를 만드는 곳이 이름을 싣는가 ──');
  p = await ctx.newPage();
  p.on('pageerror', e => errs.push(String(e).slice(0, 90)));
  await p.goto(BASE + encodeURIComponent('리포트링크생성기.html'), { waitUntil: 'load' });
  const made = await p.evaluate(() => {
    document.getElementById('paste').value =
      'r0123456789abcdef\thttps://x\tSJRD\t강해든\t중2\t' + 'A'.repeat(60);
    document.getElementById('parseBtn').click();
    const i = document.querySelector('#tbody .lk');
    return i ? i.value : '';
  });
  chk('만들어진 링크에 이름이 실린다', /[?&]n=/.test(made),
      made.replace(/^https?:\/\/[^/]+\//, '…/'));
  await p.close();

  console.log('\n' + (errs.length ? 'JS 오류: ' + errs.slice(0, 3).join(' | ') : 'JS 오류 없음'));
  if (errs.length) fail++;
  await browser.close();
  server.close();
  console.log(fail ? `\n실패 ${fail}건`
    : '\n이름은 링크를 쥔 사람만 본다 — 그리고 이미 보낸 링크는 안 깨졌다.');
  process.exit(fail ? 1 : 0);
})();
