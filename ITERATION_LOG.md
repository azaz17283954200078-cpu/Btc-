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

## M5-G01 — 單一模型研究引導重構

- **發現什麼**：R02 讓漏斗可操作後，實際使用回饋指出更前置的障礙：價格尺幫助有限、浮動資訊難固定、歷史案例研究視窗太小、「3 / 5 / 10 / 20 根 K 後」仍要求使用者自己理解研究術語。代表系統仍高估第一次使用者的先備知識。
- **為什麼選它**：使用者明確要求先解決個別模型引導，再回頭處理漏斗展示。本輪因此凍結條件引擎與漏斗語意，只重構單一模型的閱讀／操作路徑。
- **主要流程**：模型磚第一動作改成「看懂這個模型」；固定研究後依序回答「現在看到什麼、為什麼模型會這樣判斷、接下來觀察什麼」，再進歷史後續與真實案例；多模型研究退為第二步。
- **固定研究**：桌面 Evidence Dock 改為大型固定側面研究區；手機改為全螢幕研究頁。圖上浮動卡加入「固定到研究區，慢慢看」，不再只能靠 hover。
- **歷史後續**：把 3 / 5 / 10 / 20 K 翻成人類時間；明確定義起點為模型確認該狀態的 K 棒收盤、終點為第 N 根未來 K 收盤。MFE / MAE 放在白話路徑描述之後。
- **真實案例**：案例入口從 7 個增為最多 12 個，使用更大的案例按鈕；研究面板保持固定，主圖可直接跳到不同歷史案例比較。
- **保護區**：Chart Core、三層 Canvas、Shared Model Engine、Condition Engine v1.2、Evidence schema、known-through、anchor-centric sampling、sample gates、資料來源均不改。
- **CI 紀錄**：UI 前兩個中間 commits 的 runs `35425623322`、`35425663646` 都只因 M4 契約仍要求舊的 `M4/M5` 版本標籤而失敗；核心引擎與前置回歸均未顯示新增失敗。更新 M4 契約後 run `35425727233` 再因 M5 UI 契約仍鎖定 v1.5 標籤而失敗。同步 M5 契約並新增 G01 永久契約後，runs `35425741161` 與 `35425743357` 全部通過；最終 run 包含 Research Kernel、Model Engine、Condition Engine、Runner、real-market causality、data、regression、M4、M5、G01、preset 全部成功。
- **產品驗收**：pending；CI 只證明程式與契約沒有破壞，不等於桌面／手機實際閱讀已被使用者接受。

## G02-R1 — 單模型研究架構重建

- **發現什麼**：G01 的文字說明已能讓使用者稍微理解模型，但實際操作仍繁瑣。根因不是文案，而是架構把「模型是否顯示、目前研究哪個模型、正在看哪一筆 Evidence、是否進入組合研究」混在同一套 `PINNED_RESEARCH`／模型磚／漏斗／Evidence Dock 流程。
- **為什麼選它**：使用者明確要求先把單模型研究架構最佳化，並要求研究成果之後能直接延續到獨立的多模型研究系統。這屬憲法第 23 條重大介面變更，方案已先討論並獲同意。
- **介面重構**：右側第一層只保留一個單模型研究器。移除 primary DOM 中的 active model stack、research funnel、Evidence Dock/backdrop；模型庫降為折疊的次要「模型庫與圖層」。
- **狀態解耦**：新增 `FOCUSED_MODEL`、`FOCUSED_EVIDENCE`、`SINGLE_RESEARCH_CONTEXT`、`COMBINATION_HANDOFF_CONTEXT`、`CONDITION_STACK`。單模型研究不再偷偷建立條件漏斗；舊 `PINNED_RESEARCH` 僅留給尚未重建的 legacy M5 組合 UI helper。
- **顯示 vs 研究**：`isModelVisible()` 只控制圖層；`shouldRunModel()` 讓目前研究的模型即使圖層隱藏仍會由 Shared Model Engine 計算 Evidence。沒有把 Experimental models 預設顯示狀態改成 ON。
- **現在 vs 歷史**：`openLatestResearch()` 改成只聚焦模型與現在；如果最新市場沒有 Evidence，直接說沒有，再由使用者明確按「查看最近一次歷史案例」。不再 `current || lastHistorical` 靜默 fallback。
- **歷史研究**：3/5/10/20 K 只顯示一個 selected horizon；真實案例改為較新／較舊導航。切換案例會同時更新右側 Evidence 與主圖 viewport；點主圖模型標記也會反向同步右側。
- **組合研究接續**：單模型可建立 handoff context，包含 market / timeframe / model / state / condition / Evidence id/index/detectedAt/evidenceStart/kind / selected horizon / setting source / parameter snapshot / parameter fingerprint / engine+kernel version / knownThrough / data source。hand-off 直接 seed 第一個 `CONDITION_STACK`；若模型參數改變，舊 handoff 會失效而不是偷偷沿用。
- **保護區**：Chart Core、三層 Canvas、Shared Model Engine 世界觀、Research Kernel、Condition Engine v1.2、Evidence schema、causality、Runner parity、sample gates、data sources 均未改。
- **CI 過程**：前段 UI commits 的 runs `35427293629`、`35427360412`、`35427370801` 先因舊 M4/G01 契約仍要求舊版 primary surface 而失敗；更新 M4/M5/G01 契約後，新增 G02-R1 architecture gate，完整 branch run `35427426794` 全綠；最後補上「從設定視窗切換研究模型時同步右側 inspector」後，final code run `35427496870` 再次全綠。該 final run 包含 Research Kernel、Model Engine、Condition Engine、Runner、real-market causality、market data、regression、architecture、M4、M5、G01、G02-R1、preset 全部成功。
- **產品驗收**：pending。CI 證明架構契約與既有研究基礎未被破壞，但沒有完成真實桌面／手機視覺與觸控人工驗收；下一步應先由使用者測單模型流程，再決定獨立組合研究工作區。
