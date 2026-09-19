# PROJECT_STATE

## Authoritative Strategy Lab repository

- Repository: `azaz17283954200078-cpu/Btc-`
- Default branch: `main`
- Current milestone: G03-R1→R5 technical implementation complete — ready for external human testing; G02/G03 human acceptance remains pending
- M4 Guided Research: completed
- M5 Shared Condition Engine: technical/research validation passed
- M5 product acceptance: not complete until desktop/mobile use is tested by the user

This repository is the source of truth for Strategy Lab. Do not use `strategy-flow`, Quant/策流 V3.2.7, or their UI/CI as Strategy Lab evidence.

## Protected M5 contracts

- Evidence must remain causal / known-through.
- First condition remains the baseline anchor.
- Added conditions use anchor-centric sampling; cumulative N cannot increase.
- Price relations may only filter an anchor episode; they cannot duplicate it or increase N.
- "價格重疊" means actual interval intersection; proximity/tolerance is not silently treated as overlap.
- N < 5 = insufficient, 5–19 = exploratory, N >= 20 = comparable.
- Research output does not become model voting, BUY/SELL, or best-combination ranking.
- MFE, MAE, return distribution, incomplete future observations and failure cases remain research evidence.

## M5-PH02 data coverage hardening
- BTC 1H target: 30,000 bars; BTC 4H target: 20,000 bars.
- Browser exposes `window.__SL_MARKET_COVERAGE__`.
- Interrupted pagination is marked explicitly and is not conflated with low conditional N.

## M5-UI-R01 research-stack architecture
- User approved a major sidebar information-architecture redesign.
- Primary sidebar surface: 研究條件組.
- Full model library: progressively disclosed and collapsed by default.
- Chinese-first labels; English model names and research abbreviations are secondary.
- Chart Core, Model Engine, Condition Engine, causality and anchor-centric sampling are protected and unchanged.
- Product acceptance is still pending real desktop/mobile use.

## M5-UI-R02 relationship funnel
- Condition Engine v1.2 adds explicit relationship semantics: 同時成立、價格區域重疊、掃單價格進入區域.
- Price geometry is read only from causal Evidence already present at that historical time.
- R02 price-aware structures: Support, Macro Bottom, Basin; Sweep contributes its swept interval [low, priorLow].
- Field, Echo and Astrology remain time-only until they have a justified standard price geometry.
- The primary sidebar now owns the operable funnel; Evidence Dock is deeper analysis, not a prerequisite for filtering.
- Closing Evidence details must not clear the active funnel.
- M5 product acceptance remains pending user desktop/mobile testing.

## M5-G01 single-model guidance
- User feedback showed the prerequisite problem comes before the funnel: a person still had to understand model jargon and small research panels before conditional research became useful.
- Primary action is now 「看懂這個模型」; combination research is secondary.
- A pinned model opens a large fixed research workspace on desktop and a full-screen research view on mobile.
- Each model state is explained in a fixed order: 現在看到什麼 → 為什麼模型會這樣判斷 → 接下來觀察什麼.
- 3 / 5 / 10 / 20 K horizons are translated into human time for the active timeframe and explicitly define the comparison as state-confirmation close → Nth future K close.
- MFE / MAE remain available but are explained after plain-language path descriptions.
- Historical cases are promoted to a larger 12-case browser before lifecycle/raw Evidence.
- Conditional research semantics, Chart Core, Model Engine, Evidence, causality, data sources and sample gates are unchanged.
- G01 is not M5 completion. User desktop/mobile acceptance is still required.

## G02-R1 single-model research architecture
- User approved a major information-architecture change before implementation under Constitution Article 23.
- The primary Research sidebar is now one inline single-model inspector. Active-model bricks, the direct funnel, and Evidence Dock are retired from the single-model primary DOM.
- Research focus and chart visibility are separate: `FOCUSED_MODEL` controls what the inspector studies; the existing model checkboxes control what overlays are visible. `shouldRunModel()` lets a focused hidden model still compute Evidence without forcing the overlay on.
- `FOCUSED_EVIDENCE` explicitly distinguishes `now` from `history`. Opening a model always starts at now; no-current-Evidence never silently falls back to a historical case.
- One selected `SINGLE_RESEARCH_HORIZON` controls the outcome view; 3/5/10/20 are not rendered as four competing result cards.
- Historical navigation changes both the selected Evidence and chart viewport, so the graph and explanation refer to the same case.
- Single-model research and conditional research state are decoupled: `SINGLE_RESEARCH_CONTEXT`, `COMBINATION_HANDOFF_CONTEXT`, and `CONDITION_STACK` are explicit separate state domains. Legacy `PINNED_RESEARCH` remains dormant only for the not-yet-rebuilt M5 combination UI helpers.
- A handoff captures market, timeframe, model/state, Evidence reference, selected horizon, setting source, parameter snapshot/fingerprint, engine/kernel version, knownThrough, and data source. Parameter changes invalidate a prepared handoff.
- Shared Model Engine, Research Kernel, Condition Engine v1.2, Evidence schema, causality, sample gates, Runner parity, Chart Core and data sources are unchanged.
- G02-R1 does not complete product acceptance; desktop/mobile user validation is still required before building the dedicated combination workspace.

## G02-R2 research safety
- Source: two G02-R1 user walkthroughs using a high-school social-studies student acceptance role. The product direction remains single-model-first; multi-model expansion is intentionally deferred.
- Global single-model outcomes now show total state cases, completed horizon cases, incomplete cases and sample sufficiency before return percentages.
- Safety labels reuse the existing M5 thresholds: N < 5 insufficient, 5–19 exploratory, N >= 20 comparable. They never mean prediction confidence.
- Macro primary research now displays candidate, confirmed, failed/expired-before-confirmation and unresolved counts together. Macro active is labelled as completed model confirmation rather than an unqualified bottom verdict.
- Astrology primary research explicitly distinguishes external-time hypothesis from price causality; upcoming dates are relative to the loaded data cutoff and compared with the browser current date.
- Astrology exposes event-bar count vs underlying event count and warns that overlapping follow-up windows are not independent evidence.
- Astrology projections are blocked from combination handoff. Historical event Evidence remains eligible.
- Historical case UI distinguishes total cases from the current browse cap.
- Fixed-fixture safety audit: IXIC has Macro candidate=1, confirmed=1, confirmed 10-bar N=1 with upRate=100%; TWII candidate=7, confirmed=3, failed-before-confirm=4, confirmed 10-bar N=3 with upRate=66.7%. These are intentionally treated as insufficient-sample demonstrations, not model performance claims.
- Fixed-fixture Astrology audit found 945 IXIC and 944 TWII event bars plus one upcoming projection record in each run; projection Evidence remains excluded from historical Evaluation.
- Automated safety gates are green, but the Work acceptance guide requires an uninvolved human to complete the blocker tasks without verbal help. Therefore stage-1 product acceptance remains pending.

## G02-R3 through R7 technical completion
- R3: all seven single-model surfaces use the same quantity vocabulary: same-state total, completed observation, incomplete observation, browseable cases/display cap. Model-specific notes define what one case means.
- R4: every model exposes checkable, model-specific Evidence before aggregate outcome statistics. Model Engine 1.2.0 enriches Echo observations with a causal best-match historical range and OHLC similarity components without changing the similarity ranking formula.
- R5: single-model research snapshots persist in browser localStorage (maximum 30). Saved research retains market, timeframe, model/state, Evidence reference/time, horizon, setting source, parameter snapshot/fingerprint, engine/kernel versions, knownThrough and source. Current research is explicitly distinct from saved snapshots.
- R6: a dedicated combination-research tab consumes `COMBINATION_HANDOFF_CONTEXT` and its seeded first `CONDITION_STACK` entry. The first condition is not re-entered. Additional conditions and relationship semantics use Shared Condition Engine v1.2 and knownThrough.
- R7: mobile/tablet stacks chart and research; mobile core controls have touch targets and model research does not depend on hover. Desktop keeps research inline beside the chart rather than covering Chart Core.
- Final guide audit on fixed IXIC/TWII fixtures exercised all seven models and confirmed failure states, incomplete observations, small-N cases, causal Echo trace, and an explicit no-Macro/no-Sweep flat-market scenario.
- Latest branch technical run before documentation: `35431231619` success. All existing M4/M5/G01/G02 contracts, regression, causality, data, model presets and G02 final audit passed.
- Independent human acceptance remains pending because the guide explicitly requires an evaluator who did not participate in development and receives no verbal hints.


## G03-R0 Model Semantics Registry
- Approved G03 direction is stored in `G03_ITERATION_GUIDE.md`; G03 remains subordinate to the Constitution and is executed one major problem per iteration.
- New shared `src/model-semantics.js` v1.0.0 defines the seven models' research type, primary question, claim boundary, normalized states, progression/confirmation/invalidation/exit semantics, standardized price geometry, allowed cross-research relations, directional-claim flag and future Strategy Adapter role boundaries.
- All seven current models explicitly keep `directionalClaim=false`. Model lifecycle/event/analogy/external-time semantics must not be relabelled as future-price success/failure.
- Condition Engine v1.3.0 now reads state/event/observation/terminal classification from the shared registry. Protected R02 behavior remains unchanged: Support/Macro/Basin can use standardized zone overlap; Sweep can use event-range price touch; Field/Echo/Astrology remain time-only.
- The existing single-model research surface now shows the model's research type and claim boundary without adding a new main panel or navigation layer.
- Future strategy capability is recorded but not implemented yet: Echo and Astrology have no standalone Entry; Macro Candidate is not an Entry state; 3+ model simulation remains a future engine-level prohibition per G03 guide.
- G03-R0 CI contract is wired into the main Research Kernel workflow and passed together with all pre-existing M4/M5/G01/G02 gates on PR run `35434017722`.
- R0 does not recalibrate presets, add Reliability scoring, build Runner Observatory, or modify Script/strategy simulation. Those remain later G03 iterations.


## G03-R1 through R5 reliability and blind validation
- R1: every browser/Runner research run gets an immutable Run ID and manifest. Changed market/timeframe/model/preset/params starts a new run; the previous run is not mutated.
- R2: `src/reliability-engine.js` v1.0.0 adds gate-based Reliability: 不足 / 探索 / 可研究 / 較穩健. It uses data integrity, complete N, overlap-clustered N_eff, temporal coverage, semantic lifecycle/counterexamples, chronological OOS and parameter stability.
- R3: Reliability Matrix diagnoses `DATA_SHORTAGE`, `NATURALLY_RARE`, `PARAMETER_TOO_STRICT`, `OVERLAP_HEAVY`, `OOS_SHORTAGE`, `LIFECYCLE_IMBALANCE`, `MODEL_LIMITATION`. Per-context lifecycle transition-count exceptions are warnings; aggregate Evidence density is the monotonic preset gate.
- R4: official preset vocabulary is now 寬鬆 / 平衡 / 嚴格 while legacy IDs sensitive/balanced/selective remain for saved-snapshot compatibility. Preset selection cannot use return/up-rate/MFE/MAE/equity ranking.
- R4 calibration across 8 contexts passed aggregate loose >= balanced >= strict for all seven models and passed local parameter-neighborhood stability.
- R5: chronological 70% calibration / 30% blind validation. Parameter fingerprint must remain frozen before OOS reveal. All 21 presets have OOS coverage; all frozen-fingerprint checks passed.
- Published audit artifact: `research/g03-preset-validation.json`.
- Notable reliability findings are intentionally preserved rather than optimized away: Macro remains naturally rare; Astrology has very large raw N but very small N_eff because events and forward windows cluster.
- No Strategy Adapter / simulation work is included in R1-R5. Chart Core, Evidence schema, model worldview and no-lookahead remain protected.
- External desktop/mobile no-hint use is the next product evidence. Technical pass is not human acceptance.
