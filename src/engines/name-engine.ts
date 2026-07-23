import { NAME_DICTIONARY } from '../data/name-dictionary';
import type { ElementName, NameAnalysisResult, NameCharacterResult, NameFiveGrid, NameGrid, NameGridCategory } from '../types/fate';

const DICTIONARY = NAME_DICTIONARY;

// 81 數理吉凶採常見通行版本；不同流派略有出入，僅供文化參考。
const LUCKY_NUMBERS = new Set([1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81]);
const HALF_LUCKY_NUMBERS = new Set([26, 27, 28, 30, 38, 40, 42, 43, 49, 50, 51, 53, 55, 58, 71, 72, 73, 75, 77, 78]);

const CATEGORY_MEANINGS: Record<NameGridCategory, string> = {
  吉: '傳統數理視為順遂之數',
  半吉: '傳統數理視為吉中帶挑戰',
  凶: '傳統數理視為需多留意之數',
};

const GRID_GENERATES: Record<ElementName, ElementName> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const GRID_CONTROLS: Record<ElementName, ElementName> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };
const GRID_ELEMENT_LABELS: Record<ElementName, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };

function gridCategory(value: number): NameGridCategory {
  const normalized = value > 81 ? ((value - 1) % 80) + 1 : value;
  if (LUCKY_NUMBERS.has(normalized)) return '吉';
  if (HALF_LUCKY_NUMBERS.has(normalized)) return '半吉';
  return '凶';
}

// 數理尾數配五行：1、2 木，3、4 火，5、6 土，7、8 金，9、0 水。
function gridElement(value: number): ElementName {
  const digit = value % 10;
  if (digit === 1 || digit === 2) return 'wood';
  if (digit === 3 || digit === 4) return 'fire';
  if (digit === 5 || digit === 6) return 'earth';
  if (digit === 7 || digit === 8) return 'metal';
  return 'water';
}

function pairRelation(from: ElementName, to: ElementName): string {
  const fromLabel = GRID_ELEMENT_LABELS[from];
  const toLabel = GRID_ELEMENT_LABELS[to];
  if (from === to) return `${fromLabel}${toLabel}同氣，性質相近`;
  if (GRID_GENERATES[from] === to) return `${fromLabel}生${toLabel}，氣勢順向流動`;
  if (GRID_GENERATES[to] === from) return `${toLabel}生${fromLabel}，由下往上承托`;
  if (GRID_CONTROLS[from] === to) return `${fromLabel}剋${toLabel}，帶有制衡張力`;
  return `${toLabel}剋${fromLabel}，帶有制衡張力`;
}

function computeFiveGrid(strokes: number[]): NameFiveGrid | undefined {
  if (strokes.length < 2 || strokes.length > 4 || strokes.some((value) => !value || value <= 0)) return undefined;
  const surname = strokes.length === 4 ? [strokes[0], strokes[1]] : [strokes[0]];
  const given = strokes.slice(surname.length);
  const surnameSum = surname.reduce((total, value) => total + value, 0);
  const givenSum = given.reduce((total, value) => total + value, 0);
  const heaven = surname.length === 2 ? surnameSum : surnameSum + 1;
  const person = surname[surname.length - 1] + given[0];
  const ground = given.length === 1 ? given[0] + 1 : givenSum;
  const total = surnameSum + givenSum;
  const outer = strokes.length === 2 ? 2 : (surname.length === 2 ? surname[0] : 1) + given[given.length - 1];
  const build = (name: NameGrid['name'], value: number): NameGrid => ({
    name,
    value,
    category: gridCategory(value),
    element: gridElement(value),
    meaning: CATEGORY_MEANINGS[gridCategory(value)],
  });
  const grids = [build('天格', heaven), build('人格', person), build('地格', ground), build('外格', outer), build('總格', total)];
  const sanCaiElements: [ElementName, ElementName, ElementName] = [gridElement(heaven), gridElement(person), gridElement(ground)];
  const relation = `三才為${sanCaiElements.map((element) => GRID_ELEMENT_LABELS[element]).join('')}：${pairRelation(sanCaiElements[0], sanCaiElements[1])}；${pairRelation(sanCaiElements[1], sanCaiElements[2])}。`;
  return {
    grids,
    sanCai: { elements: sanCaiElements, relation },
    basis: '五格以現代標準筆畫計算，與康熙筆畫流派結果可能不同；81 數理吉凶採常見通行版本，僅供文化參考，不是命運判定。',
  };
}

export function analyzeName(fullName: string, weakest: ElementName[], manualStrokes: Record<string, number> = {}): NameAnalysisResult {
  const cleaned = fullName.trim().replace(/\s+/g, '');
  if (!cleaned) throw new Error('請填寫姓名。');
  const characters: NameCharacterResult[] = [...cleaned].map((character) => {
    const entry = DICTIONARY[character];
    const manual = manualStrokes[character];
    if (!entry) return { character, ...(manual ? { strokes: manual, strokeSource: 'manual' as const } : { strokeSource: 'insufficient' as const }) };
    return { character, meaning: entry.meaning, sound: entry.sound, element: entry.element, strokes: manual || entry.modernStrokes, strokeSource: manual ? 'manual' : 'modern' };
  });
  const known = characters.filter((item) => item.meaning);
  const nameElements = characters.flatMap((item) => item.element ? [item.element] : []);
  const overlap = nameElements.filter((element) => weakest.includes(element));
  const strokeValues = characters.map((item) => item.strokes ?? 0);
  const fiveGrid = strokeValues.every((value) => value > 0) ? computeFiveGrid(strokeValues) : undefined;
  return {
    fullName: cleaned,
    characterCount: characters.length,
    characters,
    overallImpression: known.length ? `你的名字帶有「${known.map((item) => item.meaning?.split('、')[0]).join('、')}」的語意組合；尚未收錄的字不作推測。` : '字庫尚未收錄這個姓名的字，因此不作推測；可以手動填入筆畫輔助。',
    elementComparison: overlap.length ? '名字中部分字的五行，剛好對到你命盤相對較弱的元素——可以當成有趣的呼應，但不是「缺什麼就補什麼」的判定。' : '名字用字的五行與命盤沒有形成明確對照，這很常見，不作強行推論。',
    strokeNotice: fiveGrid
      ? '筆畫採現代標準寫法計算（如「阝」算 3 畫），與康熙字典筆畫不同；缺筆畫的字可手動填入後重新計算。'
      : '筆畫採現代標準寫法計算，與康熙字典筆畫不同；部分字尚無筆畫資料，補上手動筆畫後即可計算五格。',
    ...(fiveGrid ? { fiveGrid } : {}),
    fiveGridBeta: true,
  };
}
