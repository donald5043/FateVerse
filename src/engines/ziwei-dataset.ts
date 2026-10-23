import type { ProfileInput } from '../types/fate';

export const ZIWEI_DATASET_SOURCE = 'https://github.com/Renhuai123/ziwei-doushu';
export const ZIWEI_DATASET_TOPICS = [
  ['overview', '命格總覽'], ['personality', '性格'], ['love', '感情'],
  ['career', '事業'], ['wealth', '財運'], ['health', '健康'],
  ['family', '兄弟'], ['children', '子女'], ['move', '遷移'],
  ['friends', '人際'], ['home', '田宅'], ['spirit', '福德'], ['parents', '父母'],
] as const;

type BirthInput = Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'>;
interface DatasetManifest {
  version: string;
  topics: string[];
  dictionary: string[];
  years: Record<string, { records: number; bytes: number; sha256: string }>;
}
export interface ZiweiDatasetKey {
  year: number;
  row: number;
  date: string;
  hourIndex: number;
  gender: 'male' | 'female';
  key: string;
  rolledForward: boolean;
}
export interface ZiweiDatasetReading {
  lookup: ZiweiDatasetKey;
  summaries: { topic: string; label: string; text: string }[];
}

/** The upstream dataset uses branch hours 0–11 and next-day late Zi. */
export function buildZiweiDatasetKey(input: BirthInput): ZiweiDatasetKey {
  if (input.gender !== 'male' && input.gender !== 'female') {
    throw new Error('來源資料集只提供男命與女命，無法查詢目前的排盤性別。');
  }
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.birthDate);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(input.birthTime);
  if (!dateMatch || !timeMatch) throw new Error('請確認出生日期與時間格式。');
  const [, y, m, d] = dateMatch.map(Number);
  const [, hour, minute] = timeMatch.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d || hour > 23 || minute > 59) {
    throw new Error('出生日期或時間不存在，無法查表。');
  }
  if (hour === 23) date.setUTCDate(date.getUTCDate() + 1);
  const year = date.getUTCFullYear();
  if (year < 1950 || year > 2026) throw new Error('開源資料集涵蓋 1950–2026 年，這個排盤日期沒有資料。');
  const hourIndex = Math.floor((hour + 1) / 2) % 12;
  const dayOfYear = (date.getTime() - Date.UTC(year, 0, 1)) / 86400000;
  const normalizedDate = date.toISOString().slice(0, 10);
  return {
    year, row: dayOfYear * 24 + hourIndex * 2 + (input.gender === 'female' ? 1 : 0),
    date: normalizedDate, hourIndex, gender: input.gender,
    key: `${normalizedDate}-${hourIndex}-${input.gender}`, rolledForward: hour === 23,
  };
}

const base = `${import.meta.env.BASE_URL}data/ziwei-v4/`;
let manifestCache: DatasetManifest | undefined;
const yearCache = new Map<number, DataView>();

async function fetchManifest(signal?: AbortSignal): Promise<DatasetManifest> {
  if (manifestCache) return manifestCache;
  const response = await fetch(`${base}manifest.json`, { signal });
  if (!response.ok) throw new Error('開源解讀資料暫時無法讀取，請稍後再試。');
  const manifest: DatasetManifest = await response.json();
  if (manifest.version !== 'v4.0-13d-excerpts-1' || !Array.isArray(manifest.dictionary) ||
      ZIWEI_DATASET_TOPICS.some(([topic], index) => manifest.topics?.[index] !== topic)) {
    throw new Error('開源資料版本不符，請重新整理網站後再試。');
  }
  manifestCache = manifest;
  return manifest;
}

export async function lookupZiweiDataset(input: BirthInput, signal?: AbortSignal): Promise<ZiweiDatasetReading> {
  const lookup = buildZiweiDatasetKey(input);
  const manifest = await fetchManifest(signal);
  const yearInfo = manifest.years[lookup.year];
  if (!yearInfo || lookup.row >= yearInfo.records) throw new Error('找不到對應日期的開源解讀。');
  let view = yearCache.get(lookup.year);
  if (!view) {
    if (typeof DecompressionStream === 'undefined') throw new Error('此瀏覽器無法讀取解讀資料，請使用較新的瀏覽器。');
    const response = await fetch(`${base}${lookup.year}.bin.gz`, { signal });
    if (!response.ok) throw new Error('這個年份的解讀資料暫時無法讀取，請稍後再試。');
    const compressed = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', compressed);
    const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    if (compressed.byteLength !== yearInfo.bytes || hash !== yearInfo.sha256) throw new Error('年份資料校驗失敗，請重新整理後再試。');
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    const binary = await new Response(stream).arrayBuffer();
    if (binary.byteLength !== yearInfo.records * ZIWEI_DATASET_TOPICS.length * 2) throw new Error('年份資料不完整，請重新整理後再試。');
    view = new DataView(binary);
    if (yearCache.size >= 2) yearCache.delete(yearCache.keys().next().value!);
    yearCache.set(lookup.year, view);
  }
  const summaries = ZIWEI_DATASET_TOPICS.map(([topic, label], index) => {
    const id = view.getUint16((lookup.row * ZIWEI_DATASET_TOPICS.length + index) * 2, true);
    const text = manifest.dictionary[id];
    if (typeof text !== 'string') throw new Error('解讀索引不完整，請重新整理後再試。');
    return { topic, label, text };
  });
  return { lookup, summaries };
}
