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

## M5-UI-R01 — 研究條件組架構重構

- **發現什麼**：原本側欄同時承擔模型教學、模型開關、參數入口、單一證據研究與條件組合，七張長模型卡長期佔據第一層，造成「先選模型」與「正在研究什麼」混在一起。
- **為什麼選它**：使用者明確要求模型磚與整體 UI 大改，並已同意「主圖不變、研究條件組為主、模型庫按需展開」方案；符合憲法第 2、3、4、17、18、23 條。
- **改了什麼**：側欄第一層改為研究條件組；正在開啟的模型用動態模型磚呈現；模型庫預設收起；每顆磚可研究證據、調整設定、關閉模型；條件角色與歷史案例直接回到模型磚；主要術語改為中文優先，英文模型名與 MFE/MAE 僅作第二層識別。
- **保護區**：Chart Core、三層 Canvas、Shared Model Engine、Condition Engine、Evidence schema、known-through、anchor-centric sampling、sample gate 均不改。
- **預先驗證**：inline JavaScript 與 M4/M5 UI 契約可解析後才提交。
- **CI**：pending.
- **產品驗收**：pending；技術通過不等於使用者已接受新介面。
