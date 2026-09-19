# ITERATION_LOG

## M5-PH01 — Condition bricks and Sample Funnel

- **Goal**: make conditional stacking understandable without changing M5 research semantics.
- **Changes**: add shared cumulative Sample Funnel output; replace condition chips with model/condition bricks; show N before/after every added condition, retained ratio and largest bottleneck; expose per-brick model parameter entry; show prospective N before adding a companion; distinguish anchor scarcity, condition-overlap loss and incomplete future observations; add mobile layout rules.
- **Research semantics**: unchanged — AND stacking, anchor-centric episodes, same anchor baseline, causal known-through filtering.
- **Pre-commit validation**: modified Condition Engine, UI inline JavaScript and test files compile successfully in syntax checks.
- **Tests added**: deterministic monotonic funnel fixture [2, 2, 1], per-stage removed counts, UI contract for bricks/funnel/mobile diagnostics.
- **CI**: GitHub Actions `Research Kernel checks` run `35415923867` — success. All kernel/model/runner/M5 causality/market-data/regression/M4+M5 UI/preset gates passed.
- **Completion layer**: code/product hardening only; user product acceptance remains pending.

## M5-PH02 — Research data coverage hardening

- **Goal**: distinguish true history-fetch shortage from sparse conditional overlap before expanding data blindly.
- **Changes**: raise BTC 1H research target from 20,000 to 30,000 bars; keep 4H at 20,000; make paginated Binance fetch resilient after partial success; expose requested/returned bars, target reached, history exhausted and fetch interruption; surface coverage reason inside M5 diagnostics.
- **Research semantics**: no change to Evidence, condition sampling, baseline, horizons or sample gates.
- **Pre-commit validation**: modified inline JavaScript compiles; market-data contract extended.
- **CI**: GitHub Actions `Research Kernel checks` run `35416124373` — success. Market-data, kernel/model/runner, M5 causality, regression, M4/M5 UI and preset gates all passed.
- **Completion layer**: data/technical hardening; product acceptance remains pending.
