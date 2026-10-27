// @vitest-environment node
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyZiweiRights } from '../scripts/verify-ziwei-rights.mjs';

const source = resolve(import.meta.dirname, '../public/data/ziwei-v4');
const temporaryDirectories = [];
afterEach(() => {
  for (const path of temporaryDirectories.splice(0)) {
    const absolute = resolve(path);
    if (dirname(absolute) !== resolve(tmpdir()) || !basename(absolute).startsWith('fateverse-rights-')) {
      throw new Error('Refusing to remove a path outside the test temporary directory.');
    }
    rmSync(absolute, { recursive: true, force: true });
  }
});

function copyData() {
  const root = mkdtempSync(resolve(tmpdir(), 'fateverse-rights-'));
  temporaryDirectories.push(root);
  const data = resolve(root, 'data');
  cpSync(source, data, { recursive: true });
  return data;
}

function mutateManifest(data, change) {
  const path = resolve(data, 'manifest.json');
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  change(manifest);
  writeFileSync(path, JSON.stringify(manifest));
}

describe('紫微授權與發佈檢查', () => {
  it('公開資料只包含本次允許的摘要、署名與授權文件', () => {
    expect(verifyZiweiRights(source)).toEqual({ summaries: 633, excludedParagraphs: 34 });
  });

  it('未審查的新文字與舊版字典都不能通過發佈', () => {
    const data = copyData();
    mutateManifest(data, (manifest) => { manifest.dictionary[1] += ' An unreviewed addition.'; });
    expect(() => verifyZiweiRights(data)).toThrow('unreviewed summary');
    mutateManifest(data, (manifest) => { manifest.version = 'v4.0-13d-excerpts-1'; });
    expect(() => verifyZiweiRights(data)).toThrow('stale dataset');
  });

  it('來源作者、授權連結或修改記錄缺漏時不能通過發佈', () => {
    for (const change of [
      (manifest) => { manifest.author = ''; },
      (manifest) => { manifest.licenseUrl = ''; },
      (manifest) => { manifest.attribution = ''; },
      (manifest) => { manifest.modificationHistory = []; },
    ]) {
      const data = copyData();
      mutateManifest(data, change);
      expect(() => verifyZiweiRights(data)).toThrow('missing attribution');
    }
  });

  it('原作者條款被修改或資料夾混入比對語料時不能發佈', () => {
    const data = copyData();
    writeFileSync(resolve(data, 'entries.jsonl'), 'self-authored test fixture');
    expect(() => verifyZiweiRights(data)).toThrow('unexpected audit or data asset');
    rmSync(resolve(data, 'entries.jsonl'));
    writeFileSync(resolve(data, 'SOURCE-LICENSE.txt'), 'A substituted license.');
    expect(() => verifyZiweiRights(data)).toThrow('upstream license notice changed');
  });

  it('通知檔缺少原作者指定署名時不能發佈；Windows 換行不改變條款', () => {
    const data = copyData();
    const licensePath = resolve(data, 'SOURCE-LICENSE.txt');
    writeFileSync(licensePath, readFileSync(licensePath, 'utf8').replace(/\r?\n/g, '\r\n'));
    expect(() => verifyZiweiRights(data)).not.toThrow();
    writeFileSync(resolve(data, 'NOTICE.md'), 'A notice missing attribution.');
    expect(() => verifyZiweiRights(data)).toThrow('incomplete distributable notice');
  });
});
