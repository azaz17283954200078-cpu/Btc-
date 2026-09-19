# PROJECT_STATE

## Authoritative Strategy Lab repository

- Repository: `azaz17283954200078-cpu/Btc-`
- Default branch: `main`
- Current milestone: M5 product acceptance hardening — G01 single-model guidance
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
