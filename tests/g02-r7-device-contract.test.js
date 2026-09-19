const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');

assert(s.includes('v2.3 · G02-R7 裝置與流程硬化'),'R7 version label missing');

for(const phrase of ['1</b> 選模型','2</b> 看證據','3</b> 查歷史','4</b> 保存','5</b> 延續']){
  assert(s.includes(phrase),'visible research flow step missing: '+phrase);
}

// Desktop: research lives beside chart, not in a fixed overlay.
assert(s.includes('.workspace{min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 480px'),
  'desktop chart/side-by-side workspace missing');
assert(!s.includes('id="evidenceDock"'),'fixed Evidence Dock must remain retired');
assert(!s.includes('id="evidenceBackdrop"'),'fixed Evidence backdrop must remain retired');

// Tablet/mobile: chart and research stack vertically.
assert(s.includes('@media(max-width:1050px)'), 'stacked responsive breakpoint missing');
assert(s.includes('.workspace{display:block}'),'mobile/tablet workspace must stack');
assert(s.includes('.chartbox{height:62vh'), 'stacked chart height guard missing');

// Touch: no primary task relies on hover/tooltip.
assert(s.includes('button,.tabbtn,.controls button{min-height:44px}'),'global mobile touch target missing');
assert(s.includes('.single-model-picker select{min-height:44px'),'single-model mobile select target missing');
assert(s.includes('.combo-add select,.combo-add button,.combo-actions button{min-height:44px}'),'combo touch targets missing');
assert(s.includes('.saved-research-actions button{min-height:44px'),'saved-research touch targets missing');
assert(s.includes('.chart-tip{display:none!important}'),'mobile tooltip must not be required');
assert(s.includes('if(hit&&hit.model)focusSingleEvidenceFromHit(hit)'),'tap/click must open model evidence directly');
assert(s.includes('手機不需要懸停，直接點模型標記即可同步右側案例'),'mobile interaction instruction missing');

// Current-vs-saved state must reset on manual market/timeframe reload and restore explicitly when loading a saved snapshot.
const reset=s.slice(s.indexOf('function resetSingleResearchForMarketChange('),s.indexOf('function openModelLibrary('));
assert(reset.includes('ACTIVE_SAVED_RESEARCH_ID=null'),'manual market/timeframe reload must detach saved origin');
const saved=s.slice(s.indexOf('async function openSavedResearch('),s.indexOf('function currentResearchIdentityHTML('));
assert(saved.indexOf('await load();')<saved.indexOf('ACTIVE_SAVED_RESEARCH_ID=id;'),
  'saved research must reattach only after restored market/timeframe load');

// Major task surfaces remain siblings, not nested modes.
const modelPos=s.indexOf('id="modelsPane"'),comboPos=s.indexOf('id="comboPane"'),scriptPos=s.indexOf('id="scriptPane"');
assert(modelPos>=0&&comboPos>modelPos&&scriptPos>comboPos,'model/combo/script task surfaces missing or reordered');
assert(s.includes("q('comboPane').classList.toggle('on',x==='combo')"),'combo tab switch missing');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
new Function(s.slice(a+8,b));
console.log('g02-r7-device-contract.test.js: OK');
