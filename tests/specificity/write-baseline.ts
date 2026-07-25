import { writeFileSync } from 'node:fs';
import { OVER_GENERIC_THRESHOLD, WATCH_THRESHOLD, type AnalysisResult, type TemplateStat } from './analyze';

const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;

/** Markdown 表格欄位需跳脫直線與換行。 */
const cell = (text: string): string => text.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function truncate(text: string, max = 78): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function table(stats: TemplateStat[]): string {
  if (!stats.length) return '_（無）_\n';
  const head = '| # | 來源檔案 | 欄位 | 句子模板 | 出現率 | 判定 | 違反規則 |\n| --- | --- | --- | --- | ---: | --- | --- |\n';
  const rows = stats.map((stat, index) => {
    const fields = stat.fields.length > 2 ? `${stat.fields.slice(0, 2).join('、')} 等 ${stat.fields.length} 處` : stat.fields.join('、');
    const rules = stat.voiceRules.length ? stat.voiceRules.join('、') : '—';
    return `| ${index + 1} | \`${cell(stat.source)}\` | \`${cell(fields)}\` | ${cell(truncate(stat.template))} | ${pct(stat.rate)} | \`${stat.verdict}\` | ${rules} |`;
  });
  return head + rows.join('\n') + '\n';
}

export function renderBaseline(result: AnalysisResult): string {
  const over = result.stats.filter((s) => s.verdict === 'OVER_GENERIC');
  const watch = result.stats.filter((s) => s.verdict === 'WATCH');
  const ok = result.stats.filter((s) => s.verdict === 'OK');
  const overRate = result.totalTemplates ? over.length / result.totalTemplates : 0;

  return `# 具體性基線報告（Specificity Baseline）

> 由 \`npm run test:specificity\` 自動產生，請勿手動編輯。
> 本次量測：${result.chartCount} 組合成命盤，亂數種子 \`${result.seed}\`（固定，結果可重現）。
> 耗時 ${(result.elapsedMs / 1000).toFixed(1)} 秒。
> 判定標準見 [voice.md](./voice.md)：出現率 > ${pct(OVER_GENERIC_THRESHOLD)} 為 \`OVER_GENERIC\`，${pct(WATCH_THRESHOLD)}–${pct(OVER_GENERIC_THRESHOLD)} 為 \`WATCH\`，其餘為 \`OK\`。

## 總覽

| 指標 | 數值 |
| --- | ---: |
| 抽取句子總數（含重複） | ${result.totalSentences.toLocaleString()} |
| 去重後的句子模板數 | ${result.totalTemplates} |
| \`OVER_GENERIC\` | **${over.length}**（佔全部模板 ${pct(overRate)}） |
| \`WATCH\` | ${watch.length} |
| \`OK\` | ${ok.length} |

### voice.md 靜態規則違規

| 規則 | 違規數 | 說明 |
| --- | ---: | --- |
| R1-formal-pronoun | ${result.voiceRuleTotals['R1-formal-pronoun']} | 出現「您」的句子模板數 |
| R2-future-assertion | ${result.voiceRuleTotals['R2-future-assertion']} | 含未來斷言詞的句子模板數 |
| R3-paragraph-length | ${result.voiceRuleTotals['R3-paragraph-length']} | 超過 3 句的段落模板數 |
| R4-hedges | ${result.voiceRuleTotals['R4-hedges']} | 模糊限定詞超過每份 1 次上限的**命盤數**（${pct(result.hedgeOverLimitRate)}） |

每份報告平均出現 **${result.averageHedgesPerReport.toFixed(1)}** 個模糊限定詞（可能／或許／傾向於／往往／有時），上限為 1。

### R3 違規段落（超過 3 句）

${result.longParagraphs.length === 0 ? '_（無）_' : `| 來源檔案 | 欄位 | 句數 | 內容範例 |\n| --- | --- | ---: | --- |\n${result.longParagraphs
    .map((p) => `| \`${cell(p.source)}\` | \`${cell(p.field)}\` | ${p.sentenceCount} | ${cell(truncate(p.example, 90))} |`)
    .join('\n')}`}

## OVER_GENERIC（出現率 > ${pct(OVER_GENERIC_THRESHOLD)}）

這些句子在超過三成的命盤中都會出現。依 voice.md 的核心判準——「一句解讀必須有可能說錯」——它們幾乎不可能是在描述某個特定的人。**依嚴重度（出現率）排序：**

${table(over)}

## WATCH（出現率 ${pct(WATCH_THRESHOLD)}–${pct(OVER_GENERIC_THRESHOLD)}）

尚未越線，但已足夠常見，改寫時應一併檢視。

${table(watch)}

## OK（出現率 < ${pct(WATCH_THRESHOLD)}）

共 ${ok.length} 條，具備足夠的命盤區辨度。前 30 條如下（完整清單可由工具重新產生）：

${table(ok.slice(0, 30))}

---

## 備註

- 本報告只做量測，**未修改任何既有文案**。
- \`cautions\` 免責文字、\`src/data/barnum-statements.ts\`（教學用的巴納姆句）與籤詩傳統原文依 voice.md 白名單排除於統計外。
- 出現率的分母是命盤數（${result.chartCount}），不是句子數：同一模板在同一份報告出現多次仍只計一次。
- 模板比對前會將干支、生肖、星座、五行、數字與日期正規化為佔位符，因此「同一個模板的不同插值」會被歸為同一句。
`;
}

export function writeBaseline(result: AnalysisResult, path: string): void {
  writeFileSync(path, renderBaseline(result), 'utf8');
}
