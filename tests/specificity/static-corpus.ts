import dailyGuidance from '../../public/data/daily-guidance.json';
import guanyinSticks from '../../public/data/fortune-sticks/guanyin-100.json';
import jiaziSticks from '../../public/data/fortune-sticks/sixty-jiazi.json';
import { MAJOR_ARCANA } from '../../src/data/tarot-cards';
import { RITUAL_CARDS } from '../../src/data/ritual-cards';
import {
  ASTROLOGY_ASPECT_LIBRARY, ASTROLOGY_HOUSE_LIBRARY, PLANET_LIBRARY,
  SIGN_STYLE_LIBRARY, TEN_GOD_LIBRARY, ZIWEI_PALACE_LIBRARY, ZIWEI_STAR_LIBRARY,
} from '../../src/data/interpretation-library';
import { checkFieldRules, countHedges, type VoiceRuleId } from './voice-rules';

/**
 * 報告管線以外的靜態文案語料。
 *
 * 這些內容不由命盤驅動（塔羅牌義、儀式卡、解讀庫、今日指引、籤詩解讀），
 * 因此「出現率」判準不適用——它們本來就是固定文本。改以 voice.md 的靜態規則
 * （R1 您、R2 未來斷言、R4 模糊限定詞）檢查。
 */
export interface CorpusEntry {
  corpus: string;
  source: string;
  path: string;
  text: string;
}

export interface CorpusViolation {
  corpus: string;
  source: string;
  path: string;
  text: string;
  rules: VoiceRuleId[];
  hedges: string[];
}

/** 走訪任意巢狀結構，取出所有含中文的字串。 */
function walk(value: unknown, corpus: string, source: string, path: string, out: CorpusEntry[]): void {
  if (typeof value === 'string') {
    // 只收含中文的內容，略過 id、英文名、代碼等非文案欄位。
    if (/[一-鿿]/.test(value)) out.push({ corpus, source, path, text: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, corpus, source, `${path}[${index}]`, out));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      walk(child, corpus, source, path ? `${path}.${key}` : key, out);
    }
  }
}

/**
 * 這些欄位是傳統原文或刻意的通用句，依 voice.md 白名單排除。
 * 比對方式為「路徑包含此片段」。
 */
const WHITELIST_PATH_FRAGMENTS = [
  '.poem', // 籤詩傳統詩句，公有領域原文，不得改寫
  '.story', // 籤本體例說明
  '.dataSource', // 來源與授權標註
  '.cautions', // 免責
];

function isWhitelisted(path: string): boolean {
  return WHITELIST_PATH_FRAGMENTS.some((fragment) => path.includes(fragment));
}

export function collectStaticCorpus(): CorpusEntry[] {
  const out: CorpusEntry[] = [];
  walk(MAJOR_ARCANA, '塔羅牌義', 'src/data/tarot-cards.ts', 'MAJOR_ARCANA', out);
  walk(RITUAL_CARDS, '決策儀式卡', 'src/data/ritual-cards.ts', 'RITUAL_CARDS', out);
  walk(TEN_GOD_LIBRARY, '八字十神', 'src/data/interpretation-library.ts', 'TEN_GOD_LIBRARY', out);
  walk(PLANET_LIBRARY, '行星', 'src/data/interpretation-library.ts', 'PLANET_LIBRARY', out);
  walk(SIGN_STYLE_LIBRARY, '星座風格', 'src/data/interpretation-library.ts', 'SIGN_STYLE_LIBRARY', out);
  walk(ASTROLOGY_HOUSE_LIBRARY, '宮位', 'src/data/interpretation-library.ts', 'ASTROLOGY_HOUSE_LIBRARY', out);
  walk(ASTROLOGY_ASPECT_LIBRARY, '相位', 'src/data/interpretation-library.ts', 'ASTROLOGY_ASPECT_LIBRARY', out);
  walk(ZIWEI_STAR_LIBRARY, '紫微星曜', 'src/data/interpretation-library.ts', 'ZIWEI_STAR_LIBRARY', out);
  walk(ZIWEI_PALACE_LIBRARY, '紫微宮位', 'src/data/interpretation-library.ts', 'ZIWEI_PALACE_LIBRARY', out);
  walk(dailyGuidance, '今日指引', 'public/data/daily-guidance.json', 'cards', out);
  walk(jiaziSticks, '六十甲子籤解讀', 'public/data/fortune-sticks/sixty-jiazi.json', 'sticks', out);
  walk(guanyinSticks, '觀音一百籤解讀', 'public/data/fortune-sticks/guanyin-100.json', 'sticks', out);
  return out.filter((entry) => !isWhitelisted(entry.path));
}

/** 對靜態語料套用 voice.md 可機器驗證的規則。 */
export function scanStaticCorpus(entries: CorpusEntry[] = collectStaticCorpus()): CorpusViolation[] {
  const violations: CorpusViolation[] = [];
  for (const entry of entries) {
    const rules = checkFieldRules(entry.text).map((v) => v.rule);
    const { breakdown } = countHedges(entry.text);
    const hedges = Object.keys(breakdown);
    if (hedges.length) rules.push('R4-hedges');
    if (rules.length) {
      violations.push({ ...entry, rules: [...new Set(rules)].sort(), hedges });
    }
  }
  return violations;
}

/** 依語料分組統計違規數，用於報告與終端摘要。 */
export function summariseByCorpus(violations: CorpusViolation[], entries: CorpusEntry[] = collectStaticCorpus()) {
  const totals = new Map<string, { corpus: string; source: string; entries: number; violations: number; hedges: number }>();
  for (const entry of entries) {
    const row = totals.get(entry.corpus) ?? { corpus: entry.corpus, source: entry.source, entries: 0, violations: 0, hedges: 0 };
    row.entries += 1;
    totals.set(entry.corpus, row);
  }
  for (const violation of violations) {
    const row = totals.get(violation.corpus);
    if (!row) continue;
    row.violations += 1;
    row.hedges += violation.hedges.length;
  }
  return [...totals.values()].sort((a, b) => b.violations - a.violations);
}
