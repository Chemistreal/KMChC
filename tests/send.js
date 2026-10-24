/* ============================================================
   제출 확인 — 학생 화면이 «선생님께 전송됨 ✓» 를 사실대로 말하는가 (선생님 2026-10-24)
   ------------------------------------------------------------
   «설문 결과가 나에게 전송이 안 됐어» — 실제로는 넘어와 있었다. 예전 보내기는 답을 안 읽는
   no-cors 라 학생도 선생님도 확인할 길이 없었다. 이제 서버 답을 읽는다.
     · 서버가 {ok:true, id, shortUrl} 로 답하면 «✓ 선생님께 전송됨» + 리포트 링크
     · 서버가 실패하거나 닿지 않으면 «⚠ 전송을 확인하지 못했어요» + 백업 코드를 펼친다
     · 어느 쪽이든 한 번만 보낸다(다시 보내면 시트에 같은 학생이 두 줄 생긴다)
   학생은 가상이다. 앱스크립트는 진짜로 부르지 않는다 — 가짜 답을 준다.

   실행:  PLAYWRIGHT_MODULE=… CHROMIUM_PATH=… node tests/send.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

const PLAYWRIGHT = process.env.PLAYWRIGHT_MODULE || 'playwright';
const CHROMIUM = process.env.CHROMIUM_PATH || undefined;
const ROOT = path.join(__dirname, '..');
let chromium;
try { ({ chromium } = require(PLAYWRIGHT)); }
catch (e) { if (process.env.REQUIRE_BROWSER) { console.log('실패: playwright 를 찾지 못했다'); process.exit(1); } console.log('건너뜀: playwright 없음'); process.exit(0); }

let fail = 0;
const chk = (n, ok, extra) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (extra ? '  ' + extra : '')); if (!ok) fail++; };

function fakeAnswers() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'items_LIVE.json'), 'utf8'));
  const items = Array.isArray(raw) ? raw : (raw.items || []);
  let seed = 11; const rnd = n => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
  const A = {};
  items.forEach(it => {
    const k = it.kind || (it.block === 'B' ? 'forced16' : it.block === 'C' ? 'misconception' : '');
    if (k === 'mostleast') { const m = rnd(3); A[it.id] = { most: m, least: (m + 1) % 3 }; }
    else if (k === 'misconception') A[it.id] = { t1: rnd((it.t1 || [0, 1]).length || 2), t2: rnd(2), conf: 1 + rnd(4) };
    else if (k === 'overclaim') A[it.id] = [];
    else if (k === 'forced16') A[it.id] = rnd(2);
    else if (k === 'scenario') A[it.id] = rnd((it.opts || [0, 1]).length || 2);
    else if (k === 'attention') A[it.id] = it.answer || 3;
    else A[it.id] = 1 + rnd(5);
  });
  return A;
}
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

(async () => {
  const srv = http.createServer((q, s) => {
    let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
    s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
  });
  await new Promise(r => srv.listen(0, r));
  const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
  const A = fakeAnswers();

  async function run(mode) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const posts = [];
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
      const req = r.request(), u = req.url();
      if (/script\.google\.com\/macros/.test(u) && req.method() === 'POST') {
        posts.push(req.postData() || '');
        if (mode === 'ok') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ ok: true, id: 'r0000test0000', shortUrl: 'https://chemistreal.github.io/KMChC/report.html?id=r0000test0000' }) });
        if (mode === 'err') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: false, error: 'x' }) });
        return r.abort();
      }
      return r.abort();
    });
    await page.goto(BASE + 'index.html');
    const A2 = Object.assign({}, A), lastId = Object.keys(A2).filter(k => typeof A2[k] === 'number')[0]; delete A2[lastId];
    await page.evaluate(a => { localStorage.setItem('kmchc_v2_progress', JSON.stringify({ meta: { name: '가상', grade: '중2' }, answers: a, elapsedMs: 900000, ts: Date.now() })); }, A2);
    await page.reload();
    await page.click('.resume .btn');
    await page.click('.opt[data-qid="' + lastId + '"]');
    await page.waitForSelector('#submitBtn:not([disabled])', { timeout: 15000 });
    await page.click('#submitBtn');
    await page.waitForFunction(() => { const b = document.getElementById('sendStatus'); return b && b.getAttribute('data-st') !== 'sending'; }, null, { timeout: 30000 });
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => { const b = document.getElementById('sendStatus'), bk = document.getElementById('backupStrip');
      return { st: b.getAttribute('data-st'), t: b.innerText, link: (b.querySelector('a') || {}).href || '', bkOpen: !!(bk && bk.open) }; });
    await page.close();
    return { r, posts };
  }

  const ok = await run('ok');
  chk('서버가 받으면 «✓ 선생님께 전송됨»', ok.r.st === 'ok' && /선생님께 전송됨/.test(ok.r.t), ok.r.st);
  chk('받으면 리포트 링크가 선다', /report\.html\?id=r0000test0000/.test(ok.r.link), ok.r.link);
  chk('한 번만 보낸다 · 이름·응답 원본이 실린다', ok.posts.length === 1 && /"name":"가상"/.test(ok.posts[0]) && /"answers":"eyJ/.test(ok.posts[0]), ok.posts.length + '번');
  const err = await run('err');
  chk('서버가 ok:false 면 «확인하지 못했어요» + 백업 코드를 펼친다', err.r.st === 'fail' && /확인하지 못했어요/.test(err.r.t) && err.r.bkOpen, JSON.stringify(err.r).slice(0, 120));
  const down = await run('down');
  chk('서버에 닿지 않아도 같다 · 다시 보내지 않는다', down.r.st === 'fail' && down.r.bkOpen && down.posts.length === 1, down.posts.length + '번');

  await browser.close(); srv.close();
  console.log(fail ? `\n실패 ${fail}건` : '\n학생 화면이 전송 결과를 사실대로 말한다.');
  process.exit(fail ? 1 : 0);
})();
