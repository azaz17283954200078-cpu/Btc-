# Strategy Lab G03｜研究可信度、資料工程與策略實驗迭代指南

> Status: approved product direction.  
> Repository: `azaz17283954200078-cpu/Btc-`  
> G03 must remain subordinate to `CONSTITUTION.md`.  
> G02 human acceptance and M5 product acceptance remain separate pending items; G03 technical work does not erase them.

---

## 1. G03 mission

G03 answers three questions that G02 intentionally did not solve:

1. **這批 Evidence 到底夠不夠研究？**
2. **資料薄弱時，原因是資料不足、事件天然稀有、案例不獨立，還是 preset 過嚴？**
3. **已完成的模型研究，如何在不把模型偷換成預測器的前提下，轉成有限、可追溯的歷史模擬交易？**

Target flow:

```text
Market Data
  ↓
Shared Model Engine
  ↓
Normalized Evidence
  ↓
Model Semantics
  ↓
Single / Cross Research
  ↓
Reliability
  ↓
Preset Calibration
  ↓
Strategy Adapter
  ↓
Simulation Runner
  ↓
Trade Replay
```

核心原則：

> **研究層保持自由；策略層刻意限制自由度。**

---

## 2. Constitutional constraints

G03 不得因為樣本量、漂亮回測或策略便利而破壞以下契約：

- Chart Core model-independent.
- Same Evidence supports chart / research / cross research / future strategy simulation.
- Strategy layer不得重新發明一套 Support / Macro / Sweep 判斷。
- `detectedAt` / first-known semantics must remain causal.
- No look-ahead.
- Model state progression / invalidation is not the same thing as future price profit/loss.
- No BUY / SELL recommendation is added to model research.
- Preset calibration may not maximize historical return or win rate.
- Rare-event models may remain statistically thin even when raw history is complete.
- More conditions do not imply stronger evidence.
- Important outputs remain traceable to market data, model version, parameters, Evidence and run metadata.
- Technical CI pass does not equal uninvolved-human product acceptance.
- Any new major navigation/layout change still obeys Constitution Article 23.

---

## 3. Fixed terminology

### 3.1 Model semantics

Lifecycle models:
- 候選
- 成形
- 確認
- 有效
- 失效
- 退出
- 過期
- 尚未完成

Event models:
- 事件發生
- 事件未發生

Analogy models:
- 高相似度
- 中等相似度
- 低相似度

Market outcome:
- X 根 K 後收盤較高 / 較低
- 歷史中位變化
- MFE
- MAE

研究層避免使用「模型成功率／模型失敗率」。

### 3.2 Presets

G03 calibration publication uses exactly:

- **寬鬆**
- **平衡**
- **嚴格**

名稱只描述條件寬嚴與 Evidence 密度，不代表預測準確度、安全程度或未來績效。

---

# 4. G03-R0｜Model Semantics Registry

## Goal

建立七模型的唯一研究語意來源，先回答：

> 這個模型到底聲稱了什麼？

Registry needs at least:

- model
- researchType
- conditionMode
- primaryQuestion
- claim
- states
- progressionStates
- confirmationStates
- invalidationStates
- exitStates
- terminalStates
- projectionStates
- standardized price geometry
- directionalClaim
- allowed cross-research relations
- future Strategy Adapter capability boundaries

## Initial classification

| Model | Type | Core claim |
|---|---|---|
| Support | lifecycle | 支撐結構形成、驗證、失效 |
| Macro | lifecycle | 深跌／波動後是否完成收復確認 |
| Sweep | event | 舊低被刺破後重新收回的事件 |
| Basin | lifecycle | 下跌後盆地結構逐步形成與離開 |
| Field | lifecycle | 震盪場逐步形成與破界 |
| Echo | analogy | 現在形狀與歷史片段相似程度 |
| Astrology | external_time | 外部時間事件與市場分布的可否證關聯 |

All current models:
- `directionalClaim = false`

Important distinctions:
- Macro Candidate ≠ confirmed bottom.
- Sweep event ≠ successful reversal.
- Echo Strong ≠ future replay.
- Astrology event ≠ causality.

## Protected R02 relation semantics

The registry documents current standardized relations but does not broaden them silently:

- Support / Macro / Basin: `time`, `price_overlap`
- Sweep: `time`, `price_touch`
- Field / Echo / Astrology: `time`

Field may have internal geometry, but it remains **non-standardized for Condition Engine price relations** until a separate justified contract exists.

---

# 5. G03-R1｜Runner Observatory

## Product role

Runner Observatory is:

> **研究過程的觀察窗，不是可任意干預的後台控制台。**

Every run gets an immutable Run Manifest:

- Run ID
- market
- timeframe
- source
- data range
- data cutoff
- knownThrough
- model
- model version
- kernel version
- preset
- full parameter snapshot
- parameter fingerprint
- Reliability Standard version
- start time
- run state

Once running:

> 🔒 本次研究條件已鎖定

## User can observe

- current phase
- processed bars
- Evidence count
- lifecycle-building status
- warnings
- data gaps
- current parameter snapshot
- source / cutoff
- future Reliability gate progress

## User cannot mutate the active run

No in-place changes to:

- threshold
- lookback
- preset
- market
- timeframe
- selected historical exclusion
- observation horizon used by that run
- Evidence deletion

Any change creates a **new Run ID**.

## Education

Runner phase explanations teach:
- chronological scanning
- first-known time
- no-lookahead
- why a new parameter set becomes a new experiment

---

# 6. Calibration blind mode

During preset calibration, do not expose outcome performance while choosing parameters.

Visible:
- Evidence N
- complete / incomplete
- lifecycle distribution
- N_eff
- time coverage
- event density
- parameter-to-density response

Hidden until freeze:
- return ranking
- “best win rate”
- equity curve
- outcome-based winner

Copy:

> 🔒 後續市場結果在參數凍結後揭露。

This prevents manual data snooping.

---

# 7. G03-R2｜Research Reliability Standard v1

Do not produce a single pseudo-precise score such as 82/100.

Use gate-based Reliability.

## Gates

### A. Data Integrity
Check:
- missing bars
- duplicated bars
- ordering
- valid OHLC
- timeframe aggregation
- timezone consistency
- source interruption
- latest-bar completeness

A failed Data Integrity gate cannot be averaged away.

### B. Complete Sample
Primary quantity:
- `N_complete`

Initial sample bands:

| N complete | Quantity interpretation |
|---:|---|
| 0–4 | 個案級 |
| 5–19 | 探索 |
| 20–49 | 初步可比較 |
| 50–99 | 較充足 |
| 100+ | 大量案例 |

This is sample-size description only, not final reliability.

### C. Effective Independence
Introduce:
- `N_eff`

Highly overlapping forward-observation windows or repeated same-episode records must not be treated as fully independent experiments.

Always show both:
- raw N
- effective N

### D. Historical Coverage
Measure at least:
- history span
- year dispersion
- broad trend/regime coverage
- volatility-regime coverage

Regime classification is analysis metadata; it may not change what Evidence existed historically.

### E. Semantics-specific lifecycle / counterexample coverage

Lifecycle models inspect relevant progression / terminal paths.

Examples:
- Macro: Candidate / Confirmed / Broken-or-Expired / unresolved
- Support: Potential / Candidate / Validated / Broken
- Basin: Landing / Forming / Active / Exit
- Field: Seed / Forming / Active / Broken

Event / observation models must not be forced into fake failure labels.

- Sweep: event N, N_eff, temporal coverage, forward completeness
- Echo: Strong / Weak, comparable fragments, repeated-reference concentration
- Astrology: event count, event bars, clustering, N_eff, time coverage, OOS, projection separation

### F. OOS
Time-series split only; do not random-shuffle future and past.

First implementation may use:
- calibration history
- later blind validation history

Walk-forward may come later.

### G. Parameter Stability
A publishable preset should exist in a reasonable parameter neighborhood, not at one isolated “magic” value.

---

# 8. Overall Reliability levels

Final labels:

- **不足**
- **探索**
- **可研究**
- **較穩健**

No 0–100 score.

A large raw N cannot override:
- low N_eff
- poor historical coverage
- missing OOS
- data-integrity failure
- severe parameter instability

---

# 9. Rare-event rule

Raw history completeness and statistical sufficiency are separate.

Example:

> BTC full history may be completely loaded, while Macro still has few truly macro episodes.

Allowed message:

> 歷史資料已完整涵蓋目前可用期間，但此模型研究的是稀有事件，因此有效樣本仍有限。

Forbidden behavior:

> Loosen Macro until it stops being Macro merely to reach N=50.

---

# 10. G03-R3｜Reliability Matrix / Dataset Audit

Matrix key:

```text
Model
└── Preset
    └── Market
        └── Timeframe
            └── State
```

Each cell records at least:

- N_total
- N_complete
- N_incomplete
- N_eff
- date_start
- date_end
- history_span
- temporal/regime coverage
- lifecycle distribution where applicable
- OOS N
- OOS N_eff
- parameter stability
- data integrity
- reliability level
- reliability reasons
- standard version

## Weakness classification

Every weak cell must explain why.

- `DATA_SHORTAGE`
- `NATURALLY_RARE`
- `PARAMETER_TOO_STRICT`
- `OVERLAP_HEAVY`
- `OOS_SHORTAGE`
- `LIFECYCLE_IMBALANCE`
- `MODEL_LIMITATION`

Only actual parameter problems go directly into calibration.

---

# 11. Matrix explanation UI

The matrix may use compact labels, but every cell must be expandable.

Example:

```text
Macro · 平衡 · BTC 1D
Reliability：探索

同狀態總案例        18
完整觀察            15
有效獨立案例         8
確認前失效／過期     4
歷史跨度            10.8 年
OOS 完整案例          5

✓ 原始資料完整
✓ 同時存在確認與失效樣本
△ N_eff 偏低
△ OOS 仍薄
```

Reliability Standard itself is versioned and inspectable.

---

# 12. G03-R4｜Preset Calibration

Rename public preset vocabulary to:

- 寬鬆
- 平衡
- 嚴格

Calibration objective is **not** return maximization.

Priorities:
1. preserve model worldview
2. sensible Evidence count
3. complete lifecycle coverage
4. cross-market behavior not pathological
5. timeframe behavior explainable
6. raw N vs N_eff not severely misleading
7. stable parameter neighborhood
8. understandable loose / balanced / strict progression

Expected monotonicity:

> `N 寬鬆 ≥ N 平衡 ≥ N 嚴格`

Violations require audit, not silent acceptance.

---

# 13. G03-R5｜Blind / OOS Validation

After calibration:

- freeze parameter snapshot
- freeze preset candidate version
- record calibration cutoff
- fingerprint parameters

Only then reveal validation outcomes.

If validation is poor:
- do not silently mutate the same preset
- create a new preset candidate
- rerun the research protocol

Formal published preset record includes:
- model version
- preset version
- calibration range
- validation range
- markets tested
- timeframes tested
- N / N_eff / OOS N
- known limitations
- Reliability Standard version

---

# 14. G03-R6｜Cross Research Reliability

Research freedom remains open.

## Standard path
Default to:
- A + B

A is Anchor / base Evidence.
B is an added condition.

## Advanced research
3+ conditions remain allowed for **research**.

Every added condition must recompute:
- N
- N_complete
- N_eff
- coverage
- OOS
- Reliability
- shrink ratio

Do not write “signal strengthened”.

Write:
> 加入一個篩選條件。

Example:

```text
Support        N_eff 48｜可研究
+ Sweep        N_eff 27｜可研究
+ Echo         N_eff 11｜探索
+ Astrology    N_eff  4｜不足
```

Research freedom is not simulation freedom.

---

# 15. G03-R7｜Strategy Adapter Registry / 策略實驗

The existing Script area becomes, for normal users:

> **策略實驗**

Free-form code may remain as an advanced surface later, but the primary workflow is a constrained rule builder based on shared Evidence.

## Strategy capability by model

Initial intended boundary:

| Model | Entry source | Filter / context | Exit source |
|---|---|---|---|
| Support | Validated-derived choices | Candidate / Validated | Broken-derived choices |
| Macro | Active only, not Candidate | Candidate / Active | Broken-derived choices |
| Sweep | completed Sweep event | Event | limited event-specific exits / fixed horizon |
| Basin | Active | Forming / Active | Exit |
| Field | Active with defined rule | Forming / Active | Broken |
| Echo | **no standalone Entry** | Strong | no standalone Exit |
| Astrology | **no standalone Entry** | Event only | no standalone Exit |

Detailed Entry/Exit variants are implemented only after each model's semantics are checked.

---

# 16. Simulation eligibility

This is a deliberate product constraint.

| Research structure | Research | Simulation |
|---|---:|---:|
| Single model | yes | yes |
| Two models | yes | yes |
| 3+ models | yes | **no** |

The simulation engine itself must reject 3+ model strategies; hiding the button is not enough.

Reason:
- reduce condition-mining freedom
- reduce extreme sample collapse
- keep every simulated trade explainable

---

# 17. Single-model strategy experiment

Fixed structure:

```text
Model
↓
寬鬆 / 平衡 / 嚴格
↓
Choose one Entry
↓
Choose one Exit
↓
Run simulation
```

No arbitrary Boolean expression in the normal path.

Model-specific Entry/Exit menus contain only semantically justified choices.

---

# 18. Dual-model strategy experiment

Fixed semantics:

- A = primary model
- B = Filter / Context only

A owns:
- Entry
- Exit

B may answer:
> A 準備進場時，B 是否也符合指定條件？

B does **not** own, in the first version:
- a second Entry system
- Exit
- position sizing

Every A+B result must display the A-only baseline.

Example:

```text
Support only
47 trades
N_eff 35

Support + Sweep
16 trades
N_eff 12
```

The product should teach what B changed, not merely show a prettier equity curve.

---

# 19. 3+ model research

Example:

```text
Support + Sweep + Echo + Astrology
```

Allowed:
- Evidence funnel
- historical cases
- Reliability
- outcome distribution

Not allowed:
- strategy simulation

User-facing explanation:

> 目前 Strategy Lab 的模擬交易限制為單模型或雙模型。多模型交叉會快速增加條件選擇自由度並縮小樣本，因此保留為研究用途。

---

# 20. G03-R8｜Simulation Runner

Every simulation gets a Strategy Run Manifest:

- Strategy Run ID
- market
- timeframe
- primary model
- preset
- model version
- Evidence / parameter fingerprint
- Entry rule
- optional second-model filter
- relation
- Exit rule
- execution model
- cost model
- data cutoff
- runner version

## First-version constraints

- long only
- no short
- one entry
- one exit
- no averaging down
- no pyramiding
- no scale-in
- no scale-out
- no leverage
- one active position per strategy
- new Entry signals during an open trade are ignored by default

## Execution causality

If Evidence becomes known only at bar close:

> signal known at close → simulated execution at next bar open

Same rule applies to Exit unless a model-specific execution contract explicitly says otherwise.

---

# 21. Simulation output

At strategy layer only, show:

- total simulated trades
- completed trades
- open/incomplete trades
- profitable trades
- losing trades
- profitable-trade proportion
- median trade return
- average trade return
- MFE
- MAE
- median / average holding bars
- maximum historical drawdown
- maximum consecutive losses
- OOS result

Avoid the label:
- 策略成功率

Prefer:
- 獲利交易比例 X / N

Every percentage must keep N visible.

---

# 22. Trade Replay

Every historical simulated trade must be inspectable.

A trade answers:

1. **為什麼進？**
2. **為什麼出？**
3. **中間發生什麼？**

Trace includes:
- Entry Evidence ID
- Entry rule
- signal-known bar
- simulated execution bar
- MFE
- MAE
- holding bars
- lifecycle changes
- Exit reason
- Exit Evidence / rule
- historical simulated return

Chart and explanation must synchronize.

---

# 23. Model Reliability vs Strategy Reliability

They are separate.

Example:

```text
Support 平衡
Model Reliability：較穩健

Support 回踩 + Broken Exit
Strategy Reliability：可研究

Support + Sweep filter
Strategy Reliability：探索
```

A rich model database does not guarantee a particular Entry/Exit combination has enough simulated trades.

Strategy Reliability should consider at least:
- complete-trade N
- trade N_eff
- overlapping exposure
- time coverage
- OOS trades
- cost sensitivity
- rule stability
- parameter dependency

No 0–100 strategy confidence score.

---

# 24. G03-R9｜Device & Human Acceptance

Technical tests are necessary but insufficient.

A no-hint evaluator should be able to:

- identify model research type
- explain model invalidation vs later price loss
- inspect an active Runner and its frozen settings
- explain why active-run parameters cannot be changed in place
- inspect a weak Reliability Matrix cell and identify the reason
- explain raw N vs N_eff
- explain why large N may still be weak
- understand 寬鬆 / 平衡 / 嚴格 without assuming strict = more accurate
- build one single-model simulation
- identify why a simulated trade entered and exited
- build one dual-model simulation
- explain A vs B roles
- add a third model to research
- observe that simulation is unavailable for 3+ models and explain why
- complete core tasks on mobile without hover

---

# 25. Technical acceptance gates

## Evidence
- stable Evidence ID semantics
- detectedAt / first-known preserved
- Strategy does not recalculate model worldview

## Reliability
- deterministic
- versioned
- explainable
- same inputs → same result
- N_eff <= raw N

## Presets
- loose/balanced/strict density ordering is audited
- outcome leakage forbidden in calibration

## OOS
- validation data cannot select the preset it later validates

## Cross research
- anchor-centric
- adding AND conditions cannot increase cumulative sample N

## Strategy
- no Entry before Evidence is knowable
- second model in two-model simulation is Filter/Context only
- 3+ model simulation rejected by engine
- Chart Core unchanged

---

# 26. Explicitly out of scope for G03

Do not add:

- AI “best strategy” recommendation
- automated return maximization
- automated stop-loss / take-profit optimization
- return-ranked grid-search leaderboard
- arbitrary position sizing
- leverage
- short selling
- martingale
- pyramiding
- unrestricted AND/OR normal strategy builder
- 3+ model strategy backtest
- broker execution
- live order routing
- investment recommendation

G03 is a **research and historical simulation environment**, not an automated trading system.

---

# 27. Iteration order

Execute in this order unless a discovered correctness issue requires stopping:

1. **R0 Model Semantics Registry**
2. **R1 Runner Observatory**
3. **R2 Reliability Standard v1**
4. **R3 Dataset Audit / Reliability Matrix**
5. **R4 Preset Calibration: 寬鬆 / 平衡 / 嚴格**
6. **R5 Blind / OOS Validation**
7. **R6 Cross Research Reliability**
8. **R7 Strategy Adapter / 策略實驗**
9. **R8 Simulation Runner / Trade Replay**
10. **R9 Device & Human Acceptance**

Constitution Article 18 still applies:

> 每輪自主迭代只處理一個大型問題，或 2–3 個高度相關的小問題。

Therefore G03 is a stage, not a license to implement R0–R9 in one unreviewed code change.

---

# 28. G03 completion definition

G03 is complete only when:

- every model knows what kind of claim it makes
- every dataset can explain why it is sufficient or insufficient
- weak-data diagnoses distinguish raw-data shortage from rare events, overlap and parameter problems
- every official preset has a research history and OOS validation record
- every Runner result is reproducible
- every added cross condition exposes its sample cost
- research may stay open-ended, while strategy simulation is constrained
- single-model and dual-model research can become limited historical simulation
- 3+ model research cannot become simulation
- every simulated trade can be traced back to causal Evidence
- model state outcomes and trade profit/loss are never presented as the same concept
- desktop/mobile human acceptance remains separately evidenced
