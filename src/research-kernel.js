(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabKernel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='1.0.0';

  const STATE_MAP={
    support:{
      potential:'potential',candidate:'candidate',validated:'validated',broken:'broken',rejected:'broken'
    },
    macro:{
      candidate:'candidate',confirmed:'active',failed:'broken',expired:'broken'
    },
    sweep:{
      event:'event',active:'event'
    },
    basin:{
      landing:'landing',forming:'forming',active:'active',exit:'exit'
    },
    field:{
      seed:'seed',forming:'forming',active:'active',invalidated:'broken',broken:'broken'
    },
    echo:{
      weak:'weak',strong:'strong'
    },
    astro:{
      upcoming:'upcoming',active:'active',passed:'passed'
    }
  };

  function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
  function finiteOrNull(x){return Number.isFinite(x)?x:null}
  function clone(x){
    if(x===undefined)return undefined;
    return JSON.parse(JSON.stringify(x));
  }
  function median(a){
    if(!a.length)return null;
    const b=a.slice().sort((x,y)=>x-y),m=Math.floor(b.length/2);
    return b.length%2?b[m]:(b[m-1]+b[m])/2;
  }
  function normalizeState(model,state){
    const m=STATE_MAP[model]||{};
    const raw=String(state||'').toLowerCase();
    return m[raw]||raw||'unknown';
  }
  function normalizeConfidence(x){
    if(x===null||x===undefined||x==='')return null;
    if(!Number.isFinite(Number(x)))return null;
    return clamp(Number(x),0,100);
  }
  function makeId(model,index,state){
    return [model,index,state].join(':');
  }

  function makeEvidence(input){
    if(!input||!input.model)throw new Error('Evidence requires model');
    const model=String(input.model);
    const index=Number.isFinite(input.index)?Math.round(input.index):null;
    const state=normalizeState(model,input.state);
    return{
      version:1,
      id:input.id||makeId(model,index,state),
      model,
      family:input.family||'model',
      index,
      timestamp:finiteOrNull(input.timestamp),
      state,
      confidence:normalizeConfidence(input.confidence),
      detectedAt:input.detectedAt==null?index:Math.round(input.detectedAt),
      evidence:clone(input.evidence||{}),
      projection:input.projection==null?null:clone(input.projection),
      invalidation:input.invalidation==null?null:clone(input.invalidation),
      metrics:clone(input.metrics||{}),
      meta:clone(input.meta||{})
    };
  }

  function validateEvidence(e){
    const errors=[];
    if(!e||typeof e!=='object')return{ok:false,errors:['not_object']};
    if(e.version!==1)errors.push('version');
    if(!e.model)errors.push('model');
    if(!e.state)errors.push('state');
    if(e.index!==null&&!Number.isInteger(e.index))errors.push('index');
    if(e.detectedAt!==null&&!Number.isInteger(e.detectedAt))errors.push('detectedAt');
    if(e.confidence!==null&&(!Number.isFinite(e.confidence)||e.confidence<0||e.confidence>100))errors.push('confidence');
    return{ok:errors.length===0,errors};
  }

  function forwardOutcome(data,index,horizon){
    if(!Array.isArray(data)||!data.length)return null;
    index=Math.round(index);
    horizon=Math.max(1,Math.round(horizon));
    const end=index+horizon;
    if(index<0||index>=data.length||end>=data.length)return null;
    const entry=Number(data[index].c);
    if(!(entry>0))return null;
    const future=data.slice(index+1,end+1);
    if(!future.length)return null;
    const highs=future.map(x=>Number(x.h)).filter(Number.isFinite);
    const lows=future.map(x=>Number(x.l)).filter(Number.isFinite);
    const close=Number(data[end].c);
    if(!Number.isFinite(close)||!highs.length||!lows.length)return null;
    return{
      index,
      horizon,
      futureEnd:end,
      return:close/entry-1,
      mfe:Math.max(...highs)/entry-1,
      mae:Math.min(...lows)/entry-1
    };
  }

  function summarizeOutcomes(rows){
    const clean=(rows||[]).filter(Boolean);
    if(!clean.length)return null;
    const rets=clean.map(x=>x.return).filter(Number.isFinite),
          mfes=clean.map(x=>x.mfe).filter(Number.isFinite),
          maes=clean.map(x=>x.mae).filter(Number.isFinite);
    if(!rets.length)return null;
    return{
      n:rets.length,
      upRate:rets.filter(x=>x>0).length/rets.length,
      downRate:rets.filter(x=>x<0).length/rets.length,
      flatRate:rets.filter(x=>x===0).length/rets.length,
      medianReturn:median(rets),
      medianMFE:median(mfes),
      medianMAE:median(maes)
    };
  }

  function evaluateEvidence(data,evidence,horizon){
    const outcomes=[];
    for(const e of evidence||[]){
      if(!e||!Number.isInteger(e.index))continue;
      const o=forwardOutcome(data,e.index,horizon);
      if(o)outcomes.push({id:e.id,model:e.model,state:e.state,...o});
    }
    return{
      horizon:Math.max(1,Math.round(horizon)),
      summary:summarizeOutcomes(outcomes),
      outcomes
    };
  }

  function latestByModel(evidence){
    const out={};
    for(const e of evidence||[]){
      if(!e||!e.model)continue;
      if(!out[e.model]||(e.index??-1)>(out[e.model].index??-1))out[e.model]=e;
    }
    return out;
  }

  return{
    VERSION,
    STATE_MAP,
    normalizeState,
    makeEvidence,
    validateEvidence,
    forwardOutcome,
    summarizeOutcomes,
    evaluateEvidence,
    latestByModel
  };
});
