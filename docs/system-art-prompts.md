# FateVerse 命理章節圖庫

本批資產使用 Codex 內建 ImageGen 的 `stylized-concept` 模式生成，再統一縮放為 1280 × 720、WebP quality 86。沒有使用 CLI fallback 或外部 API key。

## 共用視覺指示

所有成品共用以下方向：

> Create a premium Taiwanese cultural magazine illustration on deep midnight ink-blue handmade paper. Use engraved gold linework, mineral pigment, ink wash, and tactile woodblock or copperplate texture. Compose a wide 16:9 chapter banner with the subject concentrated on the right two-thirds and calm negative space on the left. Keep the mood grounded, precise, contemplative and reassuring. No readable text, fake writing, numerals, people, watermark, UI, neon sci-fi, glossy 3D, horror or clutter.

## 各系統最終主題提示

| 檔案 | 系統 | 最終主題提示 |
| --- | --- | --- |
| `public/art/system-bazi.webp` | 八字 | Four illuminated pillar tablets built from abstract heavenly-stem and earthly-branch seal geometry, translucent hidden-root strata beneath each pillar, and a restrained five-element cycle connecting wood, fire, earth, metal and water. Use soft gold and vermilion with small jade and celeste accents. |
| `public/art/system-ziwei.webp` | 紫微斗數 | A floating twelve-palace square celestial court map with a calm empty center, linked chambers, distinct star clusters, four subtle transformation trails and a purple imperial star above the chart. Use gold, violet and celeste mineral pigments. |
| `public/art/system-western.webp` | 西洋星盤 | An antique celestial astrolabe with twelve zodiac sectors, ten orbital points, fine aspect threads, brass rings and a quiet crescent. Keep it structurally clear without looking like a UI screenshot or using branded zodiac icons. |
| `public/art/system-numerology.webp` | 生命靈數 | Luminous counting dots and nested geometric paths flowing from small constellations into a central life-path mandala. Suggest nine node groups through spacing, rings and rhythm without displaying literal numerals or equations. |
| `public/art/system-name.webp` | 姓名學 | Expressive abstract brush strokes that convey calligraphic rhythm without forming actual characters, arranged over a five-cell framework with abstract red seal shapes, ink pooling and thin gold measurement lines. |
| `public/art/system-tarot.webp` | 塔羅 | Three entirely original divination cards representing past, present and future: one face down and two partially revealed, using only a crescent, branching path, dawn sun, cup and botanical motifs, connected by fine narrative threads. |
| `public/art/system-fortune.webp` | 籤詩 | A grounded ceremonial still life with a dark wooden fortune-stick cylinder, blank bamboo sticks, two blank deckled paper slips, an abstract vermilion seal circle, restrained incense haze and fine gold cloud motifs. |
| `public/art/system-palm.webp` | 手相 | One open gender-neutral palm rendered as an antique anatomical engraving, with the heart, head and life lines glowing in mineral pigments and five elemental nodes extending into subtle constellation paths. |
| `public/art/system-daily.webp` | 今日指引 | One original oracle card on a circular platform, showing a moon-to-sun horizon, a single path and a sprouting branch. A slow star arc marks the transition from night to morning and one gold thread continues forward. |
| `public/art/system-fusion.webp` | 萬象合參 | A coherent synthesis mandala combining four pillar forms, a twelve-chamber square, zodiac astrolabe, dotted numerology paths, three card silhouettes and flowing palm lines around one luminous center. |

## 網站動態

動畫由 CSS 實作，因此圖片本身維持輕量的靜態 WebP：

- 16 秒的低幅度漂移與縮放，增加紙上星圖的呼吸感。
- 7 秒的柔光脈動，聚焦每張圖的核心符號。
- 系統偵測 `prefers-reduced-motion: reduce` 時會自動停用。
