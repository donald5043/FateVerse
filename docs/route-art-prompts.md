# FateVerse 分頁首圖語意校準

這批首圖使用 Codex 內建 ImageGen 的 `stylized-concept` 模式逐張生成，再轉為 1280 × 720、WebP quality 86。生成時以既有的 `public/art/system-fusion.webp` 作為風格參考；參考圖只用來延續深夜藍手工紙、古金版畫線條與礦物顏料語彙，沒有複製其構圖。

## 核對結果

原本已符合內容的路由維持不變：今日指引、塔羅、手相、籤詩，以及報告頁內的八字、紫微、西洋星盤、生命靈數、姓名學與萬象合參。

原本以相近命理系統圖片代用、但實際語意不同的 11 個路由，改為下列專屬資產：

| 路由 | 分頁內容 | 原本代用 | 新資產 |
| --- | --- | --- | --- |
| `/profile` | 建立出生資料、探索命盤 | 八字 | `public/art/system-profile.webp` |
| `/ritual` | 隨機擲骰、觀察第一反應 | 塔羅 | `public/art/system-ritual.webp` |
| `/imprint` | 五元素與個人命之圖騰 | 西洋星盤 | `public/art/system-imprint.webp` |
| `/shared` | 接收他人自主分享的命盤 | 萬象合參 | `public/art/system-shared.webp` |
| `/narrative` | 把命盤整理成人生劇本 | 姓名學 | `public/art/system-narrative.webp` |
| `/capsule` | 留給未來自己的時間膠囊 | 今日指引 | `public/art/system-capsule.webp` |
| `/synastry` | 兩人的差異、交會與共振 | 萬象合參 | `public/art/system-synastry.webp` |
| `/mirror` | 巴納姆效應與冷讀術拆解 | 姓名學 | `public/art/system-mirror.webp` |
| `/about` | 方法透明、詮釋而非預言 | 萬象合參 | `public/art/system-about.webp` |
| `/privacy` | 本機資料與隱私邊界 | 今日指引 | `public/art/system-privacy.webp` |
| `/settings` | 個人資料、動態與本機控制 | 生命靈數 | `public/art/system-settings.webp` |

## 共用最終提示

每張圖都以此段為共同骨架，再接上各路由的主題提示：

> Use case: stylized-concept. Asset type: wide page banner for FateVerse. Input image: style reference only; preserve its midnight indigo handmade paper, engraved antique-gold linework and mineral-pigment editorial language. Composition/framing: wide 16:9, meaningful objects concentrated on the right two-thirds, calm dark negative space on the left, readable on mobile crop. Constraints: no readable text, fake characters, numerals, watermark, UI or copied card artwork. Avoid generic horoscope wheels as the sole subject, glossy 3D and clutter.

## 各分頁最終主題提示

- `system-profile.webp`：A blank birth record sheet, celestial compass, location globe, clock and four small pillar seals align into one precise personal coordinate map. Welcoming, precise and personal; no tarot cards.
- `system-ritual.webp`：One carved cosmic die caught in mid-tumble over a forked path, with two blank choice stones and a circular dark mirror or water ripple reflecting the landing. Psychological reflection rather than prediction; no tarot cards or divination sticks.
- `system-imprint.webp`：A unique fingerprint-like spiral inside five-point elemental geometry, surrounded by a sprouting wood branch, flame feather, terraced earth stone, silver arc and flowing water current, woven into one personal celestial seal.
- `system-shared.webp`：A sealed celestial chart folio sends one luminous thread across a threshold to a receiving folio where the same constellation gently appears, with a subtle consent seal and protected boundary.
- `system-narrative.webp`：An open blank codex unfolds into a luminous path with branching chapters and symbolic landscapes for origin, turning point, relationship, work and future horizon, emphasizing authorship instead of prediction.
- `system-capsule.webp`：A sealed glass-and-brass vessel contains a small living star, folded blank letter and sprouting seed; an orbital clock ring connects the present to a distant future dawn.
- `system-synastry.webp`：Two celestial map circles with different geometry and color accents overlap into a luminous shared field; two orbit paths cross, influence one another, then continue independently.
- `system-mirror.webp`：An antique mirror reflects one identical constellation pattern from several differently shaped blank masks; investigative rays and a magnifying lens reveal how broad patterns can feel uniquely personal.
- `system-about.webp`：An open method atlas supports four transparent layered plates for source observations, calculation geometry, symbolic vocabulary and reflective interpretation; a magnifying lens exposes the joins.
- `system-privacy.webp`：A personal celestial chart rests inside a compact local archive, enclosed by a complete protective gold boundary and physical lock; all star trails remain inside with no outgoing network lines.
- `system-settings.webp`：An analog celestial instrument table with three adjustable brass dials, sliding orbit rail, local archive drawer and motion pendulum; each mechanism changes one layer of a personal star map.

## 動態處理

新資產沿用網站既有的 CSS 呼吸動畫與柔光層；圖片本身保持靜態 WebP，以降低行動裝置負擔。使用者開啟 `prefers-reduced-motion: reduce` 時，動畫會自動停用。
