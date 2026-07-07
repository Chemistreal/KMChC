#!/usr/bin/env node
/* =====================================================================
   배포전점검.js — KMChC 배포 게이트 (구 회귀테스트.js·회귀_v2.js 대체)

   실행:  node 배포전점검.js [대상폴더]   (기본 /mnt/user-data/outputs, KMCHC_OUT 환경변수 가능)
   통과(EXIT 0)일 때만 배포: index.html / report.html / 관리자.html /
   answers.html 4종을 GitHub 저장소(KMChC) 루트에 덮어쓰기.
   og.png는 변경 시에만. 업로드 후 1분 대기 + Ctrl+Shift+R.

   --- 정본 구조 메모 (2026-06) ---
   · 소스 단일 원본: engine_v2.js(채점) / report_v2.js(렌더)
   · 배포 HTML 4종은 두 소스의 사본을 임베드한 단일파일.
     (외부 <script src> 분리 안 한 이유: 배포 8파일화 + GitHub Pages
      캐시(max-age 600s)로 HTML/JS 세대 어긋남 위험 → 단일파일 유지가
      이 운영 규모에서 더 안전. 드리프트는 본 게이트가 차단.)
   · report 블록 재이식 경계:
       START = "var TYPES = {GJTD"
       END   = "typeStability: typeStability };"
     → index.html / report.html / 관리자.html 3곳. answers.html은 ITEMS만.
   · 엔진 수정은 engine_v2.js와 3개 HTML에 같은 라인 치환.
   · 미리보기(리포트_고급_미리보기.html) = report.html 사본 + 김민결 주입.
   · 골든 2건(김민결 중2 / 이하윤 중1)은 아래 b64 내장 — 채점 로직이
     의도적으로 바뀌면 기대값을 함께 갱신할 것.
===================================================================== */
let J; try{ J=require("jsdom"); }catch(e){ J=require("/home/claude/node_modules/jsdom"); }
const {JSDOM,VirtualConsole}=J;
const fs=require("fs"), crypto=require("crypto");
const OUT=process.argv[2]||process.env.KMCHC_OUT||"/mnt/user-data/outputs";
const KM="eyJWLU9DIjpbMCwxLDIsMyw1XSwiQS1JTjEiOjQsIkEtSU4yIjo0LCJBLUlOMyI6NCwiQS1JTjQiOjMsIkEtSU4tUEgiOjUsIkEtSU4tU1kiOjEsIkEtSU4tUVQiOjEsIkEtSU4tTEIiOjUsIkEtRUYxIjo1LCJBLUVGMiI6NCwiVi1TRDEiOjUsIkEtRUYzIjo0LCJBLUVGNCI6MywiQS1BWC1QSCI6NCwiQS1BWC1TWSI6NCwiQS1BWC1RVCI6MywiQS1BWC1MQiI6NSwiQS1BWC1HTiI6NCwiQS1WQTEiOjUsIkEtVkEyIjoyLCJBLVZBMyI6NCwiVi1TRDIiOjIsIkIyMSI6MCwiQjIyIjoxLCJCMjMiOjAsIkIyNCI6MCwiQjI1IjowLCJCMjYiOjAsIkIyNyI6MSwiQjI4IjoxLCJCMSI6MSwiQjIiOjAsIkIzIjoxLCJCNCI6MCwiQjUiOjAsIkI2IjowLCJCNyI6MSwiQjkiOjAsIkI4IjowLCJCMTAiOjEsIkIxMSI6MCwiQjEyIjoxLCJWLUNTMWEiOjQsIkIxMyI6MSwiQjE0IjowLCJCMTUiOjEsIkIxNiI6MCwiQjE3IjoxLCJCMTgiOjEsIkIxOSI6MCwiQjIwIjowLCJDMSI6eyJ0MSI6MCwidDIiOjEsImNvbmYiOjN9LCJDMiI6eyJ0MSI6MCwidDIiOjF9LCJWLUNTMWIiOjIsIkMzIjp7InQxIjoxfSwiQzQiOnsidDEiOjF9LCJDMTEiOnsidDEiOjF9LCJDMTIiOnsidDEiOjF9LCJDMTMiOnsidDEiOjF9LCJDMTQiOnsidDEiOjMsImNvbmYiOjIsInQyIjoyfSwiQzE1Ijp7InQxIjoxfSwiQzE2Ijp7InQxIjoxLCJ0MiI6MSwiY29uZiI6M30sIkMxNyI6eyJ0MSI6MX0sIkMxOCI6eyJ0MSI6MX0sIlYtQ1MyYSI6MywiQzUiOnsidDEiOjIsInQyIjoxLCJjb25mIjoyfSwiQzE5Ijp7InQxIjoxfSwiQzIwIjp7InQxIjoxfSwiQzYiOnsidDEiOjF9LCJDMjQiOnsidDEiOjF9LCJDNyI6eyJ0MSI6MX0sIkMyNSI6eyJ0MSI6MX0sIkMyMSI6eyJ0MSI6MX0sIkMyMiI6eyJ0MSI6MX0sIlYtQ1MyYiI6NCwiQzIzIjp7InQxIjoxfSwiQzgiOnsidDEiOjJ9LCJDMjYiOnsidDEiOjF9LCJDOSI6eyJ0MSI6Mn0sIkMyNyI6eyJ0MSI6MX0sIkMyOCI6eyJ0MSI6MSwidDIiOjEsImNvbmYiOjN9LCJDMTAiOnsidDEiOjF9LCJDMjkiOnsidDEiOjF9LCJDMzAiOnsidDEiOjEsInQyIjoxLCJjb25mIjozfSwiQzMxIjp7InQxIjoxfSwiQzMyIjp7InQxIjoxfSwiVi1BVCI6MywiRC1NTDEiOnsibW9zdCI6MSwibGVhc3QiOjJ9LCJELU1MMiI6eyJtb3N0IjoxLCJsZWFzdCI6Mn0sIkQtTUwzIjp7Im1vc3QiOjEsImxlYXN0IjoyfSwiRC1NTDQiOnsibW9zdCI6MiwibGVhc3QiOjF9LCJELU1DMSI6MywiRC1NQzIiOjMsIkQtTUMzIjozLCJELU1DNCI6MywiRC1TQzEiOjIsIkQtU0MyIjoyLCJELVNDMyI6Mn0=";
const HY="eyJWLU9DIjpbMCwxLDIsM10sIkEtSU4xIjo1LCJBLUlOMiI6NSwiQS1JTjMiOjUsIkEtSU40Ijo1LCJBLUlOLVBIIjo1LCJBLUlOLVNZIjoxLCJBLUlOLVFUIjoxLCJBLUlOLUxCIjo1LCJBLUVGMSI6NSwiQS1FRjIiOjUsIlYtU0QxIjo1LCJBLUVGMyI6NSwiQS1FRjQiOjUsIkEtQVgtUEgiOjUsIkEtQVgtU1kiOjEsIkEtQVgtUVQiOjEsIkEtQVgtTEIiOjUsIkEtQVgtR04iOjQsIkEtVkExIjo0LCJBLVZBMiI6MiwiQS1WQTMiOjUsIlYtU0QyIjozLCJCMjIiOjEsIkIyMSI6MCwiQjIzIjowLCJCMjQiOjAsIkIyNSI6MCwiQjI2IjowLCJCMjciOjAsIkIyOCI6MSwiQjEiOjEsIkIyIjowLCJCMyI6MSwiQjQiOjAsIkI1IjoxLCJCNiI6MSwiQjciOjAsIkI4IjowLCJCOSI6MSwiQjEwIjowLCJCMTEiOjEsIkIxMiI6MCwiVi1DUzFhIjo1LCJCMTMiOjEsIkIxNCI6MCwiQjE1IjoxLCJCMTYiOjAsIkIxNyI6MSwiQjE4IjowLCJCMTkiOjEsIkIyMCI6MSwiQzEiOnsidDEiOjAsInQyIjowLCJjb25mIjozfSwiQzIiOnsidDIiOjEsInQxIjowfSwiVi1DUzFiIjoxLCJDMyI6eyJ0MSI6MX0sIkM0Ijp7InQxIjoxfSwiQzExIjp7InQxIjoxfSwiQzEyIjp7InQxIjoxfSwiQzEzIjp7InQxIjoxfSwiQzE0Ijp7InQyIjoxLCJ0MSI6MSwiY29uZiI6M30sIkMxNSI6eyJ0MSI6MX0sIkMxNiI6eyJ0MSI6MSwidDIiOjEsImNvbmYiOjN9LCJDMTciOnsidDEiOjF9LCJWLUNTMmEiOjQsIkMxOCI6eyJ0MSI6MX0sIkM1Ijp7InQyIjoxLCJ0MSI6MSwiY29uZiI6M30sIkMxOSI6eyJ0MSI6MX0sIkMyMCI6eyJ0MSI6MX0sIkM2Ijp7InQxIjoxfSwiQzI0Ijp7InQxIjoxfSwiQzciOnsidDEiOjF9LCJDMjUiOnsidDEiOjF9LCJDMjEiOnsidDEiOjF9LCJDMjIiOnsidDEiOjF9LCJDMjMiOnsidDEiOjF9LCJWLUNTMmIiOjIsIkM4Ijp7InQxIjoyfSwiQzI2Ijp7InQxIjoxfSwiQzkiOnsidDEiOjJ9LCJDMjciOnsidDEiOjF9LCJDMjgiOnsidDEiOjEsInQyIjoxLCJjb25mIjozfSwiQzEwIjp7InQxIjoxfSwiQzI5Ijp7InQxIjoxfSwiQzMwIjp7InQxIjoxLCJ0MiI6MSwiY29uZiI6M30sIkMzMSI6eyJ0MSI6MX0sIkMzMiI6eyJ0MSI6MX0sIlYtQVQiOjMsIkQtTUwxIjp7Im1vc3QiOjEsImxlYXN0IjowfSwiRC1NTDIiOnsibW9zdCI6MCwibGVhc3QiOjJ9LCJELU1MMyI6eyJtb3N0IjoxLCJsZWFzdCI6Mn0sIkQtTUw0Ijp7Im1vc3QiOjAsImxlYXN0IjoxfSwiRC1NQzEiOjQsIkQtTUMyIjo1LCJELU1DMyI6NCwiRC1NQzQiOjQsIkQtU0MxIjoyLCJELVNDMiI6MiwiRC1TQzMiOjN9";
let pass=0,fail=0,bad=[];
function ck(n,ok,info){ if(ok){pass++;console.log("  ✅ "+n+(info?" — "+info:""));} else {fail++;bad.push(n);console.log("  ❌ "+n+(info?" — "+info:""));} }
const rd=f=>fs.readFileSync(OUT+"/"+f,"utf8");
const md5=s=>crypto.createHash("md5").update(s).digest("hex").slice(0,10);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function dec(b){ return JSON.parse(Buffer.from(b,"base64").toString("utf8")); }
function itemsFrom(h){ let i=h.indexOf("var ITEMS"), j=h.indexOf("[",i), d=0; for(let k=j;k<h.length;k++){ if(h[k]==="[")d++; else if(h[k]==="]"){d--; if(!d) return eval(h.slice(j,k+1)); } } }
class IO{constructor(c){this.c=c}observe(el){this.c([{isIntersecting:true,target:el}])}unobserve(){}disconnect(){}}
function load(file,url){
  const vc=new VirtualConsole(); const errs=[];
  vc.on("jsdomError",e=>{const m=(e.detail&&e.detail.message)||e.message||"";if(!/scroll|Not implemented/i.test(m))errs.push(m);});
  const dom=new JSDOM(rd(file),{runScripts:"dangerously",url:url||"https://x/",pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window, st={w,errs,fetchCount:0,$:s=>w.document.querySelector(s),$$:s=>w.document.querySelectorAll(s)};
  w.HTMLElement.prototype.scrollIntoView=function(){}; w.print=function(){}; w.scrollTo=function(){};
  w.matchMedia=w.matchMedia||function(){return{matches:false,addEventListener(){},removeEventListener(){}}};
  w.IntersectionObserver=IO;
  w.fetch=function(){ st.fetchCount++; return Promise.resolve({ok:true}); };
  return st;
}
(async()=>{
console.log("◆ A. 파일 세트");
const SET=["index.html","report.html","관리자.html","answers.html","og.png","engine_v2.js","report_v2.js","리포트_고급_미리보기.html"];
SET.forEach(f=>ck("존재: "+f, fs.existsSync(OUT+"/"+f)));
ck("og.png 크기", fs.existsSync(OUT+"/og.png") && fs.statSync(OUT+"/og.png").size>10000);

console.log("◆ B. 임베드 동기 (report 블록 md5)");
const START="var TYPES = {GJTD", ENDM="typeStability: typeStability };";
function blk(s){ const i=s.indexOf(START); if(i<0) return null; const j=s.indexOf(ENDM,i); return j<0?null:s.slice(i,j+ENDM.length); }
const ref=md5(blk(rd("report_v2.js")));
["index.html","report.html","관리자.html","리포트_고급_미리보기.html"].forEach(f=>{ const b=blk(rd(f)); ck("블록 동기: "+f, b&&md5(b)===ref, b?md5(b):"블록없음"); });

console.log("◆ C. 엔진 센티널");
const ENG='correctPick: !!(opt && opt.key)';
[["engine_v2.js",1],["index.html",1],["report.html",1],["관리자.html",1],["answers.html",0]].forEach(([f,n])=>ck("엔진라인 "+f+"="+n, rd(f).split(ENG).length-1===n));

console.log("◆ D. 골든 회귀 (엔진)");
const {computeV2}=require(OUT+"/engine_v2.js");
const RV=require(OUT+"/report_v2.js");
const ITEMS=itemsFrom(rd("index.html"));
ck("ITEMS 99문항", Array.isArray(ITEMS)&&ITEMS.length===99, ITEMS&&ITEMS.length);
const rK=computeV2(dec(KM),{name:"김민결",grade:"중2",elapsed:706},ITEMS);
const rH=computeV2(dec(HY),{name:"이하윤",grade:"중1",elapsed:706},ITEMS);
const cv=r=>{ if(typeof r.concept==="number")return r.concept; if(r.concept&&typeof r.concept.score==="number")return r.concept.score; if(typeof r.conceptScore==="number")return r.conceptScore; if(r.concept&&typeof r.concept.pct==="number")return r.concept.pct; return null; };
const vt=r=>r.validity&&(r.validity.tag||r.validity.label)||null;
ck("김민결 유형 SJRD", rK.type&&rK.type.code==="SJRD", rK.type&&rK.type.code);
ck("이하윤 유형 SJRD", rH.type&&rH.type.code==="SJRD", rH.type&&rH.type.code);
ck("김민결 개념 94", cv(rK)===94, "got "+cv(rK));
ck("이하윤 개념 97", cv(rH)===97, "got "+cv(rH));
ck("김민결 신뢰도 주의", vt(rK)==="주의", vt(rK));
ck("이하윤 신뢰도 주의", vt(rH)==="주의", vt(rH));
const tk=RV.trackScores2(rK);
ck("김민결 1위 트랙 올림피아드(66)", tk[0]&&tk[0].key==="올림피아드"&&tk[0].fit===66, tk[0]&&(tk[0].key+" "+tk[0].fit));
ck("김민결 top 밴드 ‘적합 근접’", tk[0].level==="적합 근접", tk[0].level);
var _hK=RV.renderReportV2(rK);
ck("김민결 소프트 안내(구간 향해)", _hK.includes("구간을 향해 다져 가는 단계"));
ck("김민결 ‘미달/이르지 않’ 표현 없음", !/미달|이르지 않/.test(_hK));
var tH2=RV.trackScores2(rH);
ck("이하윤 top 밴드 ‘적합’(≥70)", tH2[0].level==="적합" && tH2[0].fit>=70, tH2[0].level+" "+tH2[0].fit);
ck("이하윤 소프트 안내 없음", !RV.renderReportV2(rH).includes("구간을 향해 다져 가는 단계"));
ck("박빙은 성향쌍으로 설명(유형명/코드 의존 없음)", /사이를 오갑니다/.test(_hK) && /성향은 양쪽이 비슷하게/.test(_hK) && !/이웃 유형:|인접 가능성/.test(_hK));
ck("유형 뚜렷함 라벨", _hK.includes("유형 뚜렷함") && !_hK.includes("유형 신뢰도 ·"));
ck("순화 어휘(위조/귀인/미지어/적응적/결정적 모델 없음)", !/위조|귀인|미지어|적응적|결정적 모델/.test(_hK));
ck("§04 안내문(0점 아님)", _hK.includes("짧다고 0점이거나 부족하다는 뜻이 아닙니다"));
ck("70미만: ‘가까운 쪽’ 단정 안 함", !/지금 가까운 쪽|가장 가까운 방향/.test(_hK) && /뚜렷이 가깝다고|또렷하진 않습니다/.test(_hK));
ck("70미만: 역량 키우기로 안내", /바탕이 되는 힘을 키워 갈 때|토대를 다질 때/.test(_hK));
var _hH=RV.renderReportV2(rH);
ck("70이상: 방향 제시 유지", /방향과 가장 잘 맞습니다/.test(_hH) && _hH.includes("잘 맞는 방향"));
ck("리포트 크레딧(정적 마스트헤드·풋터)", rd("report.html").includes("분석·설계") && (rd("report.html").match(/조준모T/g)||[]).length>=2 && !_hK.includes("by 조준모"));
ck("v2 표기 제거(앱)", !rd("index.html").includes("· v2") && !/<title>[^<]*v2<\/title>/.test(rd("index.html")));
ck("Master Edition 키커", rd("index.html").includes("CHEMISTRY DIAGNOSTIC · MASTER EDITION"));
ck("새 공유 이름(og:title)", rd("index.html").includes('content="중학 화학대회 정밀 학습진단"'));
ck("앱 h1 정밀 학습진단", rd("index.html").includes("<h1>화학 정밀 학습진단</h1>"));

console.log("◆ E. 렌더 무결성");
[["김민결",rK],["이하윤",rH]].forEach(([nm,r])=>{
  const H=RV.renderReportV2(r);
  const txt=H.replace(/<style[\s\S]*?<\/style>/g," ").replace(/<[^>]+>/g," ");
  ck(nm+" 깨짐 없음", !/\bundefined\b|\bNaN\b|\[object Object\]/.test(txt));
  ck(nm+" 트랙 효용×5", (H.match(/이 길의 효용/g)||[]).length===5);
  ck(nm+" 할 일×5", (H.match(/그래서, 지금 할 일/g)||[]).length===5);
});
ck("§07 부제(구간 중심)", RV.renderReportV2(rK).includes("점수보다 순위와 구간"));

console.log("◆ F. OG 태그");
[["index.html",1],["report.html",1],["answers.html",1],["관리자.html",0]].forEach(([f,n])=>{
  const c=(rd(f).match(/property="og:image"/g)||[]).length;
  ck("og:image "+f+"="+n, c===n, c+"개");
});
ck("og 절대주소", rd("index.html").includes("https://chemistreal.github.io/KMChC/og.png"));

console.log("◆ G. 공개앱 (index.html — 데모 제거·실완료 전송·백업)");
const A=load("index.html"); await sleep(170);
ck("앱 로드 무오류", A.errs.length===0, A.errs[0]);
ck("데모 버튼 제거됨(공개앱)", !A.$("#demoBtn"));
ck("진단 시작 버튼", !!A.$("#startBtn"));
ck("관리자 링크", !!A.w.document.querySelector('a[href="관리자.html"]'));
const bk=A.$("#backupStrip");
ck("백업 스트립(숨김 시작)", !!bk && bk.style.display==="none");
A.w.showBackup("TESTCODE123");
ck("showBackup(code) 동작", !!bk && bk.style.display!=="none" && A.$("#backupCode").value==="TESTCODE123");
ck("실제 완료시 전송+백업 호출 코드", rd("index.html").includes("sendToSheet(r); if(window.showBackup)showBackup(serialize());"));
ck("누적 로그 코드", rd("index.html").includes('kmchc_v2_log'));

console.log("◆ H. 학부모 뷰어 (report.html / answers.html)");
const R=load("report.html","https://x/report.html?d="+encodeURIComponent(KM)+"&n=%EA%B9%80%EB%AF%BC%EA%B2%B0&g=%EC%A4%912");
await sleep(140);
let rc=0; for(let k=0;k<8;k++){ await sleep(220); rc=R.$$("#report .card").length; if(rc>=13) break; }
ck("리포트 13카드", rc>=13, rc+"카드");
ck("리포트 무오류", R.errs.length===0, R.errs[0]);
ck("리포트 프라이버시 풋노트", !!R.$(".privacy-foot"));
ck("리포트 og 메타", !!R.$('meta[property="og:image"]'));
ck("응답지 링크 연결", (R.$("#toAnswers")||{}).href ? R.$("#toAnswers").href.includes("answers.html") : false);
const W=load("answers.html","https://x/answers.html?d="+encodeURIComponent(KM));
await sleep(420);
let wc=0; for(let k=0;k<8;k++){ await sleep(220); wc=(W.$("#report")||{innerHTML:""}).innerHTML.length; if(wc>50000) break; }
ck("응답지 렌더(99문항)", wc>50000 && /총 99문항/.test(W.$("#report").textContent), wc+"자");
ck("응답지 풋노트", !!W.$(".privacy-foot"));
ck("응답지 무오류", W.errs.length===0, W.errs[0]);

console.log("◆ I. 관리자 (보조 UI·검증·데모 전송)");
const M=load("관리자.html"); await sleep(160);
ck("관리자 무오류", M.errs.length===0, M.errs[0]);
ck("보조 UI 3종", !!M.$("#liveIssues") && !!M.$("#mlAssist") && !!M.$("#restoreCard"));
ck("ML 보조 4문항", M.$$("#mlAssist .mlitem").length===4, M.$$("#mlAssist .mlitem").length+"개");
ck("실행형 충돌 메시지", rd("관리자.html").includes("두 자리를 서로 다르게"));
ck("데모 버튼(관리자)", !!M.$("#demoRun"));
if(M.$("#demoRun")){ M.w.document.getElementById("an").value="데모테스트"; var _fb=M.fetchCount; M.$("#demoRun").click();
  let dc=0; for(let k=0;k<10;k++){ await sleep(230); dc=M.$$("#report .card").length; if(dc>=13) break; }
  ck("데모 채점 13카드", dc>=13, dc+"카드");
  ck("데모: 시트 전송", M.fetchCount-_fb===1, (M.fetchCount-_fb)+"회");
  ck("데모: 공유링크 설정", M.w.__share && !!M.w.__share.b64);
}

console.log("");
if(fail){ console.log("■ 결과: ❌ FAIL "+fail+"건 — "+bad.join(" / ")); console.log("   배포 중단. 위 항목 수정 후 재실행."); process.exit(1); }
console.log("■ 결과: ✅ 전체 통과 ("+pass+"항목)");
console.log("   배포 세트: index.html · report.html · 관리자.html · answers.html (og.png 변경 없으면 생략)");
process.exit(0);
})().catch(e=>{ console.error("게이트 자체 오류:",e&&e.message||e); process.exit(2); });
