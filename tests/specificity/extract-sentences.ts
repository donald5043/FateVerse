import { buildReportFromProfile } from '../../src/engines/build-report';
import { buildSystemMatrix, generateFusionReading, generateSystemConclusions, generateTimelineReading } from '../../src/engines/fusion-engine';
import { buildUnifiedElementProfile } from '../../src/engines/integration-engine';
import type { ProfileInput } from '../../src/types/fate';

/**
 * 文字的性質，決定是否適用「出現率」判準。
 * - interpretation：對「這個人」的解讀。換個命盤仍成立就是巴納姆句，適用 OVER_GENERIC 判定。
 * - framing：方法說明、免責提醒與資料標籤。它們本來就該對所有人成立，出現率高是正常的，
 *   若一併計入會把免責聲明誤判為泛用文案（voice.md R6 與白名單的精神）。
 */
export type TextKind = 'interpretation' | 'framing';

export interface ExtractedSentence {
  kind: TextKind;
  /** 產生這句話的來源檔案（相對 repo 根目錄）。 */
  source: string;
  /** 報告中的欄位路徑，例如 sections.bazi、focusAnalysis[].analysis。 */
  field: string;
  /** 原始句子（含插值後的實際內容）。 */
  raw: string;
  /** 正規化後的模板：數字、干支、星座等插值一律代換為佔位符。 */
  template: string;
}

/** 未切句的整個欄位內容。R3「段落至多 3 句」必須在此層級檢查，切句後就看不到了。 */
export interface ExtractedField {
  kind: TextKind;
  source: string;
  field: string;
  text: string;
  template: string;
}

export interface ExtractionResult {
  sentences: ExtractedSentence[];
  fields: ExtractedField[];
}

// ── 正規化：把插值變數換成佔位符，讓「同一個模板」被歸為同一句 ──────────────
// 順序重要：先換長樣式（日期、括號內容），再換短樣式（單一干支字元）。
const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const ANIMALS = '鼠牛虎兔龍蛇馬羊猴雞狗豬';
const ELEMENTS = ['木', '火', '土', '金', '水'];
const SIGNS = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];

/**
 * 把一句插值後的文字還原成模板形式。
 * 例：「你的日主是甲木，生在寅月」→「你的日主是{干支}{五行}，生在{地支}月」
 */
export function normalizeSentence(sentence: string): string {
  let out = sentence;

  // 日期與數字區間
  out = out.replace(/\d{4}-\d{2}-\d{2}/g, '{日期}');
  out = out.replace(/\d{4}\s*年/g, '{年}年');
  // 星座（先於單字元代換，避免被拆開）
  for (const sign of SIGNS) out = out.split(`${sign}座`).join('{星座}').split(sign).join('{星座}');
  // 干支組合（兩字：天干+地支）
  out = out.replace(new RegExp(`[${STEMS}][${BRANCHES}]`, 'g'), '{干支}');
  // 單一天干、地支、生肖
  out = out.replace(new RegExp(`[${STEMS}]`, 'g'), '{天干}');
  out = out.replace(new RegExp(`[${BRANCHES}]`, 'g'), '{地支}');
  out = out.replace(new RegExp(`[${ANIMALS}]`, 'g'), '{生肖}');
  // 五行字元
  for (const element of ELEMENTS) out = out.split(element).join('{五行}');
  // 剩餘數字
  out = out.replace(/\d+(\.\d+)?%/g, '{百分比}');
  out = out.replace(/\d+/g, '{數}');
  // 連續佔位符壓縮，避免「{五行}{五行}{五行}」造成模板分裂
  out = out.replace(/(\{[^}]+\})(\1)+/g, '$1');
  out = out.replace(/(\{[^}]+\}、)+\{[^}]+\}/g, '{列表}');

  return out.trim();
}

/** 依中文句號切句，保留問句與驚嘆句。 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？])/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * 判定欄位屬於「對人的解讀」還是「框架文字」。
 * 未列出者一律視為 interpretation，確保新增欄位預設受最嚴格的檢驗。
 */
const FRAMING_FIELDS = new Set([
  'differences[]', // 解釋各系統之間的差異，不是在描述這個人
  'fusion.plainIntro', // 方法論說明
  'fusion.consensus.mappingNotes[]', // 換算方式的註記
  'fusion.domains[].reminder', // 領域邊界聲明（職涯／財務等）
  'fusion.axes[].evidence[].point', // 依據標籤
  'fusion.domains[].evidence[].point',
  'fusion.timing.evidence[].point',
  'unified.contributions[].detail', // 各系統貢獻的資料標籤
  'unified.caveat', // 免責
]);

function kindOf(field: string): TextKind {
  return FRAMING_FIELDS.has(field) ? 'framing' : 'interpretation';
}

function makePush(result: ExtractionResult) {
  return (source: string, field: string, text: string | undefined): void => {
    if (!text) return;
    const kind = kindOf(field);
    // 先記錄整段（供 R3 檢查段落句數），再切成單句（供出現率統計）。
    result.fields.push({ kind, source, field, text, template: normalizeSentence(text) });
    for (const raw of splitSentences(text)) {
      result.sentences.push({ kind, source, field, raw, template: normalizeSentence(raw) });
    }
  };
}

const FALLBACK = 'src/engines/fallback-report.ts';
const FUSION = 'src/engines/fusion-engine.ts';
const INTEGRATION = 'src/engines/integration-engine.ts';

/**
 * 跑一次完整的報告產生流程，抽出所有使用者可見句子。
 * 涵蓋 ReportPage 實際渲染的全部文字來源：綜合報告 + 融合解讀 + 整合剖面
 * + 各系統結論 + 時間軸三段，不含純數值欄位與 UI 靜態說明。
 */
export function extractReportSentences(profile: ProfileInput): ExtractionResult {
  const out: ExtractionResult = { sentences: [], fields: [] };
  const push = makePush(out);
  const { reportInput, report } = buildReportFromProfile(profile);

  // ── 綜合報告 ──────────────────────────────────────────────
  push(FALLBACK, 'summary', report.summary);
  report.sharedPatterns.forEach((item) => push(FALLBACK, 'sharedPatterns[]', item));
  report.differences.forEach((item) => push(FALLBACK, 'differences[]', item));
  push(FALLBACK, 'sections.bazi', report.sections.bazi);
  push(FALLBACK, 'sections.zodiac', report.sections.zodiac);
  push(FALLBACK, 'sections.astrology', report.sections.astrology);
  push(FALLBACK, 'sections.ziwei', report.sections.ziwei);
  push(FALLBACK, 'sections.numerology', report.sections.numerology);
  push(FALLBACK, 'sections.name', report.sections.name);
  report.focusAnalysis.forEach((item) => {
    push(FALLBACK, 'focusAnalysis[].analysis', item.analysis);
    item.suggestions.forEach((s) => push(FALLBACK, 'focusAnalysis[].suggestions[]', s));
  });
  // cautions 屬免責文字，依 voice.md R6 與白名單排除，不列入統計。

  // ── 融合解讀 ──────────────────────────────────────────────
  const fusion = generateFusionReading(reportInput);
  push(FUSION, 'fusion.headline', fusion.headline);
  push(FUSION, 'fusion.plainIntro', fusion.plainIntro);
  push(FUSION, 'fusion.consensus.plainSummary', fusion.consensus.plainSummary);
  fusion.consensus.mappingNotes.forEach((note) => push(FUSION, 'fusion.consensus.mappingNotes[]', note));
  fusion.axes.forEach((axis) => {
    push(FUSION, 'fusion.axes[].verdict', axis.verdict);
    axis.evidence.forEach((e) => push(FUSION, 'fusion.axes[].evidence[].point', e.point));
  });
  fusion.domains.forEach((domain) => {
    push(FUSION, 'fusion.domains[].plainReading', domain.plainReading);
    push(FUSION, 'fusion.domains[].reminder', domain.reminder);
    domain.evidence.forEach((e) => push(FUSION, 'fusion.domains[].evidence[].point', e.point));
  });
  fusion.highlights.forEach((h) => {
    push(FUSION, 'fusion.highlights[].title', h.title);
    push(FUSION, 'fusion.highlights[].plainExplanation', h.plainExplanation);
  });
  if (fusion.timing) {
    push(FUSION, 'fusion.timing.plainReading', fusion.timing.plainReading);
    fusion.timing.evidence.forEach((e) => push(FUSION, 'fusion.timing.evidence[].point', e.point));
  }

  // ── 各系統結論 ────────────────────────────────────────────
  generateSystemConclusions(reportInput).forEach((c) => {
    push(FUSION, 'systemConclusions[].headline', c.headline);
    push(FUSION, 'systemConclusions[].conclusion', c.conclusion);
  });

  // ── 時間軸（過去／現在／未來）────────────────────────────
  generateTimelineReading(reportInput).forEach((phase) => {
    push(FUSION, `timeline.${phase.id}.reading`, phase.reading);
    push(FUSION, `timeline.${phase.id}.advice`, phase.advice);
  });

  // ── 整合剖面 ──────────────────────────────────────────────
  const unified = buildUnifiedElementProfile(reportInput);
  push(INTEGRATION, 'unified.plainSummary', unified.plainSummary);
  push(INTEGRATION, 'unified.caveat', unified.caveat);
  unified.contributions.forEach((c) => push(INTEGRATION, 'unified.contributions[].detail', c.detail));

  // 系統矩陣只有數值與標籤，無解讀句子，僅確認其可被呼叫。
  buildSystemMatrix(reportInput);

  return out;
}
