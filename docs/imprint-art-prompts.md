# FateVerse 命之圖騰元素世界

五張元素世界底圖與五張透明感刻紋材質都使用 Codex 內建 ImageGen `stylized-concept` 模式生成，再轉為 WebP。圖像模型負責質感與意象；個人命盤種子仍由瀏覽器即時計算，用 Canvas 決定有機刻紋、能量枝流、五瓣核心、星芒節點與六爻，因此同命盤可穩定重現，也不需要上傳生日資料。

## 共用提示

> Create an original square generative background for a FateVerse personal destiny totem. Use deep midnight indigo handmade paper, engraved antique-gold linework, mineral pigment, ink wash, tactile copperplate and woodblock texture. Build a rich radial perimeter with a calm dark central zone reserved for overlaid personal geometry. No readable text, letters, numerals, people, faces, watermark, UI or religious symbols. Avoid photorealism, neon cyberpunk, glossy 3D, horror and clutter.

## 五行主題

- 木 `wood.webp`：樹根、枝冠、種子星座與翡翠脈絡，表達生長與方向。
- 火 `fire.webp`：羽狀火焰、太陽花瓣與朱紅能量流，表達光、勇氣與轉化。
- 土 `earth.webp`：梯田山形、礦物地層與種子石，表達承載、滋養與連續。
- 金 `metal.webp`：銀色弧面、鐘形共振與晶格切面，表達清晰、淬鍊與決斷。
- 水 `water.webp`：潮汐、月光水流與珍珠節點，表達直覺、適應與深度。

## 有機刻紋材質

第二批材質以 1024 × 1024 方形 PNG 生成，轉為 WebP 後存為 `motif-{element}.webp`。純黑底在 Canvas 以 `screen` 混合，黑色自然消失，只留下手繪光紋；中央刻意留白，讓資料生成的個人印記保持主角地位。

### 共用提示

> Create an original square compositing texture atlas for a FateVerse generative personal totem, using the supplied element-world image only as a style reference. Flat pure black #000000 background. Arrange separate curved ornamental fragments around a generous empty central clearing. Antique-gold engraving, mineral pigment, ink-wash and handmade-print texture. No readable text, letters, numerals, symbols, people, faces, watermark or UI. No solid dots, straight spokes, perfect dashboard rings, SVG, infographic, flat vector or glossy 3D. Keep the fragments richly detailed but compositionally calm so black can disappear with screen blending.

### 五行差異提示

- 木 `motif-wood.webp`：branching root veins, vine tendrils, leaf filigree, seed-star bursts and growth rings；古金、玉綠與淡青，避免霓虹綠。
- 火 `motif-fire.webp`：feathered flames, ember filigree, phoenix-like plumes without a bird, solar petal arcs and sparks；古金、朱紅、橙與紫。
- 土 `motif-earth.webp`：terraced contour bands, mineral veins, stone petals, mountain-fold curves, seed-stone facets and geological rosettes；古金、赭石、棕、苔綠與朱紅。
- 金 `motif-metal.webp`：hammered silver crescents, brass filigree, bell-wave arcs, crystalline lattice fragments, blade-thin curves and faceted starbursts；古金、銀、錫、淡青與紫，避免齒輪。
- 水 `motif-water.webp`：tidal curls, moonlit current ribbons, ink-wash wave filigree, pearl trails, eddies and rain-like star droplets；古金、淡青、青綠、月白與紫，避免霓虹青。

## 合成規則

- 元素世界底圖鋪滿畫布，有機材質以約 30% 不透明度 `screen` 疊加。
- 舊版完整同心圓、直線輻條、實心節點改成斷續刻紋帶、曲線枝流與八角星芒。
- 五行資料決定中央五瓣印記的比例；二進位卦碼不再印成工程字串，而是直接畫為六爻。
- 頁面與 1080 × 1350 分享圖共用同一個 Canvas renderer，避免兩個版本視覺漂移。
