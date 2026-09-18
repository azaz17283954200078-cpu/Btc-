const fs=require('fs');
const assert=require('assert');

const s=fs.readFileSync('index.html','utf8');

for(const id of ['c','modelCanvas','scriptCanvas']){
  assert(s.includes('id="'+id+'"'),'missing canvas '+id);
}
assert(s.includes('<script src="src/research-kernel.js"></script>'),'Research Kernel script not loaded');
assert(s.includes('window.__SL_EVIDENCE__'),'normalized evidence export missing');
assert(s.includes('rebuildEvidence()'),'evidence rebuild hook missing');

const baseStart=s.indexOf('function drawBase(){');
const baseEnd=s.indexOf('function findHoveredEcho',baseStart);
assert(baseStart>=0&&baseEnd>baseStart,'drawBase block missing');
const core=s.slice(baseStart,baseEnd);
for(const forbidden of ['.zones','.macro','bottomSigs','researchSigs','researchZones','SIG','modelCanvas','scriptCanvas']){
  assert(!core.includes(forbidden),'Chart Core contaminated by '+forbidden);
}

for(const id of ['modBasin','modSpring','modEcho','modAstro']){
  const m=s.match(new RegExp('id="'+id+'"[^>]*>'));
  assert(m,'missing '+id);
  assert(!/\bchecked\b/.test(m[0]),id+' must default OFF');
}

for(const token of [
  "model:'support'",
  "model:'macro'",
  "model:'sweep'",
  "model:'basin'",
  "model:'field'",
  "model:'echo'",
  "model:'astro'"
]){
  assert(s.includes(token),'missing evidence adapter '+token);
}

console.log('index-contract.test.js: OK');
