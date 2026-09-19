const assert=require('assert');
const P=require('../src/model-presets.js');

assert.equal(P.VERSION,'2.0.0-g03-calibrated');
const models=['support','macro','sweep','basin','field','echo','astro'];
for(const model of models){
  const rows=P.list(model),levels=Object.fromEntries(rows.map(x=>[x.level,x]));
  assert.equal(rows.length,3,model+' must expose exactly three official presets');
  for(const level of ['loose','balanced','strict'])assert(levels[level],model+' missing '+level);
  assert.equal(levels.loose.title,'寬鬆');
  assert.equal(levels.balanced.title,'平衡');
  assert.equal(levels.strict.title,'嚴格');
  assert(levels.strict.intent.includes('不代表')||model==='macro'||model==='astro',model+' strict preset must not imply accuracy');
}
// Backward-compatible IDs remain stable for saved snapshots.
for(const model of models){
  const ids=P.list(model).map(x=>x.id);
  for(const id of ['sensitive','balanced','selective'])assert(ids.includes(id),model+' legacy preset id missing '+id);
}
// Models that previously showed non-monotonic density now keep comparison dimensions fixed.
{
  const x=P.list('sweep');
  const looks=x.map(p=>JSON.stringify(p.config.sweep.lookback));
  assert(looks.every(v=>v===looks[0]),'Sweep preset comparison must keep the same old-low horizon');
  assert(x[0].config.sweep.minClosePosition<x[1].config.sweep.minClosePosition);
  assert(x[1].config.sweep.minClosePosition<x[2].config.sweep.minClosePosition);
}
{
  const x=P.list('basin').map(p=>p.config.exp.basin);
  for(const k of ['floorMin','floorMax','cliffMax'])assert(x.every(v=>v[k]===x[0][k]),'Basin '+k+' must stay fixed across presets');
  assert(x[0].threshold<x[1].threshold&&x[1].threshold<x[2].threshold);
}
{
  const x=P.list('echo').map(p=>p.config.exp.echo);
  for(const k of ['length','history','followBars'])assert(x.every(v=>v[k]===x[0][k]),'Echo '+k+' must stay fixed across presets');
  assert(x[0].similarity<x[1].similarity&&x[1].similarity<x[2].similarity);
}
console.log('g03-r4-preset-calibration-contract.test.js: OK');
