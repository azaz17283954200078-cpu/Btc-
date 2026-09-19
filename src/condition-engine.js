(function(root,factory){
  const RK=(typeof module==='object'&&module.exports)
    ? require('./research-kernel.js')
    : root.StrategyLabKernel;
  const api=factory(RK);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabConditionEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(RK){
  'use strict';
  if(!RK)throw new Error('Condition Engine requires Research Kernel');

  const VERSION='1.0.0';
  const STATE_MODELS=new Set(['support','macro','basin','field']);
  const EVENT_MODELS=new Set(['sweep','astro']);
  const OBSERVATION_MODELS=new Set(['echo']);
  const TERMINAL_STATES={
    support:new Set(['broken']),
    macro:new Set(['broken']),
    basin:new Set(['exit']),
    field:new Set(['broken'])
  };

  function clampIndex(x,known){return Math.max(0,Math.min(known,Math.round(x)))}
  function normalizeCondition(input){
    if(!input||!input.model)throw new Error('Condition requires model');
    const model=String(input.model).toLowerCase(),
          state=RK.normalizeState(model,input.state),
          windowBars=Math.max(0,Math.round(Number(input.windowBars)||0));
    return{model,state,windowBars};
  }
  function semantics(input){
    const c=normalizeCondition(input);
    if(STATE_MODELS.has(c.model)){
      if(TERMINAL_STATES[c.model]&&TERMINAL_STATES[c.model].has(c.state))return'transition_event';
      return'state';
    }
    if(EVENT_MODELS.has(c.model))return'event';
    if(OBSERVATION_MODELS.has(c.model))return'observation';
    return'event';
  }
  function conditionKey(input){
    const c=normalizeCondition(input);
    return c.model+'|'+c.state+'|w'+c.windowBars;
  }
  function eligibleRows(evidence){
    return (evidence||[]).filter(e=>e&&e.kind!=='projection'&&Number.isInteger(e.index)&&e.model&&e.state);
  }
  function matchingRows(evidence,c,kind){
    return eligibleRows(evidence).filter(e=>{
      if(e.model!==c.model||RK.normalizeState(e.model,e.state)!==c.state)return false;
      if(kind==='state')return e.kind==='transition';
      if(kind==='observation')return e.kind==='observation';
      if(kind==='transition_event')return e.kind==='transition';
      return e.kind==='event';
    });
  }
  function buildPresence(evidence,input,options){
    options=options||{};
    const known=Math.max(0,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          c=normalizeCondition(input),mode=semantics(c),
          present=Array(known+1).fill(false);

    if(mode==='state'){
      const rows=eligibleRows(evidence).filter(e=>e.model===c.model&&e.kind==='transition'),
            groups={};
      for(const e of rows){
        const id=e.entityId||e.id;
        (groups[id]||(groups[id]=[])).push(e);
      }
      for(const seq of Object.values(groups)){
        seq.sort((a,b)=>(a.detectedAt??a.index)-(b.detectedAt??b.index)||a.index-b.index);
        for(let i=0;i<seq.length;i++){
          const e=seq[i],state=RK.normalizeState(e.model,e.state);
          if(state!==c.state)continue;
          const start=clampIndex(e.detectedAt??e.index,known),
                next=i+1?(seq[i+1].detectedAt??seq[i+1].index):known+1,
                end=Math.min(known,Math.max(start,Math.round(next)-1));
          for(let j=start;j<=end;j++)present[j]=true;
        }
      }
      return{condition:c,mode,knownThrough:known,present};
    }

    const rows=matchingRows(evidence,c,mode);
    for(const e of rows){
      const at=clampIndex(e.detectedAt??e.index,known),
            end=Math.min(known,at+c.windowBars);
      for(let j=at;j<=end;j++)present[j]=true;
    }
    return{condition:c,mode,knownThrough:known,present};
  }
  function inferKnownThrough(evidence){
    let n=0;
    for(const e of evidence||[])if(e&&Number.isInteger(e.index))n=Math.max(n,e.index);
    return n;
  }
  function episodesFromPresence(present){
    const out=[];
    let start=null;
    for(let i=0;i<=present.length;i++){
      const on=i<present.length&&!!present[i];
      if(on&&start==null)start=i;
      if(!on&&start!=null){
        out.push({index:start,end:i-1,length:i-start});
        start=null;
      }
    }
    return out;
  }
  function episodesForConditions(evidence,conditions,options){
    options=options||{};
    const list=(conditions||[]).map(normalizeCondition);
    if(!list.length)return[];
    const known=Math.max(0,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          layers=list.map(c=>buildPresence(evidence,c,{knownThrough:known}).present),
          both=Array(known+1).fill(false);
    for(let i=0;i<=known;i++)both[i]=layers.every(a=>!!a[i]);
    return episodesFromPresence(both);
  }
  function quantile(a,q){
    const b=(a||[]).filter(Number.isFinite).slice().sort((x,y)=>x-y);
    if(!b.length)return null;
    const p=(b.length-1)*q,lo=Math.floor(p),hi=Math.ceil(p);
    if(lo===hi)return b[lo];
    return b[lo]+(b[hi]-b[lo])*(p-lo);
  }
  function evaluateEpisodes(data,episodes,horizons,knownThrough){
    const out={};
    for(const h of horizons){
      const rows=(episodes||[]).map(ep=>RK.forwardOutcome(data,ep.index,h,knownThrough)),
            complete=rows.filter(Boolean),
            summary=RK.summarizeOutcomes(complete),
            returns=complete.map(x=>x.return);
      out[h]={
        n:complete.length,
        incomplete:Math.max(0,(episodes||[]).length-complete.length),
        upRate:summary?summary.upRate:null,
        downRate:summary?summary.downRate:null,
        flatRate:summary?summary.flatRate:null,
        medianReturn:summary?summary.medianReturn:null,
        medianMFE:summary?summary.medianMFE:null,
        medianMAE:summary?summary.medianMAE:null,
        returnP25:quantile(returns,.25),
        returnP75:quantile(returns,.75)
      };
    }
    return out;
  }
  function sampleGate(n){
    n=Math.max(0,Math.round(Number(n)||0));
    if(n<5)return{level:'insufficient',label:'樣本不足',n};
    if(n<20)return{level:'exploratory',label:'探索性樣本',n};
    return{level:'comparable',label:'可比較樣本',n};
  }
  function compareHorizons(combo,base,horizons){
    const out={};
    for(const h of horizons){
      const a=combo[h]||{},b=base[h]||{};
      const delta=(k)=>Number.isFinite(a[k])&&Number.isFinite(b[k])?a[k]-b[k]:null;
      out[h]={
        deltaMedianReturn:delta('medianReturn'),
        deltaMedianMFE:delta('medianMFE'),
        deltaMedianMAE:delta('medianMAE'),
        deltaUpRate:delta('upRate'),
        comboN:a.n||0,
        baselineN:b.n||0
      };
    }
    return out;
  }
  function evaluateConditions(data,evidence,conditions,options){
    options=options||{};
    const list=(conditions||[]).map(normalizeCondition);
    if(!list.length)throw new Error('At least one condition is required');
    const known=Math.min(
      Array.isArray(data)&&data.length?data.length-1:0,
      Math.max(0,Math.round(options.knownThrough==null?(Array.isArray(data)?data.length-1:inferKnownThrough(evidence)):options.knownThrough))
    );
    const horizons=RK.normalizeHorizons(options.horizons),
          episodes=episodesForConditions(evidence,list,{knownThrough:known}),
          baselineConditions=(options.baselineConditions&&options.baselineConditions.length?options.baselineConditions:[list[0]]).map(normalizeCondition),
          baselineEpisodes=episodesForConditions(evidence,baselineConditions,{knownThrough:known}),
          stats=evaluateEpisodes(data,episodes,horizons,known),
          baselineStats=evaluateEpisodes(data,baselineEpisodes,horizons,known);
    return{
      version:1,engineVersion:VERSION,knownThrough:known,horizons,
      conditions:list,
      semantics:list.map(c=>({condition:c,mode:semantics(c)})),
      episodeCount:episodes.length,
      episodes,
      gate:sampleGate(episodes.length),
      stats,
      baseline:{
        conditions:baselineConditions,
        episodeCount:baselineEpisodes.length,
        gate:sampleGate(baselineEpisodes.length),
        stats:baselineStats
      },
      comparison:compareHorizons(stats,baselineStats,horizons)
    };
  }
  function candidateConditions(evidence,options){
    options=options||{};
    const map=new Map();
    for(const e of eligibleRows(evidence)){
      if(e.kind==='snapshot'||e.kind==='projection')continue;
      const c=normalizeCondition({model:e.model,state:e.state,windowBars:0}),
            mode=semantics(c);
      if(mode==='state'&&e.kind!=='transition')continue;
      if(mode==='event'&&e.kind!=='event')continue;
      if(mode==='transition_event'&&e.kind!=='transition')continue;
      if(mode==='observation'&&e.kind!=='observation')continue;
      map.set(conditionKey(c),c);
    }
    return [...map.values()];
  }
  function discoverCompanions(evidence,baseConditions,options){
    options=options||{};
    const base=(Array.isArray(baseConditions)?baseConditions:[baseConditions]).filter(Boolean).map(normalizeCondition),
          known=Math.max(0,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          existing=new Set(base.map(conditionKey)),
          existingModels=new Set(base.map(x=>x.model)),
          maxResults=Math.max(1,Math.round(options.maxResults||8)),
          minEpisodes=Math.max(1,Math.round(options.minEpisodes||1)),
          out=[];
    for(const c of candidateConditions(evidence,options)){
      if(existing.has(conditionKey(c))||existingModels.has(c.model))continue;
      const episodes=episodesForConditions(evidence,[...base,c],{knownThrough:known});
      if(episodes.length<minEpisodes)continue;
      out.push({condition:c,mode:semantics(c),episodeCount:episodes.length,gate:sampleGate(episodes.length)});
    }
    out.sort((a,b)=>b.episodeCount-a.episodeCount||conditionKey(a.condition).localeCompare(conditionKey(b.condition)));
    return out.slice(0,maxResults);
  }
  function conditionsAtIndex(evidence,index,options){
    options=options||{};
    const known=Math.max(index,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          out=[];
    for(const c of candidateConditions(evidence,options)){
      const p=buildPresence(evidence,c,{knownThrough:known}).present;
      if(p[index])out.push({condition:c,mode:semantics(c)});
    }
    return out;
  }

  return{
    VERSION,STATE_MODELS,EVENT_MODELS,OBSERVATION_MODELS,TERMINAL_STATES,
    normalizeCondition,conditionKey,semantics,buildPresence,episodesFromPresence,
    episodesForConditions,quantile,evaluateEpisodes,sampleGate,evaluateConditions,
    candidateConditions,discoverCompanions,conditionsAtIndex
  };
});
