import {
  UNIHAN_END, UNIHAN_RADICAL_RUNS, UNIHAN_START, UNIHAN_STROKES, UNIHAN_STROKE_ALPHABET,
} from '../data/unihan-char-data';
import type { ElementName } from '../types/fate';

// 康熙部首編號對五行的保守對照：只收錄慣例上無爭議的部首。
const RADICAL_ELEMENTS: Record<number, ElementName> = {
  75: 'wood', // 木
  140: 'wood', // 艸
  118: 'wood', // 竹
  85: 'water', // 水
  173: 'water', // 雨
  15: 'water', // 冫
  86: 'fire', // 火
  61: 'fire', // 心
  72: 'fire', // 日
  32: 'earth', // 土
  46: 'earth', // 山
  112: 'earth', // 石
  102: 'earth', // 田
  40: 'earth', // 宀
  167: 'metal', // 金
};

let strokeDecodeMap: Map<string, number> | undefined;
let radicalTable: Uint8Array | undefined;

function ensureTables() {
  if (!strokeDecodeMap) {
    strokeDecodeMap = new Map([...UNIHAN_STROKE_ALPHABET].map((char, index) => [char, index]));
  }
  if (!radicalTable) {
    radicalTable = new Uint8Array(UNIHAN_END - UNIHAN_START + 1);
    let offset = 0;
    for (const [radical, count] of UNIHAN_RADICAL_RUNS) {
      radicalTable.fill(radical, offset, offset + count);
      offset += count;
    }
  }
}

function indexOfChar(character: string): number | undefined {
  const code = character.codePointAt(0);
  if (code === undefined || code < UNIHAN_START || code > UNIHAN_END) return undefined;
  return code - UNIHAN_START;
}

/** 依 Unihan kTotalStrokes 查詢總筆畫；查無資料回傳 undefined。 */
export function unihanStrokes(character: string): number | undefined {
  const index = indexOfChar(character);
  if (index === undefined) return undefined;
  ensureTables();
  const value = strokeDecodeMap!.get(UNIHAN_STROKES[index]) ?? 0;
  return value > 0 ? value : undefined;
}

/** 依 Unihan kRSUnicode 部首推導五行；部首不在保守對照表時回傳 undefined。 */
export function unihanElement(character: string): ElementName | undefined {
  const index = indexOfChar(character);
  if (index === undefined) return undefined;
  ensureTables();
  const radical = radicalTable![index];
  return RADICAL_ELEMENTS[radical];
}

/** 查詢字的康熙部首編號（1–214）；查無資料回傳 undefined。 */
export function unihanRadical(character: string): number | undefined {
  const index = indexOfChar(character);
  if (index === undefined) return undefined;
  ensureTables();
  const radical = radicalTable![index];
  return radical > 0 ? radical : undefined;
}
