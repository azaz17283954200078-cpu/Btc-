const assert=require('assert');
const P=require('../src/model-presets.js');

assert.equal(P.VERSION,'1.0.0-validated');
assert(P.VALIDATION&&Array.isArray(P.VALIDATION.contexts),'validated preset metadata missing');
assert.equal(P.VALIDATION.contexts.length,8,'M4 recipes must remain validated across 8 research contexts');
assert(/not selected by return/i.test(P.VALIDATION.basis),'validation must explicitly reject return-ranking selection');

const models=['support','macro','sweep','basin','field','echo','astro'];
for(const model of models){
  const rows=P.list(model);
  assert(rows.length>=3,model+' needs multiple guided research recipes');
  const byId=Object.fromEntries(rows.map(x=>[x.id,x]));
  for(const id of ['sensitive','balanced','selective'])assert(byId[id],model+' missing '+id+' recipe');

  const meta=P.VALIDATION.models[model];
  assert(meta&&meta.ordering&&meta.ordering.pass,model+' semantic ordering was not validated');
  const counts=['sensitive','balanced','selective'].map(id=>{
    const v=P.validation(model,id);
    assert(v,model+' '+id+' missing validation metadata');
    assert.equal(v.errors,0,model+' '+id+' emitted Evidence errors during validation');
    assert(v.n10>=5,model+' '+id+' has too few completed 10-bar outcomes');
    assert(v.contextsWithSamples>=2,model+' '+id+' lacks cross-context sample coverage');
    return v.count;
  });
  assert(counts[0]>=counts[1]&&counts[1]>=counts[2],model+' recipe names no longer match sample sensitivity');
  assert(counts[0]>counts[2],model+' sensitive/selective recipes must materially differ');
}

console.log('model-presets.test.js: OK');
