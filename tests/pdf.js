/* ============================================================
   PDF 저장 — 인쇄 창이 아니라 파일로 나오는가 (kmpdf.js · 선생님 2026-10-24)
   ------------------------------------------------------------
   «pdf는 브라우저 인쇄 말고 exam처럼 따로 만드는 걸로 개선해봐».
   카카오톡·네이버 앱 안 브라우저는 window.print() 를 막아 두어 단추가 아무 일도
   안 했다. 이제 세 화면(학생 완료 화면 · 학부모 리포트 · 관리자)이 jsPDF + html2canvas 로
   A4 PDF 파일을 바로 만든다. 여기서 재는 것:
     · 단추가 window.print() 를 부르지 않는다
     · .pdf 파일이 내려받아지고, 쪽 수가 1 이상 · 크기가 그럴듯하다(머리가 %PDF)
     · PDF 사본에서는 단추·백업 코드가 빠지고, 화면(원본 문서)은 그대로다
   학생은 가상이다(응답도 무작위로 만든다). 앱스크립트(제출)는 부르지 않는다 — 막는다.

   실행:
       PLAYWRIGHT_MODULE=… CHROMIUM_PATH=… node tests/pdf.js
     KMPDF_LIB_DIR=<jspdf.umd.min.js · html2canvas.min.js 가 있는 폴더> 를 주면 cdnjs 대신 그 파일을 쓴다.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

const PLAYWRIGHT = process.env.PLAYWRIGHT_MODULE || 'playwright';
const CHROMIUM = process.env.CHROMIUM_PATH || undefined;
const ROOT = path.join(__dirname, '..');
const LIB = process.env.KMPDF_LIB_DIR || '';

let chromium;
try { ({ chromium } = require(PLAYWRIGHT)); }
catch (e) {
  if (process.env.REQUIRE_BROWSER) { console.log('실패: playwright 를 찾지 못했다'); process.exit(1); }
  console.log('건너뜀: playwright 없음'); process.exit(0);
}

let fail = 0;
const chk = (n, ok, extra) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (extra ? '  ' + extra : '')); if (!ok) fail++; };

/* 가상 응답 — 문항 표(items_LIVE.json)의 꼴대로 무작위로 채운다 */
function fakeAnswers() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'items_LIVE.json'), 'utf8'));
  const items = Array.isArray(raw) ? raw : (raw.items || []);
  let seed = 7; const rnd = n => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
  const A = {};
  items.forEach(it => {
    const k = it.kind || (it.block === 'B' ? 'forced16' : it.block === 'C' ? 'misconception' : '');
    if (k === 'mostleast') { const m = rnd(3); A[it.id] = { most: m, least: (m + 1) % 3 }; }
    else if (k === 'misconception') A[it.id] = { t1: rnd((it.t1 || [0, 1]).length || 2), t2: rnd(2), conf: 1 + rnd(4) };
    else if (k === 'overclaim') A[it.id] = (it.terms || []).map((t, i) => i).filter(i => i % 2 === 0);
    else if (k === 'forced16') A[it.id] = rnd(2);
    else if (k === 'scenario') A[it.id] = rnd((it.opts || [0, 1]).length || 2);
    else if (k === 'attention') A[it.id] = it.answer || 3;
    else A[it.id] = 1 + rnd(5);
  });
  return A;
}

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };

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
  const errs = [];

  async function newPage() {
    const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => { window.__printed = 0; window.print = function () { window.__printed++; }; });
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => {
      const u = r.request().url();
      if (LIB && /jspdf/.test(u)) return r.fulfill({ body: fs.readFileSync(path.join(LIB, 'jspdf.umd.min.js')), contentType: 'application/javascript' });
      if (LIB && /html2canvas/.test(u)) return r.fulfill({ body: fs.readFileSync(path.join(LIB, 'html2canvas.min.js')), contentType: 'application/javascript' });
      if (/cdnjs\.cloudflare\.com/.test(u) && !LIB) return r.continue();
      return r.abort();                                            /* 앱스크립트 제출·글꼴 등은 부르지 않는다 */
    });
    page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
    return page;
  }
  async function grab(page, click, label) {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), click()]);
    const f = path.join(require('os').tmpdir(), 'kmpdf-' + Date.now() + '.pdf'); await dl.saveAs(f);
    const buf = fs.readFileSync(f); fs.unlinkSync(f);
    if (process.env.KMPDF_SAVE_DIR) fs.writeFileSync(path.join(process.env.KMPDF_SAVE_DIR, label.replace(/\s+/g, '_') + '.pdf'), buf);   /* 눈으로 볼 때 */
    const info = await page.evaluate(() => window.__kmpdfLast || null);
    /* 이 검사 상자의 크로뮴은 한글이 든 내려받기 이름을 «download» 로 바꾼다(ASCII 이름은 그대로 — 확인함).
       그래서 이름은 엔진이 붙인 값(__kmpdfLast.name)으로 보고, 여기서는 받은 것이 PDF 인지만 본다. */
    chk(label + ' · PDF 파일이 내려받아진다', buf.slice(0, 4).toString() === '%PDF' && /^(download|.*\.pdf)$/.test(dl.suggestedFilename()), dl.suggestedFilename() + ' · ' + Math.round(buf.length / 1024) + 'KB');
    chk(label + ' · 쪽 수 · 크기가 그럴듯하다', info && info.pages >= 1 && buf.length > 30 * 1024, JSON.stringify(info));
    chk(label + ' · 인쇄 창을 부르지 않는다', (await page.evaluate(() => window.__printed)) === 0, '');
    return info;
  }

  const A = fakeAnswers();
  const b64 = Buffer.from(JSON.stringify(A), 'utf8').toString('base64');

  /* ① 학부모 리포트 — report.html?d=…&n=… */
  {
    const page = await newPage();
    await page.goto(BASE + 'report.html?d=' + encodeURIComponent(b64) + '&n=' + encodeURIComponent('가상') + '&g=' + encodeURIComponent('중2'));
    await page.waitForSelector('#report .card', { timeout: 30000 });
    chk('학부모 리포트에 «PDF로 저장» 단추가 있다', !!(await page.$('#pdfBtn')), '');
    const info = await grab(page, () => page.click('#pdfBtn'), '학부모 리포트');
    chk('학부모 리포트 · 파일 이름에 학생 이름', info && /_가상\.pdf$/.test(info.name || ''), info && info.name);
    chk('학부모 리포트 · 화면의 단추는 그대로(사본에서만 뺐다)', await page.$eval('#pdfBtn', e => getComputedStyle(e).display !== 'none'), '');
    await page.context().close();
  }

  /* ② 학생 완료 화면 — 저장해 둔 진행(이어서 하기)으로 다 채우고 제출 */
  {
    const page = await newPage();
    await page.goto(BASE + 'index.html');
    /* 하나만 남겨 둔다 — 다 채운 진행은 «이어서 하기» 를 안 띄운다(done < tot 일 때만) */
    const A2 = Object.assign({}, A), lastId = Object.keys(A2).filter(k => typeof A2[k] === 'number')[0]; delete A2[lastId];
    await page.evaluate(a => { localStorage.setItem('kmchc_v2_progress', JSON.stringify({ meta: { name: '가상', grade: '중2' }, answers: a, elapsedMs: 900000, ts: Date.now() })); }, A2);
    await page.reload();
    const resume = await page.$('.resume .btn');
    chk('학생 화면 · 이어서 하기가 뜬다', !!resume, '');
    if (resume) await resume.click();
    await page.click('.opt[data-qid="' + lastId + '"]');
    await page.waitForSelector('#submitBtn:not([disabled])', { timeout: 15000 });
    await page.click('#submitBtn');
    await page.waitForSelector('#printBtn', { state: 'visible', timeout: 60000 });
    chk('학생 완료 화면 단추 이름이 «PDF로 저장»', (await page.textContent('#printBtn')).trim() === 'PDF로 저장', '');
    await grab(page, () => page.click('#printBtn'), '학생 완료 화면');
    await page.context().close();
  }

  /* ③ 쪽 나눔 — 카드 위쪽 끝에서 자르고, 너무 일찍(쪽의 35% 전) 끊지 않는다. 끊을 자리가 없으면 쪽 끝에서.
     2500 높이 · 쪽 1000 · 끊을 자리 300·900·1200·1990·2400 → 0~900(900 에서) · 900~1900(1250~1900 사이에 자리가 없어 쪽 끝) · 1900~끝 */
  {
    const page = await newPage();
    await page.goto(BASE + 'report.html?d=' + encodeURIComponent(b64));
    await page.waitForFunction(() => !!window.KMPDF, null, { timeout: 15000 });
    const c = await page.evaluate(() => window.KMPDF._cuts(2500, 1000, [300, 900, 1200, 1990, 2400]));
    chk('쪽 나눔 · 끊을 자리', JSON.stringify(c) === JSON.stringify([[0, 900], [900, 1900], [1900, 2500]]), JSON.stringify(c));
    await page.context().close();
  }

  console.log('\n' + (errs.length ? 'JS 오류: ' + errs.slice(0, 3).join(' | ') : 'JS 오류 없음'));
  if (errs.length) fail++;
  await browser.close(); srv.close();
  console.log(fail ? `\n실패 ${fail}건` : '\nPDF 가 파일로 나온다.');
  process.exit(fail ? 1 : 0);
})();
