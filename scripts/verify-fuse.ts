import Fuse from 'fuse.js';

const records = [
  { id: 'target', numberText: '12 十二', title: '舉頭三尺', normalizedPoem: '伏羲八卦最精靈六十甲子排五星暗室虧心天地見舉頭三尺有神明', sourceName: '照片樣本' },
  { id: 'other', numberText: '18 十八', title: '候潮', normalizedPoem: '潮聲未到且觀瀾舟纜安繫莫心煩', sourceName: '自編示範' },
];

const fuse = new Fuse(records, {
  includeScore: true,
  threshold: 0.55,
  ignoreLocation: true,
  keys: [
    { name: 'numberText', weight: 0.4 },
    { name: 'title', weight: 0.15 },
    { name: 'normalizedPoem', weight: 0.35 },
    { name: 'sourceName', weight: 0.1 },
  ],
});

const result = fuse.search('伏羲八卦最精靈六十甲子扔五星嘆室虎心天地見舉頭三尺有神明')[0];
if (result?.item.id !== 'target') throw new Error('Fuse.js OCR 容錯驗證失敗。');

console.log(`Fuse.js OK：目標排名第一，score ${result.score?.toFixed(3)}`);
