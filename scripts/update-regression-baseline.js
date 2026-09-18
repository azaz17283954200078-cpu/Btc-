#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const Runner=require('./research-runner.js');
const Snap=require('./regression-snapshot.js');

const FIXTURES=[
  {name:'taiex_1d_fixed',market:'TWII',timeframe:'1d',file:'tests/fixtures/taiex_1d_fixed.csv'},
  {name:'nasdaq_1d_fixed',market:'IXIC',timeframe:'1d',file:'tests/fixtures/nasdaq_1d_fixed.csv'}
];

function main(){
  const fixtures={};
  for(const f of FIXTURES){
    const data=Runner.parseCSV(fs.readFileSync(f.file,'utf8'));
    const result=Snap.createSnapshot(data,{name:f.name,market:f.market,timeframe:f.timeframe,source:'fixed-regression-fixture'});
    if(result.auditErrors.length)throw new Error(f.name+' audit failed: '+JSON.stringify(result.auditErrors,null,2));
    fixtures[f.name]=result.snapshot;
  }
  const target=path.resolve('tests/fixtures/regression-baseline.json');
  fs.writeFileSync(target,JSON.stringify({schemaVersion:1,fixtures},null,2)+'\n','utf8');
  console.log('Updated '+target);
}
if(require.main===module)main();
module.exports={FIXTURES,main};
