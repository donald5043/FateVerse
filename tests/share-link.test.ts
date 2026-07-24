import { describe, expect, it } from 'vitest';
import { buildShareUrl, decodeShareCodeToProfile, decodeShareInput, encodeProfileToShareCode } from '../src/utils/share-link';
import { buildReportFromProfile } from '../src/engines/build-report';
import type { ProfileInput } from '../src/types/fate';

const profile: ProfileInput = {
  name: '林安晨', birthDate: '1990-01-02', birthTime: '10:30', gender: 'female',
  region: '臺灣', timezone: 'Asia/Taipei', city: '臺北市', longitude: 121.5654, latitude: 25.033,
  focus: ['career', 'love'],
};

describe('分享連結編解碼', () => {
  it('預設不含姓名，往返還原其餘欄位', () => {
    const code = encodeProfileToShareCode(profile);
    const decoded = decodeShareCodeToProfile(code);
    expect(decoded).toBeDefined();
    expect(decoded!.name).toBe('');
    expect(decoded!.birthDate).toBe('1990-01-02');
    expect(decoded!.birthTime).toBe('10:30');
    expect(decoded!.gender).toBe('female');
    expect(decoded!.timezone).toBe('Asia/Taipei');
    expect(decoded!.longitude).toBeCloseTo(121.5654);
    expect(decoded!.latitude).toBeCloseTo(25.033);
    expect(decoded!.focus).toEqual(['career', 'love']);
  });

  it('選擇包含姓名時姓名被保留', () => {
    const decoded = decodeShareCodeToProfile(encodeProfileToShareCode(profile, { includeName: true }));
    expect(decoded!.name).toBe('林安晨');
  });

  it('沒有經緯度的資料也能往返', () => {
    const minimal: ProfileInput = { name: '', birthDate: '1985-07-15', birthTime: '08:00', gender: 'male', region: '臺灣', timezone: 'Asia/Taipei', focus: ['all'] };
    const decoded = decodeShareCodeToProfile(encodeProfileToShareCode(minimal));
    expect(decoded!.longitude).toBeUndefined();
    expect(decoded!.latitude).toBeUndefined();
    expect(decoded!.focus).toEqual(['all']);
  });

  it('壓縮碼帶版本前綴且相對精簡', () => {
    const code = encodeProfileToShareCode(profile);
    expect(code.startsWith('v1.')).toBe(true);
    expect(code.length).toBeLessThan(200);
  });

  it('拒絕格式錯誤、版本不符或被竄改的字串', () => {
    expect(decodeShareCodeToProfile('')).toBeUndefined();
    expect(decodeShareCodeToProfile('隨便亂打')).toBeUndefined();
    expect(decodeShareCodeToProfile('v2.abcdef')).toBeUndefined();
    expect(decodeShareCodeToProfile('v1.@@@notvalid@@@')).toBeUndefined();
  });

  it('缺少必要欄位（日期）的 payload 被拒絕', () => {
    // 手動壓一個缺 d 的 payload
    const bad = encodeProfileToShareCode({ ...profile, birthDate: '' as unknown as string });
    expect(decodeShareCodeToProfile(bad)).toBeUndefined();
  });

  it('分享網址使用 HashRouter 的 /shared 路徑', () => {
    const url = buildShareUrl(profile);
    expect(url).toContain('#/shared?d=v1.');
  });

  it('decodeShareInput 同時接受純代碼與整段分享網址', () => {
    const code = encodeProfileToShareCode(profile, { includeName: true });
    const fromCode = decodeShareInput(code);
    const fromUrl = decodeShareInput(`https://donald5043.github.io/FateVerse/#/shared?d=${code}`);
    expect(fromCode?.birthDate).toBe('1990-01-02');
    expect(fromUrl?.birthDate).toBe('1990-01-02');
    expect(fromUrl?.name).toBe('林安晨');
    expect(decodeShareInput('  ')).toBeUndefined();
    expect(decodeShareInput('https://example.com/no-code')).toBeUndefined();
  });

  it('解碼後的 profile 能實際重算出完整報告', () => {
    const decoded = decodeShareCodeToProfile(encodeProfileToShareCode(profile, { includeName: true }));
    const { reportInput, report } = buildReportFromProfile(decoded!);
    expect(reportInput.bazi.dayMaster).toBeTruthy();
    expect(reportInput.ziwei).toBeDefined();
    expect(report.summary.length).toBeGreaterThan(10);
  });
});
