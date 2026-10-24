/* ============================================================
   KMChC PDF 엔진 · 리포트를 «파일로» 바로 만든다 (선생님 2026-10-24)
   ------------------------------------------------------------
   «pdf는 브라우저 인쇄 말고 exam처럼 따로 만드는 걸로 개선해봐».
   예전 단추는 window.print() 였다. 카카오톡·네이버 같은 앱 안 브라우저는 인쇄를
   막아 두어서 눌러도 아무 일이 없었다(학생·학부모 신고). 그래서 DT 시험지 엔진
   (DT pdfgen.js)과 같은 방법으로 화면을 그대로 찍어 A4 PDF 파일을 만든다.

   · jsPDF + html2canvas 는 단추를 누를 때만 받는다(첫 화면을 무겁게 하지 않는다).
   · 찍기는 문서 사본(html2canvas 의 onclone)에서 한다 — 학생이 보는 화면은 안 바뀐다.
     사본은 데스크톱 폭(820px)으로 펴서 휴대폰에서 눌러도 같은 모양의 A4 가 나온다.
     사본에서만: 나타나기 효과를 끄고(카드가 투명한 채 찍히지 않게) · 접힌 해설(details)을 펴고 ·
     단추·백업 코드·공유 상자를 숨긴다.
   · 쪽 나눔은 카드·섹션·트랙의 위쪽 끝에서 한다 — 카드가 쪽 경계에서 잘리지 않게.
     한 카드가 한 쪽보다 길 때만 그 안에서 자른다.
   · 내보내기: 휴대폰이면 공유 창(파일 저장·카톡 보내기), 아니면 내려받기.
     앱 안 브라우저면 저장이 막힐 수 있어 «PDF 열기» · «다른 브라우저로 열기» 를 함께 띄운다.

   전역: window.KMPDF.save({ root, name, title, hide:[선택자…] })
   ============================================================ */
(function () {
  'use strict';
  var JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  var H2C_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  var WIDTH = 820;                       /* 사본을 펼 폭 — 리포트 본문 760px + 여백 */
  var MAX_AREA = 12e6;                   /* iOS 캔버스 한도(약 16.7M 화소) 아래로 */
  var BREAK_SEL = '.card, details, section, .masthead, .cover, h2, h3, table, .kmpdf-break';
  /* 카드가 한 쪽보다 길면 그 안에서 자른다 — 그때는 문단·항목·표 줄 사이에서(글줄 가운데를 가르지 않게) */
  var SOFT_SEL = 'p, li, tr, .kv, .row, dt, dd, h4, svg, canvas';
  var GAP = 8;                           /* 끊는 자리는 카드 윗선보다 조금 위 — 다음 카드 윗선이 앞 쪽 끝에 걸치지 않게 */
  var _loading = null;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var el = document.createElement('script');
      el.src = src; el.onload = res; el.onerror = function () { rej(new Error('load fail: ' + src)); };
      document.head.appendChild(el);
    });
  }
  function ensureLibs() {
    if (window.jspdf && window.html2canvas) return Promise.resolve();
    if (_loading) return _loading;
    _loading = (async function () {
      if (!window.jspdf) await loadScript(JS_URL);
      if (!window.html2canvas) await loadScript(H2C_URL);
    })();
    _loading.catch(function () { _loading = null; });
    return _loading;
  }
  function inApp() { return /KAKAOTALK|NAVER\(inapp|NAVER|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp|BAND\//i.test(navigator.userAgent || ''); }
  function isMobile() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform || '')); }
  function safeName(s) { return String(s || '').replace(/\s*학생\s*$/, '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40); }

  /* 사본에만 입히는 모양 — 인쇄 규칙(@media print)과 같은 뜻 */
  function pdfCSS(hide) {
    return 'html.kmpdf,html.kmpdf body{background:#fff!important}'
      + 'html.kmpdf body::before,html.kmpdf body::after{display:none!important}'
      + 'html.kmpdf *{animation:none!important;transition:none!important;caret-color:transparent}'
      + 'html.kmpdf .card,html.kmpdf .reveal-on .card{opacity:1!important;transform:none!important;box-shadow:none!important}'
      + 'html.kmpdf .poly-in,html.kmpdf .reveal-on .card .poly-in{opacity:1!important;transform:none!important}'
      + 'html.kmpdf .vbar,html.kmpdf .repbar,html.kmpdf #printBtn,html.kmpdf .bkstrip,html.kmpdf #backupStrip,html.kmpdf .kmpdf-hide,'
      + 'html.kmpdf #toAnswers,html.kmpdf #shareBox,html.kmpdf #kmpdfBox,html.kmpdf #kmpdfOv' + (hide && hide.length ? ',' + hide.map(function (h) { return 'html.kmpdf ' + h; }).join(',') : '')
      + '{display:none!important}';
  }

  /* 진행 표시 — 몇 초 걸린다 */
  function overlay(msg) {
    var o = document.getElementById('kmpdfOv');
    if (!o) {
      o = document.createElement('div'); o.id = 'kmpdfOv'; o.setAttribute('role', 'status'); o.setAttribute('aria-live', 'polite');
      o.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;background:#123;color:#fff;'
        + 'padding:12px 18px;border-radius:12px;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:calc(100% - 32px);text-align:center';
      document.body.appendChild(o);
    }
    o.textContent = msg;
    return o;
  }
  function overlayOff() { var o = document.getElementById('kmpdfOv'); if (o) o.remove(); }

  /* 앱 안 브라우저 · 저장이 막힐 때 — 열기 · 다른 브라우저 */
  function fallbackBox(url, filename) {
    var old = document.getElementById('kmpdfBox'); if (old) old.remove();
    var b = document.createElement('div'); b.id = 'kmpdfBox';
    b.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:9999;background:#fff;color:#1c1e2e;'
      + 'border:1px solid #d9d3c4;border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.55;box-shadow:0 10px 30px rgba(0,0,0,.18);'
      + 'width:min(420px,calc(100% - 32px))';
    var kakao = /KAKAOTALK/i.test(navigator.userAgent || '');
    b.innerHTML = '<div style="font-weight:700;margin-bottom:4px">PDF를 만들었습니다</div>'
      + '<div style="color:#5b5f6e;font-size:13px;margin-bottom:10px">카카오톡·네이버 같은 앱 안에서는 파일 저장이 막힐 수 있어요. '
      + '아래 «PDF 열기» 를 눌러 공유·저장하거나, 크롬·사파리로 열어 다시 눌러 주세요.</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      + '<a id="kmpdfOpen" href="' + url + '" target="_blank" rel="noopener" download="' + filename.replace(/"/g, '') + '" '
      + 'style="flex:1;min-width:120px;text-align:center;padding:10px 12px;border-radius:10px;background:#0E7A6E;color:#fff;text-decoration:none;font-weight:700">PDF 열기</a>'
      + (kakao ? '<a href="kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href) + '" '
      + 'style="flex:1;min-width:120px;text-align:center;padding:10px 12px;border-radius:10px;border:1px solid #0E7A6E;color:#0E7A6E;text-decoration:none;font-weight:700">다른 브라우저로 열기</a>' : '')
      + '<button type="button" id="kmpdfClose" style="padding:10px 12px;border-radius:10px;border:1px solid #d9d3c4;background:#fff;font:inherit;cursor:pointer">닫기</button></div>';
    document.body.appendChild(b);
    b.querySelector('#kmpdfClose').addEventListener('click', function () { b.remove(); });
  }

  async function deliver(blob, filename, title) {
    var url = URL.createObjectURL(blob);
    setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 10 * 60 * 1000);
    var file = null;
    try { file = new File([blob], filename, { type: 'application/pdf' }); } catch (e) { file = null; }
    if (file && isMobile() && navigator.canShare && navigator.share) {
      try {
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: title || filename }); if (inApp()) fallbackBox(url, filename); return 'share'; }
      } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
    }
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 1000);
    if (inApp()) fallbackBox(url, filename);
    return 'download';
  }

  /* 쪽 나눔 — 쪽 높이(pageH) 안에서 가장 아래쪽 끊을 자리. 너무 일찍(쪽의 35% 전) 끊지는 않는다. */
  function cuts(total, pageH, breaks, soft) {
    var out = [], y = 0;
    var ok = function (a) { return (a || []).filter(function (b) { return b > 0 && b < total; }).sort(function (x, z) { return x - z; }); };
    breaks = ok(breaks); soft = ok(soft);
    var lastIn = function (arr, lo, hi) { var best = -1; for (var i = 0; i < arr.length; i++) { if (arr[i] > lo && arr[i] <= hi) best = arr[i]; } return best; };
    while (y < total - 1) {
      var lim = y + pageH;
      if (lim >= total) { out.push([y, total]); break; }
      var end = lastIn(breaks, y + pageH * 0.35, lim);          /* 1) 카드·섹션 위쪽 끝 */
      if (end < 0) end = lastIn(soft, y + pageH * 0.5, lim);    /* 2) 긴 카드 안 문단 사이 */
      if (end < 0) end = lim;                                   /* 3) 그래도 없으면 쪽 끝 */
      out.push([y, end]); y = end;
    }
    return out;
  }

  async function save(opts) {
    opts = opts || {};
    var root = typeof opts.root === 'string' ? document.querySelector(opts.root) : opts.root;
    if (!root) throw new Error('찍을 화면이 없습니다');
    var nm = safeName(typeof opts.name === 'function' ? opts.name() : opts.name);
    var filename = 'KMChC_화학진단리포트' + (nm ? '_' + nm : '') + '.pdf';
    var btn = opts.button || null, btnText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'PDF 만드는 중…'; }
    var old = document.getElementById('kmpdfBox'); if (old) old.remove();
    try {
      overlay('PDF 만드는 중… (도구 불러오기)');
      await ensureLibs();
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
      overlay('PDF 만드는 중… (리포트 찍기)');
      /* 배율 — 폭 820 으로 폈을 때의 높이를 지금 화면에서 어림(글 양은 같고 폭만 바뀐다)하고, 캔버스가
         iOS 한도(약 16.7M 화소) 아래에 들도록 2 배에서 낮춘다. 한 번만 찍는다. */
      var liveW = Math.max(1, root.getBoundingClientRect().width), liveH = Math.max(1, root.scrollHeight);
      var estH = liveH * Math.min(1, liveW / WIDTH) + 200;
      var scale = Math.max(1, Math.min(2, Math.sqrt(MAX_AREA / (WIDTH * estH))));
      var breaks = [], soft = [];
      var canvas = await window.html2canvas(root, {
        scale: scale, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: WIDTH,
        onclone: async function (doc, el) {
          doc.documentElement.classList.add('kmpdf');
          var st = doc.createElement('style'); st.textContent = pdfCSS(opts.hide); doc.head.appendChild(st);
          Array.prototype.forEach.call(doc.querySelectorAll('details'), function (d) { d.setAttribute('open', ''); });
          /* 사본의 웹 글꼴이 다 들어온 뒤에 잰다 — 먼저 재면 글줄 높이가 달라 끊는 자리가 아래로 밀린다
             (재어 보니 첫 쪽 끝에 다음 카드 윗선이 15px 쯤 걸쳤다) */
          try { if (doc.fonts && doc.fonts.ready) await doc.fonts.ready; } catch (e) {}
          await new Promise(function (r) { setTimeout(r, 60); });
          var r0 = el.getBoundingClientRect();
          /* 끊는 자리는 바깥 덩어리(카드·섹션)의 윗선만 — 안쪽 요소의 윗선을 쓰면 다음 카드 윗부분이 앞 쪽 끝에 걸친다.
             안쪽 덩어리는 «긴 카드 안에서 자를 자리»(soft)로 돌린다. */
          Array.prototype.forEach.call(el.querySelectorAll(BREAK_SEL), function (n) {
            var r = n.getBoundingClientRect(); if (!(r.height > 0 && r.width > 0)) return;
            var a = n.parentElement, inner = false;
            while (a && a !== el) { if (a.matches && a.matches(BREAK_SEL)) { inner = true; break; } a = a.parentElement; }
            (inner ? soft : breaks).push(Math.max(1, r.top - r0.top - GAP));
          });
          Array.prototype.forEach.call(el.querySelectorAll(SOFT_SEL), function (n) {
            var r = n.getBoundingClientRect(); if (r.height > 0 && r.width > 0) { soft.push(Math.max(1, r.top - r0.top - 2)); soft.push(r.bottom - r0.top + 2); }
          });
        }
      });
      overlay('PDF 만드는 중… (쪽 나누기)');
      var JsPDF = window.jspdf.jsPDF;
      var doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      var PW = 210, PH = 297, M = 10, FOOT = 8;
      var imgW = PW - 2 * M, k = canvas.width / imgW;               /* 화소 / mm */
      var pageHpx = Math.floor((PH - 2 * M - FOOT) * k);
      var sc = function (a) { return a.map(function (b) { return Math.round(b * scale); }); };
      var segs = cuts(canvas.height, pageHpx, sc(breaks), sc(soft));
      segs.forEach(function (sg, i) {
        var h = sg[1] - sg[0]; if (h <= 0) return;
        var c = document.createElement('canvas'); c.width = canvas.width; c.height = h;
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, h);
        g.drawImage(canvas, 0, sg[0], canvas.width, h, 0, 0, canvas.width, h);
        if (i) doc.addPage();
        doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', M, M, imgW, h / k, undefined, 'FAST');
        doc.setFontSize(9); doc.setTextColor(140);
        doc.text((i + 1) + ' / ' + segs.length, PW / 2, PH - M / 2 - 1, { align: 'center' });
      });
      doc.setProperties({ title: opts.title || filename.replace(/\.pdf$/, ''), creator: 'KMChC' });
      var blob = doc.output('blob');
      overlayOff();
      window.__kmpdfLast = { pages: segs.length, bytes: blob.size, name: filename };     /* 시험이 읽는다 */
      return await deliver(blob, filename, opts.title);
    } catch (e) {
      overlay('PDF를 만들지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.');
      setTimeout(overlayOff, 4000);
      window.__kmpdfLast = { error: String(e && e.message || e) };
      throw e;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btnText; }
    }
  }

  window.KMPDF = { save: save, _cuts: cuts, _inApp: inApp };
})();
