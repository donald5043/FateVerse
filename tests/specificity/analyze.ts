import { buildSyntheticCharts, CHART_COUNT, CHART_SEED, type SyntheticChart } from './synthetic-charts';
import {
  buildOnce, extractReportSentences, extractSynastrySentences, extractTimelineSentences,
  splitSentences, type BuiltReport, type ExtractionResult, type TextKind,
} from './extract-sentences';
import { checkFieldRules, countHedges, HEDGE_LIMIT, type VoiceRuleId } from './voice-rules';
import { checkPlainness, type PlainnessRuleId } from './plainness';
import { partnerIndex } from './pairing';

/** 判定門檻：出現率 > 30% 為過度泛用，15–30% 需觀察。 */
export const OVER_GENERIC_THRESHOLD = 0.3;
export const WATCH_THRESHOLD = 0.15;

/** framing 文字（方法說明／免責／資料標籤）不適用出現率判準，另立一類。 */
export type Verdict = 'OVER_GENERIC' | 'WATCH' | 'OK' | 'FRAMING';

export interface TemplateStat {
  kind: TextKind;
  template: string;
  /**
   * 模板中佔位符所佔的字元比例（0–1）。
   * 高比例代表這是「句框」——每份報告都會用到，但填入的內容因命盤而異，區辨度來自插值。
   * 低比例代表這是「靜態文案」——不論誰來看幾乎都是同一段字，才是真正的巴納姆風險。
   */
  placeholderRatio: number;
  example: string;
  source: string;
  fields: string[];
  chartCount: number;
  rate: number;
  verdict: Verdict;
  voiceRules: VoiceRuleId[];
}

export interface AnalysisResult {
  seed: string;
  chartCount: number;
  totalTemplates: number;
  totalSentences: number;
  stats: TemplateStat[];
  counts: Record<Verdict, number>;
  /** 違反 R4（每份報告限定詞 ≤ 1）的命盤比例。 */
  hedgeOverLimitRate: number;
  averageHedgesPerReport: number;
  voiceRuleTotals: Record<VoiceRuleId, number>;
  /** 違反 R3（段落 > 3 句）的欄位，格式為 `來源::欄位::句數`。 */
  longParagraphs: { source: string; field: string; sentenceCount: number; example: string }[];
  /** 口語度（R7–R9）：以「句子模板」為單位計數，同一句不因 500 份報告重複累加。 */
  plainnessRuleTotals: Record<PlainnessRuleId, number>;
  /** 出現最頻繁的口語度問題，供撰稿時優先處理。 */
  plainnessMarkers: { rule: PlainnessRuleId; marker: string; templates: number; source: string; suggestion: string }[];
  /** 有口語度問題的解讀類模板數。 */
  plainnessTemplates: number;
  elapsedMs: number;
}

function mergeExtractions(...parts: ExtractionResult[]): ExtractionResult {
  return {
    sentences: parts.flatMap((part) => part.sentences),
    fields: parts.flatMap((part) => part.fields),
  };
}

/** 佔位符低於此比例者視為靜態文案，是改寫的優先目標。 */
export const STATIC_PLACEHOLDER_MAX = 0.25;

/** 計算模板中 {佔位符} 所佔的字元比例。 */
export function placeholderRatioOf(template: string): number {
  if (!template.length) return 0;
  const placeholderChars = (template.match(/\{[^}]+\}/g) ?? []).reduce((sum, token) => sum + token.length, 0);
  return placeholderChars / template.length;
}

function verdictOf(rate: number, kind: TextKind): Verdict {
  // 免責、方法說明與資料標籤本來就該對所有人成立，不套用巴納姆判準。
  if (kind === 'framing') return 'FRAMING';
  if (rate > OVER_GENERIC_THRESHOLD) return 'OVER_GENERIC';
  if (rate >= WATCH_THRESHOLD) return 'WATCH';
  return 'OK';
}

export function analyze(charts: SyntheticChart[] = buildSyntheticCharts()): AnalysisResult {
  const startedAt = Date.now();

  // template → 統計累積
  const byTemplate = new Map<string, {
    kind: TextKind;
    example: string;
    source: string;
    fields: Set<string>;
    charts: Set<number>;
    voiceRules: Set<VoiceRuleId>;
  }>();

  const plainnessRuleTotals: Record<PlainnessRuleId, number> = {
    'R7-hedged-assertion': 0, 'R8-meta-commentary': 0, 'R9-bookish': 0,
  };
  // marker → { 命中的模板數, 來源, 建議 }
  const plainnessByMarker = new Map<string, { rule: PlainnessRuleId; templates: number; source: string; suggestion: string }>();

  const voiceRuleTotals: Record<VoiceRuleId, number> = {
    'R1-formal-pronoun': 0,
    'R2-future-assertion': 0,
    'R3-paragraph-length': 0,
    'R4-hedges': 0,
  };

  let totalSentences = 0;
  let hedgeOverLimitCharts = 0;
  let hedgeSum = 0;

  // R3 以「欄位模板」為單位記錄，避免同一段落在 500 份報告中重複累加。
  const longParagraphTemplates = new Map<string, { source: string; field: string; sentenceCount: number; example: string }>();

  // 每個人的報告只建一次：自己用一次，當別人的合盤對象時再用一次。
  const builtCache = new Map<number, BuiltReport>();
  const buildFor = (chart: SyntheticChart): BuiltReport => {
    const hit = builtCache.get(chart.index);
    if (hit) return hit;
    const built = buildOnce(chart.profile);
    builtCache.set(chart.index, built);
    return built;
  };

  for (const chart of charts) {
    let extracted: ExtractionResult;
    try {
      const partner = charts[partnerIndex(chart.index, charts.length)];
      const built = buildFor(chart);
      extracted = mergeExtractions(
        extractReportSentences(chart.profile, built),
        extractSynastrySentences(built, buildFor(partner)),
        extractTimelineSentences(chart.profile, built),
      );
    } catch {
      // 個別命盤若因曆法邊界計算失敗，跳過但不中斷整體量測。
      continue;
    }
    const { sentences, fields } = extracted;
    totalSentences += sentences.length;

    // R3 必須在未切句的整段文字上檢查。
    for (const field of fields) {
      const tooLong = checkFieldRules(field.text).find((v) => v.rule === 'R3-paragraph-length');
      if (!tooLong) continue;
      const key = `${field.source}::${field.field}::${field.template}`;
      if (!longParagraphTemplates.has(key)) {
        longParagraphTemplates.set(key, {
          source: field.source,
          field: field.field,
          sentenceCount: splitSentences(field.text).length,
          example: field.text,
        });
      }
    }

    // R4 以「整份報告」為單位彙總。
    const reportText = sentences.map((s) => s.raw).join('');
    const hedges = countHedges(reportText);
    hedgeSum += hedges.total;
    if (hedges.total > HEDGE_LIMIT) {
      hedgeOverLimitCharts += 1;
      voiceRuleTotals['R4-hedges'] += 1;
    }

    for (const sentence of sentences) {
      let entry = byTemplate.get(sentence.template);
      if (!entry) {
        entry = { kind: sentence.kind, example: sentence.raw, source: sentence.source, fields: new Set(), charts: new Set(), voiceRules: new Set() };
        byTemplate.set(sentence.template, entry);
      }
      entry.fields.add(sentence.field);
      entry.charts.add(chart.index);
      for (const violation of checkFieldRules(sentence.raw)) {
        entry.voiceRules.add(violation.rule);
      }
    }
  }

  // R1–R2 以「句子模板」為單位計數，避免同一句在 500 份報告中被重複累加。
  for (const entry of byTemplate.values()) {
    for (const rule of entry.voiceRules) {
      if (rule !== 'R4-hedges' && rule !== 'R3-paragraph-length') voiceRuleTotals[rule] += 1;
    }
  }

  // R7–R9 同樣以模板為單位。免責與方法說明（framing）本來就該這樣寫，不計。
  let plainnessTemplates = 0;
  for (const [template, entry] of byTemplate) {
    if (entry.kind === 'framing') continue;
    const hits = checkPlainness(entry.example);
    if (hits.length === 0) continue;
    plainnessTemplates += 1;
    const seenRules = new Set<PlainnessRuleId>();
    for (const hit of hits) {
      if (!seenRules.has(hit.rule)) {
        plainnessRuleTotals[hit.rule] += 1;
        seenRules.add(hit.rule);
      }
      const record = plainnessByMarker.get(hit.marker);
      if (record) record.templates += 1;
      else plainnessByMarker.set(hit.marker, { rule: hit.rule, templates: 1, source: entry.source, suggestion: hit.suggestion ?? '' });
    }
    void template;
  }
  // R3 來自欄位層級的獨立統計。
  voiceRuleTotals['R3-paragraph-length'] = longParagraphTemplates.size;

  const stats: TemplateStat[] = [...byTemplate.entries()]
    .map(([template, entry]) => {
      const rate = entry.charts.size / charts.length;
      return {
        kind: entry.kind,
        template,
        placeholderRatio: placeholderRatioOf(template),
        example: entry.example,
        source: entry.source,
        fields: [...entry.fields].sort(),
        chartCount: entry.charts.size,
        rate,
        verdict: verdictOf(rate, entry.kind),
        voiceRules: [...entry.voiceRules].sort(),
      };
    })
    .sort((a, b) => b.rate - a.rate || a.template.localeCompare(b.template));

  const counts: Record<Verdict, number> = { OVER_GENERIC: 0, WATCH: 0, OK: 0, FRAMING: 0 };
  for (const stat of stats) counts[stat.verdict] += 1;

  return {
    seed: CHART_SEED,
    chartCount: charts.length,
    totalTemplates: stats.length,
    totalSentences,
    stats,
    counts,
    hedgeOverLimitRate: charts.length ? hedgeOverLimitCharts / charts.length : 0,
    averageHedgesPerReport: charts.length ? hedgeSum / charts.length : 0,
    voiceRuleTotals,
    plainnessRuleTotals,
    plainnessTemplates,
    plainnessMarkers: [...plainnessByMarker.entries()]
      .map(([marker, record]) => ({ marker, ...record }))
      .sort((a, b) => b.templates - a.templates),
    longParagraphs: [...longParagraphTemplates.values()].sort((a, b) => b.sentenceCount - a.sentenceCount),
    elapsedMs: Date.now() - startedAt,
  };
}

export { CHART_COUNT };
