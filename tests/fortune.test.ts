import { describe, expect, it } from 'vitest';
import { matchFortuneSticks } from '../src/engines/fortune-stick-matcher';
import type { FortuneStick } from '../src/types/fate';

const sticks: FortuneStick[] = [
  { id: '1', system: 'sixty-jiazi', sourceName: '示範', number: 1, title: '初光', level: '中吉', poem: ['晨光漸照遠山明', '且整行囊步履輕', '舊路回看知取捨', '新程穩走自安寧'], summary: '摘要', interpretations: { overall: '整體' }, actions: [], risks: [], keywords: ['晨光'], dataSource: { sourceName: '自編' } },
  { id: '18', system: 'sixty-jiazi', sourceName: '示範', number: 18, title: '候潮', level: '平', poem: ['潮聲未到且觀瀾', '舟纜安繫莫心煩'], summary: '摘要', interpretations: { overall: '整體' }, actions: [], risks: [], keywords: ['潮聲'], dataSource: { sourceName: '自編' } },
  { id: '12', system: 'custom', sourceName: '照片樣本', number: 12, title: '舉頭三尺', level: '警示籤', poem: ['伏羲八卦最精靈', '六十甲子排五星', '暗室虧心天地見', '舉頭三尺有神明'], summary: '摘要', interpretations: { overall: '整體' }, actions: [], risks: [], keywords: ['八卦', '神明'], dataSource: { sourceName: '使用者照片' } },
];

describe('籤詩模糊比對', () => {
  it('比對完整籤文', () => expect(matchFortuneSticks(sticks[0].poem.join(''), sticks)[0].item.id).toBe('1'));
  it('OCR 少一個字仍能比對', () => expect(matchFortuneSticks('晨光漸照遠山 且整行囊步履輕', sticks)[0].item.id).toBe('1'));
  it('OCR 多個錯字仍有候選', () => expect(matchFortuneSticks('晨光漸昭遠山明 且整行郎步履輕', sticks)[0].item.id).toBe('1'));
  it('只有籤號可比對', () => expect(matchFortuneSticks('第18籤', sticks)[0].item.id).toBe('18'));
  it('中文籤號也可直接找到', () => expect(matchFortuneSticks('第十二首籤詩', sticks)[0].item.id).toBe('12'));
  it('直排 OCR 有錯字與欄首雜訊時仍以詩句找到正確籤', () => {
    const ocr = '內一 第十三首籤詩 M\n門一伙姜八卦最精靈_遍\n紫」六十甲子扔五星一樣\n竹一嘆室虎心天地見一\n寺_舉頭三尺有神明';
    expect(matchFortuneSticks(ocr, sticks)[0].item.id).toBe('12');
  });
  it('找不到時回傳空陣列', () => expect(matchFortuneSticks('完全無關的文字資料', sticks)).toEqual([]));
});
