# 具體性基線報告（Specificity Baseline）

> 由 `npm run test:specificity` 自動產生，請勿手動編輯。
> 本次量測：500 組合成命盤，亂數種子 `fateverse-specificity-baseline-v1`（固定，結果可重現）。
> 耗時 24.3 秒。
> 判定標準見 [voice.md](./voice.md)：出現率 > 30.0% 為 `OVER_GENERIC`，15.0%–30.0% 為 `WATCH`，其餘為 `OK`。

## 總覽

| 指標 | 數值 |
| --- | ---: |
| 抽取句子總數（含重複） | 67,668 |
| 去重後的句子模板數 | 3813 |
| 其中屬「對人的解讀」 | 3400 |
| 其中屬「框架文字」（方法說明／免責／資料標籤） | 413 |
| `OVER_GENERIC` | **39**（佔解讀類 1.1%） |
| `WATCH` | 59 |
| `OK` | 3302 |

> 出現率判準只套用在**對人的解讀**上。方法說明、免責提醒與資料標籤（如「留意：{特質}」「生肖（子支）」）
> 本來就該對所有人成立，把它們算進去會把免責聲明誤判成巴納姆句，因此另列為 `FRAMING` 不計分。

### voice.md 靜態規則違規

| 規則 | 違規數 | 說明 |
| --- | ---: | --- |
| R1-formal-pronoun | 0 | 出現「您」的句子模板數 |
| R2-future-assertion | 0 | 含未來斷言詞的句子模板數 |
| R3-paragraph-length | 0 | 超過 3 句的段落模板數 |
| R4-hedges | 0 | 模糊限定詞超過每份 1 次上限的**命盤數**（0.0%） |

每份報告平均出現 **0.0** 個模糊限定詞（可能／或許／傾向於／往往／有時），上限為 1。

### R3 違規段落（超過 3 句）

_（無）_

## OVER_GENERIC（出現率 > 30.0%）

共 39 條，再依「插值比例」分成兩類。插值比例是模板中 `{佔位符}` 所佔的字元比例：
比例低代表不論誰來看幾乎都是同一段字；比例高代表這是句框，區辨度來自填入的命盤內容。

### A. 靜態泛用句（插值 < 25.0%）——優先改寫目標

共 **33** 條。這些句子在超過三成的命盤中出現，而且內容幾乎不隨命盤變化，
最符合 voice.md 核心判準所要排除的情況：換個人來看仍然成立。**依出現率排序：**

| # | 來源檔案 | 欄位 | 句子模板 | 出現率 | 插值比例 | 判定 | 違反規則 |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| 1 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 四柱{五行}偏少這件事，傳統上會被解讀成「{五行}類的節奏比較不是你的預設值」，換成現代語言就是：與其模仿別人的作息，不如觀察自{天干}什麼時候最有電、什麼… | 100.0% | 19.8% | `OVER_GENERIC` | — |
| 2 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 四柱裡{五行}最多，代表你自然而然就會用{五行}的方式做事；{五行}比例少，不是缺陷，而是提醒你這類任務要嘛刻意練、要嘛找隊友補位。 | 100.0% | 18.2% | `OVER_GENERIC` | — |
| 3 | `src/engines/integration-engine.ts` | `unified.plainSummary` | 目前整合完成度 {百分比}，補上尚{地支}加入的系統會讓這張剖面更貼近你。 | 100.0% | 24.3% | `OVER_GENERIC` | — |
| 4 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 這幾套系統各自用不同語言，卻在描述同一個人不同角度的側臉。 | 100.0% | 0.0% | `OVER_GENERIC` | — |
| 5 | `src/engines/fusion-engine.ts` | `fusion.timing.plainReading` | 兩套系統都有「十年一個大階段」的概念。 | 66.8% | 0.0% | `OVER_GENERIC` | — |
| 6 | `src/engines/fusion-engine.ts` | `fusion.consensus.plainSummary` | 你可以把它當成「最常出現的底色」，其他元素則是不同場合會冒出來的配色。 | 63.6% | 0.0% | `OVER_GENERIC` | — |
| 7 | `src/engines/fusion-engine.ts` | `timeline.past.advice` | 回頭挑出那段時間真正有效的一兩個習慣，帶著走；證明沒用的模式，也趁換階段放下。 | 61.2% | 0.0% | `OVER_GENERIC` | — |
| 8 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 人格與靈魂同一張牌，代表內外一致。 | 60.0% | 0.0% | `OVER_GENERIC` | — |
| 9 | `src/engines/fusion-engine.ts` | `timeline.future.reading` | 可以確定的是：四柱裡{五行}偏少，{地支}來刻意補上這類經驗（或找這類隊友），你的選擇會變多。 | 54.6% | 17.0% | `OVER_GENERIC` | — |
| 10 | `src/engines/integration-engine.ts` | `unified.plainSummary` | 相對較淡的是{五行}，不是缺陷，只是這些能量比較不是你的預設值。 | 47.8% | 12.5% | `OVER_GENERIC` | — |
| 11 | `src/engines/fusion-engine.ts` | `timeline.future.reading` | 傳統的講法是氣氛會換季——不是變好或變壞，而是換一種規則玩。 | 45.4% | 0.0% | `OVER_GENERIC` | — |
| 12 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 全部疊起來，比較像在說：你喜歡成長、往前展開，像植物一樣需要空間和方向。 | 40.0% | 0.0% | `OVER_GENERIC` | — |
| 13 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 講白話：在關係裡，你在關係裡重視一起進步的感覺，最怕原地踏步。 | 40.0% | 0.0% | `OVER_GENERIC` | — |
| 14 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 講白話：照這幾套系統的共識，你悶在室內太久會蔫掉，散步、綠意和換個環境最能回血。 | 40.0% | 0.0% | `OVER_GENERIC` | — |
| 15 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 講白話：綜合起來，你需要看得到成長性的環境，例如規劃、教育、內容或把小東西養大的專案。 | 40.0% | 0.0% | `OVER_GENERIC` | — |
| 16 | `src/engines/fusion-engine.ts` | `timeline.past.reading` | 你還在第一段大運之前或剛起步的階段。 | 38.8% | 0.0% | `OVER_GENERIC` | — |
| 17 | `src/engines/fusion-engine.ts` | `timeline.past.advice` | 這個階段重點不是定型，而是多試：把各種有興趣的事都碰一碰，記下哪些讓你特別有電。 | 38.8% | 0.0% | `OVER_GENERIC` | — |
| 18 | `src/engines/integration-engine.ts` | `unified.plainSummary` | 五行分布相當均衡，各種模式都拿得出來。 | 36.6% | 0.0% | `OVER_GENERIC` | — |
| 19 | `src/engines/integration-engine.ts` | `unified.plainSummary` | 把目前接上的 {數} 套系統全部換算成五行後加權平均，你的整體主軸落在「{五行}」——求穩、講信用，喜歡把事情放在可靠的基礎上。 | 36.2% | 10.9% | `OVER_GENERIC` | — |
| 20 | `src/engines/fusion-engine.ts` | `fusion.consensus.plainSummary` | 講白話：把 {數} 套系統各自換算成五行後，有 {數} 套不約而同指向「{五行}」。 | 36.0% | 23.8% | `OVER_GENERIC` | — |
| 21 | `src/engines/fallback-report.ts` | `focusAnalysis[].analysis` | 這禮拜留意一下：你有把握的時候和被逼的時候，做事節奏差多少。 | 35.8% | 0.0% | `OVER_GENERIC` | — |
| 22 | `src/engines/fallback-report.ts` | `focusAnalysis[].analysis` | 重點不是替誰貼標籤，是把需求、界線和期待講清楚。 | 35.8% | 0.0% | `OVER_GENERIC` | — |
| 23 | `src/engines/fallback-report.ts` | `focusAnalysis[].analysis` | 方向不是哪一套系統能替你決定的——把日主{天干}、生命靈數 {數} 和你真正在乎的東西放在一起，用小實驗去試哪一個撐得久。 | 35.6% | 11.5% | `OVER_GENERIC` | — |
| 24 | `src/engines/fusion-engine.ts` | `fusion.highlights[].title` | 星座強調的能量，恰好是八字裡最少的五行 | 34.2% | 0.0% | `OVER_GENERIC` | — |
| 25 | `src/engines/fusion-engine.ts` | `fusion.highlights[].plainExplanation` | 白話說：太陽星座描述的是你「想活出來的樣{地支}」，八字結構比較像「出廠預設值」——兩者打架時，你會在「想成為的樣{地支}」和「做起來順手的方式」之間覺得卡… | 34.2% | 7.8% | `OVER_GENERIC` | — |
| 26 | `src/engines/fusion-engine.ts` | `timeline.present.reading` | 以你{五行}的本質來看，現在最重要的是照自{天干}的節奏走，不用跟別人比進度。 | 33.2% | 20.5% | `OVER_GENERIC` | — |
| 27 | `src/engines/fusion-engine.ts` | `fusion.consensus.plainSummary` | 講白話：{數} 套系統換算成五行後，「{五行}」被點名 {數} 次，算是相對明顯的主題，但沒有一面倒。 | 33.2% | 19.6% | `OVER_GENERIC` | — |
| 28 | `src/engines/fusion-engine.ts` | `fusion.highlights[].plainExplanation` | 白話說：這幾套來自不同文化、彼此沒有抄襲關係的系統，居然講到同一種能量，那「求穩、講信用，喜歡把事情放在可靠的基礎上」大概就是你身上最不需要懷疑的部分。 | 32.6% | 0.0% | `OVER_GENERIC` | — |
| 29 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 全部疊起來，比較像在說：你求穩、講信用，喜歡把事情放在可靠的基礎上。 | 30.6% | 0.0% | `OVER_GENERIC` | — |
| 30 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 講白話：在關係裡，你用行動和陪伴表達在乎，勝過甜言蜜語。 | 30.6% | 0.0% | `OVER_GENERIC` | — |
| 31 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 講白話：照這幾套系統的共識，你規律作息就是你的充電器，生活一亂整個人就卡。 | 30.6% | 0.0% | `OVER_GENERIC` | — |
| 32 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 講白話：綜合起來，你適合營運、管理、後勤這類把事情穩穩接住的角色。 | 30.6% | 0.0% | `OVER_GENERIC` | — |
| 33 | `src/engines/fusion-engine.ts` | `fusion.consensus.plainSummary` | 講白話：{數} 套系統換算成五行後，「{列表}」被點名 {數} 次，算是相對明顯的主題，但沒有一面倒。 | 30.4% | 19.6% | `OVER_GENERIC` | — |


### B. 高插值句框（插值 ≥ 25.0%）——次要

共 6 條。模板本身每份報告都會出現，但填入的干支、五行、星座等內容因人而異，
實際讀到的文字並不相同。改寫優先度低於 A 類，但仍可檢查句框本身是否過於制式。

| # | 來源檔案 | 欄位 | 句子模板 | 出現率 | 插值比例 | 判定 | 違反規則 |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| 1 | `src/engines/fallback-report.ts` | `sections.bazi` | 你的日主是{天干}{五行}，四柱為{列表}。 | 100.0% | 54.5% | `OVER_GENERIC` | — |
| 2 | `src/engines/fusion-engine.ts` | `fusion.highlights[].title` | {數} 套系統同時指向「{五行}」 | 76.4% | 41.2% | `OVER_GENERIC` | — |
| 3 | `src/engines/fusion-engine.ts` | `systemConclusions[].headline` | 太陽{星座} · {五行}元素 | 74.4% | 53.3% | `OVER_GENERIC` | — |
| 4 | `src/engines/fallback-report.ts` | `sharedPatterns[]` | 日主{五行}和{五行}講的都是你做事的節奏，只是用了不同的詞。 | 74.4% | 25.8% | `OVER_GENERIC` | — |
| 5 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 四柱裡{五行}最多、{五行}最少；綜合全盤來看日主屬「弱」，喜用五行偏向{列表}。 | 38.4% | 29.3% | `OVER_GENERIC` | — |
| 6 | `src/engines/fusion-engine.ts` | `systemConclusions[].headline` | 日主 {天干} · {五行} · 弱 | 38.4% | 44.4% | `OVER_GENERIC` | — |


## WATCH（出現率 15.0%–30.0%）

尚未越線，但已足夠常見，改寫時應一併檢視。

| # | 來源檔案 | 欄位 | 句子模板 | 出現率 | 插值比例 | 判定 | 違反規則 |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| 1 | `src/engines/fusion-engine.ts` | `fusion.highlights[].plainExplanation` | 白話說：這幾套來自不同文化、彼此沒有抄襲關係的系統，居然講到同一種能量，那「喜歡成長、往前展開，像植物一樣需要空間和方向」大概就是你身上最不需要懷疑的部分。 | 29.8% | 0.0% | `WATCH` | — |
| 2 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 你多半是人群充電型：跟人互動會讓你更有勁，行程太空反而悶。 | 28.4% | 0.0% | `WATCH` | — |
| 3 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 安排社交沒問題，睡眠別跟著犧牲就好。 | 28.4% | 0.0% | `WATCH` | — |
| 4 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 你八成是「想法藏不住」的人：直說是你的魅力，只要在重要場合先想三秒再開口，就幾乎沒有缺點。 | 28.0% | 0.0% | `WATCH` | — |
| 5 | `src/engines/fallback-report.ts` | `sections.name、systemConclusions[].conclusion` | 名字中部分字的五行，剛好對到你命盤相對較弱的元素——可以當成有趣的呼應，但不是「缺什麼就補什麼」的判定。 | 27.6% | 0.0% | `WATCH` | — |
| 6 | `src/engines/fusion-engine.ts` | `fusion.headline` | 把 {數} 套系統疊起來看，你的主旋律偏「{五行}」：求穩、講信用，喜歡把事情放在可靠的基礎上。 | 25.8% | 14.6% | `WATCH` | — |
| 7 | `src/engines/fusion-engine.ts` | `systemConclusions[].headline` | 太陽{星座} · 風元素 | 25.6% | 33.3% | `WATCH` | — |
| 8 | `src/engines/fallback-report.ts` | `sharedPatterns[]` | 日主{五行}和風講的都是你做事的節奏，只是用了不同的詞。 | 25.6% | 14.3% | `WATCH` | — |
| 9 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 幾套系統一起看，你多半是「先做了再修」的類型：起步快是優勢，記得留一點回頭檢查的餘裕就好。 | 25.0% | 0.0% | `WATCH` | — |
| 10 | `src/engines/fusion-engine.ts` | `fusion.highlights[].plainExplanation` | {星座}偏{五行}元素（近似{五行}），但你的四柱裡{五行}比例最少。 | 24.6% | 45.7% | `WATCH` | — |
| 11 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 兩種充電方式訊號各半：熱鬧完你需要一段獨處才回得了神，安排行程時記得留白。 | 24.6% | 0.0% | `WATCH` | — |
| 12 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 幾套系統都說你是步驟派：規劃是你的強項，但世界不會永遠照計畫走，留一格「計畫外」的彈性會更輕鬆。 | 24.4% | 0.0% | `WATCH` | — |
| 13 | `src/engines/fallback-report.ts` | `focusAnalysis[].suggestions[]` | 挑一個習慣，設一個當天就看得出有沒有做到的標準 | 24.2% | 0.0% | `WATCH` | — |
| 14 | `src/engines/fallback-report.ts` | `sections.astrology` | 太陽位於{星座}，月亮位於{星座}，上升位於{星座}，太陽星座屬{五行}元素、開創模式。 | 24.0% | 36.4% | `WATCH` | — |
| 15 | `src/engines/fusion-engine.ts` | `fusion.headline` | 把 {數} 套系統疊起來看，你的主旋律偏「{五行}」：喜歡成長、往前展開，像植物一樣需要空間和方向。 | 24.0% | 14.0% | `WATCH` | — |
| 16 | `src/engines/fallback-report.ts` | `focusAnalysis[].suggestions[]` | 把一個重大選擇拆成兩週內可以回頭的小實驗 | 23.8% | 0.0% | `WATCH` | — |
| 17 | `src/engines/fallback-report.ts` | `focusAnalysis[].suggestions[]` | 選一個兩週內能做完的小實驗，測試某個方向 | 23.8% | 0.0% | `WATCH` | — |
| 18 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 快慢兩邊的訊號差不多：你大概是「看場合切換」的人，熟悉的事衝很快，沒把握的事會先觀望。 | 23.6% | 0.0% | `WATCH` | — |
| 19 | `src/engines/fallback-report.ts` | `focusAnalysis[].suggestions[]` | 把一個期待講成具體要求，不要讓對方猜 | 23.6% | 0.0% | `WATCH` | — |
| 20 | `src/engines/fallback-report.ts` | `sections.astrology` | 太陽位於{星座}，月亮位於{星座}，上升位於{星座}，太陽星座屬{五行}元素、固定模式。 | 23.2% | 36.4% | `WATCH` | — |
| 21 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 外放和內斂的訊號各半：熟人面前你話多，生人面前你先觀察——這是兩種模式輪流上場，不用勉強自{天干}統一。 | 23.0% | 7.7% | `WATCH` | — |
| 22 | `src/engines/fusion-engine.ts` | `timeline.present.advice` | 適合做減法：把不重要的承諾收掉，讓規則和品質說話，成果會更俐落。 | 23.0% | 0.0% | `WATCH` | — |
| 23 | `src/engines/fallback-report.ts` | `sections.astrology` | 太陽位於{星座}，月亮位於{星座}，上升位於{星座}，太陽星座屬{五行}元素、變動模式。 | 22.6% | 36.4% | `WATCH` | — |
| 24 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 感覺與分析勢均力敵：你大概是「先感覺、再驗算」的混合型，這其實是決策裡很健康的配置。 | 22.4% | 0.0% | `WATCH` | — |
| 25 | `src/engines/fusion-engine.ts` | `fusion.highlights[].plainExplanation` | 五行票數分散在四種以上元素，白話說：你是「多聲道」的人——家人、同事、老朋友對你的形容會差很多，而且他們都沒說錯。 | 22.2% | 0.0% | `WATCH` | — |
| 26 | `src/engines/fusion-engine.ts` | `fusion.highlights[].title` | 各系統看到的你相當不同 | 22.2% | 0.0% | `WATCH` | — |
| 27 | `src/engines/fusion-engine.ts` | `fusion.highlights[].plainExplanation` | 與其煩惱哪個才是真的你，不如把這當成場合切換的彈性。 | 22.2% | 0.0% | `WATCH` | — |
| 28 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 你的核心是{五行}——像{五行}一樣會繞路、會滲透，觀察力和適應力強。 | 21.4% | 22.9% | `WATCH` | — |
| 29 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 你的核心是{五行}——重視品質和原則，喜歡把事情切得清楚俐落。 | 21.0% | 12.9% | `WATCH` | — |
| 30 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 整體偏外放：大部分時候願意把話說出來，但也懂得看場合，這是很好用的組合。 | 21.0% | 0.0% | `WATCH` | — |
| 31 | `src/engines/fusion-engine.ts` | `timeline.present.advice` | 這段時間適合被看見：主動爭取上台、發表、帶頭的機會，但幫自{天干}排好休息時間。 | 21.0% | 10.0% | `WATCH` | — |
| 32 | `src/engines/fusion-engine.ts` | `fusion.highlights[].plainExplanation` | 你的生肖{生肖}（{地支}支）和日主{天干}同屬{五行}。 | 20.8% | 55.2% | `WATCH` | — |
| 33 | `src/engines/fusion-engine.ts` | `fusion.highlights[].title` | 生肖年支與八字日主同屬一行 | 20.8% | 0.0% | `WATCH` | — |
| 34 | `src/engines/fusion-engine.ts` | `fusion.highlights[].plainExplanation` | 白話說：連最粗略的生肖和最精細的日主都對上了，這種內外一致的人通常「給人的第一印象」和「實際相處起來」落差不大。 | 20.8% | 0.0% | `WATCH` | — |
| 35 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 你的核心是{五行}——自帶熱度、要發光，情緒和行動都來得快。 | 20.4% | 13.3% | `WATCH` | — |
| 36 | `src/engines/fusion-engine.ts` | `timeline.present.advice` | 適合流動與連結：多交流、多打聽、多學習，答案常常在別人的一句話裡。 | 20.4% | 0.0% | `WATCH` | — |
| 37 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 整體偏向行動派：想到就想動，但還保有踩煞車的能力，算是不錯的平衡。 | 20.0% | 0.0% | `WATCH` | — |
| 38 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 可以善用這個天線，同時養成把理由補齊的小習慣。 | 19.8% | 0.0% | `WATCH` | — |
| 39 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 整體偏直覺派：先有感覺、再找理由。 | 19.8% | 0.0% | `WATCH` | — |
| 40 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 整體偏群體型：喜歡有人一起，但也撐得住獨處，恢復方式算有彈性。 | 19.8% | 0.0% | `WATCH` | — |
| 41 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 四柱裡{五行}最多、{五行}最少；綜合全盤來看日主屬「偏弱」，喜用五行偏向{列表}。 | 19.4% | 28.6% | `WATCH` | — |
| 42 | `src/engines/fusion-engine.ts` | `systemConclusions[].headline` | 日主 {天干} · {五行} · 偏弱 | 19.4% | 42.1% | `WATCH` | — |
| 43 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 你的直覺雷達相當強：第一感覺常常是對的，但{五行}額大或影響久的決定，還是幫直覺配一張檢查清單。 | 19.2% | 8.3% | `WATCH` | — |
| 44 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 你的核心是{五行}——喜歡成長、往前展開，像植物一樣需要空間和方向。 | 18.8% | 11.8% | `WATCH` | — |
| 45 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 你的核心是{五行}——求穩、講信用，喜歡把事情放在可靠的基礎上。 | 18.4% | 12.5% | `WATCH` | — |
| 46 | `src/engines/fusion-engine.ts` | `timeline.present.advice` | 適合打地基：把生活作息、財務和手上的專案整理穩，慢就是快。 | 18.2% | 0.0% | `WATCH` | — |
| 47 | `src/engines/fusion-engine.ts` | `systemConclusions[].headline` | 日主 {天干} · {五行} · 中和 | 17.6% | 42.1% | `WATCH` | — |
| 48 | `src/engines/fusion-engine.ts` | `timeline.present.advice` | 把重心放在「養大一件事」：挑一個值得長期投入的方向，定期回頭看它有沒有長高。 | 17.4% | 0.0% | `WATCH` | — |
| 49 | `src/engines/integration-engine.ts` | `unified.plainSummary` | 把目前接上的 {數} 套系統全部換算成五行後加權平均，你的整體主軸落在「{五行}」——喜歡成長、往前展開，像植物一樣需要空間和方向。 | 17.2% | 10.6% | `WATCH` | — |
| 50 | `src/engines/fusion-engine.ts` | `timeline.past.reading` | 你上一段走的是{干支}大運：和你的本質同屬{五行}，同類相挺，適合放大你原本就擅長的事。 | 16.4% | 18.2% | `WATCH` | — |
| 51 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 全部疊起來，比較像在說：你自帶熱度、要發光，情緒和行動都來得快。 | 16.4% | 0.0% | `WATCH` | — |
| 52 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 講白話：在關係裡，你表達直接、熱得快，需要對方接得住你的熱情。 | 16.4% | 0.0% | `WATCH` | — |
| 53 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 講白話：照這幾套系統的共識，你燒過頭容易斷電，安排固定的冷卻時間比硬撐重要。 | 16.4% | 0.0% | `WATCH` | — |
| 54 | `src/engines/fusion-engine.ts` | `fusion.domains[].plainReading` | 講白話：綜合起來，你適合能被看見的位置，例如簡報、推廣、帶氣氛、開新局。 | 16.4% | 0.0% | `WATCH` | — |
| 55 | `src/engines/fusion-engine.ts` | `fusion.headline` | 把 {數} 套系統疊起來看，你的主旋律偏「{列表}」：喜歡成長、往前展開，像植物一樣需要空間和方向。 | 16.0% | 14.0% | `WATCH` | — |
| 56 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 幾套系統都指向沉穩慢熬型：你適合把時間當隊友，用累積換成果；偶爾也給自{天干}一個「限時決定」的練習。 | 15.8% | 7.8% | `WATCH` | — |
| 57 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 整體偏向謀定而後動：你習慣先把路想清楚，好處是穩，只要別把「再想一下」變成拖延就行。 | 15.6% | 0.0% | `WATCH` | — |
| 58 | `src/engines/integration-engine.ts` | `unified.plainSummary` | 相對較淡的是{列表}，不是缺陷，只是這些能量比較不是你的預設值。 | 15.6% | 12.5% | `WATCH` | — |
| 59 | `src/engines/fusion-engine.ts` | `fusion.consensus.plainSummary` | 這麼多套不同文化的模型講到同一件事，代表「求穩、講信用，喜歡把事情放在可靠的基礎上」是你自{天干}也認得出來的主旋律。 | 15.4% | 6.8% | `WATCH` | — |


## OK（出現率 < 15.0%）

共 3302 條，具備足夠的命盤區辨度。前 30 條如下（完整清單可由工具重新產生）：

| # | 來源檔案 | 欄位 | 句子模板 | 出現率 | 插值比例 | 判定 | 違反規則 |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| 1 | `src/engines/fallback-report.ts` | `focusAnalysis[].analysis` | 你的五行{五行}多、{五行}少，拿這件事檢查一個問題：最近是不是只用了自{天干}順手的那幾招。 | 14.6% | 25.5% | `OK` | — |
| 2 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 幾套系統都指向獨處回血：留白對你不是奢侈是剛需，把獨處時間當正式行程排進去，狀態會穩很多。 | 14.6% | 0.0% | `OK` | — |
| 3 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 效率提示：小事給自{天干}五分鐘上限，把{五行}力留給大事。 | 14.2% | 26.7% | `OK` | — |
| 4 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 整體偏內斂：你習慣先在心裡整理好再說。 | 14.2% | 0.0% | `OK` | — |
| 5 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 整體偏分析派：你喜歡把選項攤開來比。 | 14.2% | 0.0% | `OK` | — |
| 6 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 記得，別人不會通靈——重要的需求還是要說出口。 | 14.2% | 0.0% | `OK` | — |
| 7 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 幾套系統都說你把話放心裡：深思是優點，但憋久了容易累積誤會，可以練習每天說出一件真實感受。 | 13.8% | 0.0% | `OK` | — |
| 8 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 靈魂牌「女祭司」則是你內在深層的動力。 | 13.6% | 0.0% | `OK` | — |
| 9 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 四柱裡{五行}最多、{五行}最少；綜合全盤來看日主屬「偏強」，喜用五行偏向{列表}。 | 13.2% | 28.6% | `OK` | — |
| 10 | `src/engines/fusion-engine.ts` | `systemConclusions[].headline` | 日主 {天干} · {五行} · 偏強 | 13.2% | 42.1% | `OK` | — |
| 11 | `src/engines/fusion-engine.ts` | `timeline.present.reading` | 你目前走{干支}大運：和你的本質同屬{五行}，同類相挺，適合放大你原本就擅長的事。 | 13.0% | 19.5% | `OK` | — |
| 12 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 內在主軸偏「祿存」象徵的特質，穩穩發揮比衝快更適合你。 | 13.0% | 0.0% | `OK` | — |
| 13 | `src/engines/fusion-engine.ts` | `timeline.past.reading` | 你上一段走的是{干支}大運：你的日主在生{五行}，屬於往外輸出、表現的時期，做得多也要記得補回來。 | 12.8% | 16.3% | `OK` | — |
| 14 | `src/engines/fusion-engine.ts` | `fusion.consensus.plainSummary` | 這麼多套不同文化的模型講到同一件事，代表「喜歡成長、往前展開，像植物一樣需要空間和方向」是你自{天干}也認得出來的主旋律。 | 12.8% | 6.6% | `OK` | — |
| 15 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 整體偏獨處型：安靜時刻是你的行動電源。 | 12.6% | 0.0% | `OK` | — |
| 16 | `src/engines/fusion-engine.ts` | `fusion.axes[].verdict` | 社交不是不行，但結束後給自{天干}緩衝時間，別連趕兩攤。 | 12.6% | 14.3% | `OK` | — |
| 17 | `src/engines/fusion-engine.ts` | `timeline.present.reading` | 你目前走{干支}大運：你的日主在生{五行}，屬於往外輸出、表現的時期，做得多也要記得補回來。 | 12.2% | 17.4% | `OK` | — |
| 18 | `src/engines/fusion-engine.ts` | `timeline.past.reading` | 你上一段走的是{干支}大運：{五行}剋你的日主，傳統上叫「官殺」，像有規範和壓力在推著你，扛得住就是升級。 | 12.0% | 15.1% | `OK` | — |
| 19 | `src/engines/fallback-report.ts` | `sections.name、systemConclusions[].conclusion` | 你的名字帶有「張弓開展、明理、美玉」的語意組合；尚{地支}收錄字義的字不作語意推測。 | 11.8% | 9.5% | `OK` | — |
| 20 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 內在主軸偏「武曲」象徵的特質，穩穩發揮比衝快更適合你。 | 11.8% | 0.0% | `OK` | — |
| 21 | `src/engines/fusion-engine.ts` | `systemConclusions[].headline` | 張哲瑋 · {數} 字 | 11.8% | 27.3% | `OK` | — |
| 22 | `src/engines/fallback-report.ts` | `sections.zodiac` | {生肖}對應{地支}支，傳統上說的是「精準與秩序」。 | 11.6% | 30.8% | `OK` | — |
| 23 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 「重視品質」和「表達清楚」是你的招牌；要留意的是已經夠好的東西還會再改一輪。 | 11.6% | 0.0% | `OK` | — |
| 24 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 你的人格牌是「戀人」（選擇、關係、價值觀）：重要的選擇擺在眼前，選那個和你價值觀一致的，而不是最輕鬆的。 | 11.6% | 0.0% | `OK` | — |
| 25 | `src/engines/fallback-report.ts` | `sections.name、systemConclusions[].conclusion` | 你的名字帶有「樹{五行}聚集、安定、清晨」的語意組合；尚{地支}收錄字義的字不作語意推測。 | 11.6% | 17.8% | `OK` | — |
| 26 | `src/engines/fallback-report.ts` | `sections.name、systemConclusions[].conclusion` | 你的名字帶有「陳述、常青、空間」的語意組合；尚{地支}收錄字義的字不作語意推測。 | 11.6% | 10.0% | `OK` | — |
| 27 | `src/engines/fallback-report.ts` | `sections.name、systemConclusions[].conclusion` | 你的名字帶有「領導、高雅、美玉」的語意組合；尚{地支}收錄字義的字不作語意推測。 | 11.6% | 10.0% | `OK` | — |
| 28 | `src/engines/fallback-report.ts` | `sections.zodiac` | 你的強項在重視品質、表達清楚、善於規劃；要留意的是已經夠好的東西還會再改一輪、桌面或流程一亂，做事效率就掉下來。 | 11.6% | 0.0% | `OK` | — |
| 29 | `src/engines/fusion-engine.ts` | `systemConclusions[].conclusion` | 內在主軸偏「巨門」象徵的特質，穩穩發揮比衝快更適合你。 | 11.6% | 0.0% | `OK` | — |
| 30 | `src/engines/fusion-engine.ts` | `systemConclusions[].headline` | 屬{生肖} · 精準與秩序 | 11.6% | 30.8% | `OK` | — |


---

## 備註

- `cautions` 免責文字、`src/data/barnum-statements.ts`（教學用的巴納姆句）與籤詩傳統原文依 voice.md 白名單排除於統計外。
- `FRAMING` 類（方法說明、免責提醒、資料標籤）不套用出現率判準，理由見上方總覽的說明。
- 出現率的分母是命盤數（500），不是句子數：同一模板在同一份報告出現多次仍只計一次。
- 模板比對前會將干支、生肖、星座、五行、數字與日期正規化為佔位符，因此「同一個模板的不同插值」會被歸為同一句。
