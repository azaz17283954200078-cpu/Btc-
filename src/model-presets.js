(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabModelPresets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='1.0.0-validated';
  const PRESETS={
    support:[
      {id:'sensitive',title:'較早看見',intent:'縮短低點比較範圍，讓較小的支撐結構也能進入研究。',config:{zone:{pivot:3,atr:14,width:.72,breakAtr:.42}}},
      {id:'balanced',title:'平衡觀察',intent:'保留目前模型的預設尺度，適合作為第一個研究起點。',config:{zone:{pivot:5,atr:14,width:.8,breakAtr:.5}}},
      {id:'selective',title:'只看明顯支撐',intent:'要求低點相對更長的過去區間成立，減少短促支撐候選。',config:{zone:{pivot:10,atr:14,width:.9,breakAtr:.6}}}
    ],
    macro:[
      {id:'sensitive',title:'較早觀察',intent:'降低回撤與波動門檻，讓更多深跌後的候選進入觀察。',config:{macro:{p:{
        '1h':{dd:.08,atrX:1.05,confirm:30},'4h':{dd:.11,atrX:1.05,confirm:22},'1d':{dd:.15,atrX:1.05,confirm:16},
        '1w':{dd:.24,atrX:1.02,confirm:8},'1m':{dd:.24,atrX:1.00,confirm:6}
      }}}},
      {id:'balanced',title:'平衡確認',intent:'使用目前預設的回撤、波動與確認期限。',config:{macro:{}}},
      {id:'selective',title:'嚴格確認',intent:'要求更深回撤與更明顯的波動擴張，只留下較少候選。',config:{macro:{p:{
        '1h':{dd:.12,atrX:1.22,confirm:20},'4h':{dd:.17,atrX:1.22,confirm:15},'1d':{dd:.24,atrX:1.20,confirm:10},
        '1w':{dd:.32,atrX:1.12,confirm:6},'1m':{dd:.32,atrX:1.08,confirm:4}
      }}}}
    ],
    sweep:[
      {id:'sensitive',title:'小幅掃低也看',intent:'縮短舊低點回看範圍，並降低收盤位置要求，事件會比較多。',config:{sweep:{lookback:{'1h':24,'4h':24,'1d':18,'1w':12,'1m':8},minClosePosition:.45}}},
      {id:'balanced',title:'典型掃單',intent:'使用目前的回看尺度與 55% 收盤位置門檻。',config:{sweep:{lookback:{'1h':48,'4h':42,'1d':30,'1w':20,'1m':12},minClosePosition:.55}}},
      {id:'selective',title:'只看明顯假跌破',intent:'回看更久的低點，並要求 K 棒收回到更高位置。',config:{sweep:{lookback:{'1h':72,'4h':60,'1d':45,'1w':30,'1m':18},minClosePosition:.68}}}
    ],
    basin:[
      {id:'sensitive',title:'短期整理',intent:'較短的平盤也能被研究，門檻較寬鬆，候選通常較多。',config:{exp:{basin:{floorMin:6,floorMax:50,cliffMax:40,threshold:56}}}},
      {id:'balanced',title:'平衡盆地',intent:'兼顧短期與較完整的下山後走平結構。',config:{exp:{basin:{floorMin:10,floorMax:80,cliffMax:60,threshold:60}}}},
      {id:'selective',title:'大型盆地',intent:'忽略較短整理，要求更長的平盤尺度；分數門檻維持可研究範圍。',config:{exp:{basin:{floorMin:12,floorMax:120,cliffMax:90,threshold:60}}}}
    ],
    field:[
      {id:'sensitive',title:'容易成形',intent:'允許較少震盪回合與較寬幾何變化，較早產生場域。',config:{exp:{spring:{minCycles:1.5,maxCoreShiftPct:90,maxShapeChangePct:85,minFitPct:72,breakConfirmBars:2}}}},
      {id:'balanced',title:'平衡場域',intent:'使用目前預設的震盪、貼合與幾何限制。',config:{exp:{spring:{minCycles:2,maxCoreShiftPct:65,maxShapeChangePct:60,minFitPct:82,breakConfirmBars:2}}}},
      {id:'selective',title:'高純度震盪',intent:'要求更多來回、更高貼合、較小幾何變形，場域會更少。',config:{exp:{spring:{minCycles:3,maxCoreShiftPct:45,maxShapeChangePct:40,minFitPct:90,breakConfirmBars:3}}}}
    ],
    echo:[
      {id:'sensitive',title:'短型態・較多回聲',intent:'用較短 K 線片段與較低相似門檻，增加強回聲樣本。',config:{exp:{echo:{length:20,history:1000,similarity:.72,followBars:12}}}},
      {id:'balanced',title:'平衡回聲',intent:'用 32 根 K 線與 82% 強回聲門檻，保留目前預設作為中間尺度。',config:{exp:{echo:{length:32,history:1000,similarity:.82,followBars:12}}}},
      {id:'selective',title:'長型態・高相似',intent:'拉長型態並維持較高相似要求，只留下比平衡設定更少但仍可研究的強回聲。',config:{exp:{echo:{length:40,history:1500,similarity:.82,followBars:12}}}}
    ],
    astro:[
      {id:'selective',title:'主要緊張事件',intent:'只看傳統七曜的合、刑、沖，並縮小 Orb，事件較少。',config:{exp:{astro:{planetSet:'classic',aspectSet:'hard',orb:2,retro:'off',ingress:'off'}}}},
      {id:'balanced',title:'傳統主要相位',intent:'使用傳統七曜與主要相位，維持目前預設事件密度。',config:{exp:{astro:{planetSet:'classic',aspectSet:'major',orb:4,retro:'off',ingress:'off'}}}},
      {id:'sensitive',title:'較廣事件集',intent:'加入三王星、較寬 Orb、逆行與入座事件，事件會更多。',config:{exp:{astro:{planetSet:'modern',aspectSet:'major',orb:6,retro:'on',ingress:'on'}}}}
    ]
  };
  const VALIDATION={
  "validatedAt": "2026-09-19",
  "basis": "Research Runner semantic-fit validation; counts are primary-state occurrences, n10 is completed 10-bar outcomes. Presets were not selected by return ranking.",
  "contexts": [
    {
      "market": "BTC",
      "timeframe": "1d",
      "bars": 1800
    },
    {
      "market": "BTC",
      "timeframe": "1w",
      "bars": 700
    },
    {
      "market": "IXIC",
      "timeframe": "1d",
      "bars": 1800
    },
    {
      "market": "TWII",
      "timeframe": "1d",
      "bars": 1800
    },
    {
      "market": "IXIC",
      "timeframe": "1w",
      "bars": 700
    },
    {
      "market": "TWII",
      "timeframe": "1w",
      "bars": 700
    },
    {
      "market": "IXIC",
      "timeframe": "1m",
      "bars": 300
    },
    {
      "market": "TWII",
      "timeframe": "1m",
      "bars": 300
    }
  ],
  "models": {
    "support": {
      "primaryState": "potential",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          415,
          332,
          222
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 415,
          "n10": 412,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 332,
          "n10": 326,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 222,
          "n10": 220,
          "contextsWithSamples": 8,
          "errors": 0
        }
      }
    },
    "macro": {
      "primaryState": "candidate",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          85,
          52,
          39
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 85,
          "n10": 85,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 52,
          "n10": 52,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 39,
          "n10": 39,
          "contextsWithSamples": 7,
          "errors": 0
        }
      }
    },
    "sweep": {
      "primaryState": "event",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          212,
          133,
          82
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 212,
          "n10": 211,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 133,
          "n10": 133,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 82,
          "n10": 82,
          "contextsWithSamples": 8,
          "errors": 0
        }
      }
    },
    "basin": {
      "primaryState": "active",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          109,
          57,
          43
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 109,
          "n10": 109,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 57,
          "n10": 57,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 43,
          "n10": 43,
          "contextsWithSamples": 5,
          "errors": 0
        }
      }
    },
    "field": {
      "primaryState": "active",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          246,
          140,
          25
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 246,
          "n10": 243,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 140,
          "n10": 137,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 25,
          "n10": 24,
          "contextsWithSamples": 5,
          "errors": 0
        }
      }
    },
    "echo": {
      "primaryState": "strong",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          519,
          20,
          14
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 519,
          "n10": 510,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 20,
          "n10": 20,
          "contextsWithSamples": 7,
          "errors": 0
        },
        "selective": {
          "count": 14,
          "n10": 14,
          "contextsWithSamples": 5,
          "errors": 0
        }
      }
    },
    "astro": {
      "primaryState": "event",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          7977,
          6836,
          3436
        ],
        "pass": true
      },
      "presets": {
        "selective": {
          "count": 3436,
          "n10": 3403,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 6836,
          "n10": 6766,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "sensitive": {
          "count": 7977,
          "n10": 7898,
          "contextsWithSamples": 8,
          "errors": 0
        }
      }
    }
  }
};
  function list(model){return (PRESETS[model]||[]).map(x=>JSON.parse(JSON.stringify(x)))}
  function get(model,id){return list(model).find(x=>x.id===id)||null}
  function validation(model,id){return VALIDATION.models[model]&&VALIDATION.models[model].presets[id]?JSON.parse(JSON.stringify(VALIDATION.models[model].presets[id])):null}
  return{VERSION,PRESETS,VALIDATION,list,get,validation};
});
