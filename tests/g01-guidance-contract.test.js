const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');

assert(s.includes('v1.6 · G01 單一模型引導'),'G01 version label missing');

for(const phrase of [
  '看懂這個模型',
  '第一步只要選一個看懂',
  '現在看到什麼？',
  '為什麼模型會這樣判斷？',
  '接下來觀察什麼？',
  '固定到研究區，慢慢看',
  '已固定：',
  '幾根 K 後」到底在比什麼？',
  '模型第一次確認這個狀態',
  '直接回到真實歷史案例',
  '多模型研究先放後面。'
]){
  assert(s.includes(phrase),'missing G01 guided copy: '+phrase);
}

for(const fn of [
  'function guideFor(','function guidanceHTML(','function horizonHuman(','function timeframeKLabel(',
  'function pinTooltipResearch(','function renderEvidenceDock(','function casesHTML('
]){
  assert(s.includes(fn),'missing G01 function '+fn);
}

for(const model of ['support','macro','sweep','basin','field','echo','astro']){
  assert(s.includes("'"+model+"|"),'G01 model guidance missing for '+model);
}
assert(s.includes('const MODEL_CAUTION={'),'model-level non-advice caution map missing');

assert(s.includes('.evidence-dock{display:none;position:fixed;top:72px;right:18px;bottom:18px'),'desktop fixed research panel missing');
assert(s.includes('.evidence-dock{display:none;position:fixed;inset:0'),'mobile full-screen research panel missing');
assert(!s.includes('max-height:min(76dvh,720px)'),'old small mobile research sheet must not remain');
assert(s.includes('.chart-tip.has-research{pointer-events:auto}'),'hover preview must allow explicit pin action');

assert(s.includes("historyCases(model,state,12)"),'history browser should expose more than the old seven-case list');
assert(s.includes('研究面板會保持固定'),'history case browser must explain fixed-panel behavior');
assert(s.includes("if(conditions.length>1){\n      html+=conditionalExplorerHTML(r)"),'conditional explorer must wait until more than one condition exists');
assert(s.includes('加入組合研究'),'combination research must be a secondary action, not the first task');

for(const phrase of [
  "if(tf==='1h')return '約 '+h+' 小時後'",
  "if(tf==='1d')return market==='BTC'?'約 '+h+' 天後':'約 '+h+' 個交易日後'",
  "if(tf==='1w')return '約 '+h+' 週後'",
  "if(tf==='1m')return '約 '+h+' 個月後'"
]){
  assert(s.includes(phrase),'missing human timeframe translation: '+phrase);
}

const panelStart=s.indexOf('function renderEvidenceDock(){');
const panelEnd=s.indexOf('function pinResearch(',panelStart);
assert(panelStart>=0&&panelEnd>panelStart,'research panel block missing');
const panel=s.slice(panelStart,panelEnd);
const guidePos=panel.indexOf('guidanceHTML(r.model,r.state)');
const horizonPos=panel.indexOf('horizonsHTML(st)');
const casesPos=panel.indexOf('casesHTML(r.model,r.state)');
const rawPos=panel.indexOf('進階｜模型當時到底記錄了哪些原始證據？');
assert(guidePos>=0&&horizonPos>guidePos&&casesPos>horizonPos&&rawPos>casesPos,
  'G01 reading order must be guide → historical outcomes → real cases → raw evidence');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
assert(a>=0&&b>a,'inline app script missing');
new Function(s.slice(a+8,b));

console.log('g01-guidance-contract.test.js: OK');
