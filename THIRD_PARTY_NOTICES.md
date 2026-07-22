# Third-Party Notices

本專案不將 WebLLM 模型或 Tesseract OCR 語言資料提交至 repository。使用者主動啟用相關功能時，瀏覽器才會依上游套件設定下載並快取內容。

## 執行階段套件

| 套件／專案 | 用途 | 上游授權 |
| --- | --- | --- |
| React、React DOM、React Router | UI 與路由 | MIT |
| Vite | 前端建置 | MIT |
| Tailwind CSS | 樣式系統 | MIT |
| Zustand | 狀態管理 | MIT |
| lunar-javascript | 公農曆與四柱計算 | MIT |
| Tesseract.js | 瀏覽器 OCR | Apache-2.0 |
| Fuse.js | 籤詩模糊比對 | Apache-2.0 |
| idb-keyval | IndexedDB 封裝 | Apache-2.0 |
| @mlc-ai/web-llm | 瀏覽器本地 LLM runtime | Apache-2.0 |
| Lucide React | 圖示 | ISC |
| Zod | JSON schema 驗證 | MIT |

## 開發工具

TypeScript、ESLint、Prettier、Vitest、Testing Library、PostCSS、Autoprefixer 與相關型別套件，依各自上游 repository 的授權使用；目前主要為 MIT 授權。

完整版本與傳遞相依請以 `package-lock.json` 為準。發佈前可使用套件管理工具產生當次版本的 license inventory 再覆核。

## 外部下載內容

- `chi_tra` OCR traineddata：由 Tesseract.js 預設資料來源取得，授權與確切版本依該下載來源為準。
- `Qwen3-0.6B-q4f16_1-MLC`：WebLLM 預建清單指向的 MLC 量化模型。模型權重與衍生檔案適用其模型頁面所列授權；本 repository 不重分發模型。

啟用或重新分發外部模型與語言資料前，部署者應在上游來源再次確認當時版本、授權與使用條款。

## FateVerse 示範資料

- `public/data/fortune-sticks/*.json`：FateVerse 自編格式示範，不是特定廟宇正式籤文，CC BY 4.0。
- `public/data/daily-guidance.json`：FateVerse 自編自我反思卡，CC BY 4.0。
- 生肖、星座、生命靈數、姓名示範內容與現代化報告模板：FateVerse 自編基礎內容，CC BY 4.0。

資料欄位中的 `DataSource` 為每筆內容保留來源、URL、授權與備註擴充位置。
