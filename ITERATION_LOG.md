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
- **CI**：首次 run `35417038345` 未通過；失敗點是 M4 UI 契約仍要求舊文案「MFE 是途中曾向上走到多遠」，而本輪已依中文優先原則改為「途中最大上漲幅度（MFE）」。在該失敗前 Research Kernel、Model Engine、M5 Condition Engine、Runner parity、real-market causality、market-data、regression、architecture contract 均已通過。同步更新這個刻意變更的 UI 文案契約後，第二次 run `35417075349` 全部通過。
- **產品驗收**：pending；技術通過不等於使用者已接受新介面。

## M5-UI-R02 — 關係式漏斗與價格尺

- **發現什麼**：R01 只把模型變成積木；真正的條件篩選仍藏在 Evidence 詳細抽屜，使用者無法從第一層直接讀懂「這一步用什麼關係、篩掉多少案例」。同時，既有 M5 只有時間重疊，無法回答多個結構是否落在同一價格區。
- **為什麼選它**：使用者明確指出需要「直觀的漏斗式篩選」，並進一步確認價格區域比單純同時發訊號更接近研究需求。本輪因此只處理「關係式篩選」這一個大型問題。
- **研究語意**：新增三種明確關係：同時成立、價格區域重疊、掃單價格進入區域。價格重疊必須是實際區間交集；不把「接近」偷偷算成重疊。Sweep 的事件價格區間固定為最低價到被掃舊低。
- **因果保護**：所有價格幾何只讀當時已存在的 Evidence；State 使用該 transition 當時記錄的區域直到下一 transition；不使用未來完整形態回填。第一條件仍是 anchor，每個 anchor episode 最多一個組合樣本。
- **介面**：主側欄新增可直接操作的漏斗；模型磚可直接設為基準／加入漏斗；每一層直接切換關係與事件窗口；價格關係顯示最近符合案例的價格尺；Evidence Dock 改成深入結果，不再是操作漏斗的必經入口。
- **刻意限制**：R02 第一版只對 Support / Macro / Basin 提供結構價格區，Sweep 提供事件價格區；Field / Echo / Astrology 保持時間關係，不推測不存在的標準價格幾何。
- **CI 紀錄**：Condition Engine 單獨修改後的中間 commit run `35418372528` 因測試仍鎖定 v1.1 而失敗；同步引擎與關係測試後 run `35418374690` 全綠。UI commit run `35418496346` 的 kernel/model/condition/runner/causality/data/regression/M4 均通過，只有 M5 UI 契約仍鎖定 v1.4 標籤而失敗；把 R02 直接漏斗、價格關係、價格尺與 detail/funnel 分離寫入永久契約後，完整 run `35418589049` 全部通過。
- **產品驗收**：pending；技術通過後仍需使用者實際測試桌面與手機流程。
