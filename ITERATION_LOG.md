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

## G02-R2 — 研究安全

- **來源**：接管 Work 兩輪 v1.7 G02-R1 使用者走查。指南明確要求先處理「研究可靠度、狀態辨識與跨模型延續」，完整多模型功能延後；第一階段阻斷項集中在 Macro 與 Astrology。
- **本輪問題**：G02-R1 架構已簡化，但仍可能把小樣本的高百分比放得太醒目；Macro 候選與完成確認的關係不夠集中；Astrology 的 future label 可能被誤讀成現實未來，且大量事件可能被誤認為等量獨立證據。
- **全站樣本安全**：單模型 horizon 先呈現「符合狀態總數／已走完／尚未走完／研究可靠度」，再呈現報酬、上漲比例與 MFE/MAE。N<5 直接標「樣本不足｜只能當案例看」，5–19 為探索性，20+ 才稱較可比較；百分比明確寫成幾個案例中的幾個，且不稱成功率。
- **Macro 阻斷修正**：同頁顯示候選、完成模型確認、確認前失效／過期、資料尾端未結束；目前 selected horizon 同時顯示 confirmed 案例中已走完／未走完數。Primary state label 把 active 改寫成「已完成收復確認」，candidate 明寫尚未完成確認。
- **Astrology 阻斷修正**：第一層說明為可否證外部時間假說、不是價格因果；Upcoming 顯示「資料截止日」與瀏覽器今天日期，若投影日期以今天看已過去會直接指出。另顯示 event-bar、底層事件、同 K 多事件與「不一定獨立」；future projection 不可 handoff 到組合研究。
- **案例數一致性**：歷史案例顯示「可瀏覽 X / 總 Y」，若超過載入上限 500 會明寫只載入最近 500，不再讓 UI cap 冒充總樣本。
- **參數入口**：Astrology 一般使用者先以三套事件密度參考設定研究，不要求先理解 Orb、相位、逆行等術語。
- **實際資料 audit**：固定 IXIC 1D fixture 的 Macro candidate=1、confirmed=1、confirmed 10-bar N=1，upRate=100%；固定 TWII 1D fixture candidate=7、confirmed=3、failed-before-confirm=4、confirmed 10-bar N=3，upRate=66.7%。這正是小樣本高百分比需要被攔截的案例，不是績效宣稱。Astrology 分別有 945 / 944 個 event bars 與各 1 筆 upcoming projection；projection 未進 Evaluation。
- **CI 過程**：初次 code run `35429567409` 因既有 M4 版本標籤契約未接受 v1.8 失敗；後續 runs 依序暴露舊 G01/M4 文案契約仍鎖定 G02-R1 用語。這些屬刻意 UI wording/architecture 變更的契約同步，不是引擎錯誤。更新 inherited contracts 與新增 G02-R2 UI/data safety gates 後，run `35429780000` 全綠，包含 Kernel、Model Engine、Condition Engine、Runner、causality、market data、regression、M4/M5/G01/G02-R1/G02-R2、preset。
- **產品驗收**：尚未通過第一階段。依 Work 指南，Macro 與 Astrology 阻斷任務仍需要未參與開發的使用者，在沒有口頭提示下實際操作桌面／手機才能關閉。

## G02-R3 → R7 — 完整指南技術執行

- **使用者指令**：把 Work 產生的 G02 使用者角度迭代指南完整跑完；全程受 Strategy Lab 開發憲法約束。後續另明確指定「先把技術層面跑完」。
- **R3 全站一致性**：統一單模型研究數量詞彙為「同狀態總案例 → 完整觀察 → 尚未完成 → 可瀏覽案例」，並在 UI 說明百分比只取完整觀察的分母。Sweep / Echo / Astrology 額外解釋一個案例代表什麼。
- **R4 模型專屬證據**：新增 model-specific proof presenter。Support 顯示支撐帶與失效邊界；Macro 顯示候選帶、觸發高點與確認階段；Sweep 顯示舊低／最低／收盤／收盤位置；Basin 顯示下跌、平盤、中心穩定與尺度；Field 顯示回合、貼合、幾何與破界確認；Echo 顯示相似度、門檻、Strong 數與最佳歷史區間；Astrology 顯示事件摘要與無因果主張。Support/Macro/Field 可直接跳失效案例，Basin 可跳離開案例。
- **Echo Evidence**：Model Engine 1.2.0 在既有相似排序不變的前提下，把最佳歷史片段 start/end/timestamp 及 O/C/H/L similarity parts 寫進 Evidence。所有 best-match 都必須結束於目前 pattern 開始之前。
- **R5 保存與延續**：新增最多 30 筆 browser-local saved research。保存 market/timeframe/model/state/Evidence/horizon/setting/parameter snapshot/fingerprint/versions/knownThrough/source。保存快照與目前研究分離；載入保存研究會先還原 market/timeframe/params，再重新找 Evidence；若原 Evidence 已不存在，明確回到現在而不假裝成功。
- **R6 組合入口**：新增獨立「組合研究」Tab。單模型 handoff seed 第一條件，直接顯示 inherited market/timeframe/condition/setting/Evidence。第二、第三條件由 Condition Engine candidateConditions / suggestRelation / availableRelations / evaluateConditions 產生；Astrology upcoming 保持禁止作為歷史條件。
- **R7 裝置與流程**：介面明示五步「選模型 → 看證據 → 查歷史 → 保存 → 延續」。Desktop 不使用遮蓋 Chart Core 的固定 Evidence panel；<=1050px 版面堆疊；<=650px 隱藏 hover tooltip 並使用 tap/click 進 Evidence，核心按鈕與 select 維持 touch target。
- **最後技術 audit**：固定 IXIC 1D 產生 1476 Evidence（Astro 945 / Support 181 / Field 107 / Basin 76 / Sweep 21 / Echo 143 / Macro 2）；固定 TWII 1D 產生 1473 Evidence（Astro 944 / Support 198 / Field 87 / Echo 143 / Basin 70 / Sweep 14 / Macro 16）。Audit 實際命中 failure=true、incomplete=true、smallSample=true、echoTrace=true、noEvent=true。這些是 coverage 證據，不是模型績效排名。
- **CI**：branch final technical run `35431231619` success。Research Kernel、Model Engine、Condition Engine、Runner、conditional parity、real-market causality、market data、pre-M4 regression、architecture、M4、M5、G01、G02-R1/R2/R3/R4/R5/R6/R7、final guide audit、preset 全部成功。
- **未完成的只有真人驗收**：指南要求未參與開發者在沒有口頭提示下操作；本輪無法用自動測試冒充這項人因證據。因此技術層標記完成，產品／真人驗收仍 pending。


## 2026-09-19｜G03-R0 Model Semantics Registry

### 發現什麼
G02 已讓 Evidence 可讀、可追溯，但下一階段若直接做資料可信度、preset 補樣本或策略回測，會先遇到一個更基礎的語意問題：Support / Macro / Sweep / Echo / Astrology 並不是同一種主張，不能共用「成功／失敗」語言，也不能讓策略層自己重新解釋模型。

### 為什麼選它
依 `CONSTITUTION.md` 第十八條，一輪只處理一個大型問題。使用者已批准 G03 詳細指南，而所有後續 Reliability / Runner / Strategy Adapter 都依賴一份穩定 Model Semantics Registry，因此 R0 必須先完成，且本輪不調 preset、不建立 Reliability 分數、不改 Script 主流程。

### 改了什麼
- 新增 `src/model-semantics.js` v1.0.0。
- 七模型登錄 research type、primary question、claim boundary、normalized states、progression / confirmation / invalidation / exit、standardized price geometry、allowed relation、directional claim、future strategy roles。
- Condition Engine 升至 v1.3.0，state/event/observation/terminal classification 改由 Registry 提供；原 R02 relation behavior 保持。
- Browser 載入共享 Registry，並透過 `window.__SL_MODEL_SEMANTICS__` 可檢查。
- 現有單模型研究區增加「研究型態／模型主張」兩行教育資訊；沒有新增 Tab、Dashboard 或主工作流。
- 建立 `tests/g03-r0-model-semantics-contract.test.js` 並加入主 CI。
- 把完整 G03 已批准方向保存為 `G03_ITERATION_GUIDE.md`。

### 測試結果
PR workflow `35434017722`：success。
- Research Kernel / Model Engine / Condition Engine
- Runner parity / M5 conditional parity
- real-market causality audit
- market-data / regression
- M4 / M5 / G01 / G02 contracts
- G03-R0 model semantics contract
- preset validation / semantic gate

全部同時通過。

### 本輪沒有做
- 不改模型公式或 worldview。
- 不更改 Chart Core。
- 不改 Evidence schema / detectedAt。
- 不重新校準 preset。
- 不建立 Reliability Matrix。
- 不建立 Runner Observatory。
- 不重構 Script／策略實驗。
- 不宣告 G02 真人驗收完成。

### 下一個最值得研究的問題
**G03-R1 Runner Observatory**：讓背景 Runner 可觀察且可教育，但 active run 不可被中途修改；任何市場／週期／preset／參數變更必須形成新的 Run ID。
