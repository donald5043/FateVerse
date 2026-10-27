# Third-Party Notices

本專案不將 Tesseract OCR 語言資料提交至 repository。使用者主動啟用 OCR 功能時，瀏覽器才會依上游套件設定下載並快取內容。

## 執行階段套件

| 套件／專案 | 用途 | 上游授權 |
| --- | --- | --- |
| React、React DOM、React Router | UI 與路由 | MIT |
| Vite | 前端建置 | MIT |
| vite-plugin-pwa / Workbox | PWA 建置、更新提示與離線快取 | MIT |
| Tailwind CSS | 樣式系統 | MIT |
| Zustand | 狀態管理 | MIT |
| lunar-javascript | 公農曆與四柱計算 | MIT |
| astronomy-engine | 地心黃道位置、恆星時與西洋星盤基礎計算 | MIT |
| iztro | 紫微斗數十二宮與星曜排盤 | MIT |
| Tesseract.js | 瀏覽器 OCR | Apache-2.0 |
| Fuse.js | 籤詩模糊比對 | Apache-2.0 |
| idb-keyval | IndexedDB 封裝 | Apache-2.0 |
| lz-string | 分享連結的字串壓縮 | MIT |
| Lucide React | 圖示 | ISC |

## 開發工具

TypeScript、ESLint、Prettier、Vitest、Testing Library、PostCSS、Autoprefixer 與相關型別套件，依各自上游 repository 的授權使用；目前主要為 MIT 授權。

完整版本與傳遞相依請以 `package-lock.json` 為準。發佈前可使用套件管理工具產生當次版本的 license inventory 再覆核。

## 外部下載內容

- `chi_tra` OCR traineddata：由 Tesseract.js 預設資料來源取得，授權與確切版本依該下載來源為準。

啟用或重新分發外部語言資料前，部署者應在上游來源再次確認當時版本、授權與使用條款。

## Unicode Unihan Database

- `src/data/unihan-char-data.ts`：由 Unicode® Unihan 資料庫（`Unihan_IRGSources.txt` 的 `kTotalStrokes` 與 `kRSUnicode` 欄位）自動產生的緊湊表，涵蓋 U+4E00–U+9FFF。
- 來源：<https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip>
- 授權：Unicode License v3（<https://www.unicode.org/license.txt>）。Copyright © Unicode, Inc.
- 產生方式：`scripts/generate-unihan-data.py`。

## 紫微斗數開源解讀資料集 v4.0

本專案使用了「紫微斗数开源解读数据集 v4.0（674,976 张命盘 × 13 维）」的開頭摘要。

以下依原作者指定格式署名（保留原文）：

```text
本项目使用了 紫微斗数开源解读数据集 v4.0（674,976 张命盘 × 13 维）
来源：https://github.com/Renhuai123/ziwei-doushu
作者：王多鱼AI
```

- 來源：[Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu)，作者：王多鱼AI。
- 固定發行版本：[v4.0-13d](https://github.com/Renhuai123/ziwei-doushu/releases/tag/v4.0-13d)，內容版本 `ca268829f7a9`。
- 授權：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，上游條款見 [DATASET-LICENSE](https://github.com/Renhuai123/ziwei-doushu/blob/main/DATASET-LICENSE)。原作者及授權未因轉換而改變；原作者並未替 FateVerse 背書。
- 衍生檔：`public/data/ziwei-v4/manifest.json` 與 `1950.bin.gz` 至 `2026.bin.gz`；產生工具 `scripts/import-ziwei-dataset.py`，來源 SHA-256 固定於 `scripts/ziwei-v4-assets.json`。
- 修改：僅摘錄每一主題第一個標題下的開頭摘要，略去含「倪／天纪／天紀」的整段文字，不收錄後續核心論斷、古籍引證或《天紀》逐字稿；保留簡體原文。以文字字典與無損索引去重，未用 LLM 改寫。
- 上游明確將倪海廈《天紀》引文排除於資料集 CC BY 授權之外。本版不匯入該逐字稿及其 CC BY-NC-SA 語料。
- 上游排盤引擎及核心斷語庫未移入 FateVerse；查表摘要採來源發布時的固定排盤口徑，與 FateVerse 的 iztro 盤面獨立呈現。
- 2026-10-27 補強：對全部 975 個不重複段落做固定引文比對與來源檢查，保守另刪 34 個整段，共影響 35 個摘要位置；不把刪除判定等同侵權判定。核准範圍以雜湊固定，新文字必須重新檢查。完整方法與限制見 [檢查記錄](docs/ziwei-rights-audit.md)。
- 原作者完整使用條款與免責聲明另隨資料附於 [SOURCE-LICENSE.txt](public/data/ziwei-v4/SOURCE-LICENSE.txt)，衍生資料的署名與歷次修改說明見 [NOTICE.md](public/data/ziwei-v4/NOTICE.md)。資料按現狀提供、不附擔保，僅供文化探索與反思，不構成預測、診斷或建議。
- 這些第三方摘要仍依 CC BY 4.0 提供；FateVerse 的程式碼授權不取代第三方授權，也不加設限制摘要再利用的條款或 DRM。

## FateVerse 示範資料

- `public/data/fortune-sticks/sixty-jiazi.json`、`guanyin-100.json`：籤詩本文與吉凶分級為傳統六十甲子籤（媽祖靈籤）與觀音一百籤，屬公有領域古典籤文，逐字校對自公開籤詩資料；隨附的白話摘要、九面向解讀、行動建議與關鍵詞為 FateVerse 自編，CC BY 4.0。各廟版本用字與吉凶分級略有出入，實際解籤請以所在廟宇為準。
- `public/data/fortune-sticks/user-samples.json`：使用者提供照片的短篇籤文轉錄；每筆來源與解讀範圍標示於資料內，不併入 FateVerse 自編資料授權聲明。
- `public/data/daily-guidance.json`：FateVerse 自編自我反思卡，CC BY 4.0。
- 生肖、星座、生命靈數、姓名示範內容與現代化報告模板：FateVerse 自編基礎內容，CC BY 4.0。

資料欄位中的 `DataSource` 為每筆內容保留來源、URL、授權與備註擴充位置。
