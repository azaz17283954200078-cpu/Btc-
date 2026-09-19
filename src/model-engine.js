(function(root,factory){
  const RK=(typeof module==='object'&&module.exports)
    ? require('./research-kernel.js')
    : root.StrategyLabKernel;
  const api=factory(RK);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabModelEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(RK){
  'use strict';

  if(!RK)throw new Error('Strategy Lab Model Engine requires Research Kernel');

  const VERSION='1.1.0';
  const DEFAULT_ZONE={
  "pivot": 5,
  "atr": 14,
  "width": 0.8,
  "breakAtr": 0.5
};
  const DEFAULT_MACRO={
  "atr": 14,
  "zoneUp": 1.2,
  "zoneDn": 0.25,
  "breakAtr": 0.6,
  "p": {
    "1h": {
      "hi": 240,
      "low": 40,
      "dd": 0.1,
      "atrAvg": 24,
      "atrX": 1.15,
      "confirm": 24
    },
    "4h": {
      "hi": 180,
      "low": 30,
      "dd": 0.14,
      "atrAvg": 24,
      "atrX": 1.15,
      "confirm": 18
    },
    "1d": {
      "hi": 120,
      "low": 20,
      "dd": 0.2,
      "atrAvg": 20,
      "atrX": 1.15,
      "confirm": 12
    },
    "1w": {
      "hi": 52,
      "low": 8,
      "dd": 0.3,
      "atrAvg": 13,
      "atrX": 1.1,
      "confirm": 6
    },
    "1m": {
      "hi": 36,
      "low": 6,
      "dd": 0.3,
      "atrAvg": 12,
      "atrX": 1.05,
      "confirm": 4
    }
  }
};
  const DEFAULT_SWEEP={
    lookback:{'1h':48,'4h':42,'1d':30,'1w':20,'1m':12},
    minClosePosition:.55
  };
  const DEFAULT_EXP={
  "basin": {
    "floorMin": 10,
    "floorMax": 80,
    "cliffMax": 60,
    "threshold": 68
  },
  "spring": {
    "minCycles": 2,
    "maxCoreShiftPct": 65,
    "maxShapeChangePct": 60,
    "minFitPct": 82,
    "breakConfirmBars": 2
  },
  "echo": {
    "length": 32,
    "history": 1000,
    "similarity": 0.82,
    "followBars": 12
  },
  "astro": {
    "planetSet": "classic",
    "aspectSet": "major",
    "orb": 4,
    "retro": "off",
    "ingress": "off"
  }
};
  const DEFAULT_ENABLED={support:true,macro:true,sweep:true,basin:false,field:false,echo:false,astro:false};
  const EVAL_HORIZONS=[3,5,10,20];

  function clone(x){return x==null?x:JSON.parse(JSON.stringify(x))}
  function merge(base,override){
    if(override==null)return clone(base);
    if(Array.isArray(base)||Array.isArray(override))return clone(override);
    if(typeof base!=='object'||typeof override!=='object')return clone(override);
    const out=clone(base)||{};
    for(const [k,v] of Object.entries(override)){
      out[k]=(v&&typeof v==='object'&&!Array.isArray(v)&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k]))
        ? merge(out[k],v):clone(v);
    }
    return out;
  }
  function stableValue(x){
    if(Array.isArray(x))return x.map(stableValue);
    if(x&&typeof x==='object'){
      const out={};
      for(const k of Object.keys(x).sort())out[k]=stableValue(x[k]);
      return out;
    }
    return x;
  }
  function parameterFingerprint(x){
    const s=JSON.stringify(stableValue(x));
    let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return 'fnv1a-'+(h>>>0).toString(16).padStart(8,'0');
  }
  function date(t){return new Date(Number(t)*1000).toISOString().slice(0,10)}

  let D=[],R=[],BASIN_EPISODES=[],OSC_FIELDS=[],EVIDENCE=[],EVIDENCE_LOG=[],EVIDENCE_ERRORS=[],EVIDENCE_IDS=new Set(),EVALUATION=null;
  let tf='1d',sourceNote='',market='BTC',ZONE=clone(DEFAULT_ZONE),MACRO=clone(DEFAULT_MACRO),SWEEP=clone(DEFAULT_SWEEP),EXP=clone(DEFAULT_EXP),ENABLED=clone(DEFAULT_ENABLED),INFO={};
  const window={};

  function q(id){
    if(id==='market')return{value:market};
    const map={
      modSupport:'support',modMacro:'macro',modSweep:'sweep',
      modBasin:'basin',modSpring:'field',modEcho:'echo',modAstro:'astro'
    };
    return{checked:!!ENABLED[map[id]]}
  }
  function setInfo(id,t){INFO[id]=String(t)}
  function safeDrawModels(){}

  function evidenceMeta(){return{market,timeframe:tf,source:sourceNote}}
  function resetEvidenceTimeline(){
    EVIDENCE_LOG.length=0;EVIDENCE_ERRORS.length=0;EVIDENCE_IDS.clear();
    window.__SL_EVIDENCE_LOG__=EVIDENCE_LOG;window.__SL_EVIDENCE_ERRORS__=EVIDENCE_ERRORS;
    window.__SL_EVIDENCE_BY_MODEL__={};window.__SL_EVIDENCE_SUMMARY__={total:0,models:{}};
    EVALUATION=null;window.__SL_EVALUATION__=null;
  }
  function rememberEvidence(input){
    if(!RK||!input)return null;
    let payload={...input,meta:{...evidenceMeta(),...(input.meta||{})}},
        e=RK.makeEvidence(payload),v=RK.validateEvidence(e);
    if(!v.ok){EVIDENCE_ERRORS.push({id:e.id,model:e.model,index:e.index,errors:v.errors});return null}
    if(EVIDENCE_IDS.has(e.id))return e;
    EVIDENCE_IDS.add(e.id);EVIDENCE_LOG.push(e);return e
  }
  function finalizeEvidenceTimeline(){
    if(RK&&RK.compareEvidence)EVIDENCE_LOG.sort(RK.compareEvidence);
    window.__SL_EVIDENCE_LOG__=EVIDENCE_LOG;
    window.__SL_EVIDENCE_ERRORS__=EVIDENCE_ERRORS;
    window.__SL_EVIDENCE_BY_MODEL__=RK&&RK.timelineByModel?RK.timelineByModel(EVIDENCE_LOG):{};
    window.__SL_EVIDENCE_SUMMARY__=RK&&RK.timelineSummary?RK.timelineSummary(EVIDENCE_LOG):{total:EVIDENCE_LOG.length,models:{}};
    return EVIDENCE_LOG
  }
  function rebuildEvaluation(){
    if(!RK||!RK.evaluateTimeline||!D.length){
      EVALUATION=null;window.__SL_EVALUATION__=null;return null
    }
    EVALUATION=RK.evaluateTimeline(D,EVIDENCE_LOG,{horizons:EVAL_HORIZONS,knownThrough:D.length-1});
    window.__SL_EVALUATION__=EVALUATION;
    return EVALUATION
  }

function atrArr(a,n){let z=a.map((x,i)=>i?Math.max(x.h-x.l,Math.abs(x.h-a[i-1].c),Math.abs(x.l-a[i-1].c)):x.h-x.l),r=Array(a.length).fill(NaN),s=0;for(let i=0;i<z.length;i++){if(i<n){s+=z[i];if(i===n-1)r[i]=s/n}else r[i]=(r[i-1]*(n-1)+z[i])/n}return r}
function zoneCalc(){
  if(!D.length)return;
  resetEvidenceTimeline();
  let L=ZONE.pivot,n=ZONE.atr,w=ZONE.width,br=ZONE.breakAtr,
      A=atrArr(D,n),zones=[],
      potential=0,candidate=0,validated=0,broken=0,
      on=q('modSupport').checked;

  R=D.map(x=>({...x,zones:[]}));

  if(on){
    for(let i=0;i<D.length;i++){
      let x=D[i],av=A[i],tol=isFinite(av)?av*br:0;

      // Causal support seed: current bar makes a fresh low versus ONLY prior bars.
      // No right-side/future bars are required, so the newest K can produce POTENTIAL.
      if(i>=L&&isFinite(av)){
        let priorLow=Math.min(...D.slice(i-L,i).map(z=>z.l)),
            fresh=x.l<=priorLow;

        if(fresh){
          let near=zones.find(z=>!z.dead&&Math.abs(x.l-z.low)<=av*1.5);
          if(!near){
            let z={
              low:x.l,
              top:x.l+av*w*.65,
              bot:x.l-av*w*.35,
              state:'potential',
              born:i,
              promotedAt:null,
              validatedAt:null,
              brokenAt:null,
              dead:false
            };
            zones.push(z);
            rememberEvidence({
              id:'support:'+z.born+':potential:'+i,entityId:'support:'+z.born,
              kind:'transition',model:'support',family:'structure',
              index:i,timestamp:D[i].t,state:'potential',detectedAt:i,evidenceStart:z.born,
              evidence:{top:z.top,bot:z.bot,low:z.low},
              invalidation:{kind:'close_below_zone',level:z.bot}
            });
            potential++;
          }else if(near.state==='potential'&&x.l<near.low){
            near.low=x.l;
            near.top=x.l+av*w*.65;
            near.bot=x.l-av*w*.35;
          }
        }
      }

      for(let z of zones){
        if(z.dead)continue;

        if(x.c<z.bot-tol){
          z.state='broken';
          z.brokenAt=i;
          rememberEvidence({
            id:'support:'+z.born+':broken:'+i,entityId:'support:'+z.born,
            kind:'transition',model:'support',family:'structure',
            index:i,timestamp:D[i].t,state:'broken',detectedAt:i,evidenceStart:z.born,
            evidence:{top:z.top,bot:z.bot,low:z.low,reason:'close_break'},
            invalidation:{kind:'close_below_zone',level:z.bot}
          });
          R[i].zones.push({top:z.top,bot:z.bot,state:'broken',detectedAt:i,evidenceStart:z.born});
          z.dead=true;
          broken++;
          continue;
        }

        if(z.state==='potential'){
          // Price first proves it can leave the low area.
          if(i>z.born&&x.c>z.top){
            z.state='candidate';
            z.promotedAt=i;
            rememberEvidence({
              id:'support:'+z.born+':candidate:'+i,entityId:'support:'+z.born,
              kind:'transition',model:'support',family:'structure',
              index:i,timestamp:D[i].t,state:'candidate',detectedAt:i,evidenceStart:z.born,
              evidence:{top:z.top,bot:z.bot,low:z.low,reason:'left_zone'}
            });
            candidate++;
          }
        }else if(z.state==='candidate'){
          // A later retest that holds the zone upgrades it to VALIDATED.
          let touch=i>(z.promotedAt??z.born)&&x.l<=z.top&&x.h>=z.bot;
          if(touch&&x.c>=z.bot){
            z.state='validated';
            z.validatedAt=i;
            rememberEvidence({
              id:'support:'+z.born+':validated:'+i,entityId:'support:'+z.born,
              kind:'transition',model:'support',family:'structure',
              index:i,timestamp:D[i].t,state:'validated',detectedAt:i,evidenceStart:z.born,
              evidence:{top:z.top,bot:z.bot,low:z.low,reason:'retest_hold'}
            });
            validated++;
          }
        }

        let stateDetectedAt=z.state==='validated'?(z.validatedAt??i):
                            z.state==='candidate'?(z.promotedAt??i):z.born;
        R[i].zones.push({top:z.top,bot:z.bot,state:z.state,detectedAt:stateDetectedAt,evidenceStart:z.born});
      }
    }
  }

  setInfo(
    'zoneInfo',
    on
      ?'Live Support｜Potential '+potential+' · Candidate '+candidate+' · Validated '+validated+' · Broken '+broken+'｜最新 K 可直接產生 Potential'
      :'Support Zone 已關閉'
  );
  macroCalc()
}
function macroCalc(){
  if(!D.length)return;
  for(let i=0;i<R.length;i++)R[i].macro=[];
  let on=q('modMacro').checked;
  if(!on){setInfo('macroInfo','Macro Bottom v0.2 已關閉');bottomLabCalc();return}

  let p=MACRO.p[tf]||MACRO.p['1d'],
      A=atrArr(D,MACRO.atr),
      ap=A.map((x,i)=>isFinite(x)&&D[i].c?x/D[i].c:NaN),
      zones=[],formed=0,confirmed=0,failed=0;

  for(let i=0;i<D.length;i++){
    if(i>=Math.max(p.hi,p.low,p.atrAvg)){
      let hi=Math.max(...D.slice(i-p.hi+1,i+1).map(x=>x.h)),
          ll=Math.min(...D.slice(i-p.low+1,i+1).map(x=>x.l)),
          dd=hi?1-D[i].c/hi:0,av=0,c=0;

      for(let j=i-p.atrAvg+1;j<=i;j++)if(isFinite(ap[j])){av+=ap[j];c++}
      av=c?av/c:NaN;

      let fresh=D[i].l<=ll,
          expanded=isFinite(ap[i])&&isFinite(av)&&ap[i]>=av*p.atrX,
          near=false;
      for(let z of zones)if(!z.dead&&Math.abs(D[i].l-z.low)<=A[i]*1.5)near=true;

      if(fresh&&dd>=p.dd&&expanded&&!near&&isFinite(A[i])){
        let z={
          top:D[i].l+A[i]*MACRO.zoneUp,
          bot:D[i].l-A[i]*MACRO.zoneDn,
          low:D[i].l,trigger:D[i].h,born:i,expires:i+p.confirm,
          state:'candidate',confirmedAt:null,dead:false
        };
        zones.push(z);
        rememberEvidence({
          id:'macro:'+z.born+':candidate:'+i,entityId:'macro:'+z.born,
          kind:'transition',model:'macro',family:'structure',
          index:i,timestamp:D[i].t,state:'candidate',detectedAt:i,evidenceStart:z.born,
          evidence:{top:z.top,bot:z.bot,low:z.low,trigger:z.trigger}
        });
        formed++;
      }
    }

    for(let z of zones){
      if(z.dead)continue;
      let tol=isFinite(A[i])?A[i]*MACRO.breakAtr:0;

      if(i>z.born&&D[i].c<z.bot-tol){
        rememberEvidence({
          id:'macro:'+z.born+':failed:'+i,entityId:'macro:'+z.born,
          kind:'transition',model:'macro',family:'structure',
          index:i,timestamp:D[i].t,state:'failed',detectedAt:i,evidenceStart:z.born,
          evidence:{top:z.top,bot:z.bot,trigger:z.trigger,reason:'close_break'}
        });
        z.dead=true;failed++;continue;
      }

      if(z.state==='candidate'){
        if(i>z.born&&i<=z.expires&&D[i].c>z.trigger){
          z.state='confirmed';
          z.confirmedAt=i;
          rememberEvidence({
            id:'macro:'+z.born+':confirmed:'+i,entityId:'macro:'+z.born,
            kind:'transition',model:'macro',family:'structure',
            index:i,timestamp:D[i].t,state:'confirmed',detectedAt:i,evidenceStart:z.born,
            evidence:{top:z.top,bot:z.bot,trigger:z.trigger,reason:'trigger_break'}
          });
          confirmed++;
        }else if(i>z.expires){
          rememberEvidence({
            id:'macro:'+z.born+':expired:'+i,entityId:'macro:'+z.born,
            kind:'transition',model:'macro',family:'structure',
            index:i,timestamp:D[i].t,state:'expired',detectedAt:i,evidenceStart:z.born,
            evidence:{top:z.top,bot:z.bot,trigger:z.trigger,reason:'expired'}
          });
          z.dead=true;failed++;continue;
        }
      }

      let stateDetectedAt=z.state==='confirmed'?(z.confirmedAt??i):z.born;
      R[i].macro.push({
        top:z.top,bot:z.bot,state:z.state,
        detectedAt:stateDetectedAt,evidenceStart:z.born
      });
    }
  }

  setInfo('macroInfo','Macro Bottom v0.2｜'+tf.toUpperCase()+'｜Candidate '+formed+' · Confirmed '+confirmed+' · Failed/Expired '+failed+'｜自動依時間框架調整觀察窗；不限制市場與週期');
  bottomLabCalc()
}
function bottomLabCalc(){
  if(!D.length)return;
  for(let i=0;i<R.length;i++)R[i].bottomSigs=[];
  let on=q('modSweep').checked,cnt=0,A=atrArr(D,14),
      look=Math.max(4,Math.round((SWEEP.lookback&&SWEEP.lookback[tf])||(SWEEP.lookback&&SWEEP.lookback['1d'])||30)),
      minClosePosition=Math.max(0,Math.min(1,Number(SWEEP.minClosePosition??.55)));

  if(on){
    for(let i=Math.max(20,look);i<D.length;i++){
      let x=D[i],range=Math.max(x.h-x.l,1e-9),pos=(x.c-x.l)/range,
          priorLow=Math.min(...D.slice(i-look,i).map(z=>z.l));

      if(x.l<priorLow&&x.c>priorLow&&pos>=minClosePosition){
        R[i].bottomSigs.push({k:'sweep',label:'Liquidity Sweep',slot:0});
        rememberEvidence({
          id:'sweep:'+i,entityId:'sweep:'+i,kind:'event',
          model:'sweep',family:'event',index:i,timestamp:D[i].t,
          state:'event',detectedAt:i,evidenceStart:i,
          evidence:{priorLow,low:x.l,close:x.c,closePosition:pos}
        });
        cnt++;
      }
    }
  }

  setInfo('bottomInfo',on?'Liquidity Sweep｜'+cnt+' 個訊號｜回看 '+look+' bars · 收盤位置 ≥ '+Math.round(minClosePosition*100)+'%':'Liquidity Sweep 已關閉');
  researchCalc()
}
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN}
function stdev(a){if(a.length<2)return 0;let m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)*(x-m))))}
function median(a){if(!a.length)return NaN;let b=a.slice().sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function angleNorm(x){x%=360;if(x<0)x+=360;return x}
function angleDiff(a,b){let d=angleNorm(a-b);return d>180?d-360:d}
function minAngle(a,b){return Math.abs(angleDiff(a,b))}
function candleShape(end,len){
  let start=end-len+1;
  if(start<0)return null;
  let seg=D.slice(start,end+1),
      lo=Math.min(...seg.map(x=>x.l)),
      hi=Math.max(...seg.map(x=>x.h)),
      span=hi-lo;
  if(!(span>0))return null;
  return seg.map(x=>({
    o:(x.o-lo)/span,
    h:(x.h-lo)/span,
    l:(x.l-lo)/span,
    c:(x.c-lo)/span
  }))
}
function candleShapeSimilarity(a,b){
  if(!a||!b||a.length!==b.length)return 0;
  let sum=0;
  for(let i=0;i<a.length;i++){
    let A=a[i],B=b[i];
    sum+=.30*(A.o-B.o)*(A.o-B.o)+
         .30*(A.c-B.c)*(A.c-B.c)+
         .20*(A.h-B.h)*(A.h-B.h)+
         .20*(A.l-B.l)*(A.l-B.l);
  }
  let rms=Math.sqrt(sum/Math.max(1,a.length));
  return clamp(1-rms/.45,0,1)
}function echoForwardStats(end,horizon,knownThrough=D.length-1){
  horizon=Math.max(1,Math.round(horizon));
  if(RK){
    let o=RK.forwardOutcome(D,end,horizon,knownThrough);
    return o?{horizon:o.horizon,futureEnd:o.futureEnd,ret:o.return,mfe:o.mfe,mae:o.mae}:null
  }
  let futureEnd=end+horizon,known=Math.min(D.length-1,Math.round(knownThrough));
  if(end<0||futureEnd>=D.length||futureEnd>known)return null;
  let entry=D[end].c,seg=D.slice(end+1,futureEnd+1);
  if(!(entry>0)||!seg.length)return null;
  return{
    horizon,futureEnd,
    ret:D[futureEnd].c/entry-1,
    mfe:Math.max(...seg.map(x=>x.h))/entry-1,
    mae:Math.min(...seg.map(x=>x.l))/entry-1
  }
}
function echoBacktest(matches,horizon){
  let rows=matches.map(m=>m.forward).filter(Boolean);
  if(!rows.length)return null;
  let returns=rows.map(x=>x.ret),mfes=rows.map(x=>x.mfe),maes=rows.map(x=>x.mae);
  return{
    horizon,n:rows.length,
    upRate:returns.filter(x=>x>0).length/rows.length,
    downRate:returns.filter(x=>x<0).length/rows.length,
    medianReturn:median(returns),
    medianMFE:median(mfes),
    medianMAE:median(maes)
  }
}


// Simplified astronomical positions for the astrology experiment.
// Circular-orbit geocentric approximation: enough to preserve real orbital periods,
// retrograde geometry and standard astrology aspect definitions without a remote dependency.
const ORBIT={
 Mercury:{r:.387,p:87.969,L:252.251},Venus:{r:.723,p:224.701,L:181.980},Earth:{r:1,p:365.256,L:100.464},
 Mars:{r:1.524,p:686.980,L:355.453},Jupiter:{r:5.203,p:4332.589,L:34.404},Saturn:{r:9.537,p:10759.22,L:49.944},
 Uranus:{r:19.191,p:30688.5,L:313.232},Neptune:{r:30.07,p:60182,L:304.880},Pluto:{r:39.48,p:90560,L:238.929}
};
function astroPos(t){
  let d=t/86400-10957.5,rad=Math.PI/180,e=ORBIT.Earth,Le=angleNorm(e.L+360*d/e.p),ex=e.r*Math.cos(Le*rad),ey=e.r*Math.sin(Le*rad),out={};
  out.Sun=angleNorm(Math.atan2(-ey,-ex)/rad);
  out.Moon=angleNorm(218.316+13.176396*d);
  for(let [name,o] of Object.entries(ORBIT)){if(name==='Earth')continue;let L=angleNorm(o.L+360*d/o.p),x=o.r*Math.cos(L*rad)-ex,y=o.r*Math.sin(L*rad)-ey;out[name]=angleNorm(Math.atan2(y,x)/rad)}
  return out
}
function astroPlanets(set){return set==='modern'?['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']:['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']}
const ASTRO_NAME={Sun:'太陽',Moon:'月亮',Mercury:'水星',Venus:'金星',Mars:'火星',Jupiter:'木星',Saturn:'土星',Uranus:'天王星',Neptune:'海王星',Pluto:'冥王星'};
const ASPECT_NAME={0:'合相 ☌',60:'六合 ⚹',90:'刑 □',120:'拱 △',180:'沖 ☍'};
function aspectAngles(set){return set==='hard'?[0,90,180]:set==='harmony'?[60,120]:[0,60,90,120,180]}

function quantile(a,qv){
  if(!a.length)return NaN;
  let b=a.slice().sort((x,y)=>x-y),p=(b.length-1)*clamp(qv,0,1),i=Math.floor(p),f=p-i;
  return b[i]+(b[Math.min(b.length-1,i+1)]-b[i])*f
}
function fieldEnvelope(seg){
  if(!seg||seg.length<3)return null;
  let bodyLow=seg.map(x=>Math.min(x.o,x.c)),
      bodyHigh=seg.map(x=>Math.max(x.o,x.c)),
      lower=quantile(bodyLow,.05),
      upper=quantile(bodyHigh,.95);
  if(!(upper>lower))return null;
  return{lower,upper,center:(upper+lower)/2,amp:(upper-lower)/2}
}
function fieldCycles(seg,c0,c1,a0,a1){
  let last=0,turns=0,n=seg.length;
  for(let i=0;i<n;i++){
    let t=i/Math.max(1,n-1),center=c0+(c1-c0)*t,amp=Math.max(1e-9,a0+(a1-a0)*t),
        d=(seg[i].c-center)/amp,side=d>=.35?1:d<=-.35?-1:0;
    if(!side)continue;
    if(last&&side!==last)turns++;
    last=side;
  }
  return turns/2
}
function fieldStats(seg){
  if(!seg||seg.length<16)return null;
  let n=seg.length,part=Math.max(4,Math.floor(n/3)),
      first=seg.slice(0,part),
      middle=seg.slice(Math.floor((n-part)/2),Math.floor((n-part)/2)+part),
      last=seg.slice(n-part),
      e0=fieldEnvelope(first),em=fieldEnvelope(middle),e1=fieldEnvelope(last);
  if(!e0||!em||!e1)return null;
  let avgHeight=e0.amp+e1.amp;if(!(avgHeight>0))return null;

  let drift=(e1.center-e0.center)/avgHeight,
      shapeChange=(e1.amp-e0.amp)/Math.max(e0.amp,1e-9),
      compression=1-e1.amp/Math.max(e0.amp,1e-9),
      ampRatio=Math.min(e0.amp,e1.amp)/Math.max(e0.amp,e1.amp),
      expectedMidCenter=(e0.center+e1.center)/2,
      expectedMidAmp=(e0.amp+e1.amp)/2,
      centerLineError=Math.abs(em.center-expectedMidCenter)/Math.max(avgHeight,1e-9),
      widthLineError=Math.abs(em.amp-expectedMidAmp)/Math.max(expectedMidAmp,1e-9),
      geometrySmooth=1-clamp(centerLineError/.30+widthLineError/.45,0,1),
      cycles=fieldCycles(seg,e0.center,e1.center,e0.amp,e1.amp),
      inside=0,biasVals=[];

  for(let i=0;i<n;i++){
    let t=i/Math.max(1,n-1),
        center=e0.center+(e1.center-e0.center)*t,
        amp=Math.max(1e-9,e0.amp+(e1.amp-e0.amp)*t),
        bodyLo=Math.min(seg[i].o,seg[i].c),
        bodyHi=Math.max(seg[i].o,seg[i].c),
        d=(seg[i].c-center)/amp;
    if(bodyLo>=center-amp*1.08&&bodyHi<=center+amp*1.08)inside++;
    if(i>=n-part)biasVals.push(clamp(d,-1.5,1.5));
  }

  return{
    lower0:e0.center-e0.amp,upper0:e0.center+e0.amp,center0:e0.center,amp0:e0.amp,
    lower1:e1.center-e1.amp,upper1:e1.center+e1.amp,center1:e1.center,amp1:e1.amp,
    cycles,drift,shapeChange,compression,ampRatio,
    containment:inside/n,geometrySmooth,
    centerLineError,widthLineError,
    bias:clamp(mean(biasVals)/1.15,-1,1)
  }
}
function fieldScore(st,p){
  if(!st)return{score:0,pass:false};
  let maxShift=Math.max(.05,p.maxCoreShiftPct/100),
      maxShape=Math.max(.05,p.maxShapeChangePct/100),
      minFit=clamp(p.minFitPct/100,.50,.99),
      cycleScore=clamp(st.cycles/Math.max(1,p.minCycles+1),0,1),
      fitScore=clamp((st.containment-.55)/.45,0,1),
      smoothScore=clamp(st.geometrySmooth,0,1),
      marginShift=1-clamp(Math.abs(st.drift)/Math.max(maxShift,1e-9),0,1),
      marginShape=1-clamp(Math.abs(st.shapeChange)/Math.max(maxShape,1e-9),0,1),
      score=100*(.30*cycleScore+.34*fitScore+.24*smoothScore+.06*marginShift+.06*marginShape),
      pass=st.cycles>=p.minCycles&&
           Math.abs(st.drift)<=maxShift&&
           Math.abs(st.shapeChange)<=maxShape&&
           st.containment>=minFit&&
           st.geometrySmooth>=.35;
  return{score,pass}
}
function fieldScaleList(){return[24,36,52,76,108,156,220]}
function fieldBestCandidate(end,p){
  let best=null;
  for(let look of fieldScaleList()){
    let start=end-look+1;if(start<0)continue;
    let st=fieldStats(D.slice(start,end+1)),sc=fieldScore(st,p);if(!st)continue;
    let c={start,end,look,...st,...sc};if(!best||c.score>best.score)best=c;
  }
  return best
}
function fieldPreviewState(c,p){
  if(!c)return null;
  let minFit=clamp(p.minFitPct/100,.50,.99),
      maxShift=Math.max(.05,p.maxCoreShiftPct/100),
      maxShape=Math.max(.05,p.maxShapeChangePct/100),
      cycleRatio=c.cycles/Math.max(1,p.minCycles),
      fitRatio=c.containment/Math.max(.01,minFit),
      geomOK=Math.abs(c.drift)<=maxShift*1.35&&Math.abs(c.shapeChange)<=maxShape*1.35,
      confidence=100*clamp(.38*clamp(cycleRatio,0,1)+.38*clamp(fitRatio,0,1)+.24*clamp(c.geometrySmooth,0,1),0,1);
  if(c.pass)return{state:'active',confidence};
  if(geomOK&&c.cycles>=Math.max(1,p.minCycles*.60)&&c.containment>=minFit*.78&&c.geometrySmooth>=.22)
    return{state:'forming',confidence};
  if(geomOK&&c.cycles>=.5&&c.containment>=minFit*.60&&c.geometrySmooth>=.12)
    return{state:'seed',confidence};
  return null
}
function lockFieldGeometry(c){
  let span=Math.max(1,c.end-c.start),
      a0=Math.max(1e-9,c.amp0),a1=Math.max(1e-9,c.amp1),needs=[];
  for(let i=c.start;i<=c.end;i++){
    let t=(i-c.start)/span,
        center=c.center0+(c.center1-c.center0)*t,
        amp=Math.max(1e-9,a0+(a1-a0)*t),
        bodyHi=Math.max(D[i].o,D[i].c),
        bodyLo=Math.min(D[i].o,D[i].c),
        need=Math.max((bodyHi-center)/amp,(center-bodyLo)/amp);
    if(isFinite(need))needs.push(need);
  }
  let scale=Math.max(1,quantile(needs,.98))*1.01;
  return{
    anchorStart:c.start,anchorEnd:c.end,
    center0:c.center0,center1:c.center1,
    amp0:a0*scale,amp1:a1*scale,
    minAmp:Math.max(1e-9,Math.min(a0,a1)*scale*.20)
  }
}
function fieldBoundaryAt(lock,i){
  let span=Math.max(1,lock.anchorEnd-lock.anchorStart),
      t=(i-lock.anchorStart)/span,
      center=lock.center0+(lock.center1-lock.center0)*t,
      amp=Math.max(lock.minAmp,lock.amp0+(lock.amp1-lock.amp0)*t);
  return{center,amp,upper:center+amp,lower:center-amp}
}
function fieldBodyBreach(lock,i){
  if(i<0||i>=D.length)return 0;
  let b=fieldBoundaryAt(lock,i),x=D[i],
      bodyHi=Math.max(x.o,x.c),
      bodyLo=Math.min(x.o,x.c);
  if(bodyLo>b.upper||bodyHi>b.upper)return 1;
  if(bodyHi<b.lower||bodyLo<b.lower)return -1;
  return 0
}
function fieldBarInside(lock,i){return fieldBodyBreach(lock,i)===0}

function fieldEpisodeStats(lock,start,end){
  let b0=fieldBoundaryAt(lock,start),b1=fieldBoundaryAt(lock,end),
      seg=D.slice(start,end+1),
      cycles=fieldCycles(seg,b0.center,b1.center,b0.amp,b1.amp),
      drift=(b1.center-b0.center)/Math.max(1e-9,b0.amp+b1.amp),
      shapeChange=(b1.amp-b0.amp)/Math.max(1e-9,b0.amp),
      compression=1-b1.amp/Math.max(1e-9,b0.amp),
      ampRatio=Math.min(b0.amp,b1.amp)/Math.max(b0.amp,b1.amp),
      n=Math.max(1,end-start+1),part=Math.max(1,Math.floor(n/3)),biasVals=[];
  for(let i=Math.max(start,end-part+1);i<=end;i++){
    let b=fieldBoundaryAt(lock,i),d=(D[i].c-b.center)/Math.max(1e-9,b.amp);
    biasVals.push(clamp(d,-1.5,1.5));
  }
  return{
    lower0:b0.lower,upper0:b0.upper,center0:b0.center,amp0:b0.amp,
    lower1:b1.lower,upper1:b1.upper,center1:b1.center,amp1:b1.amp,
    cycles,drift,shapeChange,compression,ampRatio,containment:1,
    geometrySmooth:1,centerLineError:0,widthLineError:0,
    bias:clamp(mean(biasVals)/1.15,-1,1)
  }
}
function fieldStatus(score){return score>=82?'● 穩定':score>=68?'◐ 偏移':'▲ 失衡'}
function fieldDriftText(v){let a=Math.abs(v)*100;if(a<6)return '→ 幾乎水平';return v>0?(a<30?'↗ 中心慢慢抬高':'↑ 中心明顯抬高'):(a<30?'↘ 中心慢慢降低':'↓ 中心明顯降低')}
function fieldCompressionText(v){let a=Math.abs(v)*100;if(a<8)return '→ 大致穩定';return v>0?'↘ 收束 '+a.toFixed(0)+'%':'↗ 擴張 '+a.toFixed(0)+'%'}
function fieldBiasText(v){let a=Math.abs(v)*100;if(a<15)return '→ 接近核心';return v>0?'↑ 上方聚集':'↓ 下方聚集'}

const BASIN_FEATURE_KEYS=['dropDepth','dropEfficiency','floorRelief','floorSlope','volShift','centerStability','duration'];
const BASIN_HEURISTIC_WEIGHTS={dropDepth:.18,dropEfficiency:.12,floorRelief:.22,floorSlope:.16,volShift:.10,centerStability:.14,duration:.08};

function regressionSlope(a){
  let n=a.length;
  if(n<2)return 0;
  let sx=(n-1)*n/2,
      sy=a.reduce((x,y)=>x+y,0),
      sxx=(n-1)*n*(2*n-1)/6,
      sxy=0;
  for(let i=0;i<n;i++)sxy+=i*a[i];
  let den=n*sxx-sx*sx;
  return den?(n*sxy-sx*sy)/den:0
}
function returnVol(a){
  if(a.length<3)return 0;let r=[];
  for(let i=1;i<a.length;i++)if(a[i-1]>0&&a[i]>0)r.push(Math.log(a[i]/a[i-1]));
  return stdev(r)
}
function basinScaleList(min,max){
  min=Math.max(4,Math.round(min));max=Math.max(min,Math.round(max));
  let out=[],x=min;
  while(x<max){out.push(Math.round(x));x=Math.max(x+1,x*1.42)}
  out.push(max);
  return [...new Set(out)].sort((a,b)=>a-b)
}
function basinCandidate(end,floorLen,cliffLen){
  let fs=end-floorLen+1,ce=fs-1,cs=ce-cliffLen+1;
  if(cs<0||fs<1)return null;

  let floor=D.slice(fs,end+1),floorC=floor.map(x=>x.c),
      floorHi=Math.max(...floor.map(x=>x.h)),floorLo=Math.min(...floor.map(x=>x.l)),
      floorRange=floorHi-floorLo,floorMid=median(floorC);

  let peakI=cs;
  for(let j=cs+1;j<=ce;j++)if(D[j].h>D[peakI].h)peakI=j;
  if(peakI>=ce)return null;

  let cliffTop=D[peakI].h,cliffHeight=cliffTop-floorMid;
  if(!(cliffHeight>0))return null;

  let cliffC=D.slice(peakI,ce+1).map(x=>x.c);
  let path=0;
  for(let j=1;j<cliffC.length;j++)path+=Math.abs(cliffC[j]-cliffC[j-1]);
  path+=Math.abs((cliffC[cliffC.length-1]||floorMid)-floorMid);

  let dropPct=cliffTop>0?cliffHeight/cliffTop:0,
      efficiency=path>0?clamp(cliffHeight/path,0,1):0,
      reliefRatio=floorRange/cliffHeight,
      floorDrift=Math.abs(regressionSlope(floorC)*(floorC.length-1)),
      slopeRatio=floorDrift/cliffHeight,
      cliffVol=returnVol(cliffC),
      floorVol=returnVol(floorC),
      volRatio=cliffVol>1e-9?floorVol/cliffVol:(floorVol<1e-9?0:1.5);

  let thirds=[],part=Math.max(1,Math.floor(floorC.length/3));
  for(let k=0;k<3;k++){
    let a=k*part,b=k===2?floorC.length:Math.min(floorC.length,(k+1)*part);
    if(a<b)thirds.push(median(floorC.slice(a,b)));
  }
  let centerSpread=thirds.length?Math.max(...thirds)-Math.min(...thirds):floorRange,
      centerRatio=centerSpread/cliffHeight,
      durationRatio=floorLen/Math.max(1,cliffLen);

  // Soft features: no single one can reject a basin by itself.
  let f={
    dropDepth:clamp(dropPct/.30,0,1),
    dropEfficiency:efficiency,
    floorRelief:1-clamp(reliefRatio/.70,0,1),
    floorSlope:1-clamp(slopeRatio/.35,0,1),
    volShift:1-clamp(volRatio/1.6,0,1),
    centerStability:1-clamp(centerRatio/.30,0,1),
    duration:clamp(durationRatio/1.25,0,1)
  };
  let score=0;
  for(let k of BASIN_FEATURE_KEYS)score+=(BASIN_HEURISTIC_WEIGHTS[k]||0)*f[k];
  score*=100;

  return{
    score,features:f,raw:{dropPct,efficiency,reliefRatio,slopeRatio,volRatio,centerRatio,durationRatio},
    cs,ce,fs,fe:end,peakI,cliffTop,floorHi,floorLo,floorMid,floorLen,cliffLen
  }
}
function basinBestCandidate(end,p){
  let floors=basinScaleList(p.floorMin,p.floorMax),
      cliffs=basinScaleList(Math.max(6,Math.round(p.floorMin*.6)),p.cliffMax),
      best=null;
  for(let F of floors){
    if(end-F<1)continue;
    for(let C of cliffs){
      let c=basinCandidate(end,F,C);
      if(c&&(!best||c.score>best.score))best=c;
    }
  }
  return best
}
function basinBestCandidateRange(end,floorMin,floorMax,cliffMax){
  floorMin=Math.max(4,Math.round(floorMin));
  floorMax=Math.max(floorMin,Math.round(floorMax));
  let floors=basinScaleList(floorMin,floorMax),
      cliffs=basinScaleList(6,Math.max(6,Math.round(cliffMax))),
      best=null;
  for(let F of floors){
    if(end-F<1)continue;
    for(let C of cliffs){
      let c=basinCandidate(end,F,C);
      if(c&&(!best||c.score>best.score))best=c;
    }
  }
  return best
}
function basinLiveStage(end,p,fullCandidate){
  let full=fullCandidate===undefined?basinBestCandidate(end,p):fullCandidate;
  if(full&&full.score>=p.threshold)return{stage:'active',candidate:full,confidence:full.score};
  let earlyMax=Math.max(4,p.floorMin-1),
      early=basinBestCandidateRange(end,4,earlyMax,p.cliffMax);
  if(!early)return null;
  let f=early.features,
      duration=clamp(early.floorLen/Math.max(1,p.floorMin),0,1),
      confidence=100*(.24*f.dropDepth+.14*f.dropEfficiency+.18*f.floorRelief+
                      .14*f.floorSlope+.10*f.volShift+.12*f.centerStability+.08*duration);
  if(confidence>=p.threshold*.72&&duration>=.45)return{stage:'forming',candidate:early,confidence};
  if(confidence>=p.threshold*.48&&f.dropDepth>=.30&&f.dropEfficiency>=.20)return{stage:'landing',candidate:early,confidence};
  return null
}

function rebuildEvidence(){
  EVIDENCE.length=0;
  window.__SL_EVIDENCE__=EVIDENCE;
  if(!RK||!D.length||!R.length)return EVIDENCE;

  const i=D.length-1,row=R[i],
        meta={market:q('market').value,timeframe:tf,source:sourceNote},
        push=x=>{let e=RK.makeEvidence(x),v=RK.validateEvidence(e);if(v.ok)EVIDENCE.push(e)};

  (row.zones||[]).forEach((z,k)=>push({
    id:'support:'+i+':'+k+':'+z.state,entityId:'support:'+(z.evidenceStart??z.detectedAt??i),kind:'snapshot',
    model:'support',family:'structure',index:i,timestamp:D[i].t,state:z.state,
    detectedAt:z.detectedAt??i,evidenceStart:z.evidenceStart??z.detectedAt??i,
    evidence:{top:z.top,bot:z.bot},
    invalidation:{kind:'close_below_zone',level:z.bot},
    meta
  }));

  (row.macro||[]).forEach((z,k)=>push({
    id:'macro:'+i+':'+k+':'+z.state,entityId:'macro:'+(z.evidenceStart??z.detectedAt??i),kind:'snapshot',
    model:'macro',family:'structure',index:i,timestamp:D[i].t,state:z.state,
    detectedAt:z.detectedAt??i,evidenceStart:z.evidenceStart??z.detectedAt??i,
    evidence:{top:z.top,bot:z.bot},
    invalidation:{kind:'close_below_zone',level:z.bot},
    meta
  }));

  (row.bottomSigs||[]).forEach((z,k)=>push({
    id:'sweep:'+i+':'+k,entityId:'sweep:'+i,kind:'event',
    model:'sweep',family:'event',index:i,timestamp:D[i].t,state:'event',
    detectedAt:i,evidenceStart:i,evidence:{label:z.label||'Liquidity Sweep'},meta
  }));

  BASIN_EPISODES.filter(z=>z.end===i).forEach((z,k)=>push({
    id:'basin:'+i+':'+k+':'+z.state,entityId:'basin:'+(z.detectedAt??i),kind:'snapshot',
    model:'basin',family:'structure',index:i,timestamp:D[i].t,state:z.state||'active',
    confidence:z.score,detectedAt:z.detectedAt??i,evidenceStart:z.start??z.detectedAt??i,
    evidence:{top:z.top,bot:z.bot,peakI:z.peakI,features:z.features||{},raw:z.raw||{}},
    meta
  }));

  OSC_FIELDS.filter(z=>z.end===i).forEach((z,k)=>push({
    id:'field:'+i+':'+k+':'+z.state,entityId:'field:'+(z.detectedAt??i),kind:'snapshot',
    model:'field',family:'structure',index:i,timestamp:D[i].t,state:z.state||'active',
    confidence:z.score,detectedAt:z.detectedAt??i,evidenceStart:z.start??z.detectedAt??i,
    evidence:{
      upper0:z.upper0,lower0:z.lower0,upper1:z.upper1,lower1:z.lower1,
      cycles:z.cycles,drift:z.drift,shapeChange:z.shapeChange,
      compression:z.compression,bias:z.bias
    },
    invalidation:{kind:'confirmed_body_break',bars:EXP.spring.breakConfirmBars},
    meta
  }));

  (row.researchSigs||[]).forEach((z,k)=>{
    if(z.k==='echo'&&z.echo){
      push({
        id:'echo:'+i+':'+k,entityId:'echo:'+i,kind:'snapshot',
        model:'echo',family:'analogy',index:i,timestamp:D[i].t,
        state:(z.echo.strength||'weak').toLowerCase(),
        confidence:(z.echo.bestSim||0)*100,detectedAt:i,evidenceStart:z.echo.current?.start??i,
        evidence:{
          length:z.echo.length,threshold:z.echo.threshold,
          strongCount:z.echo.strongCount,bestSim:z.echo.bestSim
        },
        projection:z.echo.backtest?{
          kind:'historical_distribution',
          horizon:z.echo.backtest.horizon,
          sampleMode:z.echo.backtestMode,
          n:z.echo.backtest.n
        }:null,
        metrics:{backtest:z.echo.backtest||null},
        meta
      });
    }else if(z.k==='astro'){
      let upcoming=String(z.label||'').includes('Upcoming');
      push({
        id:'astro:'+i+':'+k,entityId:'astro:'+i,kind:upcoming?'projection':'event',
        model:'astro',family:'external_time',index:i,timestamp:D[i].t,
        state:upcoming?'upcoming':'active',detectedAt:i,evidenceStart:i,
        evidence:{label:z.label||'',detail:z.detail||''},meta
      });
    }
  });

  window.__SL_EVIDENCE__=EVIDENCE;
  return EVIDENCE
}

function researchCalc(){
  if(!D.length)return;
  BASIN_EPISODES=[];
  OSC_FIELDS=[];
  for(let i=0;i<R.length;i++){R[i].researchSigs=[];R[i].researchZones=[]}
  let use={basin:q('modBasin').checked,spring:q('modSpring').checked,echo:q('modEcho').checked,astro:q('modAstro').checked},A=atrArr(D,14);

  // Basin Mapper live lifecycle: LANDING -> FORMING -> ACTIVE -> EXIT.
  if(use.basin){
    let p=EXP.basin,evalStep=D.length>6000?4:D.length>2500?2:1,
        active=null,gap=0,gapLimit=Math.max(2,Math.round(p.floorMin/3)),
        previewState=null,previewEntity=null,previewEvidenceStart=null,lastEval=-1;

    function finishBasin(a,state){
      if(!a)return;
      BASIN_EPISODES.push({
        k:'basin',shape:'basinScore',
        start:a.start,end:a.end,peakI:a.peakI,cliffTop:a.cliffTop,
        top:a.top,bot:a.bot,score:a.best.score,
        features:a.best.features,raw:a.best.raw,
        detectedAt:a.detectedAt,state:state||'active',
        label:'Basin Mapper｜盆地辨識',detail:a.detail
      });
    }

    function recordBasinStage(entityId,state,i,c,confidence,evidenceStart,reason){
      if(!c)return;
      rememberEvidence({
        id:entityId+':'+state+':'+i,entityId,kind:'transition',
        model:'basin',family:'structure',index:i,timestamp:D[i].t,
        state,confidence,detectedAt:i,evidenceStart:evidenceStart??c.fs,
        evidence:{
          top:c.floorHi,bot:c.floorLo,peakI:c.peakI,
          cliffLen:c.cliffLen,floorLen:c.floorLen,
          features:c.features||{},reason:reason||null
        }
      })
    }

    for(let i=Math.max(20,p.floorMin+8);i<D.length;i+=evalStep){
      lastEval=i;
      let best=basinBestCandidate(i,p),pass=best&&best.score>=p.threshold;

      if(pass){
        let detail='ACTIVE '+best.score.toFixed(0)+'｜下山 '+(best.features.dropDepth*100).toFixed(0)+
          '｜平坦 '+(best.features.floorRelief*100).toFixed(0)+
          '｜走平 '+(best.features.floorSlope*100).toFixed(0)+
          '｜中心 '+(best.features.centerStability*100).toFixed(0)+
          '｜尺度 '+best.cliffLen+'→'+best.floorLen;
        let overlaps=active&&best.fs<=active.end+Math.max(evalStep,p.floorMin)&&best.fs>=active.start-Math.max(p.floorMin,evalStep*2);

        if(!active||!overlaps){
          if(active){
            recordBasinStage(active.entityId,'exit',i,active.best,active.best.score,active.evidenceStart,'new_structure');
            finishBasin(active,'exit');
          }

          let entityId=previewEntity||('basin:'+i),
              evidenceStart=previewEvidenceStart??best.fs;
          active={
            start:best.fs,end:i,peakI:best.peakI,cliffTop:best.cliffTop,
            top:best.floorHi,bot:best.floorLo,best,detectedAt:i,detail,
            entityId,evidenceStart
          };
          recordBasinStage(entityId,'active',i,best,best.score,evidenceStart,'threshold_reached');
          previewState=null;previewEntity=null;previewEvidenceStart=null;
          R[i].researchSigs.push({k:'basin',label:'Basin ACTIVE '+best.score.toFixed(0),detail});
        }else{
          active.end=i;active.start=Math.min(active.start,best.fs);
          active.top=Math.max(active.top,best.floorHi);active.bot=Math.min(active.bot,best.floorLo);
          if(best.score>active.best.score){
            active.best=best;active.peakI=best.peakI;active.cliffTop=best.cliffTop;active.detail=detail;
          }
        }
        gap=0;
      }else if(active){
        gap+=evalStep;
        if(gap>gapLimit){
          recordBasinStage(active.entityId,'exit',i,active.best,active.best.score,active.evidenceStart,'evidence_faded');
          finishBasin(active,'exit');active=null;gap=0;
        }
      }else{
        let live=basinLiveStage(i,p,best);
        if(live&&(live.stage==='landing'||live.stage==='forming')){
          let c=live.candidate;
          if(!previewEntity){
            previewEntity='basin:'+i;
            previewEvidenceStart=c.fs;
          }
          if(live.stage!==previewState){
            recordBasinStage(previewEntity,live.stage,i,c,live.confidence,previewEvidenceStart,'early_evidence');
            previewState=live.stage;
          }
        }else{
          previewState=null;previewEntity=null;previewEvidenceStart=null;
        }
      }
    }

    let activeAtEnd=!!active;
    if(active)finishBasin(active,'active');

    if(!activeAtEnd&&D.length){
      let end=D.length-1,live=basinLiveStage(end,p);
      if(live&&live.stage!=='active'){
        let c=live.candidate,label=live.stage==='forming'?'FORMING':'LANDING',
            detail=label+' '+live.confidence.toFixed(0)+'｜下山 '+(c.features.dropDepth*100).toFixed(0)+
              '｜平坦 '+(c.features.floorRelief*100).toFixed(0)+'｜已走 '+c.floorLen+' 根';

        if(end!==lastEval&&live.stage!==previewState){
          if(!previewEntity){previewEntity='basin:'+end;previewEvidenceStart=c.fs}
          recordBasinStage(previewEntity,live.stage,end,c,live.confidence,previewEvidenceStart,'latest_evidence');
          previewState=live.stage;
        }

        BASIN_EPISODES.push({
          k:'basin',shape:'basinScore',
          start:c.fs,end,peakI:c.peakI,cliffTop:c.cliffTop,
          top:c.floorHi,bot:c.floorLo,score:live.confidence,
          features:c.features,raw:c.raw,detectedAt:end,state:live.stage,
          label:'Basin Mapper｜'+label,detail
        });
        R[end].researchSigs.push({k:'basin',label:'Basin '+label+' '+live.confidence.toFixed(0),detail});
      }
    }
  }

  // Oscillation Field lifecycle:
  // oscillation creates the box; only confirmed BODY breakout destroys it.
  if(use.spring){
    let p=EXP.spring,active=null,evalStep=D.length>10000?4:D.length>5000?2:1,
        confirmBars=Math.max(1,Math.round(p.breakConfirmBars)),
        previewState=null,previewEntity=null,previewEvidenceStart=null,lastEval=-1;

    function finishField(a){
      if(!a||a.end<a.detectedAt)return;
      let geom=fieldEpisodeStats(a.lock,a.start,a.end);
      OSC_FIELDS.push({
        k:'spring',shape:'oscillationField',
        start:a.start,end:a.end,lock:a.lock,
        lower0:geom.lower0,upper0:geom.upper0,center0:geom.center0,amp0:geom.amp0,
        lower1:geom.lower1,upper1:geom.upper1,center1:geom.center1,amp1:geom.amp1,
        score:a.birthScore,cycles:a.birthCycles,drift:geom.drift,
        shapeChange:geom.shapeChange,compression:geom.compression,bias:geom.bias,
        containment:1,detectedAt:a.detectedAt,
        state:a.invalidatedAt!=null?'invalidated':'active',
        invalidatedAt:a.invalidatedAt??null,
        breakout:a.breakout||null,
        label:'Oscillation Field｜震盪場'
      });
    }

    function recordFieldStage(entityId,state,i,c,confidence,evidenceStart,extra={}){
      if(!c)return;
      rememberEvidence({
        id:entityId+':'+state+':'+i,entityId,kind:'transition',
        model:'field',family:'structure',index:i,timestamp:D[i].t,
        state,confidence,detectedAt:i,evidenceStart:evidenceStart??c.start,
        evidence:{
          cycles:c.cycles??null,containment:c.containment??null,
          drift:c.drift??null,shapeChange:c.shapeChange??null,
          geometrySmooth:c.geometrySmooth??null,...extra
        },
        invalidation:{kind:'confirmed_body_break',bars:confirmBars}
      })
    }

    for(let i=23;i<D.length;i++){
      if(active){
        active.end=i;
        let side=fieldBodyBreach(active.lock,i);

        if(side!==0){
          if(active.breakSide===side)active.breakRun++;
          else{active.breakSide=side;active.breakRun=1}
          if(active.breakRun>=confirmBars){
            active.invalidatedAt=i;
            active.breakout=side>0?'up':'down';
            recordFieldStage(
              active.entityId,'broken',i,
              {start:active.start,cycles:active.birthCycles,containment:1},
              active.birthScore,active.evidenceStart,
              {breakout:active.breakout,reason:'confirmed_body_break'}
            );
            finishField(active);
            active=null;
            previewState=null;previewEntity=null;previewEvidenceStart=null;
            continue;
          }
        }else{
          active.breakRun=0;
          active.breakSide=0;
        }
        continue;
      }

      if(i%evalStep!==0)continue;
      lastEval=i;
      let c=fieldBestCandidate(i,p);

      if(c&&c.pass){
        let lock=lockFieldGeometry(c),
            entityId=previewEntity||('field:'+i),
            evidenceStart=previewEvidenceStart??c.start;
        active={
          start:c.start,end:i,detectedAt:i,lock,
          birthScore:c.score,birthCycles:c.cycles,
          breakRun:0,breakSide:0,invalidatedAt:null,breakout:null,
          entityId,evidenceStart
        };
        recordFieldStage(entityId,'active',i,c,c.score,evidenceStart,{reason:'field_formed'});
        previewState=null;previewEntity=null;previewEvidenceStart=null;
        R[i].researchSigs.push({
          k:'spring',
          label:'震盪場 FIELD '+c.score.toFixed(0),
          detail:'形態框成立｜'+c.cycles.toFixed(1)+' 回合｜之後只由破界決定失效'
        });
      }else{
        let preview=fieldPreviewState(c,p);
        if(preview&&(preview.state==='seed'||preview.state==='forming')){
          if(!previewEntity){
            previewEntity='field:'+i;
            previewEvidenceStart=c.start;
          }
          if(preview.state!==previewState){
            recordFieldStage(previewEntity,preview.state,i,c,preview.confidence,previewEvidenceStart,{reason:'early_oscillation'});
            previewState=preview.state;
          }
        }else{
          previewState=null;previewEntity=null;previewEvidenceStart=null;
        }
      }
    }

    let activeAtEnd=!!active;
    finishField(active);

    if(!activeAtEnd&&D.length){
      let end=D.length-1,c=fieldBestCandidate(end,p),preview=fieldPreviewState(c,p);
      if(preview&&(preview.state==='seed'||preview.state==='forming')){
        let lock=lockFieldGeometry(c),
            geom=fieldEpisodeStats(lock,c.start,end),
            state=preview.state,
            label=state==='forming'?'FORMING':'SEED';

        if(end!==lastEval&&state!==previewState){
          if(!previewEntity){previewEntity='field:'+end;previewEvidenceStart=c.start}
          recordFieldStage(previewEntity,state,end,c,preview.confidence,previewEvidenceStart,{reason:'latest_oscillation'});
          previewState=state;
        }

        OSC_FIELDS.push({
          k:'spring',shape:'oscillationField',
          start:c.start,end,lock,
          lower0:geom.lower0,upper0:geom.upper0,center0:geom.center0,amp0:geom.amp0,
          lower1:geom.lower1,upper1:geom.upper1,center1:geom.center1,amp1:geom.amp1,
          score:preview.confidence,cycles:c.cycles,drift:geom.drift,
          shapeChange:geom.shapeChange,compression:geom.compression,bias:geom.bias,
          containment:c.containment,detectedAt:end,state,
          invalidatedAt:null,breakout:null,preview:true,
          label:'Oscillation Field｜'+label
        });
        R[end].researchSigs.push({
          k:'spring',
          label:'FIELD '+label+' '+preview.confidence.toFixed(0),
          detail:label+'｜'+c.cycles.toFixed(1)+' 回合｜貼合 '+(c.containment*100).toFixed(0)+'%'
        });
      }
    }
  }

  // Echo: every evaluated bar becomes a causal historical observation.
  if(use.echo){
    let p=EXP.echo,L=Math.max(8,Math.round(p.length)),
        hist=Math.max(L*3,Math.round(p.history)),
        sim=p.similarity,follow=Math.max(1,Math.round(p.followBars)),
        evalStep=Math.max(1,Math.round(L/4)),
        histStep=Math.max(1,Math.round(L/5));

    for(let i=L-1;i<D.length;i++){
      let isLatest=i===D.length-1;
      if(!isLatest&&i%evalStep!==0)continue;

      let cur=candleShape(i,L),all=[],
          start=Math.max(L-1,i-hist),end=i-L;
      if(!cur)continue;

      for(let j=start;j<=end;j+=histStep){
        let hs=candleShape(j,L);
        if(!hs)continue;
        all.push({
          end:j,start:j-L+1,
          sim:candleShapeSimilarity(cur,hs),
          shape:hs,
          forward:echoForwardStats(j,follow,i)
        });
      }
      if(!all.length)continue;

      all.sort((a,b)=>b.sim-a.sim);
      let strong=all.filter(m=>m.sim>=sim),
          best=all[0].sim,
          strength=best>=sim?'STRONG':'WEAK',
          btSource=strong.length?strong:all.slice(0,Math.min(10,all.length)),
          backtest=echoBacktest(btSource,follow);

      rememberEvidence({
        id:'echo:'+i+':observation',entityId:'echo:'+i,kind:'observation',
        model:'echo',family:'analogy',index:i,timestamp:D[i].t,
        state:strength.toLowerCase(),confidence:best*100,
        detectedAt:i,evidenceStart:i-L+1,
        evidence:{length:L,threshold:sim,strongCount:strong.length,bestSim:best},
        projection:backtest?{
          kind:'historical_distribution',horizon:backtest.horizon,
          sampleMode:strong.length?'strong':'nearest',n:backtest.n
        }:null,
        metrics:{backtest}
      });

      let show=isLatest?all.slice(0,4):strong.slice(0,4);
      if(!isLatest&&!strong.length)continue;

      R[i].researchSigs.push({
        k:'echo',
        label:'Echo '+strength+' '+(best*100).toFixed(0),
        detail:'最佳 '+(best*100).toFixed(0)+'%｜門檻以上 '+strong.length+' 次｜後續 '+follow+' bars',
        echo:{
          length:L,threshold:sim,count:strong.length,strongCount:strong.length,
          bestSim:best,strength,followBars:follow,
          backtest,backtestMode:strong.length?'strong':'nearest',
          current:{start:i-L+1,end:i,shape:cur},
          matches:show
        }
      });
    }
  }

  // Astrology Engine: standard western astrology aspect vocabulary.
  if(use.astro){
    let p=EXP.astro,planets=astroPlanets(p.planetSet),angles=aspectAngles(p.aspectSet),prevAspect=new Set(),prevPos=null,prevDir={},lastDay='';
    for(let i=0;i<D.length;i++){
      let day=date(D[i].t);if(day===lastDay)continue;lastDay=day;
      let pos=astroPos(D[i].t),events=[],active=new Set();
      for(let a=0;a<planets.length;a++)for(let b=a+1;b<planets.length;b++){
        let A1=planets[a],B1=planets[b],sep=minAngle(pos[A1],pos[B1]);
        for(let ang of angles){let orb=Math.abs(sep-ang);if(orb<=p.orb){let key=A1+'-'+B1+'-'+ang;active.add(key);if(!prevAspect.has(key))events.push(ASTRO_NAME[A1]+' '+ASPECT_NAME[ang]+' '+ASTRO_NAME[B1]+'（orb '+orb.toFixed(1)+'°）')}}
      }
      if(prevPos&&p.retro==='on'){
        for(let name of planets){if(name==='Sun'||name==='Moon')continue;let dir=angleDiff(pos[name],prevPos[name]),pd=prevDir[name];if(pd!==undefined&&pd>=0&&dir<0)events.push(ASTRO_NAME[name]+' 開始逆行');prevDir[name]=dir}
      }else if(prevPos){for(let name of planets)if(name!=='Sun'&&name!=='Moon')prevDir[name]=angleDiff(pos[name],prevPos[name])}
      if(prevPos&&p.ingress==='on'){
        const signs=['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
        for(let name of planets){let s0=Math.floor(prevPos[name]/30),s1=Math.floor(pos[name]/30);if(s0!==s1)events.push(ASTRO_NAME[name]+' 進入'+signs[s1]+'座')}
      }
      if(events.length){
        let detail=events.slice(0,4).join(' · ')+(events.length>4?' · +'+(events.length-4):'');
        R[i].researchSigs.push({k:'astro',label:'Astrology Engine｜占星盤',detail});
        rememberEvidence({
          id:'astro:'+i+':event',entityId:'astro:'+i,kind:'event',
          model:'astro',family:'external_time',index:i,timestamp:D[i].t,
          state:'event',detectedAt:i,evidenceStart:i,evidence:{detail,eventCount:events.length}
        });
      }
      prevAspect=active;prevPos=pos;
    }

    if(D.length){
      let last=D.length-1,lastT=D[last].t,
          horizon=tf==='1h'||tf==='4h'?14:tf==='1d'?60:tf==='1w'?180:365,
          step=86400,upcoming=[],
          prevP=astroPos(lastT),prevA=new Set(),prevD={};

      for(let a=0;a<planets.length;a++)for(let b=a+1;b<planets.length;b++){
        let A1=planets[a],B1=planets[b],sep=minAngle(prevP[A1],prevP[B1]);
        for(let ang of angles)if(Math.abs(sep-ang)<=p.orb)prevA.add(A1+'-'+B1+'-'+ang);
      }
      let before=astroPos(lastT-step);
      for(let name of planets)if(name!=='Sun'&&name!=='Moon')prevD[name]=angleDiff(prevP[name],before[name]);

      for(let d=1;d<=horizon&&upcoming.length<4;d++){
        let t=lastT+d*step,pos=astroPos(t),events=[],activeA=new Set();
        for(let a=0;a<planets.length;a++)for(let b=a+1;b<planets.length;b++){
          let A1=planets[a],B1=planets[b],sep=minAngle(pos[A1],pos[B1]);
          for(let ang of angles){
            let orb=Math.abs(sep-ang),key=A1+'-'+B1+'-'+ang;
            if(orb<=p.orb){
              activeA.add(key);
              if(!prevA.has(key))events.push(ASTRO_NAME[A1]+' '+ASPECT_NAME[ang]+' '+ASTRO_NAME[B1]);
            }
          }
        }
        if(p.retro==='on'){
          for(let name of planets){
            if(name==='Sun'||name==='Moon')continue;
            let dir=angleDiff(pos[name],prevP[name]),pd=prevD[name];
            if(pd!==undefined&&pd>=0&&dir<0)events.push(ASTRO_NAME[name]+' 開始逆行');
            prevD[name]=dir;
          }
        }
        if(p.ingress==='on'){
          const signs=['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
          for(let name of planets){
            let s0=Math.floor(prevP[name]/30),s1=Math.floor(pos[name]/30);
            if(s0!==s1)events.push(ASTRO_NAME[name]+' 進入'+signs[s1]+'座');
          }
        }
        if(events.length)upcoming.push({t,events:events.slice(0,2)});
        prevA=activeA;prevP=pos;
      }

      if(upcoming.length){
        let detail=upcoming.map(u=>date(u.t)+' '+u.events.join(' / ')).join(' · ');
        R[last].researchSigs.push({k:'astro',label:'Astrology Upcoming｜未來事件',detail});
        rememberEvidence({
          id:'astro:'+last+':upcoming',entityId:'astro:upcoming:'+last,kind:'projection',
          model:'astro',family:'external_time',index:last,timestamp:D[last].t,
          state:'upcoming',detectedAt:last,evidenceStart:last,
          projection:{kind:'astronomy_timing',horizonDays:horizon,events:upcoming},
          evidence:{detail}
        });
      }
    }
  }
  finalizeEvidenceTimeline();
  rebuildEvaluation();
  rebuildEvidence();
  safeDrawModels();
}


  function run(data,options){
    options=options||{};
    D=(data||[]).map(x=>({...x}));
    R=[];BASIN_EPISODES=[];OSC_FIELDS=[];EVIDENCE=[];EVIDENCE_LOG=[];EVIDENCE_ERRORS=[];EVIDENCE_IDS=new Set();EVALUATION=null;INFO={};
    tf=String(options.timeframe||'1d').toLowerCase();
    sourceNote=String(options.source||'');
    market=String(options.market||'CUSTOM');
    ZONE=merge(DEFAULT_ZONE,options.zone||{});
    MACRO=merge(DEFAULT_MACRO,options.macro||{});
    SWEEP=merge(DEFAULT_SWEEP,options.sweep||{});
    EXP=merge(DEFAULT_EXP,options.exp||{});
    ENABLED=merge(DEFAULT_ENABLED,options.enabled||{});

    if(D.length)zoneCalc();
    else resetEvidenceTimeline();

    const params={zone:ZONE,macro:MACRO,sweep:SWEEP,exp:EXP,enabled:ENABLED};
    return{
      engineVersion:VERSION,
      kernelVersion:RK.VERSION,
      parameterFingerprint:parameterFingerprint(params),
      params:clone(params),
      market,timeframe:tf,source:sourceNote,
      rows:R,
      basinEpisodes:BASIN_EPISODES,
      oscillationFields:OSC_FIELDS,
      evidence:EVIDENCE,
      evidenceLog:EVIDENCE_LOG,
      evidenceErrors:EVIDENCE_ERRORS,
      evidenceByModel:window.__SL_EVIDENCE_BY_MODEL__||{},
      evidenceSummary:window.__SL_EVIDENCE_SUMMARY__||{total:0,models:{}},
      evaluation:EVALUATION,
      info:clone(INFO)
    };
  }

  return{
    VERSION,DEFAULT_ZONE,DEFAULT_MACRO,DEFAULT_SWEEP,DEFAULT_EXP,DEFAULT_ENABLED,EVAL_HORIZONS,
    run,parameterFingerprint,atrArr,clamp,fieldBoundaryAt,
    fieldDriftText,fieldCompressionText,fieldBiasText
  };
});
