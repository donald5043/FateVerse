import { clear, del, get, set } from 'idb-keyval';
import { DEFAULT_LOCAL_MODEL_ID } from '../ai/model-options';
import type { FateReportInput, ProfileInput } from '../types/fate';

export interface LocalPreferences {
  retainAnalysis: boolean;
  modelId: string;
  ocrLanguage: string;
  theme: 'dark' | 'system';
  modelNoticeSeen: boolean;
}

const PREFERENCES_KEY = 'fateverse:preferences';
const ANALYSIS_KEY = 'fateverse:last-analysis';
const RITUALS_KEY = 'fateverse:decision-rituals';
const RITUALS_LIMIT = 30;

export interface RitualRecord {
  id: string;
  question: string;
  diceSide: 'act' | 'wait';
  hoped: 'act' | 'wait' | 'unknown';
  reaction: 'relief' | 'disappoint' | 'neutral';
  favored: 'act' | 'wait' | null;
  cardText: string;
  createdAt: string;
}

export async function loadRituals(): Promise<RitualRecord[]> {
  return (await get<RitualRecord[]>(RITUALS_KEY)) ?? [];
}

/** 儲存一筆決策儀式紀錄（僅存本機，最多保留最近 30 筆），回傳更新後的清單。 */
export async function saveRitual(record: RitualRecord): Promise<RitualRecord[]> {
  const existing = await loadRituals();
  const next = [record, ...existing].slice(0, RITUALS_LIMIT);
  await set(RITUALS_KEY, next);
  return next;
}

export async function clearRituals(): Promise<void> {
  await del(RITUALS_KEY);
}

export const defaultPreferences: LocalPreferences = {
  retainAnalysis: false,
  modelId: DEFAULT_LOCAL_MODEL_ID,
  ocrLanguage: 'chi_tra',
  theme: 'dark',
  modelNoticeSeen: false,
};

export async function loadPreferences(): Promise<LocalPreferences> {
  const stored = (await get<Partial<LocalPreferences>>(PREFERENCES_KEY)) ?? {};
  return {
    ...defaultPreferences,
    ...stored,
    // Qwen3 0.6B repeatedly stalled during iOS generation. Existing installs
    // migrate to the lower-memory, non-thinking model on their next enable.
    modelId: stored.modelId === 'Qwen3-0.6B-q4f16_1-MLC' ? DEFAULT_LOCAL_MODEL_ID : (stored.modelId ?? DEFAULT_LOCAL_MODEL_ID),
  };
}

export async function savePreferences(value: LocalPreferences): Promise<void> {
  await set(PREFERENCES_KEY, value);
  if (!value.retainAnalysis) await del(ANALYSIS_KEY);
}

export async function saveAnalysis(profile: ProfileInput, report: FateReportInput): Promise<void> {
  await set(ANALYSIS_KEY, { profile, report });
}

export async function loadAnalysis(): Promise<{ profile: ProfileInput; report: FateReportInput } | undefined> {
  return get<{ profile: ProfileInput; report: FateReportInput }>(ANALYSIS_KEY);
}

export async function clearLocalData(): Promise<void> {
  await clear();
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  }
}
