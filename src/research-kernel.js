(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabKernel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='1.3.0';

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
      upcoming:'upcoming',event:'event',active:'active',passed:'passed'
    }
  };

  const DEFAULT_EVAL_HORIZONS=[3,5,10,20];

  // Progression is model-specific; failure/terminal states remain explicit.
  // Arrays allow an early state to skip directly to a later valid stage.
  const LIFECYCLE_RULES={
    support:{
      progress:{potential:['candidate','validated'],candidate:['validated']},
      failure:['broken'],terminal:['broken']
    },
    macro:{
      progress:{candidate:['active']},
      failure:['broken'],terminal:['broken']
    },
    basin:{
      progress:{landing:['forming','active'],forming:['active']},
      failure:[],terminal:['exit']
    },
    field:{
      progress:{seed:['forming','active'],forming:['active']},
      failure:['broken'],terminal:['broken']
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
      kind:input.kind||'snapshot',
      entityId:input.entityId||null,
      index,
      timestamp:finiteOrNull(input.timestamp),
      state,
      confidence:normalizeConfidence(input.confidence),
      detectedAt:input.detectedAt==null?index:Math.round(input.detectedAt),
      evidenceStart:input.evidenceStart==null?null:Math.round(input.evidenceStart),
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
    if(!e.kind)errors.push('kind');
    if(e.entityId!==null&&typeof e.entityId!=='string')errors.push('entityId');
    if(e.index!==null&&!Number.isInteger(e.index))errors.push('index');
    if(e.detectedAt!==null&&!Number.isInteger(e.detectedAt))errors.push('detectedAt');
    if(e.evidenceStart!==null&&!Number.isInteger(e.evidenceStart))errors.push('evidenceStart');
    if(Number.isInteger(e.index)&&Number.isInteger(e.detectedAt)&&e.detectedAt>e.index)errors.push('detectedAt_after_index');
    if(Number.isInteger(e.detectedAt)&&Number.isInteger(e.evidenceStart)&&e.evidenceStart>e.detectedAt)errors.push('evidenceStart_after_detectedAt');
    if(e.confidence!==null&&(!Number.isFinite(e.confidence)||e.confidence<0||e.confidence>100))errors.push('confidence');
    return{ok:errors.length===0,errors};
  }

  function forwardOutcome(data,index,horizon,knownThrough){
    if(!Array.isArray(data)||!data.length)return null;
    index=Math.round(index);
    horizon=Math.max(1,Math.round(horizon));
    const end=index+horizon,
          known=knownThrough==null?data.length-1:Math.min(data.length-1,Math.round(knownThrough));
    if(!Number.isFinite(known)||index<0||index>=data.length||end>=data.length||end>known)return null;
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

  function evaluateEvidence(data,evidence,horizon,knownThrough){
    const outcomes=[];
    for(const e of evidence||[]){
      if(!e||!Number.isInteger(e.index))continue;
      const o=forwardOutcome(data,e.index,horizon,knownThrough);
      if(o)outcomes.push({
        id:e.id,entityId:e.entityId||null,kind:e.kind||'snapshot',
        model:e.model,state:e.state,...o
      });
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
  function compareEvidence(a,b){
    const ai=Number.isInteger(a&&a.index)?a.index:Number.MAX_SAFE_INTEGER,
          bi=Number.isInteger(b&&b.index)?b.index:Number.MAX_SAFE_INTEGER;
    if(ai!==bi)return ai-bi;
    const ad=Number.isInteger(a&&a.detectedAt)?a.detectedAt:ai,
          bd=Number.isInteger(b&&b.detectedAt)?b.detectedAt:bi;
    if(ad!==bd)return ad-bd;
    const am=String(a&&a.model||''),bm=String(b&&b.model||'');
    if(am!==bm)return am.localeCompare(bm);
    return String(a&&a.id||'').localeCompare(String(b&&b.id||''));
  }

  function sortTimeline(evidence){
    return (evidence||[]).slice().sort(compareEvidence);
  }

  function timelineByModel(evidence){
    const out={};
    for(const e of sortTimeline(evidence)){
      if(!e||!e.model)continue;
      (out[e.model]||(out[e.model]=[])).push(e);
    }
    return out;
  }

  function timelineSummary(evidence){
    const out={total:0,models:{}};
    for(const e of evidence||[]){
      if(!e||!e.model)continue;
      out.total++;
      const m=out.models[e.model]||(out.models[e.model]={total:0,states:{},kinds:{}});
      m.total++;
      m.states[e.state]=(m.states[e.state]||0)+1;
      m.kinds[e.kind]=(m.kinds[e.kind]||0)+1;
    }
    return out;
  }

  function normalizeHorizons(horizons){
    const src=Array.isArray(horizons)&&horizons.length?horizons:DEFAULT_EVAL_HORIZONS;
    return [...new Set(src.map(x=>Math.max(1,Math.round(Number(x)))).filter(Number.isFinite))].sort((a,b)=>a-b);
  }

  function filterTimeline(evidence,filter){
    filter=filter||{};
    const toSet=x=>x==null?null:new Set(Array.isArray(x)?x:[x]),
          models=toSet(filter.model??filter.models),
          states=toSet(filter.state??filter.states),
          kinds=toSet(filter.kind??filter.kinds),
          families=toSet(filter.family??filter.families);
    return (evidence||[]).filter(e=>{
      if(!e)return false;
      if(models&&!models.has(e.model))return false;
      if(states&&!states.has(e.state))return false;
      if(kinds&&!kinds.has(e.kind))return false;
      if(families&&!families.has(e.family))return false;
      return true;
    });
  }

  function evaluateHorizonSet(data,evidence,horizons,knownThrough){
    const out={};
    for(const h of normalizeHorizons(horizons)){
      const ev=evaluateEvidence(data,evidence,h,knownThrough),
            s=ev.summary,
            n=s?s.n:0;
      out[h]={
        n,
        incomplete:Math.max(0,(evidence||[]).length-n),
        upRate:s?s.upRate:null,
        downRate:s?s.downRate:null,
        flatRate:s?s.flatRate:null,
        medianReturn:s?s.medianReturn:null,
        medianMFE:s?s.medianMFE:null,
        medianMAE:s?s.medianMAE:null
      };
    }
    return out;
  }

  function buildEntitySequences(evidence){
    const entities={};
    for(const e of sortTimeline(evidence)){
      if(!e||e.kind!=='transition'||!e.entityId||!e.model)continue;
      const key=e.model+'|'+e.entityId;
      (entities[key]||(entities[key]={model:e.model,entityId:e.entityId,events:[]})).events.push(e);
    }
    for(const x of Object.values(entities)){
      const dedup=[];
      for(const e of x.events){
        const prev=dedup[dedup.length-1];
        if(prev&&prev.state===e.state)continue;
        dedup.push(e);
      }
      x.events=dedup;
    }
    return Object.values(entities);
  }

  function evaluateLifecycle(evidence,rules){
    rules=rules||LIFECYCLE_RULES;
    const sequences=buildEntitySequences(evidence),out={models:{}};

    for(const seq of sequences){
      const rule=rules[seq.model]||{progress:{},failure:[],terminal:[]},
            model=out.models[seq.model]||(out.models[seq.model]={
              entities:0,resolvedEntities:0,openEntities:0,
              medianResolvedLifetimeBars:null,terminalStates:{},transitions:{},states:{}
            }),
            events=seq.events;
      if(!events.length)continue;

      model.entities++;
      const last=events[events.length-1],
            isResolved=(rule.terminal||[]).includes(last.state),
            life=last.index-events[0].index;
      if(isResolved){
        model.resolvedEntities++;
        (model._lifetimes||(model._lifetimes=[])).push(life);
        model.terminalStates[last.state]=(model.terminalStates[last.state]||0)+1;
      }else model.openEntities++;

      for(let i=0;i<events.length;i++){
        const cur=events[i],next=events[i+1],
              st=model.states[cur.state]||(model.states[cur.state]={
                occurrences:0,next:{},unresolvedNext:0,
                progressionTargets:(rule.progress&&rule.progress[cur.state])?rule.progress[cur.state].slice():[],
                progressed:0,failedBeforeProgress:0,endedBeforeProgress:0,unresolvedProgress:0,
                progressionRate:null,failureRate:null,medianBarsToProgression:null
              });
        st.occurrences++;

        if(next){
          const bars=next.index-cur.index,
                nextStat=st.next[next.state]||(st.next[next.state]={n:0,rate:null,medianBars:null,_bars:[]});
          nextStat.n++;nextStat._bars.push(bars);

          const tk=cur.state+'→'+next.state,
                tr=model.transitions[tk]||(model.transitions[tk]={from:cur.state,to:next.state,n:0,rateFromState:null,medianBars:null,_bars:[]});
          tr.n++;tr._bars.push(bars);
        }else st.unresolvedNext++;

        const targets=st.progressionTargets;
        if(targets.length){
          let resolved=null;
          for(let j=i+1;j<events.length;j++){
            const later=events[j];
            if(targets.includes(later.state)){
              resolved={type:'progress',bars:later.index-cur.index};
              break;
            }
            if((rule.failure||[]).includes(later.state)){
              resolved={type:'failure',bars:later.index-cur.index};
              break;
            }
            if((rule.terminal||[]).includes(later.state)){
              resolved={type:'ended',bars:later.index-cur.index};
              break;
            }
          }
          if(!resolved)st.unresolvedProgress++;
          else if(resolved.type==='progress'){
            st.progressed++;
            (st._progressBars||(st._progressBars=[])).push(resolved.bars);
          }else if(resolved.type==='failure')st.failedBeforeProgress++;
          else st.endedBeforeProgress++;
        }
      }
    }

    for(const model of Object.values(out.models)){
      if(model._lifetimes){
        model.medianResolvedLifetimeBars=median(model._lifetimes);
        delete model._lifetimes;
      }

      for(const st of Object.values(model.states)){
        const nextResolved=Object.values(st.next).reduce((n,x)=>n+x.n,0);
        for(const x of Object.values(st.next)){
          x.rate=nextResolved?x.n/nextResolved:null;
          x.medianBars=median(x._bars);
          delete x._bars;
        }

        const progressResolved=st.progressed+st.failedBeforeProgress+st.endedBeforeProgress;
        if(st.progressionTargets.length){
          st.progressionRate=progressResolved?st.progressed/progressResolved:null;
          st.failureRate=progressResolved?st.failedBeforeProgress/progressResolved:null;
          st.medianBarsToProgression=st._progressBars?median(st._progressBars):null;
        }
        delete st._progressBars;
      }

      for(const tr of Object.values(model.transitions)){
        const fromState=model.states[tr.from],
              denom=fromState?Object.values(fromState.next).reduce((n,x)=>n+x.n,0):0;
        tr.rateFromState=denom?tr.n/denom:null;
        tr.medianBars=median(tr._bars);
        delete tr._bars;
      }
    }

    out.totalEntities=Object.values(out.models).reduce((n,m)=>n+m.entities,0);
    return out;
  }

  function evaluateTimeline(data,evidence,options){
    options=options||{};
    const horizons=normalizeHorizons(options.horizons),
          knownThrough=options.knownThrough==null?(Array.isArray(data)?data.length-1:null):Math.round(options.knownThrough),
          eligibleKinds=options.kinds||['transition','event','observation'],
          rows=filterTimeline(evidence,{kinds:eligibleKinds}),
          models={};

    for(const e of rows){
      if(!e||!e.model||!e.state||!Number.isInteger(e.index))continue;
      const m=models[e.model]||(models[e.model]={count:0,states:{}}),
            st=m.states[e.state]||(m.states[e.state]={count:0,kinds:{},horizons:null});
      m.count++;st.count++;
      st.kinds[e.kind]=(st.kinds[e.kind]||0)+1;
    }

    for(const [modelName,m] of Object.entries(models)){
      for(const [stateName,st] of Object.entries(m.states)){
        const group=rows.filter(e=>e.model===modelName&&e.state===stateName);
        st.horizons=evaluateHorizonSet(data,group,horizons,knownThrough);
      }
    }

    return{
      version:1,
      horizons,
      knownThrough,
      eligibleKinds:eligibleKinds.slice(),
      totalEvidence:(evidence||[]).length,
      evaluatedEvidence:rows.length,
      excludedEvidence:Math.max(0,(evidence||[]).length-rows.length),
      models,
      lifecycle:evaluateLifecycle(evidence,options.lifecycleRules||LIFECYCLE_RULES)
    };
  }


  return{
    VERSION,
    STATE_MAP,
    DEFAULT_EVAL_HORIZONS,
    LIFECYCLE_RULES,
    normalizeState,
    makeEvidence,
    validateEvidence,
    forwardOutcome,
    summarizeOutcomes,
    evaluateEvidence,
    latestByModel,
    compareEvidence,
    sortTimeline,
    timelineByModel,
    timelineSummary,
    normalizeHorizons,
    filterTimeline,
    evaluateHorizonSet,
    buildEntitySequences,
    evaluateLifecycle,
    evaluateTimeline
  };
});
