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

export function buildReportUserPrompt(input: FateReportInput): string {
  return `請根據以下 FateReportInput 產生報告。不要重新計算任何欄位。缺少的月亮星座、上升星座、宮位或姓名資料應直接略過，不可補猜。

輸出 JSON 結構：
{
  "summary": "string",
  "sharedPatterns": ["string"],
  "differences": ["string"],
  "sections": { "bazi": "string", "zodiac": "string", "astrology": "string", "numerology": "string", "name": "optional string" },
  "focusAnalysis": [{ "topic": "string", "analysis": "string", "suggestions": ["string"] }],
  "cautions": ["string"]
}

篇幅要求：summary 2 句；sharedPatterns 2 項；differences 1 至 2 項；每個 sections 欄位 2 句；每個關注主題提供 2 項 suggestions；cautions 2 項。

結構化資料：
${JSON.stringify(input)}`;
}
