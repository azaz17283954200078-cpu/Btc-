const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');

// G01's teaching content is preserved inside the G02-R1 architecture.
assert(/v1\\.[7-9] · G02-R[1-3] /.test(s),'G02 single-model version label missing');

for(const phrase of [
  '為什麼？',
  '接下來看什麼？',
  '不要直接解讀成：',
  '模型第一次能確認這個狀態',
  '以前出現後，市場怎麼走？',
  '真實歷史案例',
  '這是歷史路徑，不是可保證取得的報酬'
]){
  assert(s.includes(phrase),'missing migrated G01 guidance: '+phrase);
}

for(const fn of [
  'function guideFor(','function horizonHuman(','function timeframeKLabel(',
  'function renderSingleResearch(','function singleEvidenceCardHTML(','function singleHorizonHTML(',
  'function singleHistoryHTML('
]){
  assert(s.includes(fn),'missing migrated G01 function '+fn);
}

for(const model of ['support','macro','sweep','basin','field','echo','astro']){
  assert(s.includes("'"+model+"|"),'model guidance missing for '+model);
}
assert(s.includes('const MODEL_CAUTION={'),'model-level non-advice caution map missing');

// G01's floating/full-screen research panel is explicitly retired.
assert(!s.includes('id="evidenceDock"'),'Evidence Dock must be retired');
assert(!s.includes('id="evidenceBackdrop"'),'Evidence backdrop must be retired');
assert(s.includes('id="singleResearchBody"'),'guidance must live in the primary right-side inspector');
assert(s.includes('在右側研究這個案例 →'),'tooltip should route to the inspector instead of creating another panel');

// Human time translation survives the architecture rewrite.
for(const phrase of [
  "if(tf==='1h')return '約 '+h+' 小時後'",
  "if(tf==='1d')return market==='BTC'?'約 '+h+' 天後':'約 '+h+' 個交易日後'",
  "if(tf==='1w')return '約 '+h+' 週後'",
  "if(tf==='1m')return '約 '+h+' 個月後'"
]){
  assert(s.includes(phrase),'missing human timeframe translation: '+phrase);
}

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
assert(a>=0&&b>a,'inline app script missing');
new Function(s.slice(a+8,b));

console.log('g01-guidance-contract.test.js: OK');
