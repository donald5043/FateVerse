import { clear, del, get, set } from 'idb-keyval';
import type { CapsuleRecord } from '../engines/time-capsule-engine';
import { upsertFeedback, type FeedbackRecord } from '../engines/fortune-feedback-engine';
import type { FateReportInput, ProfileInput } from '../types/fate';

export interface LocalPreferences {
  retainAnalysis: boolean;
  ocrLanguage: string;
  theme: 'dark' | 'system';
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

const CAPSULES_KEY = 'fateverse:time-capsules';
const CAPSULES_LIMIT = 60;

export async function loadCapsules(): Promise<CapsuleRecord[]> {
  return (await get<CapsuleRecord[]>(CAPSULES_KEY)) ?? [];
}

/** 新增一個時間膠囊（僅存本機），回傳更新後的清單。 */
export async function saveCapsule(record: CapsuleRecord): Promise<CapsuleRecord[]> {
  const existing = await loadCapsules();
  const next = [record, ...existing].slice(0, CAPSULES_LIMIT);
  await set(CAPSULES_KEY, next);
  return next;
}

/** 更新指定膠囊（例如開啟後補上回看內容）。 */
export async function updateCapsule(id: string, patch: Partial<CapsuleRecord>): Promise<CapsuleRecord[]> {
  const existing = await loadCapsules();
  const next = existing.map((capsule) => (capsule.id === id ? { ...capsule, ...patch } : capsule));
  await set(CAPSULES_KEY, next);
  return next;
}

export async function deleteCapsule(id: string): Promise<CapsuleRecord[]> {
  const existing = await loadCapsules();
  const next = existing.filter((capsule) => capsule.id !== id);
  await set(CAPSULES_KEY, next);
  return next;
}

export async function clearCapsules(): Promise<void> {
  await del(CAPSULES_KEY);
}

const FEEDBACK_KEY = 'fateverse:daily-feedback';
const FEEDBACK_LIMIT = 400;

/**
 * 今日回饋。同意狀態與紀錄放在同一個 key：沒有同意過，這個 key 根本不存在，
 * 所以「沒同意就不寫入」在資料層是可驗證的，而不是只靠 UI 擋。
 */
export interface FeedbackStore {
  consented: boolean;
  records: FeedbackRecord[];
}

const emptyFeedback: FeedbackStore = { consented: false, records: [] };

/**
 * 隱私模式等環境沒有 IndexedDB。idb-keyval 會在內部建立連線 promise，
 * 它的 rejection 攔不到，所以在呼叫之前先擋掉。
 */
function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

export async function loadFeedback(): Promise<FeedbackStore> {
  if (!hasIndexedDb()) return emptyFeedback;
  try {
    const stored = await get<Partial<FeedbackStore>>(FEEDBACK_KEY);
    if (!stored) return emptyFeedback;
    return { consented: stored.consented === true, records: stored.records ?? [] };
  } catch {
    // file:// 或被封鎖的儲存空間：當成沒紀錄，卡片照樣顯示。
    return emptyFeedback;
  }
}

/** 記錄同意。這是唯一會在未同意狀態下寫入的動作。 */
export async function grantFeedbackConsent(): Promise<FeedbackStore> {
  if (!hasIndexedDb()) throw new Error('這個瀏覽器環境無法保存紀錄。');
  const existing = await loadFeedback();
  const next: FeedbackStore = { ...existing, consented: true };
  await set(FEEDBACK_KEY, next);
  return next;
}

/**
 * 儲存一筆今日回饋。未同意時不寫入任何東西，直接回傳現況——
 * 呼叫端就算漏掉檢查，也不會偷偷留下資料。
 */
export async function saveFeedback(record: FeedbackRecord): Promise<FeedbackStore> {
  if (!hasIndexedDb()) throw new Error('這個瀏覽器環境無法保存紀錄。');
  const existing = await loadFeedback();
  if (!existing.consented) return existing;
  const next: FeedbackStore = {
    consented: true,
    records: upsertFeedback(existing.records, record).slice(0, FEEDBACK_LIMIT),
  };
  await set(FEEDBACK_KEY, next);
  return next;
}

/** 刪除全部回饋紀錄，並收回同意。 */
export async function clearFeedback(): Promise<void> {
  if (!hasIndexedDb()) return;
  await del(FEEDBACK_KEY);
}

export const defaultPreferences: LocalPreferences = {
  retainAnalysis: false,
  ocrLanguage: 'chi_tra',
  theme: 'dark',
};

export async function loadPreferences(): Promise<LocalPreferences> {
  const stored = (await get<Partial<LocalPreferences>>(PREFERENCES_KEY)) ?? {};
  return { ...defaultPreferences, ...stored };
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
