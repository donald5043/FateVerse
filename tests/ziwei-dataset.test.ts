// @vitest-environment node
import { Blob as NodeBlob } from 'node:buffer';
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildZiweiDatasetKey, ZIWEI_DATASET_TOPICS } from '../src/engines/ziwei-dataset';

const birth = { birthDate: '1990-01-01', birthTime: '00:30', gender: 'male' as const };
const directory = resolve(__dirname, '../public/data/ziwei-v4');
const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'));

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('開源紫微資料查表', () => {
  it('完整收錄全部真實日期、12 時辰與兩種性別，資料與索引通過校驗', () => {
    let total = 0;
    expect(manifest.topics).toEqual(ZIWEI_DATASET_TOPICS.map(([topic]) => topic));
    expect(Object.keys(manifest.years)).toHaveLength(77);
    for (let year = 1950; year <= 2026; year++) {
      const info = manifest.years[year];
      const compressed = readFileSync(resolve(directory, `${year}.bin.gz`));
      expect(createHash('sha256').update(compressed).digest('hex')).toBe(info.sha256);
      expect(compressed.byteLength).toBe(info.bytes);
      const expected = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000 * 24;
      expect(info.records).toBe(expected);
      const binary = gunzipSync(compressed);
      expect(binary.length).toBe(expected * 13 * 2);
      let maxId = 0;
      for (let index = 0; index < binary.length; index += 2) maxId = Math.max(maxId, binary.readUInt16LE(index));
      expect(maxId).toBeLessThan(manifest.dictionary.length);
      total += info.records;
    }
    expect(total).toBe(674976);
    expect(manifest.dictionary.every((text: string) => !/倪|天纪|天紀/.test(text))).toBe(true);
    expect(manifest.source).toBe('https://github.com/Renhuai123/ziwei-doushu');
    expect(manifest.license).toBe('CC BY 4.0');
  });

  it('時辰邊界、閏年、性別與跨年晚子時使用精確索引', () => {
    expect(buildZiweiDatasetKey(birth)).toMatchObject({ row: 0, hourIndex: 0, key: '1990-01-01-0-male' });
    expect(buildZiweiDatasetKey({ ...birth, gender: 'female' }).row).toBe(1);
    expect(buildZiweiDatasetKey({ ...birth, birthTime: '01:00' })).toMatchObject({ row: 2, hourIndex: 1 });
    expect(buildZiweiDatasetKey({ ...birth, birthTime: '22:59' }).hourIndex).toBe(11);
    expect(buildZiweiDatasetKey({ ...birth, birthDate: '1990-12-31', birthTime: '23:00' })).toMatchObject({
      year: 1991, row: 0, date: '1991-01-01', hourIndex: 0, rolledForward: true,
    });
    expect(buildZiweiDatasetKey({ ...birth, birthDate: '2000-02-29' }).row).toBe(59 * 24);
    expect(buildZiweiDatasetKey({ ...birth, birthDate: '2000-03-01' }).row).toBe(60 * 24);
  });

  it.each([
    { birthDate: '1990-02-29' }, { birthDate: '2000-02-30' }, { birthTime: '24:00' },
    { birthTime: '12:60' }, { birthDate: '1949-12-31' }, { gender: 'other' },
    { birthDate: '2026-12-31', birthTime: '23:00' },
  ])('拒絕無效輸入或來源範圍外資料：%j', (change) => {
    expect(() => buildZiweiDatasetKey({ ...birth, ...change } as Parameters<typeof buildZiweiDatasetKey>[0])).toThrow();
  });

  it('讀取實際二進位資料，回傳來源原文並重用同年份下載', async () => {
    vi.stubGlobal('crypto', webcrypto);
    vi.stubGlobal('Blob', NodeBlob);
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith('manifest.json')) return new Response(JSON.stringify(manifest));
      const filename = url.split('/').at(-1)!;
      return new Response(readFileSync(resolve(directory, filename)));
    });
    vi.stubGlobal('fetch', fetcher);
    const { lookupZiweiDataset } = await import('../src/engines/ziwei-dataset');
    const male = await lookupZiweiDataset(birth);
    expect(male.summaries).toHaveLength(13);
    expect(male.summaries[0].text).toMatch(/^你是天生的守护者。/);
    const female = await lookupZiweiDataset({ ...birth, gender: 'female' });
    expect(female.lookup.key).toBe('1990-01-01-0-female');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every(([url]) => !url.includes(birth.birthDate))).toBe(true);
  });

  it('資料損壞時拒絕顯示錯誤的查表結果', async () => {
    vi.stubGlobal('crypto', webcrypto);
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('manifest.json')
      ? new Response(JSON.stringify(manifest)) : new Response(new Uint8Array([0, 1, 2]))));
    const { lookupZiweiDataset } = await import('../src/engines/ziwei-dataset');
    await expect(lookupZiweiDataset(birth)).rejects.toThrow('校驗失敗');
  });
});
