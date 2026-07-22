import type { FateReportInput } from '../types/fate';

export const SYSTEM_PROMPT = `你是 FateVerse 的命理文化解讀助手。
你的工作不是預測確定的未來，而是根據系統提供的結構化命理資料，
將不同文化中的命理觀點整理成清楚、溫和、容易理解的繁體中文報告。
請遵守以下規則：
1. 只能根據輸入資料回答。
2. 不可重新計算或修改八字、生肖、星座、生命靈數及籤詩內容。
3. 不可編造沒有提供的典故、資料或命理結論。
4. 清楚區分不同命理系統的觀點。
5. 分析不同系統之間的共同點與差異。
6. 將結果描述為文化觀察、自我反思與可能傾向，而非必然命運或科學定論。
7. 不提供醫療診斷、法律結論、投資保證或重大人生決策指示。
8. 不預測死亡、疾病、犯罪、災難或確切事件日期。
9. 使用臺灣繁體中文。
10. 提供具體、溫和、可執行但不強迫的行動建議。
11. 內容保持精簡，整份報告控制在約 700 個繁體中文字內。
只能輸出符合指定結構的 JSON，不得加入 Markdown code fence。`;

const FOCUS_LABELS: Record<string, string> = {
  personality: '個性', career: '工作', love: '感情', finance: '財務', family: '家庭',
  relationships: '人際', direction: '人生方向', all: '全部',
};

export function buildReportUserPrompt(input: FateReportInput): string {
  return `請根據以下 FateReportInput 產生報告。不要重新計算任何欄位。缺少的月亮星座、上升星座、宮位或姓名資料應直接略過，不可補猜。

輸出 JSON 結構：
{
  "summary": "string",
  "sharedPatterns": ["string"],
  "differences": ["string"],
  "sections": { "bazi": "string", "zodiac": "string", "astrology": "string", "ziwei": "optional string", "numerology": "string", "name": "optional string" },
  "focusAnalysis": [{ "topic": "string", "analysis": "string", "suggestions": ["string"] }],
  "cautions": ["string"]
}

篇幅要求：summary 2 句；sharedPatterns 2 項；differences 1 至 2 項；每個 sections 欄位 2 句；每個關注主題提供 2 項 suggestions；cautions 2 項。

結構化資料：
${JSON.stringify(input)}`;
}

function compactReportInput(input: FateReportInput) {
  return {
    關注主題: input.userFocus.map((focus) => FOCUS_LABELS[focus] ?? focus),
    八字: {
      日主: input.bazi.dayMaster,
      日主五行: input.bazi.dayMasterElement,
      四柱: input.bazi.pillars.map((pillar) => pillar.value),
      相對突出五行: input.fiveElements.strongest,
      相對較少五行: input.fiveElements.weakest,
    },
    生肖: { 動物: input.zodiac.animal, 正向特質: input.zodiac.positiveTraits.slice(0, 2) },
    西洋占星: {
      太陽星座: input.astrology.sunSign,
      月亮星座: input.astrology.moonSign,
      優勢: input.astrology.strengths.slice(0, 2),
    },
    生命靈數: {
      數字: input.numerology.lifePathNumber,
      主題: input.numerology.title,
      優勢: input.numerology.strengths.slice(0, 2),
    },
    紫微斗數: input.ziwei ? {
      命主: input.ziwei.soul,
      身主: input.ziwei.body,
      五行局: input.ziwei.fiveElementsClass,
      命宮主星: input.ziwei.palaces.find((palace) => palace.name === '命宮')?.majorStars.map((star) => star.name),
      大限命宮: input.ziwei.currentHoroscope?.decadal.palaceName,
      流年命宮: input.ziwei.currentHoroscope?.yearly.palaceName,
    } : undefined,
  };
}

export function buildFastReportUserPrompt(input: FateReportInput): string {
  return `根據下列已計算資料，輸出一個很短的繁體中文 JSON。不要重算，不要加入其他欄位：
{
  "summary": "最多70字的跨系統摘要",
  "suggestions": ["12至25字的行動一", "12至25字的行動二"]
}
第一個字必須是 {，最後一個字必須是 }。只輸出 JSON，不要 Markdown、解釋或思考過程。資料：
摘要第一句寫兩個系統支持的共同傾向，第二句寫一個不同視角；直接描述傾向，不可使用「結論」、「影響」、「很重要」、「被接受」等空泛詞。
兩項建議不可重複摘要，每項12至25字，必須以「記錄、安排、確認、拆分、練習、比較」其中一個動詞開頭；至少包含「本週、三次、30分鐘」其中一個可查核條件，不可叫使用者選擇或相信某種命理。
${JSON.stringify(compactReportInput(input))}`;
}
