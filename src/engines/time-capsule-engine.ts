export type CapsuleStatus = 'sealed' | 'ready' | 'opened';
export type CapsuleOutcome = 'yes' | 'partly' | 'no' | 'na';

export interface CapsuleRecord {
  id: string;
  title: string;
  message: string;
  mood?: number;
  createdAt: string;
  openAt: string;
  openedAt?: string;
  reflection?: string;
  outcome?: CapsuleOutcome;
}

export interface CapsulePreset {
  label: string;
  days: number;
}

export const CAPSULE_PRESETS: CapsulePreset[] = [
  { label: '一個月後', days: 30 },
  { label: '三個月後', days: 90 },
  { label: '半年後', days: 180 },
  { label: '一年後', days: 365 },
];

const DAY_MS = 86400000;

/** 依開啟日與是否已開啟判定膠囊狀態：已開啟 / 可開啟 / 封存中。 */
export function capsuleStatus(capsule: CapsuleRecord, now: Date = new Date()): CapsuleStatus {
  if (capsule.openedAt) return 'opened';
  return now.getTime() >= new Date(capsule.openAt).getTime() ? 'ready' : 'sealed';
}

/** 距離某個時間點還有幾天（未來為正、已過為 0）。 */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS));
}

/** 距離某個時間點已過幾天（過去為正、未來為 0）。 */
export function daysSince(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS));
}

/** 從現在起算 N 天後的開啟日（ISO）。 */
export function computeOpenDate(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

/**
 * 排序：可開啟優先（最早該開的在前），其次封存中（最快到期在前），最後已開啟（最近開的在前）。
 */
export function sortCapsules(capsules: CapsuleRecord[], now: Date = new Date()): CapsuleRecord[] {
  const rank: Record<CapsuleStatus, number> = { ready: 0, sealed: 1, opened: 2 };
  return [...capsules].sort((a, b) => {
    const statusA = capsuleStatus(a, now);
    const statusB = capsuleStatus(b, now);
    if (rank[statusA] !== rank[statusB]) return rank[statusA] - rank[statusB];
    if (statusA === 'opened') return new Date(b.openedAt!).getTime() - new Date(a.openedAt!).getTime();
    return new Date(a.openAt).getTime() - new Date(b.openAt).getTime();
  });
}

export const OUTCOME_LABELS: Record<CapsuleOutcome, string> = {
  yes: '成真了',
  partly: '部分成真',
  no: '沒有發生',
  na: '不好說 / 不適用',
};
