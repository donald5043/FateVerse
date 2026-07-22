import type { ElementName, NameAnalysisResult, NameCharacterResult } from '../types/fate';

interface NameDictionaryEntry {
  character: string;
  meaning: string;
  sound: string;
  element?: ElementName;
  modernStrokes?: number;
}

const DICTIONARY: Record<string, NameDictionaryEntry> = {
  安: { character: '安', meaning: '安定、平和', sound: '聲調平穩，帶來沉著感', element: 'earth', modernStrokes: 6 },
  宇: { character: '宇', meaning: '空間、氣度', sound: '音節開展，印象寬廣', element: 'earth', modernStrokes: 6 },
  晨: { character: '晨', meaning: '清晨、開端', sound: '聲音明亮，具有朝氣', element: 'fire', modernStrokes: 11 },
  林: { character: '林', meaning: '樹木聚集、生長', sound: '音節簡潔，感受自然', element: 'wood', modernStrokes: 8 },
  心: { character: '心', meaning: '內在、心意', sound: '收音清晰，感受細膩', element: 'fire', modernStrokes: 4 },
  海: { character: '海', meaning: '廣闊、包容', sound: '開口音帶來開闊感', element: 'water', modernStrokes: 10 },
  怡: { character: '怡', meaning: '和悅、安適', sound: '音色柔和，感受親近', element: 'earth', modernStrokes: 8 },
  文: { character: '文', meaning: '文理、文化', sound: '收束平穩，印象內斂', element: 'water', modernStrokes: 4 },
};

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
    overallImpression: known.length ? `已收錄字義呈現出「${known.map((item) => item.meaning?.split('、')[0]).join('、')}」的語意組合；未收錄字不作推測。` : '示範字典尚未收錄此姓名，請以字義欄位擴充資料後再分析。',
    elementComparison: overlap.length ? '示範字典中的部分字義五行，與命盤相對較弱元素有簡化對應；這不是「缺什麼就補什麼」的判定。' : '示範字典資料不足以形成明確的姓名與五行對照，不作強行推論。',
    strokeNotice: '目前僅提供少量現代筆畫示範資料，未採用完整康熙字典。姓名五格僅標示為 Beta，不在本版計算。',
    fiveGridBeta: true,
  };
}
