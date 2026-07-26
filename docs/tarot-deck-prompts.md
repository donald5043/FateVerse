# FateVerse 大阿爾克那牌面圖庫

這套 22 張牌面使用 Codex 內建 ImageGen 的 `stylized-concept` 模式逐張生成。`public/art/system-tarot.webp` 僅作為色彩、材質與線條風格參考；所有牌面都是新的原創構圖。

成品統一轉為 480 × 720、WebP quality 80，網站再以 CSS 疊加牌名、羅馬數字、正逆位標記與動畫，避免生成式圖片內的文字錯誤。

## 共用提示

> Create one original standalone vertical 2:3 tarot card face for FateVerse. Preserve the style reference's midnight indigo handmade-paper field, engraved antique-gold linework, violet botanicals, mineral pigment, copperplate and woodblock texture. Use a centered iconic composition, ornate thin gold border, safe inner margins and full-bleed artwork. No readable text, letters, numerals, title plate, watermark, UI, mockup, hands holding the card or surrounding table. Avoid Rider-Waite duplication, photorealism, anime, glossy 3D, occult horror and clutter.

## 各牌主題提示

| ID | 牌名 | 原創構圖主題 |
| --- | --- | --- |
| 00 | 愚者 The Fool | 旅人與白犬在晨光中踏向山脊，嫩枝與遠方道路象徵信任與開始。 |
| 01 | 魔術師 The Magician | 鍊金術師以發光絲線連接天地，杯、刃、枝與圓印形成四元素星座。 |
| 02 | 女祭司 The High Priestess | 守門者坐在黑白石柱間，月形器皿、石榴帷幕與倒映水面象徵直覺。 |
| 03 | 皇后 The Empress | 花果園中的豐饒主宰，麥穗、石榴、流水與十二星光環繞。 |
| 04 | 皇帝 The Emperor | 紅色山脈上的沉穩長者，方印、羊角花杖與四條基準線構成秩序。 |
| 05 | 教皇 The Hierophant | 古樹下的智者向兩位學習者分享發光幾何，藤蔓鑰匙象徵活的傳承。 |
| 06 | 戀人 The Lovers | 兩人隔溪合起同一花枝，雙路在翼形天幕下交會，呈現關係與選擇。 |
| 07 | 戰車 The Chariot | 星冠車駕由一明一暗的雲獅前導，兩條金路匯成專注方向。 |
| 08 | 力量 Strength | 人與獅以溫柔接觸共享呼吸，鬃毛化為花藤並形成無限符號。 |
| 09 | 隱者 The Hermit | 長者提著內含一顆星的晶格燈籠，沿靜夜山路向上。 |
| 10 | 命運之輪 Wheel of Fortune | 四季水輪以種子、花、果與落葉為輪輻，山河在其中循環。 |
| 11 | 正義 Justice | 中性裁決者以鉛垂線和空秤保持平衡，筆直水面分隔後果與清明。 |
| 12 | 倒吊人 The Hanged Man | 安全改寫為冥想者漂浮於山湖之上，湖中倒影顛倒發光，表達換位觀看。 |
| 13 | 死神 Death | 安全改寫為黑蛹裂開、光蛾飛向晨光，落葉化成滋養白花的河。 |
| 14 | 節制 Temperance | 翼形工匠在溪邊交換兩器之水，水流形成平衡的八字形。 |
| 15 | 惡魔 The Devil | 戴面具的人面對藤蔓暗鏡，鬆開的金環與鏡中自由身影呈現覺察與鬆綁。 |
| 16 | 高塔 The Tower | 閃電沿觀星塔裂出一線星光，紙鳥飛出、舊冠落下、地基長出新芽。 |
| 17 | 星星 The Star | 人物將兩器之水分別倒入池與土地，八顆星守護新生植物。 |
| 18 | 月亮 The Moon | 巨月映照潮濕地，銀狐與黑狼守在兩岸，螃蟹從水中走向霧路。 |
| 19 | 太陽 The Sun | 兩名孩子持朱紅長帶跑過向日葵田，開門通往清晰山景。 |
| 20 | 審判 Judgement | 晨光中旅人從花形小舟醒來，仙鶴鳴聲化為水面同心圓，引向山口。 |
| 21 | 世界 The World | 舞者在四季植物花環中完成光之軌道，鶴、鹿、龜、狐守護四方。 |

## 動畫

- 牌背翻面：0.8 秒 3D 翻牌。
- 牌面揭曉：1.15 秒金色光帶掃過。
- 正位牌：9 秒低幅縮放與上移。
- 逆位牌：保持 180 度方向並套用相同呼吸動畫。
- 生日塔羅：12 秒局部視差漂移。
- `prefers-reduced-motion: reduce` 啟用時自動停止上述動畫。
