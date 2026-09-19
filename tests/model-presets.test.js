const assert=require('assert');
const P=require('../src/model-presets.js');

assert.equal(P.VERSION,'2.0.0-g03-calibrated');
assert(P.VALIDATION&&Array.isArray(P.VALIDATION.contexts),'validated preset metadata missing');
assert.equal(P.VALIDATION.contexts.length,8,'M4 recipes must remain validated across 8 research contexts');
assert(/not selected by return/i.test(P.VALIDATION.basis),'validation must explicitly reject return-ranking selection');

const models=['support','macro','sweep','basin','field','echo','astro'];
for(const model of models){
  const rows=P.list(model);
  assert.equal(rows.length,3,model+' needs exactly three official presets');
  const byId=Object.fromEntries(rows.map(x=>[x.id,x]));
  const byLevel=Object.fromEntries(rows.map(x=>[x.level,x]));
  for(const id of ['sensitive','balanced','selective'])assert(byId[id],model+' missing '+id+' compatibility id');
  for(const level of ['loose','balanced','strict'])assert(byLevel[level],model+' missing '+level+' preset');
  assert.equal(byLevel.loose.title,'寬鬆');
  assert.equal(byLevel.balanced.title,'平衡');
  assert.equal(byLevel.strict.title,'嚴格');

  const meta=P.VALIDATION.models[model];
  assert(meta&&meta.ordering&&meta.ordering.pass,model+' semantic ordering was not validated');
  const counts=['sensitive','balanced','selective'].map(id=>{
    const v=P.validation(model,id);
    assert(v,model+' '+id+' missing validation metadata');
    assert.equal(v.errors,0,model+' '+id+' emitted Evidence errors during validation');
    assert(v.n10>=5,model+' '+id+' has too few completed 10-bar outcomes');
    assert(v.nEff>=1,model+' '+id+' effective independent N missing');
    assert(v.oosComplete>=1,model+' '+id+' has no blind OOS coverage');
    assert.equal(v.parameterStability,true,model+' '+id+' failed parameter-neighborhood stability');
    assert(v.contextsWithSamples>=2,model+' '+id+' lacks cross-context sample coverage');
    const pub=P.publication(model,id);
    assert(pub&&pub.freezeRule&&pub.selectionBasis,model+' '+id+' publication record missing');
    return v.count;
  });
  assert(counts[0]>=counts[1]&&counts[1]>=counts[2],model+' recipe names no longer match sample sensitivity');
  assert(counts[0]>counts[2],model+' sensitive/selective recipes must materially differ');
}

console.log('model-presets.test.js: OK');
