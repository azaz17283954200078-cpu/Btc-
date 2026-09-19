# PROJECT_STATE

## Authoritative Strategy Lab repository

- Repository: `azaz17283954200078-cpu/Btc-`
- Default branch: `main`
- Current milestone: M5 Conditional Research product acceptance hardening
- M4 Guided Research: completed
- M5 Shared Condition Engine: technical/research validation passed
- M5 product acceptance: not complete until desktop/mobile use is tested by the user

This repository is the source of truth for Strategy Lab. Do not use `strategy-flow`, Quant/策流 V3.2.7, or their UI/CI as Strategy Lab evidence.

## Protected M5 contracts

- Evidence must remain causal / known-through.
- First condition remains the baseline anchor.
- Added conditions use anchor-centric sampling; cumulative N cannot increase.
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
