const fs=require('fs');
const assert=require('assert');
const Runner=require('../scripts/research-runner.js');
const Snap=require('../scripts/regression-snapshot.js');

const baseline=JSON.parse(fs.readFileSync('tests/fixtures/regression-baseline.json','utf8'));
const fixtures=[
  {name:'taiex_1d_fixed',market:'TWII',timeframe:'1d',file:'tests/fixtures/taiex_1d_fixed.csv'},
  {name:'nasdaq_1d_fixed',market:'IXIC',timeframe:'1d',file:'tests/fixtures/nasdaq_1d_fixed.csv'}
];

for(const f of fixtures){
  const data=Runner.parseCSV(fs.readFileSync(f.file,'utf8'));
  assert.equal(data.length,1200,f.name+' fixture row count changed');
  const result=Snap.createSnapshot(data,{name:f.name,market:f.market,timeframe:f.timeframe,source:'fixed-regression-fixture'});
  assert.deepEqual(result.auditErrors,[],f.name+' invariant audit failed');
  assert.deepStrictEqual(
    result.snapshot,baseline.fixtures[f.name],
    f.name+' model behavior changed; inspect the diff and regenerate the baseline only when the behavior change is intentional'
  );
}
console.log('regression-audit.test.js: OK');
