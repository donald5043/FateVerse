import Fuse, { type FuseResult } from 'fuse.js';
import type { FortuneStick } from '../types/fate';

export interface FortuneMatch {
  item: FortuneStick;
  confidence: number;
}

const normalize = (value: string): string => value.replace(/[\s，。！？、；：,.!?;:'"「」『』（）()]/g, '').toLowerCase();

interface SearchableFortune extends FortuneStick {
  searchableNumber: string;
  firstLines: string;
  fullPoem: string;
}

export function matchFortuneSticks(query: string, sticks: FortuneStick[], limit = 3): FortuneMatch[] {
  const clean = normalize(query);
  if (!clean) return [];
  const numberMatch = query.match(/(?:第)?\s*(\d{1,3})\s*(?:籤|签|首|號|号)?/);
  const searchable: SearchableFortune[] = sticks.map((stick) => ({ ...stick, searchableNumber: String(stick.number), firstLines: normalize(stick.poem.slice(0, 2).join('')), fullPoem: normalize(stick.poem.join('')) }));
  if (numberMatch && /^第?\s*\d{1,3}\s*(?:籤|签|首|號|号)?\s*$/.test(query.trim())) {
    return searchable.filter((stick) => stick.number === Number(numberMatch[1])).slice(0, limit).map((item) => ({ item, confidence: 1 }));
  }
  const fuse = new Fuse(searchable, {
    keys: [{ name: 'searchableNumber', weight: 0.25 }, { name: 'title', weight: 0.8 }, { name: 'fullPoem', weight: 1 }, { name: 'firstLines', weight: 0.9 }, { name: 'sourceName', weight: 0.35 }, { name: 'keywords', weight: 0.5 }],
    includeScore: true,
    threshold: clean.length < 5 ? 0.34 : 0.55,
    ignoreLocation: true,
    minMatchCharLength: clean.length < 4 ? 1 : 2,
  });
  return fuse.search(clean, { limit }).filter((result): result is FuseResult<SearchableFortune> & { score: number } => typeof result.score === 'number').map(({ item, score }) => ({ item, confidence: Math.max(0, Math.round((1 - score) * 100) / 100) }));
}

export async function loadFortuneSticks(system: 'sixty-jiazi' | 'guanyin-100' | 'custom'): Promise<FortuneStick[]> {
  const paths = system === 'custom' ? ['sixty-jiazi.json', 'guanyin-100.json'] : [`${system}.json`];
  try {
    const groups = await Promise.all(paths.map(async (path) => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/fortune-sticks/${path}`);
      if (!response.ok) throw new Error();
      return response.json() as Promise<FortuneStick[]>;
    }));
    return groups.flat();
  } catch {
    throw new Error('籤詩示範資料載入失敗。請確認網路，或重新整理後再試。');
  }
}
