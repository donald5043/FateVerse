import { describe, expect, it } from 'vitest';
import { calculateAstrology, calculateSunSign } from '../src/engines/astrology-engine';
import { calculateBazi, parseBirthDateTime } from '../src/engines/bazi-engine';
import { calculateBaziRelations } from '../src/engines/bazi-relations-engine';
import { branchToElement, calculateFiveElements, stemToElement } from '../src/engines/five-elements-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';
import { birthHourToZiweiIndex, calculateZiwei } from '../src/engines/ziwei-engine';
import { localDateTimeToUtc } from '../src/utils/timezone';

describe('八字與日期', () => {
  it('解析日期、午夜與時區欄位', () => expect(parseBirthDateTime('1990-01-02', '00:00', 'Asia/Taipei')).toEqual({ year: 1990, month: 1, day: 2, hour: 0, minute: 0 }));
  it('拒絕無效日期', () => expect(() => parseBirthDateTime('2024-02-31', '12:00', 'Asia/Taipei')).toThrow('不存在'));
  it('拒絕缺少時區', () => expect(() => parseBirthDateTime('2024-02-01', '12:00', '')).toThrow('時區'));
  it('可計算不同日期的四柱', () => {
    const first = calculateBazi({ birthDate: '1990-01-02', birthTime: '00:00', timezone: 'Asia/Taipei' });
    const second = calculateBazi({ birthDate: '2001-08-15', birthTime: '23:30', timezone: 'Asia/Taipei' });
    expect(first.pillars).toHaveLength(4);
    expect(second.pillars).toHaveLength(4);
    expect(first.solarDate).not.toBe(second.solarDate);
    expect(first.pillars.every((pillar) => pillar.hiddenStems.length > 0)).toBe(true);
    expect(first.mingGong).toHaveLength(2);
  });
  it('指定排盤性別時產生起運與八組大運', () => {
    const result = calculateBazi({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei', gender: 'male' });
    expect(result.luckCycles).toHaveLength(8);
    expect(result.luckStart?.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('從四柱辨識天干五合、地支六沖與三合', () => {
    const base = { stemElement: 'wood' as const, branchElement: 'wood' as const, naYin: '', tenGod: '', hiddenStems: [], hiddenTenGods: [], lifeStage: '', xunKong: '' };
    const relations = calculateBaziRelations([
      { ...base, label: '年柱', value: '甲申', stem: '甲', branch: '申' },
      { ...base, label: '月柱', value: '己子', stem: '己', branch: '子' },
      { ...base, label: '日柱', value: '丙辰', stem: '丙', branch: '辰' },
      { ...base, label: '時柱', value: '辛午', stem: '辛', branch: '午' },
    ]);
    expect(relations.some((item) => item.kind === 'stem-combination' && item.members.join('') === '甲己')).toBe(true);
    expect(relations.some((item) => item.kind === 'branch-clash' && item.members.join('') === '子午')).toBe(true);
    expect(relations.some((item) => item.kind === 'branch-three-harmony' && item.members.join('') === '申子辰')).toBe(true);
  });
  it.each([
    [1984, '鼠'], [1985, '牛'], [1986, '虎'], [1987, '兔'],
    [1988, '龍'], [1989, '蛇'], [1990, '馬'], [1991, '羊'],
    [1992, '猴'], [1993, '雞'], [1994, '狗'], [1995, '豬'],
  ])('%i 年生肖正規化為繁體 %s', (year, expected) => {
    const result = calculateBazi({ birthDate: `${year}-07-01`, birthTime: '12:00', timezone: 'Asia/Taipei' });
    expect(result.zodiac).toBe(expected);
    expect(getZodiacResult(result.zodiac).animal).toBe(expected);
  });
});

describe('五行', () => {
  it('轉換天干與地支', () => { expect(stemToElement('甲')).toBe('wood'); expect(branchToElement('子')).toBe('water'); });
  it('百分比總和接近 100 並找出強弱', () => {
    const bazi = calculateBazi({ birthDate: '1990-01-02', birthTime: '00:00', timezone: 'Asia/Taipei' });
    const result = calculateFiveElements(bazi.pillars);
    expect(Object.values(result.percentages).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 0);
    expect(result.strongest.length).toBeGreaterThan(0);
    expect(result.weakest.length).toBeGreaterThan(0);
  });
});

describe('太陽星座交界', () => {
  it.each([['2000-03-20', '雙魚座'], ['2000-03-21', '牡羊座'], ['2000-04-19', '牡羊座'], ['2000-04-20', '金牛座'], ['2000-12-21', '射手座'], ['2000-12-22', '摩羯座']])('%s 是 %s', (date, sign) => expect(calculateSunSign(date).sunSign).toBe(sign));
});

describe('完整西洋天文位置', () => {
  it('正確將臺北當地時間換成 UTC', () => {
    expect(localDateTimeToUtc('1990-01-02', '10:30', 'Asia/Taipei').toISOString()).toBe('1990-01-02T02:30:00.000Z');
  });
  it('計算十個星體、月亮星座與主要相位', () => {
    const result = calculateAstrology({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' });
    expect(result.sunSign).toBe('摩羯座');
    expect(result.moonSign).toBe('雙魚座');
    expect(result.planets).toHaveLength(10);
    expect(result.aspects?.length).toBeGreaterThan(0);
    expect(result.calculationLevel).toBe('planetary');
  });
  it('提供經緯度時加入上升與等宮制十二宮', () => {
    const result = calculateAstrology({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.033 });
    expect(result.risingSign).toBe('處女座');
    expect(result.houses).toHaveLength(12);
    expect(result.houseSystem).toBe('equal');
    expect(result.planets?.every((planet) => typeof planet.house === 'number')).toBe(true);
    expect(result.houseComparisons?.map((item) => item.system)).toEqual(['equal', 'whole-sign']);
    expect(result.houseComparisons?.every((item) => item.houses.length === 12)).toBe(true);
    expect(Object.keys(result.houseComparisons?.[1].planetHouses ?? {})).toHaveLength(10);
  });
});

describe('紫微斗數排盤', () => {
  it.each([['00:30', 0], ['01:00', 1], ['22:59', 11], ['23:00', 12]])('%s 對應時辰索引 %i', (time, index) => expect(birthHourToZiweiIndex(time)).toBe(index));
  it('產生十二宮、命身主與五行局', () => {
    const result = calculateZiwei({ birthDate: '1990-01-02', birthTime: '10:30', gender: 'male' }, '2026-07-22');
    expect(result?.palaces).toHaveLength(12);
    expect(result?.soul).toBe('廉貞');
    expect(result?.body).toBe('天機');
    expect(result?.fiveElementsClass).toBe('金四局');
    expect(result?.soulPalaceSurround.map((palace) => palace.role)).toEqual(['本宮', '對宮', '財帛位', '官祿位']);
    expect(result?.currentHoroscope.targetDate).toBe('2026-7-22');
    expect(result?.currentHoroscope.decadal.palaceName).toBe('命宮');
    expect(result?.currentHoroscope.yearly.mutagens.map((item) => item.type)).toEqual(['祿', '權', '科', '忌']);
    expect(result?.currentHoroscope.monthly.name).toBe('流月');
    expect(result?.currentHoroscope.daily.name).toBe('流日');
    expect(result?.currentHoroscope.monthly.mutagens).toHaveLength(4);
    expect(result?.currentHoroscope.daily.mutagens).toHaveLength(4);
    expect(result?.settings.algorithm).toBe('default');
  });
  it('可切換中州派安星與立春分界設定', () => {
    const result = calculateZiwei({ birthDate: '1990-01-02', birthTime: '10:30', gender: 'male' }, '2026-07-22', {
      algorithm: 'zhongzhou', yearDivide: 'exact', horoscopeDivide: 'exact', ageDivide: 'birthday', dayDivide: 'forward',
    });
    expect(result?.settings).toEqual({ algorithm: 'zhongzhou', yearDivide: 'exact', horoscopeDivide: 'exact', ageDivide: 'birthday', dayDivide: 'forward' });
    expect(result?.calculationNote).toContain('中州派');
  });
  it('未指定排盤性別時明確略過', () => {
    expect(calculateZiwei({ birthDate: '1990-01-02', birthTime: '10:30', gender: 'other' })).toBeUndefined();
  });
});

describe('生命靈數', () => {
  it('保留完整計算過程', () => expect(calculateNumerology('1990-01-01').calculationSteps).toEqual([21, 3]));
  it.each([['2000-01-08', 11], ['2000-09-29', 22], ['1999-01-04', 33]])('保留大師數 %s → %i', (date, expected) => expect(calculateNumerology(date).lifePathNumber).toBe(expected));
});
