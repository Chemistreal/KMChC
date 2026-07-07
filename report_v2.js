"use strict";
/* ── v1 16유형 콘텐츠 이식 ── */
var TYPES = {GJTD:{name:"현상 탐험가"},GJTM:{name:"관찰 수집가"},GJRD:{name:"직관 정리가"},GJRM:{name:"성실 관찰가"},GBTD:{name:"실험 분석가"},GBTM:{name:"꼼꼼 탐구가"},GBRD:{name:"데이터 설계자"},GBRM:{name:"정밀 정리가"},SJTD:{name:"직관 이론가"},SJTM:{name:"상상 탐구가"},SJRD:{name:"통찰 정리가"},SJRM:{name:"개념 수집가"},SBTD:{name:"구조 탐험가"},SBTM:{name:"원리 탐구가"},SBRD:{name:"이론 설계자"},SBRM:{name:"체계 설계자"}};
var TYPE_INFO = {
GJTD:{tag:"눈에 보이는 변화를 감으로 빠르게 잡고, 새로운 것에 겁 없이 뛰어드는 형",desc:"이 학생은 눈앞의 변화와 결과를 빠르게 알아채고, 낯선 현상에도 망설임 없이 손을 대며 배웁니다. 흥미가 켜지면 폭발적으로 몰입하지만, 보이지 않는 입자 수준의 '왜'로 내려가거나 기초를 차근차근 다지는 단계에서는 속도가 떨어질 수 있습니다.",str:["현상을 빠르게 포착하는 관찰력과 순발력","낯선 주제도 일단 시도하는 도전성","흥미가 붙으면 강하게 몰입"],cau:["눈에 안 보이는 입자·원리로 내려갈 때 도움이 필요","기초·반복 단계를 건너뛰기 쉬움"],rx:"실험·현상으로 호기심을 연 뒤, 매주 '왜 그럴까'를 알갱이 모형으로 묶어 주세요. 기본기 반복은 짧은 미션·게임처럼 설계하면 지루함 없이 채워집니다."},
GJTM:{tag:"보이는 현상을 꾸준히 관찰하고 차곡차곡 쌓아 가는 안정형",desc:"이 학생은 눈에 보이는 현상을 성실히 관찰하고 반복으로 익히며 안정적으로 실력을 쌓습니다. 빠른 직관으로 잡되 도전보다 숙달을 편안해해서, 난도를 한 단계 올리거나 '왜'를 따지는 자리에서 약간의 자극이 필요합니다.",str:["꾸준함과 성실한 관찰 습관","반복으로 안정적으로 익힘","빠른 직관적 이해"],cau:["새롭고 어려운 도전을 피하기 쉬움","원리 수준 설명으로 넘어갈 때 보조 필요"],rx:"관찰 기록을 칭찬으로 강화하되 '오늘은 한 단계 어려운 것 하나'를 작게 끼워 도전 근육을 키워 주세요. 관찰마다 '왜'를 한 줄 붙이는 습관이 원리로 가는 다리가 됩니다."},
GJRD:{tag:"감으로 빠르게 파악한 것을 자기 방식으로 정리하며 도전하는 형",desc:"이 학생은 현상을 직관으로 빠르게 잡은 뒤 자기만의 방식으로 정리하고, 더 어려운 문제로 나아가길 즐깁니다. 정리와 도전이 함께 있어 추진력이 좋지만, 분석적 검증이 약해 '맞는 것 같다'에서 멈추면 빈틈이 생길 수 있습니다.",str:["직관적 파악과 자기식 정리","도전적인 과제를 즐김","핵심을 빠르게 요약"],cau:["근거를 따지는 분석 단계가 얕을 수 있음","'대충 맞다'에서 멈추기 쉬움"],rx:"정리한 내용을 '왜 그런지' 한 단계 더 캐묻는 질문으로 분석을 보강해 주세요. 도전 과제 뒤엔 반드시 풀이 근거를 말로 설명하게 하면 직관과 논리가 함께 자랍니다."},
GJRM:{tag:"성실하게 관찰하고 정리하며 차근차근 익히는 안정형",desc:"이 학생은 현상을 꼼꼼히 관찰·정리해 두며 반복으로 단단하게 다지는 것을 편안해합니다. 안정감이 강점이지만 직관에 기대 깊은 분석이나 새 도전은 미루기 쉬워, 한 걸음 더 들어가는 자극이 도움이 됩니다.",str:["성실한 관찰과 정리","반복으로 탄탄히 다짐","안정적인 학습 태도"],cau:["깊은 분석·새 도전을 미루기 쉬움","익숙한 범위에 머물기 쉬움"],rx:"정리 노트를 인정해 주되 '왜 그런지'와 '한 단계 어려운 문제'를 작게 더해 주세요. 안전지대 밖의 작은 성공 경험을 자주 만들어 주는 것이 핵심입니다."},
GBTD:{tag:"보이는 현상을 논리로 따져 가며 새로운 것에 도전하는 형",desc:"이 학생은 눈에 보이는 현상을 그냥 받아들이지 않고 '왜?'를 논리로 따지며, 새로운 문제에 적극 도전합니다. 분석력과 도전성이 함께 있어 탐구형 과제에 강하지만, 완벽히 따지려다 시작이 늦거나 기초 반복을 답답해할 수 있습니다.",str:["현상을 논리로 분석하는 힘","탐구·실험 과제에 강함","새 문제에 도전적"],cau:["따지다 시작이 늦어질 수 있음","기초 반복을 지루해함"],rx:"탐구·실험형 과제로 분석 욕구를 채워 주고, '완벽히 이해한 뒤'가 아니라 '풀면서 이해하는' 순서를 권해 주세요. 기초는 의미를 먼저 보여 주면 덜 답답해합니다."},
GBTM:{tag:"보이는 현상을 꼼꼼히 분석하며 반복으로 탄탄히 익히는 형",desc:"이 학생은 현상을 세심하게 분석하고 반복을 통해 정확하게 익히는 것을 좋아합니다. 정확성과 성실함이 강점이지만, 완벽을 추구하느라 속도가 느리거나 낯선 도전을 피할 수 있습니다.",str:["꼼꼼한 분석과 정확성","반복으로 탄탄히 익힘","실수 관리에 강함"],cau:["완벽주의로 속도가 느려질 수 있음","새 도전을 피하기 쉬움"],rx:"정확함을 칭찬하되 '시간 제한 풀이'로 속도 감각을 키워 주세요. 익숙해진 뒤엔 난도를 한 단계 올린 도전을 작게 끼워 자신감을 확장합니다."},
GBRD:{tag:"관찰한 것을 체계적으로 분석·정리하며 도전 과제로 나아가는 형",desc:"이 학생은 현상에서 얻은 정보를 체계적으로 분석·정리하고 그것을 발판으로 어려운 문제에 도전합니다. 구조화 능력과 추진력이 함께 있어 장기 과제에 강하지만, 정리 자체에 만족하면 실제 문제풀이 시간이 줄 수 있습니다.",str:["체계적 분석·정리","도전 과제로 나아가는 추진력","정보를 구조화하는 힘"],cau:["정리에 만족해 풀이가 줄 수 있음","틀에 안 맞는 문제에 약할 수 있음"],rx:"정리 시간에 제한을 두고 '대표 문제 먼저 풀기'로 균형을 잡아 주세요. 강점을 살려 단원별 개념 지도를 직접 만들게 하면 큰 동기가 됩니다."},
GBRM:{tag:"보이는 현상을 정밀하게 분석·정리하며 반복으로 완성하는 형",desc:"이 학생은 정확하고 정밀하게 분석·정리하며 반복으로 빈틈없이 완성하는 것을 편안해합니다. 정확성·꼼꼼함이 큰 강점이지만, 완벽히 이해해야 시작한다는 부담과 새 도전 회피가 약점이 될 수 있습니다.",str:["정밀한 분석과 정리","빈틈없는 마무리","높은 정확성"],cau:["완벽 이해 부담으로 시작 지연","새롭고 어려운 도전 회피"],rx:"'완벽 이해 후 풀이'가 아니라 '풀면서 이해'를 연습시키고 정리는 핵심만 추리게 해 주세요. 작은 도전의 성공을 자주 경험시키면 안전지대가 넓어집니다."},
SJTD:{tag:"보이지 않는 원리를 직관으로 통찰하며 도전을 즐기는 형",desc:"이 학생은 눈에 안 보이는 구조·원리를 직관적으로 꿰뚫고 어려운 개념에 겁 없이 도전합니다. 통찰력과 도전성이 강점이지만, 직관에 기대 논리적 검증과 기초 계산을 건너뛰면 '알 것 같은데 틀리는' 일이 생깁니다.",str:["원리를 직관으로 꿰뚫는 통찰","어려운 개념에 도전적","핵심을 빠르게 잡음"],cau:["논리적 검증·기초 계산을 건너뛰기 쉬움","'안다는 느낌'과 실제 적용의 차이"],rx:"통찰을 살리되 '왜 그런지'를 단계로 적게 하고, 백지 설명·변형 문제로 이해를 확인해 주세요. 고난도 개념 도전으로 동기를 유지하면 강하게 성장합니다."},
SJTM:{tag:"보이지 않는 세계를 상상으로 탐구하며 꾸준히 익히는 형",desc:"이 학생은 입자·원리처럼 보이지 않는 세계를 상상으로 그리며 탐구하고 반복으로 차분히 익힙니다. 개념적 상상력이 강점이지만, 직관과 상상에 머물면 정확한 적용·계산으로 옮기는 데 보조가 필요합니다.",str:["보이지 않는 세계를 그리는 상상력","개념적 호기심","꾸준한 익힘"],cau:["상상이 정확한 적용으로 잘 이어지지 않을 수 있음","검증 단계가 약할 수 있음"],rx:"상상한 개념을 그림·모형으로 표현하게 한 뒤 대표 문제로 적용을 확인해 주세요. 호기심을 풀어 줄 '왜' 질문을 자주 던지면 깊이가 더해집니다."},
SJRD:{tag:"원리를 통찰해 자기 언어로 정리하며 도전으로 나아가는 형",desc:"이 학생은 보이지 않는 원리를 통찰하고 자기 언어로 정리하며 더 어려운 문제로 확장하길 즐깁니다. 개념 정리력과 도전성이 함께 있어 개념 중심 학습에 강하지만, 분석적 근거 확인이 얕으면 빈틈이 생길 수 있습니다.",str:["원리 통찰과 자기식 개념 정리","도전 과제로 확장","개념을 언어로 잘 풀어냄"],cau:["근거를 따지는 분석이 얕을 수 있음","계산·기초 반복을 가볍게 볼 수 있음"],rx:"정리한 개념을 '근거를 들어' 설명하게 하고 도전 문제 뒤 풀이 검증을 습관화해 주세요. 개념을 남에게 가르치게 하면 통찰이 한층 단단해집니다."},
SJRM:{tag:"보이지 않는 개념을 모아 정리하며 차근차근 익히는 형",desc:"이 학생은 개념과 원리를 모아 자기 체계로 정리하고 반복으로 안정적으로 익히는 것을 좋아합니다. 개념 축적과 성실함이 강점이지만, 직관·정리에 머물러 깊은 분석이나 새 도전을 미루기 쉽습니다.",str:["개념을 모아 정리하는 힘","성실하고 안정적","원리에 대한 관심"],cau:["깊은 분석·도전을 미루기 쉬움","수집에 그쳐 적용이 약할 수 있음"],rx:"모은 개념을 문제에 '적용'하는 단계를 꼭 붙이고 한 단계 어려운 도전을 작게 더해 주세요. 개념 지도를 직접 그리게 하면 동기와 구조가 함께 자랍니다."},
SBTD:{tag:"보이지 않는 구조를 논리로 파고들며 도전을 즐기는 형 (대회형 기질)",desc:"이 학생은 눈에 안 보이는 구조와 원리를 논리로 끝까지 파고들고 고난도 개념과 도전을 즐깁니다. 깊이·분석·도전을 모두 갖춰 경시·심화에 강한 기질이지만, 기본 반복을 지루해하고 서두르다 실수할 수 있습니다.",str:["깊이·분석·도전을 모두 가짐","고난도 개념을 즐김","원리를 끝까지 파고듦"],cau:["기본 반복을 지루해함","서두르다 실수하기도"],rx:"심화·올림피아드형 문제로 동기를 유지하되 기본기 반복은 게임처럼 설계해 주세요. 풀이 과정을 또박또박 쓰는 습관으로 실수를 줄이면 잠재력이 만개합니다."},
SBTM:{tag:"보이지 않는 원리를 깊이 분석하며 반복으로 탄탄히 익히는 형",desc:"이 학생은 원리를 깊이 분석하고 반복을 통해 정확하고 탄탄하게 익히는 것을 좋아합니다. 깊이와 정확성이 강점이지만, 완벽히 이해해야 시작한다는 부담과 느린 속도가 약점이 될 수 있습니다.",str:["원리에 대한 깊은 분석","정확하고 탄탄한 익힘","끈기 있는 탐구"],cau:["완벽 이해 부담으로 시작 지연","속도가 느려질 수 있음"],rx:"깊이를 살리되 '풀면서 이해'와 시간 제한 풀이로 시작·속도를 도와주세요. 탐구한 원리를 문제로 바로 적용시키면 이해가 실력으로 굳습니다."},
SBRD:{tag:"보이지 않는 원리를 체계적으로 분석·정리하며 도전하는 형",desc:"이 학생은 원리를 체계적으로 분석·정리해 자기 이론으로 세우고 그것으로 어려운 문제에 도전합니다. 구조화와 도전성이 강해 개념 설계에 탁월하지만, 정리·구조에 몰두하다 실전 문제풀이 시간이 줄 수 있습니다.",str:["원리를 체계로 세우는 설계력","도전 과제로 나아감","깊은 분석과 구조화"],cau:["정리·구조에 몰두해 풀이가 줄 수 있음","틀을 벗어난 문제에 유연성 필요"],rx:"이론 구축 강점을 살려 단원 개념 지도를 만들게 하되 정리 시간엔 제한을 두고 대표 문제를 먼저 풀게 해 주세요. 도전 문제로 동기를 유지하면 폭이 넓어집니다."},
SBRM:{tag:"보이지 않는 원리를 정밀하게 분석·정리하며 완성도로 마무리하는 형",desc:"이 학생은 원리를 정밀하게 분석하고 빈틈없는 체계로 정리하며 반복으로 완성도 높게 마무리합니다. 구조·정확성·완성도가 큰 강점이지만, 완벽주의로 시작이 늦고 새 도전을 피하기 쉽습니다.",str:["정밀한 분석과 체계화","높은 완성도와 정확성","빈틈없는 마무리"],cau:["완벽주의로 시작 지연","새롭고 어려운 도전 회피"],rx:"'완벽 이해 후'가 아니라 '풀면서 완성'으로 순서를 바꾸고 정리는 핵심만 추리게 해 주세요. 작은 도전의 성공을 자주 경험시키면 강점이 더 큰 무대로 확장됩니다."}
};
var POLEFULL = {G:"겉·현상",S:"속·원리",J:"직관",B:"분석",T:"탐구",R:"정리",D:"도전",M:"숙달"};
var POLEMEAN = {G:"눈에 보이는 변화와 결과부터 파악합니다.",S:"보이지 않는 입자·원리부터 상상합니다.",J:"빠른 직관으로 핵심을 잡습니다.",B:"근거를 따지며 논리로 분석합니다.",T:"새로운 것을 탐구하고 시도합니다.",R:"정리하며 차곡차곡 축적합니다.",D:"어려운 도전을 즐깁니다.",M:"반복으로 숙달하며 안정적으로 익힙니다."};
var COMBOS = {BM:"분석과 숙달이 함께 강해 정확하지만 속도가 느려질 수 있습니다.",JD:"직관과 도전이 함께 강해 빠르지만 검증이 약할 수 있습니다.",SB:"원리 지향과 분석이 만나 개념 깊이가 큽니다.",GJ:"현상 직관이 빨라 순발력이 좋습니다.",TD:"탐구와 도전이 만나 새로운 문제에 강합니다.",RM:"정리와 숙달이 만나 안정적으로 누적됩니다.",SD:"원리를 깊이 파고들며 도전하는 대회형 기질입니다.",GM:"현상을 관찰하며 꾸준히 다지는 안정형입니다.",BD:"분석력으로 도전 과제를 정면 돌파합니다.",JM:"직관으로 빠르게 잡고 반복으로 굳힙니다.",GR:"현상을 관찰해 차곡차곡 정리합니다.",ST:"원리를 탐구하며 새로움을 추구합니다.",GD:"현상에 겁 없이 도전합니다.",SM:"원리를 반복으로 깊이 다집니다.",JT:"직관으로 빠르게 탐구합니다.",BR:"분석한 것을 체계적으로 정리합니다.",JR:"직관으로 잡아 정리합니다.",BT:"분석적으로 탐구합니다."};

/* ===== 화학 진단 v2 — 리포트 렌더 (순수 함수, HTML 문자열 반환) ===== */

var CTXLAB = { phenom: "현상", symbol: "입자·기호", quant: "정량", lab: "실험" };
var CTX_ORDER = ["phenom", "symbol", "quant", "lab"];
var AXLAB = { lens: ["현상", "원리"], think: ["직관", "분석"], drive: ["탐구", "정리"], approach: ["도전", "숙달"] };
var AXNAME = { lens: "관점", think: "사고", drive: "동력", approach: "방식" };
var APPR_LAB = { deep: "이해(심층)", surface: "암기·문제량(표층)", accuracy: "정확", procedural: "절차", metacog: "점검" };
var COPE_LAB = {
  persist: "원리 다시 읽고 재시도", lookup: "해설·답지 먼저", detour: "쉬운 문제로 우회", pause: "잠시 두고 나중에",
  analyze: "실수 패턴을 분석", note: "다음엔 조심", drill: "비슷한 문제 반복", external: "운 탓",
  seek_now: "즉시 찾아봄", seek_later: "표시해 뒀다 찾음", ask: "선생님·친구에게 질문", skip: "넘기고 진도"
};
var COPE_STEM = { "D-SC1": "막혔을 때", "D-SC2": "실수했을 때", "D-SC3": "모르는 용어를 만나면" };
var ADAPT = { persist: 1, analyze: 1, seek_now: 1, seek_later: 1, ask: 1, pause: 1 };

function f(v, suf) { return (v == null) ? "—" : (v + (suf || "")); }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* ── 맥락 지도 레이더 ── */
function ctxRadarSVG(r) {
  var cx = 132, cy = 130, maxR = 96;
  function pt(val, idx) {
    var ang = (-90 + idx * 90) * Math.PI / 180, rr = (val || 0) / 100 * maxR;
    return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
  }
  function poly(get, color, fillop) {
    var pts = CTX_ORDER.map(function (c, i) { return pt(get(c), i).join(","); }).join(" ");
    return '<polygon points="' + pts + '" fill="' + color + '" fill-opacity="' + fillop + '" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" class="poly-in" style="transform-box:fill-box;transform-origin:center"/>';
  }
  var grid = "";
  [25, 50, 75, 100].forEach(function (lv) {
    var p = CTX_ORDER.map(function (c, i) { return pt(lv, i).join(","); }).join(" ");
    grid += '<polygon points="' + p + '" fill="none" stroke="var(--line-2)" stroke-width="1" stroke-dasharray="' + (lv === 100 ? "0" : "2 3") + '"/>';
  });
  var spokes = CTX_ORDER.map(function (c, i) { var e = pt(100, i); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0] + '" y2="' + e[1] + '" stroke="var(--line-2)" stroke-width="1"/>'; }).join("");
  var labels = CTX_ORDER.map(function (c, i) {
    var e = pt(118, i), anc = (i === 1 ? "start" : i === 3 ? "end" : "middle");
    return '<text x="' + e[0] + '" y="' + (e[1] + 4) + '" text-anchor="' + anc + '" font-size="12.5" font-weight="600" fill="var(--ink-2)">' + CTXLAB[c] + '</text>';
  }).join("");
  var cm = r.ctxmap || {};
  var pInt = poly(function (c) { return cm[c] ? cm[c].interest : null; }, "var(--teal)", 0.14);
  var pAnx = poly(function (c) { return cm[c] ? cm[c].anxiety : null; }, "var(--rose)", 0.12);
  var pMis = poly(function (c) { return cm[c] && cm[c].misc != null ? cm[c].misc : 0; }, "var(--amber)", 0.10);
  return '<svg viewBox="-16 0 296 250" width="100%" style="max-width:330px;display:block;margin:0 auto">' +
    grid + spokes + pMis + pAnx + pInt + labels + '</svg>';
}
function legendDot(color, label) { return '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px;font-size:13px;color:var(--ink-2)"><i style="width:11px;height:11px;border-radius:3px;background:' + color + ';display:inline-block"></i>' + label + '</span>'; }

/* ── 사다리 단계 ── */
function ladderRow(name, stage) {
  var seg = "";
  for (var t = 1; t <= 4; t++) {
    var on = stage >= t;
    seg += '<div style="flex:1;height:10px;border-radius:3px;background:' + (on ? "var(--teal)" : "var(--line)") + '"></div>';
  }
  var word = ["아직 준비 단계", "기초", "익히는 중", "자발", "몰입"][stage] || "";
  var label = stage <= 0 ? word : (f(stage) + '단 · ' + word);
  return '<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><b>' + name + '</b><span style="color:var(--teal-d);font-weight:600">' + label + '</span></div><div style="display:flex;gap:5px">' + seg + '</div></div>';
}
function ladderHTML(r) {
  var rows = ladderRow("흥미", r.interest.stage) + ladderRow("자신감", r.efficacy.stage) + ladderRow("메타인지 (스스로 점검하는 힘)", r.metacog.stage);
  var lowest = Math.min(r.interest.stage, r.efficacy.stage, r.metacog.stage);
  var intro = '<p style="font-size:12px;color:var(--muted);margin:0 0 10px">각 항목이 \u2018좋아한다\u00b7안다\u2019를 넘어 <b>스스로 하는 단계</b>까지 얼마나 올라왔는지를 봅니다. 낮은 항목은 부족이 아니라 <b>앞으로 키울 영역</b>입니다.</p>';
  var buf = lowest <= 1 ? '<p style="font-size:12px;color:var(--muted);margin:10px 0 0;padding-top:8px;border-top:1px dashed var(--line)">\u203b 낮게 나온 항목(특히 메타인지)은 이 또래에 매우 흔하며, 습관을 들이면 충분히 끌어올릴 수 있습니다.</p>' : '';
  return intro + rows + buf;
}

/* ── 접근 우선순위 + 심층–표층 lean ── */
function approachHTML(r) {
  var a = r.approach || {}, order = (a.order || []).filter(function (c) { return a.norm && a.norm[c] != null; });
  var rows = order.slice(0, 5).map(function (c, i) {
    var v = a.norm[c];
    return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;font-size:13px"><span style="width:18px;color:var(--muted)">' + (i + 1) + '</span><span style="width:120px">' + (APPR_LAB[c] || c) + '</span><div style="flex:1;height:8px;background:var(--line);border-radius:99px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(28,24,18,.09)"><div style="width:' + (12 + v * 0.88) + '%;height:100%;border-radius:99px;background:linear-gradient(180deg,rgba(255,255,255,.25),rgba(0,0,0,.08)),var(--cobalt)"></div></div></div>';
  }).join("");
  var lean = a.lean, _mag = lean == null ? 0 : Math.abs(lean), _str = _mag >= 50 ? "뚜렷이 " : _mag >= 20 ? "" : "약간 ";
  var leanTxt = lean == null ? "\u2014" : (lean > 0 ? _str + "심층(이해) 우세" : lean < 0 ? _str + "표층(암기\u00b7문제량) 우세" : "심층\u00b7표층 균형");
  var pos = lean == null ? 50 : Math.max(0, Math.min(100, 50 + lean / 2));
  var leanBar = '<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)"><span>표층(암기)</span><span style="color:var(--teal-d);font-weight:600">' + leanTxt + '</span><span>심층(이해)</span></div>' +
    '<div style="position:relative;height:8px;background:linear-gradient(90deg,rgba(189,122,18,.28),var(--line) 50%,rgba(14,122,110,.32));border-radius:99px;margin-top:4px;box-shadow:inset 0 1px 2px rgba(28,24,18,.08)"><div style="position:absolute;left:' + pos + '%;top:-4px;width:4px;height:16px;background:var(--ink);border-radius:99px;transform:translateX(-50%);box-shadow:0 1px 5px rgba(28,24,18,.45)"></div></div></div>';
  var leanNote = (lean != null && lean < 0) ? '<p style="font-size:12px;color:var(--muted);margin:10px 0 0;padding-top:8px;border-top:1px dashed var(--line)">\u203b 표층 우세는 \u2018나쁨\u2019이 아니라 지금의 공부 결입니다. 여기에 \u2018왜 그런가\u2019 한 줄을 더하는 습관을 얹으면 심층(이해)으로 자연스럽게 넓어집니다.</p>' : '';
  return '<p style="font-size:13px;color:var(--muted);margin:0 0 8px">두 보기 모두 그럴듯한 것 중 하나를 고르게 해 ‘좋아 보이는 답’을 고를 수 없는 방식입니다. 그래서 점수가 아니라 <b>무엇을 먼저 쓰는가의 순서</b>로 읽습니다.</p>' + rows + '<p style="font-size:11.5px;color:var(--muted);margin:6px 0 0">막대는 ‘더 자주, 더 먼저 쓰는 정도’의 상대 차이일 뿐, 짧다고 0점이거나 부족하다는 뜻이 아닙니다.</p>' + leanBar + leanNote;
}

/* ── 대처 패턴 ── */
function copingHTML(r) {
  var c = r.coping || {}, m = c.byItem || {};
  var rows = Object.keys(COPE_STEM).map(function (id) {
    var code = m[id]; if (!code) return "";
    var adapt = ADAPT[code];
    return '<div style="display:flex;justify-content:space-between;margin:5px 0;font-size:13px"><span style="color:var(--ink-2)">' + COPE_STEM[id] + '</span><span style="font-weight:600;color:' + (adapt ? "var(--emerald)" : "var(--amber)") + '">' + (COPE_LAB[code] || code) + '</span></div>';
  }).join("");
  return rows + '<p style="font-size:12px;color:var(--muted);margin-top:8px">도움이 되는 방향의 선택 ' + f(c.adaptive) + '/' + f(c.total) + ' · 모두 정상 대처라 ‘좋고 나쁨’이 아닌 <b>패턴</b>으로 읽습니다.</p>';
}

/* ── 신뢰도 배지 ── */
function validityBadge(r) {
  var v = r.validity || {}, tag = v.tag || "—";
  var col = tag === "고신뢰" ? "var(--emerald)" : tag === "주의" ? "var(--amber)" : "var(--rose)";
  var detail = "좋게 보이려는 경향(SD) " + f(v.sd) + " · 과대주장 " + f(v.overclaim) + " · 불일치 " + f(v.inconsistency) + (v.attentionFail ? " · 주의력 실패" : "") + (v.straightLine ? " · 직선응답" : "") + (v.tooFast ? " · 과속(" + f(v.secPerItem) + "초/문항)" : "");
  var note = tag === "신중 해석" ? "이번 응답에서는 흥미\u00b7자신감 같은 자기보고 항목이 실제보다 다소 높게 표현되었을 가능성이 있습니다. 이 시기 학생에게 자연스러운 일이니, 해당 수치는 여유를 두고 보시고, 응답 방식의 영향을 덜 받는 유형\u00b7개념\u00b7시나리오 결과를 중심으로 읽으시면 더 정확합니다." : tag === "주의" ? "자기 자신을 약간 긍정적으로 표현한 경향이 보입니다(이 또래에서 흔히 나타나는 자연스러운 모습입니다). 흥미\u00b7자신감 같은 <b>자기보고 수치만 한 톤 낮춰</b> 보시고, 유형\u00b7개념\u00b7사고 패턴 결과는 <b>그대로 신뢰하셔도</b> 됩니다." : "응답이 처음부터 끝까지 일관되고 집중도가 높아, 모든 결과를 안심하고 신뢰하셔도 됩니다.";
  return '<div style="display:flex;align-items:center;gap:10px"><span class="vbadge" style="background:' + col + ';color:#fff;font-weight:700;padding:5px 12px;border-radius:999px;font-size:13px">' + tag + '</span><span style="font-size:12px;color:var(--muted)">정밀 지표 \u00b7 ' + detail + '</span></div><p style="font-size:13px;color:var(--ink-2);margin:8px 0 0">' + note + '</p>';
}

/* ── 16유형(요약) ── */
function typeMiniHTML(r) {
  var t = r.type || {}, ax = t.axes || {};
  var bars = ["lens", "think", "drive", "approach"].map(function (k) {
    var po = { lens: ["G", "S"], think: ["J", "B"], drive: ["T", "R"], approach: ["D", "M"] }[k];
    var a = (ax[k] && ax[k][po[0]]) || 0, b = (ax[k] && ax[k][po[1]]) || 0, tot = a + b || 1, pa = Math.round(a / tot * 100);
    var lab = AXLAB[k];
    return '<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted)"><span>' + lab[0] + '</span><span>' + AXNAME[k] + '</span><span>' + lab[1] + '</span></div>' +
      '<div style="display:flex;height:9px;border-radius:99px;overflow:hidden;background:var(--line);box-shadow:inset 0 1px 2px rgba(28,24,18,.09)"><div style="width:' + pa + '%;background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(0,0,0,.06)),var(--teal)"></div><div style="flex:1;background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(0,0,0,.06)),var(--cobalt)"></div></div></div>';
  }).join("");
  return '<div class="tcode" style="text-align:center;margin:6px 0 12px">' + esc(t.code || "————") + '</div>' + bars;
}

/* ── 오개념(요약) ── */
function conceptMiniHTML(r) {
  var bandCol = { "양호": "var(--emerald)", "흔들림": "var(--amber)", "교정필요": "var(--rose)", "정보없음": "var(--grey)" };
  var intu = r.intu || {}, IL = { conservation: "보존", particle: "입자", change: "변화" };
  var chips = Object.keys(IL).map(function (k) {
    var b = intu[k] || "정보없음";
    return '<span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;color:#fff;background:' + bandCol[b] + ';margin:3px 4px 0 0">' + IL[k] + ' · ' + b + '</span>';
  }).join("");
  return '<div style="display:flex;align-items:baseline;gap:8px"><span style="font-family:var(--serif);font-size:30px;color:var(--teal-d)">' + f(r.concept) + '</span><span style="color:var(--muted);font-size:13px">/100 개념 직관</span></div>' +
    '<div style="margin-top:8px">' + chips + '</div>' +
    '<p style="font-size:13px;color:var(--ink-2);margin-top:8px">고착(우선 교정) <b>' + (r.entrenched ? r.entrenched.length : 0) + '</b>건 · 지식 공백(아직 비어 있는 개념) <b>' + (r.gaps ? r.gaps.length : 0) + '</b>건</p>';
}

/* ── 교차 해석(맥락) ── */
function crossReadHTML(r) {
  var cm = r.ctxmap || {}, msgs = [];
  CTX_ORDER.forEach(function (c) {
    var x = cm[c]; if (!x) return;
    if (x.anxiety != null && x.anxiety >= 60 && x.misc != null && x.misc >= 50)
      msgs.push("<b>" + CTXLAB[c] + "</b> 맥락에서 불안↑ 그리고 오개념↑ — 이 맥락을 <b>시각·조작 활동으로 먼저</b> 다루길 권합니다.");
    else if (x.interest != null && x.interest >= 70 && x.anxiety != null && x.anxiety <= 30)
      msgs.push("<b>" + CTXLAB[c] + "</b> 맥락은 흥미↑·불안↓ — 강점 통로. 어려운 개념을 이 맥락으로 진입시키면 효과적입니다.");
  });
  if (!msgs.length) msgs.push("맥락 간 큰 불균형은 두드러지지 않습니다.");
  return msgs.map(function (m) { return '<li style="margin:5px 0;font-size:13px;color:var(--ink-2)">' + m + '</li>'; }).join("");
}

/* ── 섹션 래퍼 ── */
function sec(ix, title, sub, body, aud) {
  return '<section class="card' + (aud ? " " + aud : "") + '"><div class="bh"><span class="ix">' + ix + '</span><h3>' + title + '</h3>' + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</div>' + body + '</section>';
}

/* ── 종합 프로필 육각형(6차원) ── */
var HEX = [
  { lab: "흥미",     get: function (r) { return r.interest.stage / 4 * 100; } },
  { lab: "자신감",   get: function (r) { return r.efficacy.stage / 4 * 100; } },
  { lab: "가치",     get: function (r) { return r.value.internalize; } },
  { lab: "개념직관", get: function (r) { return r.concept; } },
  { lab: "학습깊이", get: function (r) { return r.approach && r.approach.norm ? r.approach.norm.deep : null; } },
  { lab: "정서안정", get: function (r) { var v = [r.anxiety.general]; if (r.anxiety.ctx) for (var k in r.anxiety.ctx) v.push(r.anxiety.ctx[k]); v = v.filter(function (x) { return x != null; }); if (!v.length) return null; var s = v.reduce(function (a, b) { return a + b; }, 0); return Math.round(100 - s / v.length); } }
];
function hexRadarSVG(r) {
  var cx = 132, cy = 128, maxR = 90;
  function pt(val, idx) { var ang = (-90 + idx * 60) * Math.PI / 180, rr = (val || 0) / 100 * maxR; return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)]; }
  var grid = "";
  [25, 50, 75, 100].forEach(function (lv) { var pp = HEX.map(function (_, i) { return pt(lv, i).join(","); }).join(" "); grid += '<polygon points="' + pp + '" fill="none" stroke="var(--line-2)" stroke-width="1" stroke-dasharray="' + (lv === 100 ? "0" : "2 3") + '"/>'; });
  var spokes = HEX.map(function (_, i) { var e = pt(100, i); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0] + '" y2="' + e[1] + '" stroke="var(--line-2)" stroke-width="1"/>'; }).join("");
  var vals = HEX.map(function (h) { return h.get(r); });
  var poly = '<polygon points="' + HEX.map(function (_, i) { return pt(vals[i], i).join(","); }).join(" ") + '" fill="url(#hgGrad)" stroke="#0A5C53" stroke-width="2.5" stroke-linejoin="round" filter="url(#hgGlow)" class="poly-in" style="transform-box:fill-box;transform-origin:center"/>';
  var dots = HEX.map(function (_, i) { var pq = pt(vals[i], i); return '<circle cx="' + pq[0] + '" cy="' + pq[1] + '" r="3.4" fill="#0A5C53" stroke="#FBF8F1" stroke-width="1.4"/>'; }).join("");
  var labels = HEX.map(function (h, i) { var e = pt(115, i), anc = (i === 0 || i === 3) ? "middle" : (i < 3 ? "start" : "end"); return '<text x="' + e[0] + '" y="' + (e[1] + 4) + '" text-anchor="' + anc + '" font-size="12.5" font-weight="600" fill="var(--ink-2)">' + h.lab + '</text>'; }).join("");
  return '<svg viewBox="-16 0 296 244" width="100%" style="max-width:340px;display:block;margin:0 auto"><defs><radialGradient id="hgGrad" cx="50%" cy="44%" r="64%"><stop offset="0%" stop-color="#0E7A6E" stop-opacity="0.34"/><stop offset="100%" stop-color="#0A5C53" stop-opacity="0.1"/></radialGradient><filter id="hgGlow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0E7A6E" flood-opacity="0.4"/></filter></defs>' + grid + spokes + poly + dots + labels + '</svg>';
}

/* ── 맥락 막대(겹친 레이더 대체) ── */
function ctxBar(label, val, color) {
  var w = val == null ? 0 : val;
  return '<div style="display:flex;align-items:center;gap:6px;margin:2px 0"><span style="width:42px;font-size:11px;color:var(--muted)">' + label + '</span><div style="flex:1;height:7px;background:var(--line);border-radius:99px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(28,24,18,.08)"><div style="width:' + w + '%;height:100%;border-radius:99px;background:linear-gradient(180deg,rgba(255,255,255,.25),rgba(0,0,0,.08)),' + color + '"></div></div><span style="width:30px;text-align:right;font-size:11px;color:var(--muted)">' + f(val) + '</span></div>';
}
function contextBarsHTML(r) {
  var cm = r.ctxmap || {};
  var rows = CTX_ORDER.map(function (c) {
    var x = cm[c] || {};
    return '<div style="padding:9px 0;border-bottom:1px solid var(--line)"><div style="font-weight:600;font-size:13px;margin-bottom:3px;color:var(--ink)">' + CTXLAB[c] + '</div>' +
      ctxBar("흥미", x.interest, "var(--teal)") + ctxBar("불안", x.anxiety, "var(--rose)") + ctxBar("오개념", x.misc, "var(--amber)") + '</div>';
  }).join("");
  return '<div style="text-align:center;margin-bottom:8px">' + legendDot("var(--teal)", "흥미 (높을수록 좋음)") + legendDot("var(--rose)", "불안 (낮을수록 좋음)") + legendDot("var(--amber)", "오개념 (낮을수록 좋음)") + '</div>' +
    rows +
    '<ul style="margin:12px 0 0;padding-left:18px">' + crossReadHTML(r) + '</ul>' +
    '<p style="font-size:12px;color:var(--muted);margin-top:6px">※ 실험 영역은 흥미·불안만 묻기 때문에 오개념 표시가 없습니다.</p>';
}


/* ── 유형 정체성 카드 ── */
function typeIdentityHTML(r) {
  var code = r.type.code, T = TYPES[code] || {}, I = TYPE_INFO[code] || {};
  function li(arr, color) { return (arr || []).map(function (x) { return '<li style="margin:3px 0;font-size:13px;color:var(--ink-2)"><span style="color:' + color + '">\u25B8</span> ' + esc(x) + '</li>'; }).join(""); }
  return '<div style="text-align:center;margin-bottom:6px"><div class="tcode">' + esc(code) + '</div>' +
    '<div style="font-family:var(--serif);font-size:20px;color:var(--teal-d);margin-top:2px">' + esc(T.name || "") + '</div>' +
    '<div style="font-size:13px;color:var(--muted);margin-top:4px">' + esc(I.tag || "") + '</div></div>' +
    '<div style="text-align:center;margin-top:7px"><span style="font-size:11px;padding:2px 11px;border-radius:999px;color:#fff;background:' + (typeStability(r).conf==="뚜렷함"?"var(--emerald)":typeStability(r).conf==="대체로 뚜렷"?"var(--teal)":typeStability(r).conf==="두 성향 혼합"?"var(--amber)":"var(--rose)") + '">유형 뚜렷함 · ' + typeStability(r).conf + '</span></div>' +
    (typeStability(r).weak.length ? '<p style="font-size:12px;color:var(--muted);text-align:center;margin:6px 0 0">' + typeStability(r).weak.map(function(w){return esc(w.nm);}).join("·") + '에서 양쪽 성향이 박빙 — 상황에 따라 <b>' + typeStability(r).weak.map(function(w){return esc(w.pair || w.nm);}).join(", ") + '</b> 사이를 오갑니다</p>' : '') +
    '<p style="font-size:13px;color:var(--ink-2);margin:12px 0;line-height:1.6">' + esc(I.desc || "") + '</p>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">' +
    '<div><div style="font-size:12px;font-weight:600;color:var(--emerald);margin-bottom:4px">강점</div><ul style="margin:0;padding-left:14px">' + li(I.str, "var(--emerald)") + '</ul></div>' +
    '<div><div style="font-size:12px;font-weight:600;color:var(--amber);margin-bottom:4px">보완점</div><ul style="margin:0;padding-left:14px">' + li(I.cau, "var(--amber)") + '</ul></div></div><p style="font-size:11px;color:var(--muted);margin:6px 0 0">\u203b 보완점은 결함이 아니라 \u2018더 좋아질 여지\u2019입니다.</p>' +
    (I.rx ? '<div style="margin-top:12px;padding:11px 13px;background:rgba(14,122,110,.07);border-left:3px solid var(--teal);border-radius:0 8px 8px 0;font-size:13px;color:var(--ink-2)"><b style="color:var(--teal-d)">지도 제안 </b>' + esc(I.rx) + '</div>' : '');
}

/* ── 축 논리 해설 ── */
function axisLogicHTML(r) {
  var ax = r.type.axes || {}, AXP = { lens: ["G", "S"], think: ["J", "B"], drive: ["T", "R"], approach: ["D", "M"] }, AXN = { lens: "관찰 관점", think: "사고 방식", drive: "학습 동력", approach: "학습 방식" };
  var doms = [];
  var rows = ["lens", "think", "drive", "approach"].map(function (k) {
    var po = AXP[k], a = (ax[k] && ax[k][po[0]]) || 0, b = (ax[k] && ax[k][po[1]]) || 0, tot = a + b || 5;
    var dom = a >= b ? po[0] : po[1], n = Math.max(a, b); doms.push(dom);
    var mg = Math.abs(a - b); var strength = mg >= 5 ? "뚜렷" : mg >= 3 ? "우세" : "박빙";
    return '<div style="margin:7px 0"><div style="font-size:13px"><b>' + AXN[k] + '</b> · ' + (POLEFULL[dom] || dom) + ' <span style="color:var(--muted)">(' + n + '/' + tot + ' · ' + strength + ')</span></div><div style="font-size:12px;color:var(--muted)">' + (POLEMEAN[dom] || "") + '</div></div>';
  }).join("");
  var seen = {}, combos = [];
  for (var i = 0; i < doms.length; i++) for (var j = i + 1; j < doms.length; j++) {
    var c = COMBOS[doms[i] + doms[j]] || COMBOS[doms[j] + doms[i]];
    if (c && !seen[c]) { seen[c] = 1; combos.push(c); }
  }
  var comboHTML = combos.length ? '<div style="margin-top:10px;font-size:12px;font-weight:600;color:var(--cobalt)">조합 해석</div><ul style="margin:4px 0 0;padding-left:16px">' + combos.slice(0, 3).map(function (c) { return '<li style="font-size:13px;color:var(--ink-2);margin:2px 0">' + esc(c) + '</li>'; }).join("") + '</ul>' : '';
  return rows + comboHTML;
}

/* ── G9b: 진학 트랙 적합도 + 다년 로드맵 (영재원 제외) ── */
function josa(w, a, b) { if (!w) return a; var c = w.charCodeAt(w.length - 1); if (c < 0xAC00 || c > 0xD7A3) return a; return ((c - 0xAC00) % 28) ? a : b; }
var TRACKS_V2 = [
  { key: "올림피아드", name: "중등 올림피아드 (중학생 화학대회·물리대회)", tag: "화학·물리를 아우르는 중등 경시 무대 · 개념 깊이·도전·분석·추상 사고", w: { concept: .2, deep: .2, challenge: .2, analysis: .2, depthLens: .12, interest: .08 }, pen: 2, boost: 4, pri: 5 },
  { key: "과학고", name: "과학고", tag: "단단한 개념과 꾸준한 심층 학습", w: { concept: .3, deep: .25, efficacy: .2, analysis: .15, calm: .1 }, pen: 3, boost: 0, pri: 3 },
  { key: "영재고", name: "영재고", tag: "깊이·분석·도전과 강한 개념을 모두 요구하는 최상위", w: { deep: .28, concept: .22, challenge: .18, analysis: .17, efficacy: .15 }, pen: 4, boost: 0, pri: 2 },
  { key: "의대", name: "의대 (장기 트랙)", tag: "긴 호흡의 숙달·정확성·정서 안정", w: { mastery: .25, metacog: .2, calm: .2, value: .15, concept: .1, lowSurf: .1 }, pen: 2, boost: 0, pri: 1 },
  { key: "전국자사고", name: "전국 자사고", tag: "균형 잡힌 성실함과 가치 인식", w: { value: .25, mastery: .2, concept: .2, calm: .15, metacog: .1, efficacy: .1 }, pen: 1, boost: 0, pri: 1 }
];
var SIG_LAB = { interest: "흥미", efficacy: "자신감", value: "가치 인식", calm: "정서 안정", concept: "개념", deep: "심층 학습", metacog: "메타인지", lowSurf: "표층 탈피", challenge: "도전", analysis: "분석", depthLens: "원리 지향", inquiry: "탐구", mastery: "숙달" };
var SIGNEXT = { interest: "흥미를 여는 현상·실험 비중을 늘려 몰입 시간을 확보", efficacy: "작은 성공 경험을 쌓아 자신감 끌어올리기", value: "배우는 이유를 스스로 말로 정리하는 습관", calm: "쉬운 문제로 긴장을 낮춘 뒤 난도 올리기", concept: "핵심 개념을 반례·실험으로 다시 세우기", deep: "답보다 ‘왜’를 한 줄 더 적는 심층 습관", metacog: "풀이 후 ‘무엇을 어떻게 알았나’ 점검하기", lowSurf: "암기 의존을 줄이고 원리로 재구성", challenge: "한 단계 위 문제에 정기적으로 도전", analysis: "왜 이 답인지 근거를 단계별로 설명하게 하기", depthLens: "입자·원리 수준으로 내려가 설명하기", inquiry: "새 주제를 직접 탐구하는 미니 프로젝트", mastery: "반복으로 정확도와 숙달 굳히기" };
function sigVals2(r) {
  var ax = r.type.axes || {}; var _AP = { lens: ["G", "S"], think: ["J", "B"], drive: ["T", "R"], approach: ["D", "M"] }; function ps(a, p) { var o = ax[a] || {}, po = _AP[a], tot = ((o[po[0]] || 0) + (o[po[1]] || 0)) || 1; return Math.round(((o[p]) || 0) / tot * 100); }
  var t = r.approach.tally || {}, tot = 0, k; for (k in t) tot += t[k]; tot = tot || 1;
  var anx = r.anxiety || {}, c = anx.ctx || {}, vals = [anx.general, c.phenom, c.symbol, c.quant, c.lab].filter(function (x) { return x != null; });
  var anxAll = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : 50;
  var surf = Math.round((t.surface || 0) / tot * 100);
  return { interest: Math.round((r.interest.stage || 0) / 4 * 100), efficacy: Math.round((r.efficacy.stage || 0) / 4 * 100), value: r.value.internalize || 0, calm: Math.round(100 - anxAll), concept: r.concept || 0, deep: Math.round((t.deep || 0) / tot * 100), metacog: Math.round((r.metacog.stage || 0) / 4 * 100), lowSurf: 100 - surf, challenge: ps("approach", "D"), analysis: ps("think", "B"), depthLens: ps("lens", "S"), inquiry: ps("drive", "T"), mastery: ps("approach", "M") };
}
function fitBand(f){ return f>=90?["탁월","var(--emerald)"]:f>=80?["매우 적합","var(--emerald)"]:f>=70?["적합","var(--teal)"]:f>=60?["적합 근접","var(--teal)"]:f>=50?["발전 중","var(--cobalt)"]:f>=40?["기초 다지는 중","var(--cobalt)"]:f>=30?["토대 형성 중","var(--amber)"]:f>=20?["출발 단계","var(--amber)"]:f>=10?["준비 단계","var(--grey)"]:["탐색 단계","var(--grey)"]; }
function trackScores2(r) {
  var S = sigVals2(r), ent = (r.entrenched || []).length;
  var _o = TRACKS_V2.map(function (t) {
    var fit = 0, sw = 0, k; for (k in t.w) { fit += t.w[k] * (S[k] || 0); sw += t.w[k]; }
    fit = Math.round(Math.max(0, Math.min(100, fit / sw - ent * t.pen + (t.boost || 0))));
    var strong = null, gap = null, k2; for (k2 in t.w) { var ss = t.w[k2] * (S[k2] || 0); if (strong === null || ss > strong.s) strong = { k: k2, s: ss }; var gs = t.w[k2] * (75 - (S[k2] || 0)); if (gap === null || gs > gap.s) gap = { k: k2, s: gs }; }
    var dem = null, k3; for (k3 in t.w) { if (dem === null || t.w[k3] > dem.w) dem = { k: k3, w: t.w[k3] }; }
    var L = fitBand(fit);
    return { key: t.key, name: t.name, tag: t.tag, fit: fit, pri: t.pri || 0, level: L[0], color: L[1], strong: SIG_LAB[strong.k], gapKey: gap.k, gapLab: gap.s > 0 ? SIG_LAB[gap.k] : null, demandKey: dem.k, demandLab: SIG_LAB[dem.k], demandVal: S[dem.k] || 0 };
  }); return _o.sort(function (a, b) { return (b.fit - a.fit) || ((b.pri || 0) - (a.pri || 0)); });
}
var TRACK_WHAT = {
  "올림피아드": "중등 화학·물리 경시·탐구 대회를 아우르는 트랙입니다. 개념의 깊이, 까다로운 문제에 대한 도전, 근거를 따지는 분석력, 그리고 추상적 원리를 다루는 사고를 함께 봅니다. 이 또래가 도전하는 대표적 무대입니다. (물리 영역 적합도는 화학 진단에서 드러난 ‘사고 방식’으로 추정한 참고값이라, 실제 물리 흥미·경험과 함께 보세요.)",
  "과학고": "과학 중점 고교입니다. 단단한 개념과 꾸준한 심층 학습, 안정적인 자신감을 중시합니다.",
  "영재고": "최상위 영재 고교입니다. 깊이·분석·도전·강한 개념을 모두 높은 수준으로 요구합니다. 한 영역만으로는 부족하고 전 영역이 함께 높아야 합니다.",
  "의대": "긴 호흡의 장기 트랙입니다. 반복을 통한 정확성과 숙달, 정서 안정, 스스로 점검하는 메타인지가 핵심입니다.",
  "전국자사고": "전국 단위 자율형 사립고입니다. 균형 잡힌 성실함과 ‘왜 배우는가’에 대한 인식을 봅니다."
};
var TRACK_BENEFIT = {
  "올림피아드": "여기서 기르는 개념 깊이·도전·분석력은 과학고·영재고 면접과 심화 내신, 나아가 이과 전 과목의 사고력으로 그대로 이어집니다. 가장 확장성이 큰 토대라 진로가 바뀌어도 손해가 없습니다.",
  "과학고": "탄탄한 개념과 심층 학습 습관은 고교 내신·R&E(연구 활동)·대학 이공계 학습의 기본기가 됩니다.",
  "영재고": "전 영역이 고르게 높은 최상위 역량은 영재고뿐 아니라 어떤 최상위 트랙으로도 문을 열어 주는 만능 토대입니다.",
  "의대": "반복을 통한 정확성·숙달과 정서 안정은 방대한 분량을 오래 끌고 가는 의약학 계열 학습의 핵심 근력입니다.",
  "전국자사고": "균형 잡힌 성실함과 ‘왜 배우는가’에 대한 인식은 자기주도학습 전형과 고교 전 과목 내신에 두루 유리합니다."
};
function trackExplainHTML(t, r) {
  var what = TRACK_WHAT[t.key] || esc(t.tag);
  var benefit = TRACK_BENEFIT[t.key] || "";
  var meet = t.demandVal >= 70 ? "이미 잘 갖춰져 있습니다" : t.demandVal >= 50 ? "어느 정도 갖춰져 있어, 조금 더 올리면 좋습니다" : "지금은 더 키워야 할 부분입니다";
  var why = '이 길이 가장 크게 보는 건 <b>' + esc(t.demandLab) + '</b>인데, 이 학생은 그 점이 ' + meet + '.' + ((t.gapLab && t.gapKey !== t.demandKey) ? (' 여기에 <b>' + esc(t.gapLab) + '</b>' + josa(t.gapLab, "을", "를") + ' 보완하면 적합도가 더 오릅니다.') : '');
  var actKey = t.gapLab ? t.gapKey : t.demandKey;
  var act = SIGNEXT[actKey] || null;
  var block = function (lab, txt, col) { return '<div style="font-size:13px;color:var(--ink-2);line-height:1.72;margin-top:7px;padding-top:7px;border-top:1px dashed var(--line)"><b style="color:' + col + '">' + lab + ' </b>' + txt + '</div>'; };
  return '<div style="font-size:13px;color:var(--ink-2);line-height:1.72">' + what + '</div>'
    + (benefit ? block("이 길의 효용", benefit, "var(--teal-d)") : '')
    + block("지금 이 학생", why, "var(--cobalt)")
    + (act ? block("그래서, 지금 할 일", esc(act), "var(--amber)") : '');
}
function trackFitHTML(r) {
  var arr = trackScores2(r);
  var hasFit = arr[0] && arr[0].fit >= 70;
  var note = hasFit ? '' : '<div style="border:1px solid var(--line-2);background:var(--paper-2);border-radius:11px;padding:11px 14px;margin:0 0 10px;font-size:12.5px;color:var(--ink-2);line-height:1.74"><b style="color:var(--cobalt)">‘적합’ 구간(70점 이상)을 향해 다져 가는 단계입니다.</b> 아직 어느 한 길이 뚜렷이 가깝다고 보기는 이른 단계입니다. 아래 순위는 합격 가능성이 아니라 지금 신호가 조금 더 닿아 있는 순서일 뿐이니, 목표가 무엇이든 그 바탕이 되는 기초 역량(개념·자신감·심층 습관)을 함께 키우면 점수는 자연스럽게 따라 올라갑니다.</div>';
  var rows = arr.map(function (t, i) {
    var isFirst = (i === 0);
    var top = isFirst && hasFit;
    var head = '<summary class="trk"><div style="display:flex;align-items:center;gap:8px"><span class="trk-cv" style="font-size:11px;color:var(--muted)">▸</span><b style="font-size:14px">' + esc(t.name) + '</b>' + (top ? '<span style="font-size:10.5px;background:var(--emerald);color:#fff;padding:1px 7px;border-radius:999px">우선</span>' : (isFirst ? '<span style="font-size:10.5px;background:var(--grey);color:#fff;padding:1px 7px;border-radius:999px">신호 1순위</span>' : '')) + '<span style="margin-left:auto;font-size:11px;background:' + t.color + ';color:#fff;padding:1px 9px;border-radius:999px;white-space:nowrap;flex:none">' + t.level + '</span><span style="font-family:var(--serif);font-size:18px;color:' + t.color + '">' + t.fit + '</span></div><div style="height:7px;background:var(--line);border-radius:99px;margin:8px 0 6px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(28,24,18,.08)"><i style="display:block;height:100%;width:' + t.fit + '%;border-radius:99px;background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(0,0,0,.08)),' + t.color + '"></i></div><div style="font-size:11px;color:var(--teal-d);font-weight:600">▾ 이름을 눌러 해설 보기</div></summary>';
    return '<details' + (isFirst ? ' open' : '') + ' style="border:1px solid var(--line);border-radius:11px;padding:12px 14px;margin:9px 0;background:' + (top ? 'rgba(46,125,91,.05)' : 'var(--paper-2)') + ';box-shadow:0 1px 2px rgba(28,24,18,.05),0 10px 26px -20px rgba(28,24,18,.4)">' + head + '<div style="margin-top:9px;padding-top:9px;border-top:1px solid var(--line)">' + trackExplainHTML(t, r) + '</div></details>';
  }).join("");
  return '<style>details>summary.trk{list-style:none;cursor:pointer;outline:none}details>summary.trk::-webkit-details-marker{display:none}details>summary.trk .trk-cv{display:inline-block;transition:transform .2s}details[open]>summary.trk .trk-cv{transform:rotate(90deg)}details[open]>summary.trk>div:last-child{display:none}details>summary.trk:hover{filter:brightness(.99)}</style><p style="font-size:13px;color:var(--muted);margin:0 0 6px"><b>점수가 아니라 지금 신호 기준의 방향</b>입니다. 트랙 이름을 누르면 해설이 바로 펼쳐집니다. 올림피아드의 물리 적합도는 화학 진단으로 추정한 참고값입니다.</p>' + note + rows + '<p style="font-size:11px;color:var(--muted);font-style:italic;margin:8px 0 0">가중치는 전문가 사전값으로, 누적 데이터로 보정될 예정입니다.</p>';
}

function roadmapHTML2(r) {
  var _ra = trackScores2(r), top = _ra[0], _hasFit = top && top.fit >= 70, tn = _hasFit ? (top.name || "").split("(")[0].trim().replace("전국 ", "") : "목표 진로";
  var S = sigVals2(r);
  var entrySig = ["deep", "interest", "efficacy", "analysis", "challenge", "inquiry", "metacog", "mastery"].reduce(function (b, k) { return (S[k] > (S[b] == null ? -1 : S[b])) ? k : b; }, "interest");
  var att = [["흥미", S.interest], ["자신감", S.efficacy], ["정서 안정", S.calm], ["가치 인식", S.value]].sort(function (a, b) { return a[1] - b[1]; })[0];
  var conceptLine = (r.concept < 60 || (r.intu && Object.keys(r.intu).some(function (k) { return /교정|흔들/.test(r.intu[k]); }))) ? '개념 직관에 흔들리는 부분을 실험·반례로 먼저 바로잡기' : '개념 직관이 양호 — 강점 심화로 바로 진입';
  var ord = r.approach.order || [];
  var apprLine = ord[0] === "surface" ? '암기·표층 의존을 줄이고 원리로 재구성하는 연습' : (ord.indexOf("metacog") > 2 ? '풀이 후 점검(메타인지) 루틴 자리잡기' : '심층 질문 한 줄을 매 문제에 덧붙이기');
  var P = [
    { t: "지금", g: "토대 점검 · 강점으로 출발", it: [conceptLine, esc(SIG_LAB[entrySig]) + josa(SIG_LAB[entrySig], "을", "를") + ' 학습의 입구로 삼아 몰입 유지', att[1] < 45 ? (esc(att[0]) + josa(att[0], "이", "가") + ' 낮음 — 작은 성공부터 쌓기') : '주 단위 점검 루틴 자리잡기'] },
    { t: "3개월", g: "학습 방식 전환 · 습관화", it: [apprLine, '오개념 점검 리스트를 만들어 매주 1개씩 확인', '쉬운 문제로 정확도 → 한 단계 위로 확장'] },
    { t: "6개월", g: esc(tn) + ' 방향 역량 키우기', it: [esc(SIGNEXT[top.gapKey] || '보완 신호를 집중 훈련'), (_hasFit ? (esc(tn) + ' 유형의 문제·활동에 정기적으로 노출') : '관심 분야(대회·심화)의 문제·활동에 정기적으로 노출'), '한 주제를 끝까지 파고드는 미니 탐구 월 1회'] },
    { t: "1년", g: esc(tn) + josa(tn, "으로", "로") + ' 가는 길 다지기', it: ['누적 복습으로 개념 인출을 자동화', '모의 평가로 실전 감각·시간 관리 점검', '강점·보완 신호를 재진단해 경로 재조정'] }
  ];
  var rows = P.map(function (ph, i) {
    return '<div style="display:flex;gap:11px"><div style="display:flex;flex-direction:column;align-items:center"><div style="width:11px;height:11px;border-radius:50%;background:' + (i === 0 ? 'var(--teal)' : 'var(--line-2)') + ';margin-top:5px;flex:none' + (i === 0 ? ';box-shadow:0 0 0 3px rgba(14,122,110,.18)' : '') + '"></div>' + (i < P.length - 1 ? '<div style="width:2px;flex:1;background:var(--line)"></div>' : '') + '</div><div style="padding-bottom:14px"><div style="font-family:var(--serif);font-size:14px"><b>' + ph.t + '</b> <span style="color:var(--muted);font-size:12px">' + ph.g + '</span></div><ul style="margin:5px 0 0;padding-left:16px">' + ph.it.map(function (x) { return '<li style="font-size:13px;color:var(--ink-2);margin:2px 0">' + x + '</li>'; }).join("") + '</ul></div></div>';
  }).join("");
  return '<p style="font-size:13px;color:var(--muted);margin:0 0 8px">한 번의 결과가 아니라 <b>' + esc(tn) + '</b> 방향으로 가는 단계별 설계입니다. 지금 강점을 입구로, 약한 신호는 순서대로 보완합니다.</p>' + rows;
}


/* CLUSTERS (v1 13종 이식) */
var CLUSTERS = {
dissolve:{nm:"용해 — 녹으면 사라진다?",key:"녹아도 입자는 그대로 — 보이지 않을 뿐 사라지지 않는다.",why:"설탕이 물에 녹아 눈에서 사라지면 아이들은 자연스럽게 '없어졌다'고 느낍니다. 보이지 않는 것은 존재하지 않는다는 감각이 그만큼 강하기 때문입니다.",corr:"녹는다는 건 설탕 알갱이가 물 알갱이 사이사이로 골고루 흩어져 들어간다는 뜻입니다. 너무 작아 보이지 않을 뿐 알갱이는 그대로 남아 있어서, 물과 설탕을 합친 전체 무게는 변하지 않습니다.",cls:"용해 전후 무게를 함께 저울로 재 눈금이 그대로임을 확인시키고, 물을 증발시켜 설탕(소금)을 도로 꺼내 보입니다. '안 보이면 사라진 걸까, 흩어진 걸까?'라고 되물어 직관을 흔들어 줍니다."},
"state-mass":{nm:"상태 변화와 질량 — 얼면 무거워질까?",key:"모습이 바뀌어도 물질의 양은 그대로다.",why:"고체는 단단하고 '꽉 차' 보이는 반면 액체·기체는 묽고 가벼워 보여서, 상태가 바뀌면 무게도 변한다고 느끼기 쉽습니다.",corr:"얼음·물·수증기는 겉모습만 다를 뿐 같은 물질이 모인 모습입니다. 알갱이의 개수가 변하지 않으므로, 밖으로 새지 않게 막아 두면 얼리거나 녹여도 무게는 그대로입니다.",cls:"마개를 막은 병 안에서 얼음을 녹이며 저울 눈금이 변하지 않음을 보여 줍니다. '무엇이 변했고 무엇이 그대로일까?'를 모습과 양으로 나눠 말하게 합니다."},
combustion:{nm:"연소 — 타면 줄어든다?",key:"타도 사라진 게 아니라, 보이지 않는 기체로 빠져나간 것.",why:"다 타고 나면 작은 재만 남으니 '물질이 줄어 사라졌다'고 보는 게 자연스럽습니다. 빠져나간 기체는 눈에 보이지 않기 때문입니다.",corr:"탈 때 물질은 공기와 결합하며 눈에 보이지 않는 기체로 흩어집니다. 빠져나간 기체까지 모두 합치면 양은 줄지 않고, 공기와 결합하는 경우에는 오히려 늘어나기도 합니다.",cls:"철 수세미를 태우면 무게가 오히려 늘어나는 반례를 직접 보여 줍니다(우리 진단의 대표 문항입니다). '눈에 안 보이는 것도 무게가 있을까?'로 토론을 엽니다."},
"atom-reaction":{nm:"변화 속 알갱이 보존 — 변하면 알갱이도 사라질까?",key:"변해도 알갱이는 사라지지 않고, 짝만 다시 짜인다.",why:"전혀 다른 새 물질이 생기면 아이들은 '알갱이도 새로 생기거나 없어진다'고 직관적으로 느낍니다.",corr:"변화가 일어나도 알갱이 자체는 새로 생기거나 사라지지 않습니다. 다만 알갱이끼리의 짝(연결)만 풀렸다 다시 맺힐 뿐이라, 전체 알갱이 수와 양은 그대로 보존됩니다.",cls:"레고 블록을 부쉈다 같은 조각으로 다른 모양을 만드는 비유로, '모양은 달라져도 조각 수는 똑같다'를 손으로 확인시킵니다."},
"particle-property":{nm:"알갱이의 성질 — 알갱이 하나도 그 물질일까?",key:"색·단단함은 알갱이가 아주 많이 모였을 때 나타나는 성질이다.",why:"구리는 붉고 반짝이니, 구리 알갱이 하나하나도 붉고 반짝일 거라고 생각하기 쉽습니다.",corr:"색, 단단함, 끓는점 같은 성질은 알갱이가 엄청나게 많이 모여 함께 행동할 때 비로소 나타납니다. 그래서 알갱이 하나에는 그런 성질이 없습니다.",cls:"관중석 파도타기처럼 한 사람은 못 만들지만 수천 명이 모이면 생기는 현상에 빗대어, 성질이 '모임'에서 나온다는 점을 잡아 줍니다."},
"particle-space":{nm:"알갱이와 공간 — 누르면 알갱이가 찌그러질까?",key:"압축되는 건 알갱이가 아니라 알갱이 사이의 빈 공간.",why:"공기를 누르면 부피가 확 줄어드니 알갱이 자체가 찌그러지거나 작아진다고 보기 쉽습니다.",corr:"알갱이의 크기와 개수는 변하지 않습니다. 줄어드는 것은 알갱이와 알갱이 사이에 비어 있던 공간일 뿐이라, 누르던 힘을 풀면 다시 원래 부피로 돌아옵니다.",cls:"주사기 끝을 막고 공기를 눌러 보게 하며, '무엇이 줄었는지'를 알갱이와 사이 공간으로 나눠 말하게 합니다."},
"particle-between":{nm:"알갱이 사이 — 그 사이엔 뭐가 있을까?",key:"알갱이 사이는 아무것도 없는 빈 공간이다.",why:"사이가 비어 있다는 말이 어색해서, 그 사이를 공기나 더 작은 무언가가 채우고 있다고 생각하기 쉽습니다.",corr:"알갱이와 알갱이 사이에는 또 다른 물질이 들어 있는 것이 아니라, 정말로 아무것도 없는 빈 공간입니다. 이 빈 공간이 있기에 물질을 누르거나 데우면 부피가 달라질 수 있습니다.",cls:"모형으로 입자 사이가 비어 있음을 보이고, '그 사이엔 뭐가 있을까?'라는 질문으로 진공의 감각을 미리 살짝 심어 줍니다."},
"particle-thermal":{nm:"가열과 알갱이 — 뜨거우면 알갱이가 커질까?",key:"데우면 알갱이가 커지는 게 아니라, 더 활발히 움직여 간격이 벌어진다.",why:"가열하면 물체가 팽창하는 것을 보고 알갱이 자체가 커진다고 오해하기 쉽습니다.",corr:"온도가 올라가면 알갱이는 더 빠르고 활발하게 움직입니다. 그 결과 알갱이끼리의 간격이 벌어져 전체 부피가 커지는 것이지, 알갱이 하나의 크기가 커지는 것은 아닙니다.",cls:"좁은 공간에서 천천히 또는 빠르게 움직이는 사람들에 빗대어, '커진 건 몸집이 아니라 움직임과 간격'임을 잡아 줍니다."},
boiling:{nm:"끓음의 기포 — 거품의 정체는?",key:"끓을 때 올라오는 거품의 정체는 기체로 변한 물(수증기).",why:"물속에서 거품이 올라오니 물에 녹아 있던 공기나 산소·수소가 나온다고 보는 경우가 많습니다.",corr:"끓는 물에서 올라오는 기포는 밖에서 들어온 공기가 아니라, 뜨거워진 물이 기체로 변한 수증기입니다. 즉 물이 모습만 바꿔 위로 올라가는 것입니다.",cls:"기포를 모아 찬 곳에서 식히면 다시 물방울이 맺히는 것을 보여 '수증기는 물의 기체 상태'임을 확인시킵니다."},
"phys-chem":{nm:"물리 변화 vs 화학 변화 — 새 물질이 생겼나?",key:"기준은 단 하나 — '새로운 물질이 생겼는가?'",why:"겉모습과 상태만 보고 판단해서, 녹슬기나 갈변처럼 새 물질이 생기는 변화도 단순한 모양 변화로 보기 쉽습니다.",corr:"얼거나 녹는 것처럼 물질은 그대로이고 모습만 변하면 물리 변화입니다. 반대로 녹슬기·탐·갈변처럼 성질이 다른 새 물질이 생기면 화학 변화입니다. 판단 기준은 '새 물질이 생겼는가' 하나면 충분합니다.",cls:"여러 사례 카드를 '새 물질이 생겼나?'라는 한 가지 질문으로 두 더미로 분류하는 활동을 반복합니다."},
"gas-mass":{nm:"기체의 질량 — 공기도 무게가 있을까?",key:"눈에 안 보이는 기체도 분명히 무게가 있다.",why:"공기는 비어 있고 잡히지 않아 무게가 없다고 느끼기 쉽습니다.",corr:"공기 같은 기체도 알갱이로 이루어져 있어 아주 작지만 분명한 무게를 가집니다. 그래서 통에 공기를 압축해 더 넣으면 그만큼 무거워집니다.",cls:"압축 공기를 넣은 통과 빈 통을 정밀 저울로 비교해 눈금 차이를 보여 주며 '기체도 물질'임을 확인시킵니다."},
"melt-dissolve":{nm:"'녹다'의 두 얼굴 — 융해 vs 용해",key:"한국어 '녹다'는 두 현상 — 열로 녹는 융해, 물에 퍼지는 용해.",why:"한국어 '녹다'가 열을 받아 액체가 됨과 물에 퍼져 사라짐을 동시에 가리켜, 둘을 같은 현상으로 뭉뚱그리기 쉽습니다.",corr:"초콜릿이 녹는 것은 열을 받아 모습이 바뀌는 상태 변화(융해)이고, 소금이 물에 녹는 것은 알갱이가 물 사이로 흩어지는 용해입니다. 필요한 것이 '열'인지 '물'인지가 둘을 가르는 핵심입니다.",cls:"'얼음 녹음'과 '설탕 녹음'을 나란히 두고 '열이 필요한가, 물이 필요한가?'로 갈라 분류하게 합니다."},
evaporation:{nm:"증발 — 마르면 없어진다?",key:"마른 물은 사라진 게 아니라 수증기로 흩어진 것.",why:"젖은 것이 마르면 물이 눈앞에서 사라지니 '없어졌다'고 느낍니다.",corr:"물 표면의 알갱이가 하나둘 공기 중으로 흩어져 수증기가 된 것입니다. 보이지 않게 퍼졌을 뿐, 물 알갱이 자체가 사라진 것은 아닙니다.",cls:"투명 컵에 랩을 씌워 두고 물이 줄면서 랩 안쪽에 물방울이 맺히는 과정을 관찰하게 해 '어디로 갔는지'를 추적하게 합니다."}
};
/* ── G9c: 오개념 상세 + 상담 노트 + 한 장 요약 ── */
function topEntrenched(r) { return (r.entrenched || []).slice(0, 4); }
function strongSigLabel(r) { var S = sigVals2(r), keys = ["deep", "interest", "efficacy", "analysis", "challenge", "inquiry", "metacog", "mastery", "concept"]; var b = keys.reduce(function (a, k) { return (S[k] > (S[a] == null ? -1 : S[a])) ? k : a; }, "interest"); return SIG_LAB[b]; }
function firstStepText(r) { var ent = topEntrenched(r); if (ent.length) return "\u2018" + ent[0].label + "\u2019 개념 교정"; var top = trackScores2(r)[0]; return (SIG_LAB[top.gapKey] || "핵심 신호") + " 보완"; }
function shortTrack(n) { return (n || "").split("(")[0].trim().replace("전국 ", ""); }
function misconceptionDetailHTML(r) {
  var ent = topEntrenched(r);
  if (!ent.length) {
    var soft = Object.keys(r.clusters || {}).filter(function (c) { return /교정|흔들/.test((r.clusters[c] || {}).band); }).slice(0, 2);
    if (!soft.length) return '<p style="font-size:13px;color:var(--emerald);margin:12px 0 0">큰 오개념 없이 개념 직관이 안정적입니다. 강점 심화로 바로 진입할 수 있습니다.</p>';
    ent = soft.map(function (c) { return { cluster: c, label: (CLUSTERS[c] || {}).nm || c }; });
  }
  return '<div style="margin-top:14px"><div style="font-size:12px;font-weight:600;color:var(--rose);margin-bottom:2px">먼저 바로잡을 오개념</div>' + ent.map(function (e) {
    var C = CLUSTERS[e.cluster] || {}; if (!C.nm) return "";
    var resp = "";
    if (e.pick && !e.correctPick) { resp = '「' + esc(e.pick) + '」 쪽이 맞다고 응답했습니다' + (e.conf >= 4 ? ' — 그것도 꽤 확신하며.' : '.'); }
    else if (e.correctPick && e.viaReason && e.reasonPick) { resp = '답 자체는 맞게 골랐지만, 그 <b>이유로</b> 「' + esc(e.reasonPick) + '」를 선택해 원리 이해가 어긋나 있습니다.'; }
    else if (e.pick) { resp = '「' + esc(e.pick) + '」 쪽으로 응답했습니다.'; }
    var respDiv = resp ? ('<div style="font-size:13px;color:var(--ink-2);margin-top:6px;background:rgba(178,58,107,.06);border-radius:7px;padding:7px 9px"><b style="color:var(--rose)">학생 응답 </b>' + resp + '</div>') : '';
    return '<div style="border:1px solid var(--line);border-left:3px solid var(--rose);border-radius:0 9px 9px 0;padding:11px 13px;margin:8px 0;background:var(--paper-2)">' +
      '<div style="font-family:var(--serif);font-size:14px;color:var(--ink)">' + esc(C.nm) + '</div>' +
      respDiv +
      '<div style="font-size:12px;color:var(--muted);margin-top:6px"><b style="color:var(--ink-2)">왜 이런 오개념이 생기나 </b>' + esc(C.why) + '</div>' +
      '<div style="font-size:13px;color:var(--ink-2);margin-top:5px"><b style="color:var(--emerald)">바른 개념 </b>' + esc(C.corr) + '</div>' +
      '<div style="font-size:13px;color:var(--ink-2);margin-top:5px"><b style="color:var(--teal-d)">이렇게 고쳐요 </b>' + esc(C.cls) + '</div></div>';
  }).join("") + '</div>';
}
function parentFAQHTML(r) {
  var arr = trackScores2(r), top = arr[0], T = TYPES[r.type.code] || {};
  var nm = r.name || "", ent = topEntrenched(r), S = sigVals2(r), hasFit = top && top.fit >= 70;
  var yj = null; arr.forEach(function (x) { if (x.key === "영재고") yj = x; }); var oly = null; arr.forEach(function (x) { if (x.key === "올림피아드") oly = x; }); var olyFit = oly ? oly.fit : 0;
  var yjMsg = yj ? (yj.fit >= 70 ? "영재고도 적합 구간에 들어, 충분히 도전권입니다" : yj.fit >= 50 ? "영재고는 적합 구간을 향해 가는 중이라, 깊이·도전 신호를 더 쌓으면 열립니다" : "영재고는 기초 개념과 자신감부터 다지는 편이 빠릅니다") : "";
  function qa(q, a) { return '<div style="border:1px solid var(--line);border-radius:11px;padding:12px 14px;margin:9px 0;background:var(--paper-2)"><div style="font-size:13px;font-weight:600;color:var(--cobalt)"><span style="opacity:.55">학부모 </span>' + esc(q) + '</div><div style="font-size:13px;color:var(--ink-2);line-height:1.74;margin-top:6px"><span style="color:var(--teal-d);font-weight:600">상담 </span>' + a + '</div></div>'; }
  var items = [];
  var _a1 = (nm ? esc(nm) + josa(nm, "은", "는") + " " : "지금 ") + "신호로 보면 <b>" + esc(T.name || r.type.code) + "</b> 유형입니다. ";
  if (hasFit) { _a1 += "가장 잘 맞는 방향은 <b>" + esc(shortTrack(top.name)) + "</b>(적합도 " + top.fit + "·" + top.level + ")입니다. 이 시기에 기르는 <b>개념 깊이·도전·분석</b>은 과학고·영재고·의대 어디로 가든 공통 토대가 됩니다. " + (yjMsg ? (esc(yjMsg) + ". ") : "") + (olyFit >= 70 ? "올림피아드 적합 신호도 좋아, 대회를 그 역량을 기르는 무대로 삼기에 잘 맞습니다. " : olyFit >= 45 ? "대회(올림피아드)는 그 역량을 기르는 한 길이며, 출전이 목표가 아니어도 준비 과정만으로 도움이 됩니다. " : "") + "한 학교로 못박기보다 여러 길을 함께 열어 두는 편이 이 시기엔 더 유리합니다."; }
  else { _a1 += "지금은 어느 진학이든 <b>‘적합’ 구간을 향해 다져 가는 단계</b>입니다. 적합도로는 <b>" + esc(shortTrack(top.name)) + "</b>" + josa(shortTrack(top.name), "이", "가") + " 신호가 조금 더 닿아 있지만(적합도 " + top.fit + "·" + top.level + "), 아직 ‘여기가 길이다’라고 할 만큼 또렷하진 않습니다. 그래서 지금은 한 학교를 정하기보다, 목표가 무엇이든 그 바탕이 되는 <b>기초 역량(개념·자신감·심층 습관)</b>을 함께 키우는 것이 우선입니다." + (olyFit >= 60 ? " 올림피아드 준비도 그 역량을 함께 끌어올리는 한 방법입니다." : " 이 기초가 바로 올림피아드로 가는 출발점이라, 여기서부터 다지면 그대로 대회 준비로 이어집니다."); }
  items.push(qa("우리 아이, 어떤 진학을 목표로 잡아야 할까요? 영재고를 노려야 하나요?", _a1));
  items.push(qa("적합도 점수가 생각보다 낮은데, 너무 늦은 걸까요?",
    "이 적합도는 등수나 성적표가 아니라 <b>지금 신호 기준의 방향</b>입니다. 이 시기는 성향과 개념이 한창 자라는 때라, 지금 숫자보다 ‘어디를 채우면 어디가 열리는가’가 훨씬 중요합니다. " + (hasFit ? "" : "지금은 전반적으로 ‘적합’ 구간을 향해 올라가는 중이라, 한 진학을 정해 두기보다 기초부터 차근차근 쌓는 시기입니다. 늦은 게 전혀 아니라, 지금이 토대를 다질 적기입니다. ") + (top.gapLab ? ("당장은 <b>" + esc(top.gapLab) + "</b>" + josa(top.gapLab, "을", "를") + " 보완하면 적합도가 함께 올라갑니다.") : "지금은 강점을 한 단계 위로 밀어 줄 시점입니다.")));
  var homeTip = ent.length ? ("우선 ‘" + esc(ent[0].label) + "’ 개념을 실험·반례로 한 번 바로잡아 주세요(아래 ‘개념 직관·오개념’ 칸에 방법이 정리돼 있습니다).") : ("개념 토대는 안정적이니, 문제를 풀고 나면 ‘왜 그렇게 되는지’ 한 줄 더 적게 하는 심층 습관을 붙여 주세요.");
  items.push(qa("집에서는 무엇을 도와주면 좋을까요?",
    homeTip + " 그리고 " + (S.efficacy < 45 ? "작은 성공 경험을 자주 만들어 ‘하면 된다’는 자신감을 먼저 채워 주세요" : S.interest < 45 ? "흥미가 켜지는 현상·실험부터 노출해 몰입 시간을 늘려 주세요" : "잘하고 있을 때 구체적으로 인정해 주는 것만으로도 큰 동력이 됩니다") + ".") );
  if (ent.length) { var C = CLUSTERS[ent[0].cluster] || {};
    items.push(qa("‘오개념’이 있다고 나오는데, 큰 문제인가요?",
      "전혀 드문 일이 아니라, 또래 대부분이 거치는 자연스러운 단계입니다. " + esc(C.why || "") + " 핵심은 혼내는 게 아니라 <b>한 번의 반례</b>로 직접 보게 하는 것입니다. " + esc(C.cls || "") + " 이렇게 한 번 바로잡으면 개념이 오히려 더 단단해집니다."));
  } else {
    items.push(qa("개념은 괜찮은 편인가요?",
      "네, 굳어진 오개념 없이 개념 직관이 안정적입니다. 지금은 기초를 지키면서 한 단계 위 개념·문제로 <b>심화</b>해 갈 시점입니다."));
  }
  items.push(qa("대회(올림피아드) 준비, 우리 아이한테 의미가 있을까요?",
    olyFit >= 70 ? "네, 적합 신호가 좋습니다. 대회 준비는 ‘개념 깊이 + 도전 + 분석’을 함께 키우는데, 이 셋은 과학고·영재고 평가의 핵심이자 의대 장기 트랙의 바탕이라, 잘 맞는 무대입니다." : "출전이 당장의 목표가 아니어도, 대회 준비에 담긴 ‘개념 깊이 + 도전 + 분석’은 올림피아드로 가는 길 그 자체입니다. 지금은 그 출발점을 다지는 단계이고, 여기서부터 한 걸음씩 쌓으면 그 과정이 곧 대회 준비가 됩니다."));
  return '<p style="font-size:13px;color:var(--muted);margin:0 0 8px">상담에서 학부모님이 가장 자주 여쭤보시는 질문과, 그에 대한 설명을 대화 그대로 옮겼습니다. 천천히 읽어 보시면 결과를 스스로 이해하시는 데 도움이 됩니다.</p>' + items.join("");
}

function snapshotHTML(r) {
  var top = trackScores2(r)[0], T = TYPES[r.type.code] || {};
  var cell = function (lab, val, col) { return '<div style="text-align:center;flex:1;min-width:60px"><div style="font-size:10.5px;color:rgba(255,255,255,.55);letter-spacing:.5px">' + lab + '</div><div style="font-family:var(--serif);font-size:16px;color:' + (col || '#fff') + ';margin-top:2px">' + val + '</div></div>'; };
  var stg = function (s) { return (s == null ? '\u2014' : (s === 0 ? '준비' : s + '단계')); };
  var vtag = (r.validity && r.validity.tag) || '\u2014';
  var vcol = vtag === '고신뢰' ? '#7FD8C8' : vtag === '주의' ? '#E5C07B' : '#E58A9E';
  return '<div class="snap" style="background:linear-gradient(135deg,#1C1812 0%,#2E2719 100%);color:#fff;border-radius:14px;padding:17px 19px;margin-bottom:18px">' +
    '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><div><div style="font-size:11px;opacity:.6;letter-spacing:1px">화학 두뇌 유형</div><div style="font-family:var(--serif);font-size:20px">' + esc(T.name || r.type.code) + ' <span style="font-size:13px;opacity:.55">' + esc(r.type.code) + '</span><div style="font-size:10.5px;opacity:.6;letter-spacing:.5px;margin-top:1px">유형 뚜렷함 ' + typeStability(r).conf + '</div></div></div>' +
    '<div class="snap-track" style="text-align:right"><div style="font-size:11px;opacity:.6">' + (top.fit >= 70 ? '추천 방향' : '지금 키울 힘') + '</div><div style="font-family:var(--serif);font-size:16px">' + (top.fit >= 70 ? (esc(shortTrack(top.name)) + ' <span style="font-size:12px;opacity:.7">' + top.fit + '\u00b7' + top.level + '</span>') : esc(snapGrowKey(r))) + '</div></div></div>' +
    '<div style="display:flex;gap:6px;margin-top:15px;padding-top:13px;border-top:1px solid rgba(255,255,255,.15)">' +
    cell("흥미", stg(r.interest.stage), '#7FD8C8') + cell("자신감", stg(r.efficacy.stage), '#7FD8C8') + cell("메타인지", stg(r.metacog.stage), '#7FD8C8') + cell("개념직관", (r.concept != null ? r.concept : '\u2014'), '#E5C07B') + cell("신뢰도", vtag, vcol) +
    '</div>' +
    '<div style="margin-top:13px;font-size:13px;background:rgba(255,255,255,.08);border-radius:8px;padding:9px 12px"><b style="color:#7FD8C8">다음 한 걸음 </b>' + esc(firstStepText(r)) + '</div></div>';
}

/* ── G10: 프로필별 맞춤 종합 해설 (API 없음 · 결정적 조립) ── */
var CTXN = { phenom: "현상", symbol: "기호·식", quant: "정량·계산", lab: "실험·관찰" };
function maxCtx(o) { var bk = null, bv = -1; for (var k in (o || {})) { if (o[k] > bv) { bv = o[k]; bk = k; } } return bk ? { k: bk, v: bv, nm: CTXN[bk] } : null; }
function pickv(seed, arr) { return arr[Math.abs(seed) % arr.length]; }
function poleState(o, hi, lo) { o = o || {}; var a = o[hi] || 0, b = o[lo] || 0, m = Math.abs(a - b); return { pole: a >= b ? hi : lo, n: Math.max(a, b), margin: m, band: m >= 5 ? "strong" : "mild" }; }
function narrativeHTML(r) {
  var code = r.type.code, T = TYPES[code] || {}, I = TYPE_INFO[code] || {}, ax = r.type.axes || {};
  var nm = r.name || "이 학생";
  var seed = nm.split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0) + (r.interest.stage || 0) * 5 + (r.efficacy.stage || 0) * 11 + (r.metacog.stage || 0) * 17 + (r.concept || 0) + ((r.approach && r.approach.lean) || 0);
  var P = function (off, arr) { return arr[Math.abs(seed + off) % arr.length]; };
  var lensS = poleState(ax.lens, "S", "G"), drvS = poleState(ax.drive, "T", "R"), thkS = poleState(ax.think, "B", "J"), appS = poleState(ax.approach, "D", "M");
  var LENS = { S: { strong: ["눈에 보이지 않는 입자와 원리의 세계를 먼저 떠올리고 거기서 눈에 보이는 변화를 풀어내는", "눈에 보이는 것 뒤에 숨은 메커니즘과 구조를 가장 먼저 궁금해하는", "보이지 않는 알갱이의 움직임을 머릿속에 그려 놓고 출발하는"], mild: ["원리 쪽에서 출발하되 눈에 보이는 결과도 함께 챙기는", "대체로 ‘왜 그런가’를 먼저 떠올리지만 눈에 보이는 결과에서도 단서를 얻는"] }, G: { strong: ["눈에 보이는 변화와 결과를 빠르게 포착하는 데서 출발하는", "색·소리·온도처럼 관찰되는 변화부터 또렷하게 잡아내는", "구체적인 실험 결과와 눈앞의 변화에서 학습을 시작하는"], mild: ["주로 눈에 보이는 변화에서 출발하되 원리에도 차츰 손을 뻗는", "눈에 보이는 변화를 먼저 잡고 ‘왜’로도 한 걸음씩 내려가는"] }, balanced: ["눈에 보이는 변화와 원리 사이를 오가며 둘 다 비슷한 비중으로 활용하는", "눈에 보이는 변화와 보이지 않는 원리를 함께 살피는"] };
  var DRV = { T: { strong: ["낯선 주제에도 겁 없이 뛰어들어 직접 부딪치며 배우는", "새 문제를 만나면 곧장 시도부터 해 보는", "미지의 영역으로 먼저 발을 내딛는 탐구욕 강한"], mild: ["익숙한 반복보다 새로운 시도 쪽으로 살짝 기우는"] }, R: { strong: ["배운 것을 차곡차곡 정리하고 다지며 안정적으로 쌓아 가는", "체계적으로 갈무리하고 반복하며 단단하게 누적하는", "익힌 것을 깔끔히 정리하면서 한 단계씩 올라가는"], mild: ["정리와 반복을 선호하되 가끔 새로운 시도도 곁들이는"] }, balanced: ["새로운 시도와 익숙한 정리 사이에서 균형을 잡는", "탐구와 정리를 상황에 따라 오가는"] };
  var THK = { B: { strong: ["근거를 따지고 논리로 차근차근 분석하며", "왜 그런지 이유를 끝까지 캐묻고 논증으로 확인하며"], mild: ["대체로 논리적으로 따지되 직관도 함께 쓰며"] }, J: { strong: ["빠른 직관으로 핵심을 먼저 낚아채며", "감각적으로 전체 그림을 단번에 잡으며"], mild: ["직관으로 먼저 잡고 필요할 때 근거를 확인하며"] }, balanced: ["직관과 논리를 상황에 따라 번갈아 쓰며"] };
  var APP = { D: { strong: ["어려운 문제일수록 오히려 의욕이 살아나는 도전형", "난도가 높아질수록 몰입이 강해지는 기질"], mild: ["적당한 난도의 도전을 즐기는 편"] }, M: { strong: ["반복으로 정확도를 끌어올려 숙달로 완성하는 유형", "꾸준한 연습으로 안정적인 숙련을 만드는 기질"], mild: ["숙달을 중시하되 가끔 도전도 받아들이는 편"] }, balanced: ["도전과 숙달을 균형 있게 오가는 편"] };
  var EFF = { 0: ["‘내가 할 수 있다’는 감각은 아직 거의 잡히지 않아, 작은 성취 경험이 가장 먼저 필요합니다.", "스스로 해낼 수 있다는 확신이 아직 약해, 쉬운 성공부터 차곡차곡 쌓는 것이 출발점입니다."], 1: ["‘해낼 수 있다’는 자신감이 막 싹트는 단계라, 성공 경험을 자주 만들어 주는 것이 중요합니다.", "자신감이 이제 막 피어나는 중이라, 작은 성취를 자주 확인시켜 주면 좋습니다."], 2: ["자신감은 보통 수준으로, 한 번씩의 성공이 쌓이면 눈에 띄게 단단해질 여지가 큽니다.", "자신감은 중간쯤으로, 적절한 난도의 성취가 더해지면 빠르게 올라설 수 있습니다."], 3: ["스스로 해낼 수 있다는 자신감이 꽤 자리잡아, 조금 더 높은 과제도 감당할 준비가 되어 있습니다.", "‘하면 된다’는 감각이 단단해, 한 단계 위 과제로 밀어 줄 만합니다."], 4: ["‘어려워도 해낼 수 있다’는 자신감이 단단해, 도전적인 과제가 오히려 동기가 됩니다.", "높은 자기효능감을 갖춰, 까다로운 문제일수록 더 의욕을 냅니다."] };
  var INT = { 0: ["화학 자체에 대한 흥미는 아직 본격적으로 켜지지 않았지만,", "화학에 대한 관심은 아직 잠들어 있지만,"], 1: ["화학에 대한 관심이 이제 막 피어나는 중이며,", "화학을 향한 호기심이 조금씩 고개를 드는 단계이며,"], 2: ["화학을 꾸준히 들여다보는 관심이 자리잡았고,", "화학에 대한 관심이 안정적으로 이어지고 있고,"], 3: ["스스로 파고들 만큼 흥미가 무르익었고,", "자발적으로 더 알고 싶어 할 만큼 흥미가 깊어졌고,"], 4: ["화학을 주도적으로 즐기는 단계에 이르렀고,", "흥미가 무르익어 스스로 탐구를 이끌 정도이고,"] };
  function gradAx(bank, st, off) { if (st.margin <= 1 && bank.balanced) return P(off, bank.balanced); return P(off, bank[st.pole][st.band]); }
  var iStage = Math.max(0, Math.min(4, r.interest.stage || 0)), eStage = Math.max(0, Math.min(4, r.efficacy.stage || 0));
  var topInt = maxCtx(r.interest.ctx), topAnx = maxCtx(r.anxiety.ctx);
  var stab = typeStability(r);
  var _dStrong = (appS.pole === "D" && appS.band === "strong"); var _useInt = (!_dStrong && topInt && topInt.v >= 60);
  var intCtx = (topInt && topInt.v >= 55 && !_useInt) ? (' 특히 ' + esc(topInt.nm) + ' 영역에서 그 불꽃이 가장 또렷합니다.') : '';
  var mixNote = (stab.weak.length >= 2) ? (' 다만 <b>' + stab.weak.map(function (w) { return esc(w.pair || w.nm); }).join(', ') + '</b> 성향은 양쪽이 비슷하게 나타나, 한 유형으로 못박기보다 상황에 따라 양쪽을 오가는 혼합형으로 읽는 것이 더 정확합니다.') : (stab.weak.length === 1 ? (' <b>' + esc(stab.weak[0].pair || stab.weak[0].nm) + '</b> 성향은 박빙이라, 상황에 따라 양쪽 모습이 다 나타날 수 있습니다.') : '');
  var p1 = '<b>' + esc(nm) + '</b>' + josa(nm, "은", "는") + ' ' + gradAx(LENS, lensS, 0) + ' <b>' + esc(T.name || code) + '</b> 유형입니다' + (I.tag ? (' — ' + esc(I.tag) + '.') : '.') + ' ' + P(1, INT[iStage]) + ' ' + gradAx(DRV, drvS, 13) + ' 성향이 학습의 동력이 됩니다.' + intCtx + ' ' + P(2, EFF[eStage]) + mixNote;
  var dn = (r.approach.norm && r.approach.norm.deep) || 0, sn = (r.approach.norm && r.approach.norm.surface) || 0;
  var leanLine = dn >= 65 ? P(3, ["문제를 풀 때 답보다 ‘왜 그런가’를 먼저 따지는 심층적 태도가 분명합니다.", "정답에 그치지 않고 원리까지 파고드는 깊이가 또렷합니다."]) : dn >= 52 ? P(3, ["정답에 더해 이유를 한 번 더 짚어 보려는 결이 보입니다.", "‘왜’를 한 줄 더 적어 보려는 심층의 싹이 보입니다."]) : sn >= 65 ? P(3, ["지금은 암기와 빠른 답에 크게 기대고 있어, ‘왜’로 내려가는 습관이 절실합니다.", "외우고 빨리 맞히는 데 무게가 쏠려 있어, 원리로 다시 세우는 연습이 필요합니다."]) : sn >= 52 ? P(3, ["아직은 정답을 빠르게 맞히는 데 무게가 실려, 이유를 파고드는 깊이는 더 키울 수 있습니다.", "빠른 답 쪽으로 약간 기울어, 한 번 더 ‘왜’를 묻는 습관을 더하면 좋습니다."]) : P(3, ["깊이와 효율 사이에서 균형을 잡고 접근합니다."]);
  var vIn = (r.value && r.value.internalize) || 0;
  var valLine = vIn >= 70 ? P(4, [" 배우는 이유를 스스로 납득하고 있어 동기가 안에서 나옵니다.", " 무엇을 위해 배우는지 스스로 정리돼 있어 동기의 뿌리가 깊습니다."]) : vIn >= 45 ? P(4, [" 배우는 의미는 어느 정도 느끼지만, 스스로의 언어로 정리하면 더 단단해집니다.", " 학습의 의미를 차츰 느끼는 중이라, 직접 말로 정리하는 경험이 도움이 됩니다."]) : P(4, [" 아직은 ‘왜 배우는지’가 외부 동기에 더 기대고 있어, 의미를 스스로 찾는 경험이 필요합니다.", " 배우는 이유가 바깥에서 주어지는 편이라, 내 안의 이유를 찾는 과정이 중요합니다."]);
  var p2 = P(5, ["사고 방식을 보면, ", "접근의 결을 보면, "]) + gradAx(THK, thkS, 21) + ' 다가갑니다. ' + leanLine + valLine;
  var anxLine = (topAnx && topAnx.v >= 70) ? (esc(topAnx.nm) + ' 맥락에서는 긴장이 상당히 높습니다.') : (topAnx && topAnx.v >= 55) ? (esc(topAnx.nm) + ' 맥락에서 긴장이 도드라집니다.') : '맥락에 따른 정서 기복은 크지 않아 비교적 고르게 접근합니다.';
  var contrast = (topInt && topAnx && topInt.v >= 55 && topAnx.v >= 55 && topInt.k !== topAnx.k) ? (' 흥미가 높은 영역과 긴장이 높은 영역 사이의 격차가 학습 경험을 갈라놓을 수 있어, 자신 있는 맥락을 발판 삼아 어려운 맥락으로 건너가게 하는 설계가 효과적입니다.') : (topAnx && topAnx.v >= 55 ? ' 그 맥락에서는 쉬운 과제로 긴장을 먼저 낮춘 뒤 난도를 올리는 접근이 좋습니다.' : '');
  var adapt = (r.coping && r.coping.total) ? (r.coping.adaptive / r.coping.total) : null;
  var copeLine = adapt == null ? '' : adapt >= 0.6 ? P(6, [" 막히는 상황에서도 스스로 길을 찾아 조절하는 편입니다.", " 벽에 부딪혀도 방법을 바꿔 가며 스스로 풀어내려 합니다."]) : adapt >= 0.34 ? P(6, [" 막힐 때 더러 스스로 조절하지만, 점검 전략을 더 익히면 안정됩니다.", " 막힘에 대처하는 힘이 자라는 중이라, 멈춤·점검 루틴을 보태면 좋습니다."]) : P(6, [" 막히면 멈추거나 외부에 기대는 경향이 있어, 스스로 점검하는 전략을 익히는 것이 필요합니다.", " 어려움 앞에서 손을 놓기 쉬워, ‘막히면 무엇부터 한다’는 절차를 정해 두면 도움이 됩니다."]);
  var p3 = anxLine + contrast;
  var cband = r.concept >= 70 ? P(7, ["개념 직관은 대체로 탄탄합니다.", "개념의 토대가 비교적 단단히 잡혀 있습니다."]) : r.concept >= 40 ? P(7, ["개념 직관은 자리를 잡았지만 군데군데 흔들립니다.", "개념의 기초는 섰으나 몇 곳에서 흔들림이 보입니다."]) : P(7, ["개념 토대에는 손볼 곳이 여럿 보입니다.", "개념의 기초부터 다시 세울 지점이 여러 곳 있습니다."]);
  var weakIntu = []; if (r.intu) { var IM = { conservation: "보존", particle: "입자", change: "변화" }; for (var ik in IM) { if (/교정|흔들/.test(r.intu[ik])) weakIntu.push(IM[ik]); } }
  var ent = (r.entrenched || []), entLine;
  if (ent.length) { var C = CLUSTERS[ent[0].cluster] || {}; entLine = ' 특히 ‘' + esc(ent[0].label) + '’ 개념이 그렇습니다. ' + esc(C.why || "") + ' ' + esc(C.corr || "") + ' 이 지점을 먼저 바로잡는 것이 도약의 열쇠입니다.'; }
  else { entLine = (r.concept >= 60) ? P(8, [" 두드러진 오개념 없이 다음 단계로 나아갈 준비가 되어 있습니다.", " 굳어진 오개념이 없어, 개념 심화로 곧장 나아갈 수 있습니다."]) : P(8, [" 특정 오개념에 굳어진 상태는 아니니, 위 기초 직관부터 차분히 다져 가면 됩니다.", " 단단히 굳은 오개념은 없으니, 기초 직관부터 차근차근 다지면 빠르게 자리잡습니다."]); }
  var p4 = cband + (weakIntu.length ? (' ' + weakIntu.join('·') + ' 직관은 보완이 필요합니다.') : '') + entLine;
  var top = trackScores2(r)[0];
  var appNote = (appS.margin >= 4 && appS.band === "strong") ? (' ' + gradAx(APP, appS, 31) + '이라는 점도 그 방향과 잘 어울립니다.') : '';
  var apprAdvice = (dn >= 52) ? P(9, ["지금의 심층적 태도를 유지하는 것이 가장 큰 자산입니다", "파고드는 깊이를 잃지 않도록 받쳐 주는 것이 좋습니다"]) : P(9, ["암기에 기대기보다 원리로 다시 세우는 연습을 곁들이면 좋습니다", "‘왜’를 한 줄씩 보태는 습관으로 깊이를 키우면 좋습니다"]);
  var metaSt = Math.max(0, Math.min(4, r.metacog.stage || 0));
  var metaLine = metaSt <= 1 ? P(10, [" 풀이 뒤 ‘무엇을 어떻게 알았는지’ 돌아보는 습관을 더하면 성장에 가속이 붙습니다.", " 답을 맞힌 뒤 ‘어떻게 알았나’를 한 번 되짚는 루틴을 더하면 좋습니다."]) : metaSt >= 3 ? P(10, [" 스스로 점검하는 메타인지가 잘 작동해, 그 힘을 더 어려운 과제에 활용하면 좋습니다.", ""]) : '';
  var p5 = P(11, ["종합하면, ", "정리하면, ", "요약하면, "]) + (top.fit >= 70 ? ('지금 신호는 <b>' + esc(shortTrack(top.name)) + '</b> 방향과 가장 잘 맞습니다(적합도 ' + top.fit + '). ') : ('아직 어느 한 길이 뚜렷이 가깝다고 할 단계는 아니고, 지금은 <b>' + esc(snapGrowKey(r)) + '</b>처럼 바탕이 되는 힘을 키워 갈 때입니다(가장 높은 신호도 적합도 ' + top.fit + '). ')) + (top.fit >= 70 ? (esc(top.strong) + josa(top.strong, "이", "가") + ' 그 길을 받쳐 주고') : (esc(top.strong) + josa(top.strong, "이", "가") + ' 든든한 출발점이 되고')) + (top.gapLab ? (', ' + esc(top.gapLab) + josa(top.gapLab, "을", "를") + ' 채우는 것이 다음 과제입니다') : '입니다') + '.' + appNote + ' 당장의 한 걸음은 <b>' + esc(firstStepText(r)) + '</b>이며, ' + apprAdvice + '.' + metaLine;
  var SC_LENS = { S: { strong: ["겉으로 드러난 결과보다 ‘속에서 무슨 일이 일어났을까’를 먼저 떠올리며, 머릿속으로 알갱이의 움직임을 그려 봅니다.", "현상을 보면 그 이면의 원리부터 상상하느라, 답을 내기까지 잠시 뜸을 들이기도 합니다."], mild: ["눈에 보이는 변화를 보면서도 ‘왜 그렇게 됐을까’를 한 번 더 짚으려 합니다."] }, G: { strong: ["새로운 현상을 보면 ‘저게 왜 저렇게 변하지?’ 하며 눈으로 좇고, 색이 바뀌거나 거품이 이는 순간을 놓치지 않습니다.", "눈앞의 변화와 결과에 즉각 반응하며, 구체적으로 보이는 것에서 가장 빠르게 배웁니다."], mild: ["주로 눈에 보이는 변화에 먼저 반응하고, 거기서 실마리를 찾아 나갑니다."] }, balanced: ["보이는 변화와 보이지 않는 원리를 함께 살피며 균형 있게 받아들입니다."] };
  var SC_THK = { B: { strong: ["답을 서두르기보다 근거를 하나씩 따져 확인한 뒤 비로소 손을 들고, 어설픈 답을 내놓는 것을 스스로 못 견뎌 합니다.", "‘왜 그런지’가 납득되지 않으면 좀처럼 다음으로 넘어가지 않습니다."], mild: ["대체로 근거를 따지되, 감이 오면 빠르게 잡기도 합니다."] }, J: { strong: ["문제를 만나면 ‘답이 이거다’ 하는 감이 먼저 오고 그 직관이 자주 들어맞지만, ‘왜 그런지’를 물으면 잠시 머뭇거리기도 합니다.", "전체 그림을 단번에 잡는 데 능해, 설명보다 결론이 먼저 튀어나오곤 합니다."], mild: ["직관으로 먼저 잡고, 필요하면 근거를 되짚어 확인합니다."] }, balanced: ["감으로 빠르게 잡되 필요할 때 근거를 따져 확인합니다."] };
  var SC_APP = { D: { strong: ["쉬운 문제만 이어지면 금세 흥미를 잃고, 한 단계 어려운 문제 앞에서 오히려 눈빛이 살아납니다.", "‘이건 어렵다’는 말에 물러서기보다 ‘해 볼 만하다’며 달려드는 편입니다."], mild: ["적당히 도전적인 과제에서 가장 즐거워합니다."] }, M: { strong: ["익숙해질 때까지 반복하는 시간을 답답해하지 않고, 정확해질수록 안정감을 느낍니다.", "충분히 다졌다는 확신이 설 때 비로소 마음 편히 다음으로 넘어갑니다."], mild: ["충분히 익힌 뒤 넘어갈 때 마음이 편합니다."] }, balanced: ["도전과 반복 사이를 상황에 맞게 오갑니다."] };
  var homeLine = iStage >= 3 ? P(40, ["집에서도 관련 영상이나 책을 시키지 않아도 스스로 찾아보는 모습이 자연스레 보일 것입니다.", "관심이 켜진 주제에는 누가 권하지 않아도 집에서 곧잘 빠져듭니다."]) : iStage >= 2 ? P(40, ["관심이 붙은 주제에는 집에서도 제법 몰입합니다.", "흥미가 닿은 영역에서는 집에서도 곧잘 손이 갑니다."]) : P(40, ["아직은 스스로 찾아보기보다, 흥미를 당기는 계기가 주어질 때 반응하는 편입니다.", "관심의 불씨를 당겨 줄 계기가 있을 때 비로소 움직이기 시작합니다."]);
  var _adapt = (r.coping && r.coping.total) ? (r.coping.adaptive / r.coping.total) : null; var _meta = Math.max(0, Math.min(4, r.metacog.stage || 0)); var _vIn = (r.value && r.value.internalize) || 0;
  var copeScene = (_adapt != null && _adapt >= 0.6) ? "막히는 문제를 만나면 잠시 멈춰 다른 길을 더듬어 봅니다. " : (_adapt != null && _adapt < 0.34) ? "막히는 문제를 만나면 곧장 도움을 청하거나 잠시 손을 놓기 쉽습니다. " : "막히는 문제 앞에서는 머뭇거리다가도 이내 다시 손을 댑니다. ";
  var metaScene = _meta >= 3 ? "풀고 난 뒤에는 ‘어떻게 풀었는지’를 곧잘 되짚어 봅니다." : _meta <= 1 ? "풀고 난 뒤 과정을 되돌아보는 습관은 아직 자리잡지 않았습니다." : "푼 뒤 과정을 되짚는 습관도 조금씩 자라는 중입니다.";
  var valScene = _vIn >= 70 ? " 무엇을 위해 배우는지 스스로 납득하면, 시키지 않아도 끝까지 가는 힘이 있습니다." : _vIn < 45 ? " ‘왜 해야 하는지’가 마음에 와닿을 때 비로소 진짜 엔진이 걸립니다." : "";
  var sn = (r.approach && r.approach.norm && r.approach.norm.surface) || 0;
  var shineWhen = _dStrong ? "한 번도 본 적 없는 어려운 문제를 만나 골똘히 파고들 때" : _useInt ? (esc(topInt.nm) + " 이야기가 나올 때") : (drvS.pole === "T" && drvS.band !== "mild") ? "새로운 개념을 처음 접하며 이것저것 직접 시도해 볼 때" : "충분히 익힌 내용을 빈틈없이 정확하게 풀어낼 때";
  var _anxDiff = (topAnx && topAnx.v >= 65 && !(_useInt && topInt && topAnx.k === topInt.k));
  var stuckWhen = (sn >= 58) ? "원리를 설명해야 하는 응용·서술형으로 넘어갈 때" : (_meta <= 1) ? "비슷한 실수를 점검 없이 반복할 때" : (_adapt != null && _adapt < 0.34) ? "막혔을 때 혼자서는 방법을 좀처럼 바꾸지 못할 때" : _anxDiff ? (esc(topAnx.nm) + " 앞에서 긴장이 훅 올라올 때") : "익숙하지 않은 낯선 형식의 문제를 마주할 때";
  var pShine = "<b>" + esc(nm) + "</b>" + josa(nm, "이", "가") + " 가장 빛나는 순간은 " + shineWhen + "입니다. 반대로 가장 자주 발이 묶이는 지점은 " + stuckWhen + "이고요. 이 두 장면을 알아 두면, 어디서 밀어 주고 어디서 기다려 줘야 할지가 한결 또렷해집니다.";
  var pPortrait = P(44, ["실제로 공부하는 모습을 그려 보면 이렇습니다. ", "교실과 집에서의 모습을 떠올려 보면 이렇습니다. "]) + gradAx(SC_LENS, lensS, 41) + " " + gradAx(SC_THK, thkS, 42) + " " + gradAx(SC_APP, appS, 43) + " " + copeScene + metaScene + " " + homeLine;
  var BARNUM = ["겉으로는 무던하고 차분해 보여도, 속으로는 스스로에게 거는 기준이 높아 작은 실수에도 마음을 꽤 씁니다.", "낯선 환경에서는 한발 물러나 지켜보지만, 마음을 연 영역에서는 누구보다 깊이 몰입합니다.", "잘 해내고 싶은 마음이 큰 만큼, 막히거나 틀릴 때 받는 부담도 남보다 크게 느끼는 편입니다.", "자기만의 속도와 방식이 분명해서, 재촉하기보다 그 결을 존중해 줄 때 진짜 실력이 나옵니다.", "겉보기에는 안정돼 보여도, 새로운 것 앞에서는 설렘과 망설임이 동시에 올라옵니다.", "관심이 가는 것과 그렇지 않은 것 사이의 온도 차가 비교적 뚜렷한 편입니다.", "한번 ‘내 것’이라고 느낀 영역에서는 기대 이상으로 끈기를 보입니다."];
  function pick3(off) { var n = BARNUM.length; var a = Math.abs(seed + off) % n; var b = (a + 2 + Math.abs(seed) % 3) % n; if (b === a) b = (b + 1) % n; var c = (b + 3) % n; if (c === a || c === b) c = (c + 1) % n; if (c === a || c === b) c = (c + 1) % n; return [BARNUM[a], BARNUM[b], BARNUM[c]]; }
  var bn = pick3(7);
  var effTie = eStage <= 1 ? " 그래서 ‘넌 할 수 있어’라는 인정과 확신의 한마디가 이 아이에게는 특히 크게 작용합니다." : eStage >= 3 ? " 스스로에 대한 믿음이 어느 정도 자리잡혀 있어, 그 자신감을 한 단계 높은 목표로 이어 주면 좋습니다." : "";
  var anxTie = (topAnx && topAnx.v >= 60) ? " 긴장이 쉽게 올라오는 영역에서는 다그치기보다 먼저 안심시켜 주는 한 걸음이 큰 힘이 됩니다." : "";
  var pInner = "마음의 결을 들여다보면, " + bn[0] + " " + bn[1] + effTie + " " + bn[2] + anxTie + valScene;
  var pClose = P(50, ["지금은 가능성이 한창 자라나는 시기입니다. ", "지금의 모습은 완성형이 아니라 자라나는 중간 과정입니다. "]) + P(51, top.fit >= 70 ? ["방향이 또렷한 지금, 그 강점을 밀어붙이면 적합도는 뒤따라 올라옵니다.", "잡힌 방향을 입구 삼아 강점을 키우면, 지금의 우위가 그대로 무기가 됩니다."] : ["조급함보다 바탕을 채우는 한 걸음 한 걸음이, 지금은 가장 크게 돌아옵니다.", "기초가 자리잡는 순간, 잠재된 힘이 눈에 띄게 드러납니다."]) + " " + P(52, ["오늘의 리포트는 점수표가 아니라, 이 아이를 더 깊이 이해하기 위한 지도입니다.", "이 결과는 등수를 매기려는 것이 아니라, 아이에게 맞는 길을 함께 찾기 위한 출발점입니다."]);
  function para(x) { return '<p style="margin:0 0 11px;font-size:13px;line-height:1.78;color:var(--ink-2)">' + x + '</p>'; }
  return '<section class="card"><div class="bh"><span class="ix" style="background:var(--cobalt)">✦</span><h3>맞춤 종합 해설</h3><span class="sub">이 학생만의 종합 읽기</span></div>' + para(p1) + para(pPortrait) + para(pShine) + para(p2) + para(p3) + para(pInner) + para(p4) + para(p5) + para(pClose) + '<p style="margin:6px 0 0;font-size:11px;color:var(--muted);font-style:italic">99문항의 응답 패턴을 여러 각도에서 교차 분석해 구성한 종합 해설입니다.</p></section>';
}



function snapGrowKey(r){ var t=trackScores2(r), g=(t[0]&&t[0].gapLab)||''; var L={'심층 학습':'심층 사고','메타인지':'스스로 점검','개념':'개념 다지기','숙달':'반복 숙달','정서 안정':'마음 안정','가치 인식':'배움의 이유','분석력':'근거 분석','도전':'도전 경험','흥미':'흥미 키우기','자신감':'자신감'}; return (L[g]||g||'기초 역량')+' 키우기'; }
function typeStability(r) {
  var ax = r.type.axes || {}, AXP = { lens: ["G", "S"], think: ["J", "B"], drive: ["T", "R"], approach: ["D", "M"] }, AXN = { lens: "관찰 관점", think: "사고 방식", drive: "학습 동력", approach: "학습 방식" };
  var order = ["lens", "think", "drive", "approach"], code = r.type.code || "", letters = code.split(""), margin = {}, weak = [];
  order.forEach(function (k, idx) { var po = AXP[k], a = (ax[k] && ax[k][po[0]]) || 0, b = (ax[k] && ax[k][po[1]]) || 0; margin[k] = Math.abs(a - b); if (margin[k] <= 1) weak.push({ k: k, nm: AXN[k], cur: letters[idx], alt: (letters[idx] === po[0] ? po[1] : po[0]), pair: ((typeof AXLAB !== "undefined" && AXLAB[k]) ? AXLAB[k].join("↔") : AXN[k]) }); });
  var conf = weak.length === 0 ? "뚜렷함" : weak.length === 1 ? "대체로 뚜렷" : weak.length === 2 ? "두 성향 혼합" : "여러 성향 혼합";
  var adjacents = weak.map(function (w) { var arr = letters.slice(), idx = order.indexOf(w.k); arr[idx] = w.alt; return arr.join(""); });
  var adjNames = adjacents.map(function (c) { var t = (typeof TYPES !== "undefined" && TYPES[c]) || {}; return t.name || c; });
  var adjFull = adjacents.map(function (c) { var t = (typeof TYPES !== "undefined" && TYPES[c]) || {}; return t.name ? (t.name + "(" + c + ")") : c; });
  return { margin: margin, weak: weak, conf: conf, adjacents: adjacents, adjNames: adjNames, adjFull: adjFull };
}
function methodologyHTML(r) {
  function row(h, b) { return '<div style="margin:9px 0"><div style="font-size:13px;font-weight:600;color:var(--ink)">' + h + '</div><div style="font-size:12px;color:var(--ink-2);margin-top:2px;line-height:1.6">' + b + '</div></div>'; }
  return '<p style="font-size:12px;color:var(--muted);margin:0 0 8px">이 리포트의 산출 근거와, 지금 ‘확정’인 것과 ‘가정’인 것을 구분합니다.</p>' +
    row("측정 방식", "위계 사다리(Guttman: 단계를 차례로 오르는지 확인) · 강제선택(ipsative: 좋아 보이는 답을 고를 수 없는 양자택일) · 맥락별 분리 측정 · 응답 신뢰도 점검(좋게 보이려는 경향·과대주장·일관성·주의력)을 함께 써서, 정해진 규칙으로 산출합니다.") +
    row("확정 vs 가정", "이 검사가 실제 실력·결과를 얼마나 정확히 맞히는지(타당도)와 또래 대비 위치 기준(규준)은 <b>아직 확정 전</b>입니다(데이터 누적 필요). 문항 설계의 세부 가정들은 ‘설계 가설’ 단계이며, 학생 100명 이상이 모이면 통계 분석으로 확정하거나 수정합니다.") +
    row("유형 뚜렷함", "네 가지 축을 각각 7문항으로 판정합니다. 4:3처럼 박빙인 축은 ‘박빙’으로 표시하고 양쪽 성향(예: 직관↔분석)을 함께 적어, 한 유형으로 단정하지 않습니다.") +
    row("진학 트랙", "적합도 가중치는 전문가가 먼저 정해 둔 초기 기준(전문가 사전값)입니다. 합격생의 실제 프로필이 쌓이면 경험적으로 보정됩니다. 지금은 ‘점수’가 아니라 ‘방향’으로 읽어야 합니다.") +
    row("개념 직관", "밴드(양호/흔들림/교정필요)의 기준선은 경험에 기반한 초기값이며, 데이터가 쌓이면 재보정합니다.") +
    '<p style="font-size:12px;color:var(--muted);font-style:italic;margin:10px 0 0">요약: 이 도구는 ‘검증 가능한 상태’로 설계되어 있고, 데이터가 쌓이면 규준·타당도가 ‘확정’으로 전환됩니다. 과대 해석을 피하고, 응답 신뢰도 표시와 유형 박빙 표시를 함께 보세요.</p>';
}

function homeAction(r){
  var ms=(r.metacog&&r.metacog.stage)||0, ord=(r.approach&&r.approach.order)||[];
  var ent=(typeof topEntrenched==="function")?topEntrenched(r):[];
  if(ms<=1||ord[0]==="surface") return "문제를 풀고 나면 \u2018왜 그렇게 되는지\u2019 한 줄씩 적게 해 주세요.";
  if(ent&&ent.length) return "\u2018"+ent[0].label+"\u2019 개념을 일상 예나 간단한 실험으로 다시 짚어 주세요.";
  return "잘하고 있을 때 무엇을 잘했는지 구체적으로 짚어 인정해 주세요.";
}
function summaryHTML(r){
  var T=(typeof TYPES!=="undefined"&&TYPES[r.type.code])||{}, top=trackScores2(r)[0];
  var row=function(lab,val,last){return '<div style="display:flex;gap:10px;padding:7px 0'+(last?'':';border-bottom:1px solid var(--line)')+'"><span style="flex:0 0 90px;font-size:12px;color:var(--gold-deep);font-weight:600;letter-spacing:.02em">'+lab+'</span><span style="font-size:13px;color:var(--ink-2);line-height:1.62">'+val+'</span></div>';};
  return '<div style="background:linear-gradient(180deg,rgba(201,162,75,.06),transparent);border:1px solid var(--gold-hair);border-radius:12px;padding:4px 16px 12px;margin-bottom:6px">'
    + '<div style="font-family:var(--mono);font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold-deep);padding:11px 0 3px">한눈에 요약</div>'
    + row("유형", esc(T.name||r.type.code)+' <span style="font-size:11px;color:var(--muted)">('+esc(r.type.code)+')</span>')
    + (top.fit >= 70 ? row("잘 맞는 방향", '<b>'+esc(shortTrack(top.name))+'</b> <span style="font-size:12px;color:var(--muted)">(적합도 '+top.fit+' \u00b7 '+top.level+')</span><span style="display:block;font-size:11px;color:var(--muted);margin-top:2px">적합도는 등수가 아니라 지금 신호의 방향입니다</span>') : row("지금 할 일", '뚜렷이 가까운 길이 잡히기 전이라, <b>'+esc(snapGrowKey(r))+'</b>로 토대를 다질 때입니다'))
    + row("집에서 한 가지", esc(homeAction(r)), true)
    + '</div>';
}
function renderReportV2(r) {
  var H = "";
  H += snapshotHTML(r);
  H += summaryHTML(r);
  H += narrativeHTML(r);
  H += sec("01", "종합 프로필", "6개 핵심 차원 한눈에", hexRadarSVG(r) + '<p style="font-size:12px;color:var(--muted);text-align:center;margin-top:2px">흥미\u00b7자신감\u00b7정서안정\u00b7가치\u00b7학습깊이\u00b7개념직관 \u00b7 0~100, 높을수록 좋음</p>');
  H += sec("02", "맥락 지도", "맥락별 흥미·불안·오개념", contextBarsHTML(r));
  H += sec("03", "성장 사다리", "‘좋아한다’가 아니라 도달 단계", ladderHTML(r));
  H += sec("04", "학습 접근 우선순위", "무엇을 먼저 쓰는가 · 순서로 보기", approachHTML(r));
  H += sec("05", "대처 패턴", "행동 시나리오", copingHTML(r));
  H += sec("06", "사고 성향(16유형)", "양자택일 응답 · 꾸미기 어려움", typeIdentityHTML(r) + '<div style="height:1px;background:var(--line);margin:14px 0"></div>' + typeMiniHTML(r) + axisLogicHTML(r));
  H += sec("07", "진학 트랙 적합도", "여러 갈래 · 점수보다 순위와 구간 중심", trackFitHTML(r));
  H += sec("08", "다년 성장 로드맵", "점수가 아니라 궤적", roadmapHTML2(r));
  H += sec("09", "개념 직관·오개념", "보존 / 입자 / 변화", conceptMiniHTML(r) + misconceptionDetailHTML(r));
  H += sec("10", "응답 신뢰도", "과대응답·부주의 탐지", validityBadge(r));
  H += sec("11", "학부모 상담 문답", "자주 묻는 질문 · 자가학습 대본", parentFAQHTML(r));
  H += sec("12", "방법론·한계", "측정 모델과 현재 한계", methodologyHTML(r));
  H += '<div style="text-align:center;font-size:11.5px;color:var(--grey);margin:22px 0 4px;letter-spacing:.05em;font-family:var(--serif)">화학 학습 진단</div>';
  return H;
}

if (typeof module !== "undefined") module.exports = { renderReportV2: renderReportV2, trackScores2: trackScores2, sigVals2: sigVals2, narrativeHTML: narrativeHTML, typeStability: typeStability };
