import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { ProfileInput } from '../types/fate';

// 分享連結只編碼「輸入」而非「命盤結果」——接收端重算，連結因此很短。
// 版本前綴讓未來格式演變時仍能辨識與拒絕舊資料。
const SHARE_VERSION = 'v1';

interface SharePayload {
  n?: string; // name（可選；不含姓名時省略）
  d: string; // birthDate
  t: string; // birthTime
  g: ProfileInput['gender'];
  r: string; // region
  z: string; // timezone
  c?: string; // city
  lng?: number;
  lat?: number;
  f: string[]; // focus
}

export interface EncodeOptions {
  includeName?: boolean;
}

/** 把出生資料壓縮成可放進 URL 的字串。預設不含姓名以降低敏感度。 */
export function encodeProfileToShareCode(profile: ProfileInput, options: EncodeOptions = {}): string {
  const payload: SharePayload = {
    ...(options.includeName && profile.name.trim() ? { n: profile.name.trim() } : {}),
    d: profile.birthDate,
    t: profile.birthTime,
    g: profile.gender,
    r: profile.region,
    z: profile.timezone,
    ...(profile.city ? { c: profile.city } : {}),
    ...(typeof profile.longitude === 'number' ? { lng: profile.longitude } : {}),
    ...(typeof profile.latitude === 'number' ? { lat: profile.latitude } : {}),
    f: profile.focus,
  };
  return `${SHARE_VERSION}.${compressToEncodedURIComponent(JSON.stringify(payload))}`;
}

function isValidPayload(value: unknown): value is SharePayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(payload.d) &&
    typeof payload.t === 'string' && /^\d{2}:\d{2}$/.test(payload.t) &&
    typeof payload.z === 'string' &&
    (payload.g === 'female' || payload.g === 'male' || payload.g === 'other') &&
    Array.isArray(payload.f) && payload.f.every((item) => typeof item === 'string')
  );
}

/** 從分享字串還原 ProfileInput；格式錯誤或版本不符時回傳 undefined。 */
export function decodeShareCodeToProfile(code: string): ProfileInput | undefined {
  const trimmed = code.trim();
  const dot = trimmed.indexOf('.');
  if (dot < 0 || trimmed.slice(0, dot) !== SHARE_VERSION) return undefined;
  let parsed: unknown;
  try {
    const json = decompressFromEncodedURIComponent(trimmed.slice(dot + 1));
    if (!json) return undefined;
    parsed = JSON.parse(json);
  } catch {
    return undefined;
  }
  if (!isValidPayload(parsed)) return undefined;
  return {
    name: parsed.n ?? '',
    birthDate: parsed.d,
    birthTime: parsed.t,
    gender: parsed.g,
    region: parsed.r || '未提供',
    timezone: parsed.z,
    city: parsed.c,
    longitude: parsed.lng,
    latitude: parsed.lat,
    focus: parsed.f.length ? parsed.f : ['all'],
  };
}

/** 從純代碼或整段分享網址還原 ProfileInput；容忍使用者直接貼上整條連結。 */
export function decodeShareInput(input: string): ProfileInput | undefined {
  const raw = input.trim();
  if (!raw) return undefined;
  const match = raw.match(/[?&]d=([^&\s]+)/);
  const code = match ? decodeURIComponent(match[1]) : raw;
  return decodeShareCodeToProfile(code);
}

/** 產生完整的分享網址（HashRouter，含 base path），可直接複製分享。 */
export function buildShareUrl(profile: ProfileInput, options: EncodeOptions = {}): string {
  const code = encodeProfileToShareCode(profile, options);
  const origin = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  return `${origin}#/shared?d=${code}`;
}
