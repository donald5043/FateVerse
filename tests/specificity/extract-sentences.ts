import { buildReportFromProfile } from '../../src/engines/build-report';
import { buildSystemMatrix, generateFusionReading, generateSystemConclusions, generateTimelineReading } from '../../src/engines/fusion-engine';
import { buildUnifiedElementProfile } from '../../src/engines/integration-engine';
import { buildLifeTimeline, summarizeTimeline } from '../../src/engines/life-timeline-engine';
import { generateSynastry } from '../../src/engines/synastry-engine';
import { hashString, mulberry32 } from '../../src/utils/seeded-random';
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
  'synastry.intro', // 說明這份合盤怎麼算、不做什麼
  'synastry.aspectNote', // 相位那一段為何有／為何空的說明
  'synastry.cautions[]', // 免責
  // 實測出現率。它講的是「隨機兩個人裡有多少對也這樣」，本來就對所有人成立——
  // 那正是它存在的理由：拿來降溫，不是拿來描述這一對。
  'synastry.sections[].occurrence',
  'synastry.highlights[].occurrence',
  /*
   * 逐年的傳統框架。這個欄位有兩種句子，都不是在講這個人：
   * 前半是資料標籤（「流年天干屬土，對你的日主而言是官殺」），
   * 後半的主詞是那套說法本身（「傳統上把這種年份看成…」）。
   *
   * 而且它必然對所有人高頻出現：流年天干十年一輪，回顧夠長的區間，
   * 五種十神每個人都會輪過好幾遍。這不是文案寫得泛，是曆法決定的。
   * 頁面上直接把這件事講給使用者聽（TIMELINE_BASELINE_NOTE），
   * 而不是假裝某一年的十神是針對他的。
   */
  'timeline.years[].framing',
]);

/**
 * 有些免責與方法說明句被寫在解讀欄位裡（例如 sections.bazi 末尾的計分規則說明）。
 * 這些句子在語意上仍是 framing，不該套用「必須有可能說錯」的判準。
 * 標記詞刻意取得保守而明確，避免把真正的解讀誤放行。
 */
const FRAMING_SENTENCE_MARKERS = [
  '不是預言',
  '不是命定',   // 「不是固定命運」改寫後的說法
  '不構成',
  '僅供',
  '諮詢',
  '唯一答案',
  '標準答案',   // 「不挑一種當標準答案」是「唯一答案」改寫後的說法
  '公開計分規則',
  '不作強行推論',
  '不以猜測補齊',
  '不由單星',
  '本版只呈現',
  '互相取代',   // 涵蓋「不互相取代」與「不能互相取代」
  '這次的資料沒有',
  '本次沒有',
  '不是因果',     // 回顧日誌：命盤沒有讓任何事發生
  '不在命盤',     // 同上，順或難的原因在處境不在命盤
  '命盤以外',     // 同上
];

function kindOf(field: string, text?: string): TextKind {
  if (FRAMING_FIELDS.has(field)) return 'framing';
  if (text && FRAMING_SENTENCE_MARKERS.some((marker) => text.includes(marker))) return 'framing';
  return 'interpretation';
}

function makePush(result: ExtractionResult) {
  return (source: string, field: string, text: string | undefined): void => {
    if (!text) return;
    // 欄位層級（供 R3）沿用欄位分類；句子層級再依標記詞細判，
    // 讓夾在解讀段落裡的免責句也能被正確歸為 framing。
    result.fields.push({ kind: kindOf(field), source, field, text, template: normalizeSentence(text) });
    for (const raw of splitSentences(text)) {
      result.sentences.push({ kind: kindOf(field, raw), source, field, raw, template: normalizeSentence(raw) });
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
export type BuiltReport = ReturnType<typeof buildReportFromProfile>;

/**
 * 建報告是整個量測最貴的一步。合盤需要兩份、回顧日誌需要一份，
 * 全部各自重建的話同一個人會被建三次。呼叫端傳入已建好的結果即可共用。
 */
export function buildOnce(profile: ProfileInput): BuiltReport {
  return buildReportFromProfile(profile);
}

export function extractReportSentences(profile: ProfileInput, prebuilt?: BuiltReport): ExtractionResult {
  const out: ExtractionResult = { sentences: [], fields: [] };
  const push = makePush(out);
  const { reportInput, report } = prebuilt ?? buildReportFromProfile(profile);

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

const SYNASTRY = 'src/engines/synastry-engine.ts';
const LIFE_TIMELINE = 'src/engines/life-timeline-engine.ts';

/**
 * 合盤的名字一律代換成「甲方／乙方」再量測。
 *
 * 名字是使用者自己填的，不帶任何命盤資訊；若照實代入，每一組配對都會產生
 * 獨一無二的模板，出現率全部變成 1/500，量測就失去意義。固定成兩個會被
 * normalizeSentence 收斂成 {天干}方 的字串，才看得出句框本身有多泛用。
 */
const MEASURE_NAME_A = '甲方';
const MEASURE_NAME_B = '乙方';

/** 抽出一組合盤的全部可見文字。 */
export function extractSynastrySentences(builtA: BuiltReport, builtB: BuiltReport): ExtractionResult {
  const out: ExtractionResult = { sentences: [], fields: [] };
  const push = makePush(out);
  const reading = generateSynastry(builtA.reportInput, builtB.reportInput, MEASURE_NAME_A, MEASURE_NAME_B);

  push(SYNASTRY, 'synastry.intro', reading.intro);
  reading.sections.forEach((section) => {
    push(SYNASTRY, `synastry.sections.${section.id}`, section.reading);
    push(SYNASTRY, 'synastry.sections[].occurrence', section.occurrence);
  });
  push(SYNASTRY, 'synastry.aspectNote', reading.aspectNote);
  reading.aspects.forEach((aspect) => push(SYNASTRY, 'synastry.aspects[].reading', aspect.reading));
  reading.highlights.forEach((item) => {
    push(SYNASTRY, 'synastry.highlights[].text', item.text);
    push(SYNASTRY, 'synastry.highlights[].occurrence', item.occurrence);
  });
  reading.cautions.forEach((item) => push(SYNASTRY, 'synastry.cautions[]', item));
  return out;
}

/**
 * 抽出回顧日誌的逐年框架句。
 *
 * @param years 回顧幾年。句框的形狀只由十神、大運有無與流年宮位決定，
 *              不隨年數增加而變化，因此量測時取較短的區間即可——每一年都要
 *              重排一次紫微流年，全部 40 年跑 500 組要五分鐘。
 */
export function extractTimelineSentences(profile: ProfileInput, prebuilt?: BuiltReport, years = 8): ExtractionResult {
  const out: ExtractionResult = { sentences: [], fields: [] };
  const push = makePush(out);
  const { reportInput } = prebuilt ?? buildReportFromProfile(profile);
  const entries = buildLifeTimeline(reportInput.bazi, profile, new Date('2026-01-01T00:00:00Z'), years);
  entries.forEach((entry) => push(LIFE_TIMELINE, 'timeline.years[].framing', entry.framing));

  // 摘要句需要使用者自評才產生得出來。用種子亂數而不是固定輪替：
  // 固定輪替永遠不會集中，「有集中」那個分支就永遠走不到，
  // 量測出來的 100% 會是量測方式造成的，不是文案真的每份都出現。
  const random = mulberry32(hashString(`${profile.birthDate}${profile.birthTime}`));
  const TONES = ['good', 'mixed', 'hard'] as const;
  const notes = entries.map((entry) => ({
    year: entry.year,
    text: '（量測用）',
    tone: TONES[Math.floor(random() * TONES.length)],
  }));
  summarizeTimeline(entries, notes).lines.forEach((line) => push(LIFE_TIMELINE, 'timeline.summary.lines[]', line));
  return out;
}
