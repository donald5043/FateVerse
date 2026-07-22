# FateVerse 參考專案稽核

最後檢查：2026-07-22

本文件記錄 FateVerse 的技術與產品參考來源。參考專案只用於技術選型、資料結構、UI／UX 流程、API 與模組邊界研究；除非個別檔案的授權與來源都已確認，否則不複製其程式碼、資料、Prompt、圖片或文案。

## 可存取性與版本快照

指定的 8 個 `git ls-remote ... HEAD` 均成功。研究用 shallow clone 位於 `D:\Code\fateverse-references`，不在 FateVerse repository 內，也不得加入 FateVerse Git history。

| 專案 | 研究 HEAD | 用途 | License | 是否直接依賴 | FateVerse 借鑑內容 |
| --- | --- | --- | --- | --- | --- |
| [Taibu](https://github.com/hhszzzz/taibu) | `160fb0e` | 多命理產品與 monorepo 架構 | root app／service：AGPL-3.0-only；`packages/core`、`mcp`、`mcp-server`：MIT | 否 | 功能分類、domain 模組、canonical text／structured JSON 分流；不複製 Web UI、資料、Prompt 或後端 |
| [Fortune Poem AI](https://github.com/osisdie/fortune-poem-ai) | `ca83913` | 籤詩 RAG 與資料分層 | MIT（程式碼）；爬取資料與圖片仍須逐來源確認 | 否 | 原文、詩意、詳解、主題聖意與來源欄位分離；不採 Neo4j、Python、Gradio、付費 API 或其資料集 |
| [lunar-javascript](https://github.com/6tail/lunar-javascript) | `4c45a59` | 公農曆、四柱、節氣、十神、納音 | MIT | 是，鎖定 `1.7.7` | 只透過 `bazi-engine.ts` adapter 使用，UI 不接觸上游物件 |
| [WebLLM](https://github.com/mlc-ai/web-llm) | `2131456` | 瀏覽器本地 LLM | Apache-2.0 | 是，鎖定 `0.2.84` | 主動載入、進度、Web Worker、JSON mode、interrupt、Zod 驗證與規則式 fallback |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | `a1ca80d` | 瀏覽器 OCR | Apache-2.0 | 是，目前鎖定 `6.0.1` | 延遲載入、worker 重用、進度、PSM、取消與釋放；不把語言模型提交到 Git |
| [Fuse.js](https://github.com/krisk/Fuse) | `457fe76` | 小型資料集的 client-side 模糊搜尋 | Apache-2.0 | 是，鎖定 `7.5.0` | 加權欄位、`includeScore`、`ignoreLocation` 與文字正規化，再疊加逐句 OCR 容錯 |
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | `865d3da` | 天文位置計算 | MIT | 否；Phase 2 候選 `2.1.19` | 保留獨立 adapter 與 UTC／黃道經度介面，不混入占星文案 |
| [AstroDraw/AstroChart](https://github.com/AstroDraw/AstroChart) | `d8fb56f` | SVG 星盤繪圖 | MIT | 否；Phase 2/3 | 只研究行星角度輸入、SVG/RWD 與計算／繪圖分離 |
| [CircularNatalHoroscopeJS](https://github.com/0xStarcat/CircularNatalHoroscopeJS) | `76e150f` | 完整星盤資料結構參考 | Unlicense | 否；Phase 2/3 評估 | 研究日期、時間、經緯度、宮位、行星、相位與多語欄位；最後 commit 為 2021，整合前須重驗維護性與依賴 |
| [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) | `05670fc` | Vite PWA／Workbox | MIT | 開發相依，目標 `1.3.0` | prompt 更新、shell／靜態 JSON precache；排除 WebLLM 權重與 OCR 語言資料 |
| [Recharts](https://github.com/recharts/recharts) | `3ea1d97` | React 圖表 | MIT | 否 | 只在複雜圖表確有價值時採用；目前五行圖繼續使用輕量 CSS／SVG |

## NPM API 與版本核對

2026-07-22 執行 `npm view <package> version license`：

| 套件 | NPM latest | FateVerse 實際安裝 | 決策 |
| --- | --- | --- | --- |
| `lunar-javascript` | 1.7.7 / MIT | 1.7.7 | 鎖定實際版本並以固定生日回歸測試保護結果 |
| `@mlc-ai/web-llm` | 0.2.84 / Apache-2.0 | 0.2.84 | 使用目前 API；不得啟動時自動下載模型 |
| `tesseract.js` | 7.0.0 / Apache-2.0 | 6.0.1 | 暫不在 OCR 修正中順便升 major；現有實作依 6.0.1 型別與 API 驗證 |
| `fuse.js` | 7.5.0 / Apache-2.0 | 7.5.0 | 使用目前安裝版本 |
| `astronomy-engine` | 2.1.19 / MIT | 未安裝 | 第一版只保留介面，不阻擋 MVP |
| `vite-plugin-pwa` | 1.3.0 / MIT | 1.3.0 | 已取代手寫 cache-first service worker，提供更新提示；大型 WebLLM runtime 不進入預快取 |

`package-lock.json` 是部署的傳遞相依版本準據；`package.json` 的第一方直接相依應使用明確版本，避免 caret 在全新安裝時靜默改變排盤或模型 API。

## 架構研究摘要

### Taibu

- `packages/core/src/domains/<domain>` 把算法、型別、canonical text 與 canonical JSON 放在 domain 邊界內；MCP transport 是另一層。
- FateVerse 採用相同的「計算結果先結構化，再交給 UI／AI」原則，但不依賴 Taibu runtime、後端、Supabase 或 MCP。
- Taibu root app 的 AGPL 邊界涵蓋 `src/`、`supabase/`、`public/` 與部署檔，因此不把其 Web 程式或素材搬入 MIT 的 FateVerse。

### Fortune Poem AI

- 參考資料欄位包含：識別碼、籤名／詩名、詩句、吉凶、宮位、詩意、解曰、分類聖意、淺釋、詳解、圖片與來源 URL。
- FateVerse 對應為 `FortuneStick` 的原文、背景、摘要、各主題 interpretation、actions、risks 與 `dataSource`；原始 OCR、檢索候選和最後解讀必須分開顯示。
- 不複製 `all_chances.json`、快取回應、Prompt 或圖像。即使 repository 是 MIT，爬取來源與生成內容仍需獨立授權與溯源。

### lunar-javascript

- 上游 README 與 `__tests__/EightChar.test.js`、`JieQi.test.js` 證實四柱與節氣 API；FateVerse 維持 adapter，固定版本與固定生日測試。
- WebLLM 只能整理已計算的 `FateReportInput`，不可重新排八字。

### WebLLM

- 目前 API 使用 `CreateMLCEngine`／`CreateWebWorkerMLCEngine`、`initProgressCallback`、OpenAI-compatible chat completion、`response_format: { type: "json_object" }`、`interruptGenerate()` 與 `unload()`。
- 模型初始化必須由設定頁明確觸發；失敗、WebGPU 不支援或記憶體不足時保留規則式報告。
- 模型權重不得進 precache 或 Git；AI 產出仍須通過 Zod schema，且不得修改結構化排盤事實。

### Tesseract.js

- v6 的語言與 OEM 在 `createWorker(language, oem, options)` 指定；重複辨識應重用 worker，再在取消或離頁時 terminate。
- 直排籤詩使用 `chi_tra_vert` 與 `PSM.SINGLE_BLOCK_VERT_TEXT`；橫排使用 `chi_tra`。原始 OCR 必須可編輯並交給資料庫比對。
- 語言資料由上游 CDN 動態下載與瀏覽器快取，不放進 PWA precache。

### Fuse.js

- 分數是 0 最相似、1 最不相似；長文字需 `ignoreLocation: true`。
- FateVerse 先正規化 Unicode、空白、標點與中文籤號，再用欄位權重搜尋；逐句 Dice score 是針對直排 OCR 欄首雜訊的補充，不取代 Fuse。

### Astronomy／AstroChart

- Astronomy Engine 負責天文向量與座標；文化解讀是另一層。AstroChart 只畫 SVG，不算行星位置。
- 第一版保留 adapter 與 placeholder，月亮、上升、宮位、相位和真太陽時不阻擋 MVP。

### PWA／圖表

- FateVerse 有表單與本地狀態，採 `prompt` 更新比 `autoUpdate` 安全；使用者確認後才 reload。
- precache 僅包含 build shell、manifest、圖示與靜態 JSON；WebLLM 模型和 OCR traineddata 不納入。
- Recharts 的 tree-shaken bundle 仍顯著大於目前 CSS／SVG 五行圖需求，第一版不安裝。

## 禁止直接搬用

- Taibu root Web／server code、UI、資料、圖片、Prompt 與文案。
- Fortune Poem AI 的 `data/*.json`、圖片、爬蟲產物、預生成回應與 Prompt。
- 任一參考專案未逐檔確認來源的籤詩資料庫或圖像。
- WebLLM 模型權重與 Tesseract traineddata。

若未來確需引入資料，必須為每個 dataset 建立來源 URL、版本／抓取日期、授權、允許的再散布方式與轉換紀錄。
