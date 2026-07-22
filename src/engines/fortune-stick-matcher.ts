import Fuse, { type FuseResult } from 'fuse.js';
import type { FortuneStick } from '../types/fate';

export interface FortuneMatch {
  item: FortuneStick;
  confidence: number;
}

const normalize = (value: string): string => value
  .normalize('NFKC')
  .replace(/[^\p{Script=Han}\p{Letter}\p{Number}]/gu, '')
  .toLowerCase();

const normalizeLine = (value: string): string => normalize(value).replace(/[丨|_]/g, '');

function ngrams(value: string, size = 2): string[] {
  const clean = normalizeLine(value);
  if (clean.length < size) return clean ? [clean] : [];
  return Array.from({ length: clean.length - size + 1 }, (_, index) => clean.slice(index, index + size));
}

function diceSimilarity(first: string, second: string): number {
  const left = ngrams(first);
  const right = ngrams(second);
  if (!left.length || !right.length) return 0;
  const remaining = [...right];
  let matches = 0;
  for (const token of left) {
    const index = remaining.indexOf(token);
    if (index >= 0) {
      matches += 1;
      remaining.splice(index, 1);
    }
  }
  return (2 * matches) / (left.length + right.length);
}

function lineSimilarity(query: string, poem: string[]): number {
  const queryLines = query.split(/\r?\n/).map(normalizeLine).filter((line) => line.length >= 2);
  if (!queryLines.length) return 0;
  const scores = poem.map((poemLine) => Math.max(0, ...queryLines.map((queryLine) => diceSimilarity(queryLine, poemLine))));
  return scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length);
}

function parseChineseNumber(value: string): number | undefined {
  const digits: Record<string, number> = { 零: 0, 〇: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (value === '百') return 100;
  const hundredIndex = value.indexOf('百');
  const tenIndex = value.indexOf('十');
  let result = 0;
  if (hundredIndex >= 0) result += (digits[value[hundredIndex - 1]] ?? 1) * 100;
  if (tenIndex >= 0) result += (digits[value[tenIndex - 1]] ?? 1) * 10;
  const last = digits[value.at(-1) ?? ''];
  if (last !== undefined && value.at(-1) !== '零' && value.at(-1) !== '〇') result += last;
  return result || (value.length === 1 ? digits[value] : undefined);
}

function extractStickNumber(query: string): number | undefined {
  const arabic = /(?:第)?\s*(\d{1,3})\s*(?:籤詩|籤|签|首(?:籤詩)?|號|号)?/.exec(query);
  if (arabic) return Number(arabic[1]);
  const chinese = /(?:第)?\s*([零〇一二兩三四五六七八九十百]{1,4})\s*(?:籤詩|籤|签|首(?:籤詩)?|號|号)/.exec(query);
  return chinese ? parseChineseNumber(chinese[1]) : undefined;
}

interface SearchableFortune extends FortuneStick {
  searchableNumber: string;
  firstLines: string;
  fullPoem: string;
}

export function matchFortuneSticks(query: string, sticks: FortuneStick[], limit = 3): FortuneMatch[] {
  const clean = normalize(query);
  if (!clean) return [];
  const stickNumber = extractStickNumber(query);
  const searchable: SearchableFortune[] = sticks.map((stick) => ({ ...stick, searchableNumber: String(stick.number), firstLines: normalize(stick.poem.slice(0, 2).join('')), fullPoem: normalize(stick.poem.join('')) }));
  const numberOnly = /^第?\s*(?:\d{1,3}|[零〇一二兩三四五六七八九十百]{1,4})\s*(?:籤詩|籤|签|首(?:籤詩)?|號|号)?\s*$/.test(query.trim());
  if (stickNumber !== undefined && numberOnly) {
    return searchable.filter((stick) => stick.number === stickNumber).slice(0, limit).map((item) => ({ item, confidence: 1 }));
  }
  const fuse = new Fuse(searchable, {
    keys: [{ name: 'searchableNumber', weight: 0.25 }, { name: 'title', weight: 0.8 }, { name: 'fullPoem', weight: 1 }, { name: 'firstLines', weight: 0.9 }, { name: 'sourceName', weight: 0.35 }, { name: 'keywords', weight: 0.5 }],
    includeScore: true,
    threshold: clean.length < 5 ? 0.34 : 0.55,
    ignoreLocation: true,
    minMatchCharLength: clean.length < 4 ? 1 : 2,
  });
  const fuseScores = new Map(
    fuse.search(clean, { limit: Math.max(limit * 3, 10) })
      .filter((result): result is FuseResult<SearchableFortune> & { score: number } => typeof result.score === 'number')
      .map(({ item, score }) => [item.id, 1 - score]),
  );

  return searchable
    .map((item) => {
      const wholePoemScore = diceSimilarity(query, item.fullPoem);
      const perLineScore = lineSimilarity(query, item.poem);
      const ocrScore = Math.max(wholePoemScore, perLineScore);
      const confidence = Math.max(fuseScores.get(item.id) ?? 0, ocrScore >= 0.24 ? 0.25 + ocrScore * 0.75 : 0);
      return { item, confidence };
    })
    .filter(({ confidence }) => confidence >= 0.42)
    .sort((first, second) => second.confidence - first.confidence)
    .slice(0, limit)
    .map(({ item, confidence }) => ({ item, confidence: Math.round(confidence * 100) / 100 }));
}

export async function loadFortuneSticks(system: 'sixty-jiazi' | 'guanyin-100' | 'custom'): Promise<FortuneStick[]> {
  const paths = system === 'custom' ? ['user-samples.json', 'sixty-jiazi.json', 'guanyin-100.json'] : [`${system}.json`];
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
