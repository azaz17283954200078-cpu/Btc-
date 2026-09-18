(function(root,factory){
  const RK=(typeof module==='object'&&module.exports)?require('../src/research-kernel.js'):root.StrategyLabKernel;
  const ME=(typeof module==='object'&&module.exports)?require('../src/model-engine.js'):root.StrategyLabModelEngine;
  const api=factory(RK,ME);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabRegressionSnapshot=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(RK,ME){
  'use strict';
  if(!RK||!ME)throw new Error('Regression snapshot requires Research Kernel and Model Engine');
  const ALL_ENABLED={support:true,macro:true,sweep:true,basin:true,field:true,echo:true,astro:true};
  const round=x=>x==null||!Number.isFinite(x)?x:Math.round(x*1e8)/1e8;

  function auditResult(res){
    const errors=[],ids=new Set();
    for(let i=0;i<(res.evidenceLog||[]).length;i++){
      const e=res.evidenceLog[i],v=RK.validateEvidence(e);
      if(!v.ok)errors.push({kind:'schema',id:e&&e.id,errors:v.errors});
      if(e&&ids.has(e.id))errors.push({kind:'duplicate_id',id:e.id});
      if(e)ids.add(e.id);
      if(e&&Number.isInteger(e.evidenceStart)&&Number.isInteger(e.detectedAt)&&e.evidenceStart>e.detectedAt)
        errors.push({kind:'evidence_start_after_detection',id:e.id});
      if(e&&Number.isInteger(e.detectedAt)&&Number.isInteger(e.index)&&e.detectedAt>e.index)
        errors.push({kind:'detection_after_index',id:e.id});
      if(i&&RK.compareEvidence(res.evidenceLog[i-1],e)>0)
        errors.push({kind:'timeline_not_sorted',id:e&&e.id});
    }
    const byEntity={};
    for(const e of res.evidenceLog||[]){
      if(!e||e.kind!=='transition'||!e.entityId)continue;
      const key=e.model+'|'+e.entityId;
      (byEntity[key]||(byEntity[key]=[])).push(e);
    }
    for(const [key,seq] of Object.entries(byEntity)){
      for(let i=1;i<seq.length;i++)if(seq[i].index<seq[i-1].index)
        errors.push({kind:'entity_time_reversal',entity:key,id:seq[i].id});
    }
    const ev=res.evaluation;
    if(!ev)errors.push({kind:'evaluation_missing'});
    else{
      const eligible=(res.evidenceLog||[]).filter(e=>['transition','event','observation'].includes(e.kind)).length;
      if(ev.evaluatedEvidence!==eligible)errors.push({kind:'evaluated_evidence_count',expected:eligible,actual:ev.evaluatedEvidence});
      if(ev.totalEvidence!==(res.evidenceLog||[]).length)errors.push({kind:'total_evidence_count',expected:(res.evidenceLog||[]).length,actual:ev.totalEvidence});
      for(const [model,m] of Object.entries(ev.models||{}))for(const [state,s] of Object.entries(m.states||{}))for(const [h,x] of Object.entries(s.horizons||{})){
        if(x.n+x.incomplete!==s.count)errors.push({kind:'sample_accounting',model,state,h,count:s.count,n:x.n,incomplete:x.incomplete});
        for(const key of ['upRate','downRate','flatRate'])if(x[key]!=null&&(!Number.isFinite(x[key])||x[key]<0||x[key]>1))
          errors.push({kind:'rate_range',model,state,h,key,value:x[key]});
        for(const key of ['medianReturn','medianMFE','medianMAE'])if(x[key]!=null&&!Number.isFinite(x[key]))
          errors.push({kind:'non_finite_metric',model,state,h,key,value:x[key]});
      }
    }
    return errors;
  }
  function compactEvidenceSummary(res){
    const out={};
    for(const [model,x] of Object.entries((res.evidenceSummary&&res.evidenceSummary.models)||{}))
      out[model]={total:x.total,states:x.states,kinds:x.kinds};
    return out;
  }
  function compactLifecycle(lifecycle){
    const out={};
    for(const [model,x] of Object.entries((lifecycle&&lifecycle.models)||{})){
      const states={},transitions={};
      for(const [state,v] of Object.entries(x.states||{}))states[state]={
        occurrences:v.occurrences,unresolvedNext:v.unresolvedNext,progressed:v.progressed,
        failedBeforeProgress:v.failedBeforeProgress,endedBeforeProgress:v.endedBeforeProgress,
        unresolvedProgress:v.unresolvedProgress,progressionRate:round(v.progressionRate),
        failureRate:round(v.failureRate),medianBarsToProgression:round(v.medianBarsToProgression)
      };
      for(const [name,v] of Object.entries(x.transitions||{}))transitions[name]={
        n:v.n,rateFromState:round(v.rateFromState),medianBars:round(v.medianBars)
      };
      out[model]={
        entities:x.entities,resolvedEntities:x.resolvedEntities,openEntities:x.openEntities,
        medianResolvedLifetimeBars:round(x.medianResolvedLifetimeBars),terminalStates:x.terminalStates,
        states,transitions
      };
    }
    return out;
  }
  function compactEvaluation(ev){
    const out={};
    for(const [model,m] of Object.entries((ev&&ev.models)||{})){
      const states={};
      for(const [state,s] of Object.entries(m.states||{})){
        const horizons={};
        for(const [h,x] of Object.entries(s.horizons||{}))horizons[h]={
          n:x.n,incomplete:x.incomplete,upRate:round(x.upRate),downRate:round(x.downRate),
          flatRate:round(x.flatRate),medianReturn:round(x.medianReturn),
          medianMFE:round(x.medianMFE),medianMAE:round(x.medianMAE)
        };
        states[state]={count:s.count,kinds:s.kinds,horizons};
      }
      out[model]={count:m.count,states};
    }
    return out;
  }
  function causalAnchors(log){
    const byModel={},out={};
    for(const e of log||[])(byModel[e.model]||(byModel[e.model]=[])).push(e);
    for(const [model,rows] of Object.entries(byModel)){
      const unique=[];
      for(const e of [...rows.slice(0,2),...rows.slice(-2)])if(!unique.some(x=>x.id===e.id))unique.push(e);
      out[model]=unique.map(e=>({id:e.id,state:e.state,kind:e.kind,index:e.index,detectedAt:e.detectedAt,evidenceStart:e.evidenceStart}));
    }
    return out;
  }
  function createSnapshot(data,spec){
    spec=spec||{};
    const res=ME.run(data,{
      market:spec.market||'FIXTURE',timeframe:spec.timeframe||'1d',
      source:spec.source||'fixed-regression-fixture',
      enabled:spec.enabled||ALL_ENABLED,zone:spec.zone||{},macro:spec.macro||{},exp:spec.exp||{}
    });
    return{auditErrors:auditResult(res),snapshot:{
      name:spec.name||'fixture',market:res.market,timeframe:res.timeframe,bars:data.length,
      start:data.length?data[0].t:null,end:data.length?data[data.length-1].t:null,
      parameterFingerprint:res.parameterFingerprint,evidenceTotal:res.evidenceLog.length,
      evidenceSummary:compactEvidenceSummary(res),lifecycle:compactLifecycle(res.evaluation&&res.evaluation.lifecycle),
      evaluation:compactEvaluation(res.evaluation),anchors:causalAnchors(res.evidenceLog)
    }};
  }
  return{ALL_ENABLED,round,auditResult,compactEvidenceSummary,compactLifecycle,compactEvaluation,causalAnchors,createSnapshot};
});
