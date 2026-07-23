import { describe, expect, it } from 'vitest';
import { NAME_DICTIONARY, NAME_DICTIONARY_SIZE } from '../src/data/name-dictionary';
import { unihanElement, unihanRadical, unihanStrokes } from '../src/engines/char-data';
import { analyzeName } from '../src/engines/name-engine';
import { CITY_SUGGESTIONS, lookupCityCoordinates } from '../src/utils/city-coordinates';

describe('城市經緯度自動帶入', () => {
  it('完整縣市名可查到座標', () => {
    const taipei = lookupCityCoordinates('臺北市');
    expect(taipei?.longitude).toBeCloseTo(121.5654);
    expect(taipei?.latitude).toBeCloseTo(25.033);
    expect(taipei?.timezone).toBe('Asia/Taipei');
  });
  it('簡寫與「台」寫法也能對應', () => {
    expect(lookupCityCoordinates('台北')?.city).toBe('臺北市');
    expect(lookupCityCoordinates('台中市')?.city).toBe('臺中市');
    expect(lookupCityCoordinates('高雄')?.city).toBe('高雄市');
  });
  it('支援常見海外城市與英文別名', () => {
    expect(lookupCityCoordinates('東京')?.timezone).toBe('Asia/Tokyo');
    expect(lookupCityCoordinates('new york')?.city).toBe('紐約');
  });
  it('查不到時回傳 undefined 而不是亂猜', () => {
    expect(lookupCityCoordinates('不存在的城市')).toBeUndefined();
    expect(lookupCityCoordinates('')).toBeUndefined();
  });
  it('建議清單與資料同步', () => {
    expect(CITY_SUGGESTIONS.length).toBeGreaterThanOrEqual(50);
    expect(CITY_SUGGESTIONS).toContain('臺北市');
  });
});

describe('Unihan 字元資料', () => {
  it('常用字的總筆畫與 Unihan 一致', () => {
    expect(unihanStrokes('一')).toBe(1);
    expect(unihanStrokes('永')).toBe(5);
    expect(unihanStrokes('陳')).toBe(10);
    expect(unihanStrokes('龍')).toBe(16);
    expect(unihanStrokes('曦')).toBe(20);
  });
  it('部首可對照到保守的五行分類', () => {
    expect(unihanElement('江')).toBe('water');
    expect(unihanElement('楓')).toBe('wood');
    expect(unihanElement('曦')).toBe('fire');
    expect(unihanElement('峰')).toBe('earth');
    expect(unihanElement('鎧')).toBe('metal');
    expect(unihanElement('人')).toBeUndefined();
  });
  it('部首編號正確且非漢字回傳 undefined', () => {
    expect(unihanRadical('木')).toBe(75);
    expect(unihanStrokes('A')).toBeUndefined();
    expect(unihanElement('！')).toBeUndefined();
  });
});

describe('姓名字庫擴充', () => {
  it('字庫至少收錄 700 個常用字', () => {
    expect(NAME_DICTIONARY_SIZE).toBeGreaterThanOrEqual(700);
    expect(Object.keys(NAME_DICTIONARY).length).toBe(NAME_DICTIONARY_SIZE);
  });
  it('常見姓名字都有字義，且分析結果引用實際字義', () => {
    const result = analyzeName('陳雅婷', ['metal']);
    const [chen, ya] = result.characters;
    expect(chen.meaning).toBeDefined();
    expect(chen.strokes).toBe(11);
    expect(chen.strokeSource).toBe('modern');
    expect(ya.meaning).toContain('高雅');
    expect(result.overallImpression).toContain('語意組合');
  });
  it('精選字庫未給筆畫的字改由 Unihan 補齊', () => {
    const result = analyzeName('王英', ['fire']);
    const ying = result.characters[1];
    expect(ying.meaning).toContain('才華');
    expect(ying.element).toBe('wood');
    expect(ying.strokes).toBe(8);
    expect(ying.strokeSource).toBe('modern');
  });
  it('全部字都有筆畫時計算五格與三才', () => {
    const result = analyzeName('林安晨', ['metal']);
    expect(result.fiveGrid).toBeDefined();
    const grids = Object.fromEntries(result.fiveGrid!.grids.map((grid) => [grid.name, grid.value]));
    expect(grids).toEqual({ 天格: 9, 人格: 14, 地格: 17, 外格: 12, 總格: 25 });
    expect(result.fiveGrid!.sanCai.elements).toEqual(['water', 'fire', 'metal']);
    expect(result.fiveGrid!.sanCai.relation).toContain('三才');
    expect(result.fiveGrid!.basis).toContain('現代標準筆畫');
  });
  it('Unihan 補齊後五格可直接計算，手動筆畫仍可覆蓋', () => {
    const auto = analyzeName('王英', ['fire']);
    expect(auto.fiveGrid).toBeDefined();
    expect(auto.fiveGrid!.grids.find((grid) => grid.name === '總格')?.value).toBe(12);
    const withManual = analyzeName('王英', ['fire'], { 英: 9 });
    expect(withManual.fiveGrid!.grids.find((grid) => grid.name === '總格')?.value).toBe(13);
  });
  it('字義未收錄的罕見字仍有 Unihan 筆畫與部首五行', () => {
    const result = analyzeName('王曦', ['fire']);
    const xi = result.characters[1];
    expect(xi.meaning).toBeUndefined();
    expect(xi.strokes).toBe(20);
    expect(xi.strokeSource).toBe('modern');
    expect(xi.element).toBe('fire');
    expect(result.fiveGrid).toBeDefined();
    const manual = analyzeName('王曦', ['fire'], { 曦: 21 });
    expect(manual.characters[1].strokes).toBe(21);
    expect(manual.characters[1].strokeSource).toBe('manual');
  });
});
