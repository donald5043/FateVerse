import { NAME_DICTIONARY } from '../data/name-dictionary';
import type { ElementName, NameAnalysisResult, NameCharacterResult } from '../types/fate';

const DICTIONARY = NAME_DICTIONARY;

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
  return {
    fullName: cleaned,
    characterCount: characters.length,
    characters,
    overallImpression: known.length ? `你的名字帶有「${known.map((item) => item.meaning?.split('、')[0]).join('、')}」的語意組合；尚未收錄的字不作推測。` : '字庫尚未收錄這個姓名的字，因此不作推測；可以手動填入筆畫輔助。',
    elementComparison: overlap.length ? '名字中部分字的五行，剛好對到你命盤相對較弱的元素——可以當成有趣的呼應，但不是「缺什麼就補什麼」的判定。' : '名字用字的五行與命盤沒有形成明確對照，這很常見，不作強行推論。',
    strokeNotice: '筆畫採現代標準寫法計算（如「阝」算 3 畫），與康熙字典筆畫不同；計法有流派差異的字不顯示筆畫。姓名五格僅標示為 Beta，不在本版計算。',
    fiveGridBeta: true,
  };
}
