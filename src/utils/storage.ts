import { clear, del, get, set } from 'idb-keyval';
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

export const defaultPreferences: LocalPreferences = {
  retainAnalysis: false,
  modelId: 'Qwen3-0.6B-q4f16_1-MLC',
  ocrLanguage: 'chi_tra',
  theme: 'dark',
  modelNoticeSeen: false,
};

export async function loadPreferences(): Promise<LocalPreferences> {
  return { ...defaultPreferences, ...((await get<Partial<LocalPreferences>>(PREFERENCES_KEY)) ?? {}) };
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
