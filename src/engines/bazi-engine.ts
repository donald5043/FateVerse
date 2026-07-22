import { Solar } from 'lunar-javascript';
import type { BaziPillar, BaziResult, ProfileInput } from '../types/fate';
import { branchToElement, stemToElement } from './five-elements-engine';
import { calculateBaziRelations } from './bazi-relations-engine';
import { normalizeZodiacAnimal } from './zodiac-engine';

interface ParsedBirth {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const traditionalTerms: Record<string, string> = {
  劫财: '劫財', 伤官: '傷官', 偏财: '偏財', 正财: '正財', 七杀: '七殺',
  临官: '臨官', 长生: '長生', 养: '養',
};

function traditionalTerm(value: string): string {
  return traditionalTerms[value] ?? value;
}

export function parseBirthDateTime(birthDate: string, birthTime: string, timezone: string): ParsedBirth {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!dateMatch) throw new Error('出生日期格式無效，請使用西元年、月、日。');
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(birthTime);
  if (!timeMatch) throw new Error('請填寫有效的出生時間。');
  if (!timezone.trim()) throw new Error('請選擇出生地時區。');
  const [year, month, day] = dateMatch.slice(1).map(Number);
  const [hour, minute] = timeMatch.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || hour > 23 || minute > 59) {
    throw new Error('出生日期或時間不存在，請重新確認。');
  }
  if (year < 1900 || year > 2100) throw new Error('第一版支援 1900 至 2100 年的日期。');
  return { year, month, day, hour, minute };
}

export function calculateBazi(input: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'timezone'> & Partial<Pick<ProfileInput, 'gender'>>): BaziResult {
  const parsed = parseBirthDateTime(input.birthDate, input.birthTime, input.timezone);
  try {
    const lunar = Solar.fromYmdHms(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.minute, 0).getLunar();
    const eightChar = lunar.getEightChar();
    const values = [eightChar.getYear(), eightChar.getMonth(), eightChar.getDay(), eightChar.getTime()];
    const stems = [eightChar.getYearGan(), eightChar.getMonthGan(), eightChar.getDayGan(), eightChar.getTimeGan()];
    const branches = [eightChar.getYearZhi(), eightChar.getMonthZhi(), eightChar.getDayZhi(), eightChar.getTimeZhi()];
    const naYin = [eightChar.getYearNaYin(), eightChar.getMonthNaYin(), eightChar.getDayNaYin(), eightChar.getTimeNaYin()];
    const tenGods = [eightChar.getYearShiShenGan(), eightChar.getMonthShiShenGan(), '日主', eightChar.getTimeShiShenGan()].map(traditionalTerm);
    const hiddenStems = [eightChar.getYearHideGan(), eightChar.getMonthHideGan(), eightChar.getDayHideGan(), eightChar.getTimeHideGan()];
    const hiddenTenGods = [eightChar.getYearShiShenZhi(), eightChar.getMonthShiShenZhi(), eightChar.getDayShiShenZhi(), eightChar.getTimeShiShenZhi()].map((items) => items.map(traditionalTerm));
    const lifeStages = [eightChar.getYearDiShi(), eightChar.getMonthDiShi(), eightChar.getDayDiShi(), eightChar.getTimeDiShi()].map(traditionalTerm);
    const xunKong = [eightChar.getYearXunKong(), eightChar.getMonthXunKong(), eightChar.getDayXunKong(), eightChar.getTimeXunKong()];
    const labels = ['年柱', '月柱', '日柱', '時柱'];
    const pillars: BaziPillar[] = values.map((value, index) => ({
      label: labels[index],
      value,
      stem: stems[index],
      branch: branches[index],
      stemElement: stemToElement(stems[index]),
      branchElement: branchToElement(branches[index]),
      naYin: naYin[index],
      tenGod: tenGods[index],
      hiddenStems: hiddenStems[index],
      hiddenTenGods: hiddenTenGods[index],
      lifeStage: lifeStages[index],
      xunKong: xunKong[index],
    }));
    const genderValue = input.gender === 'male' ? 1 : input.gender === 'female' ? 0 : undefined;
    const yun = genderValue === undefined ? undefined : eightChar.getYun(genderValue, 2);
    const luckCycles = yun?.getDaYun(9).filter((cycle) => cycle.getIndex() > 0).slice(0, 8).map((cycle) => ({
      ganZhi: cycle.getGanZhi(),
      startYear: cycle.getStartYear(),
      endYear: cycle.getEndYear(),
      startAge: cycle.getStartAge(),
      endAge: cycle.getEndAge(),
    }));
    return {
      solarDate: `${input.birthDate} ${input.birthTime}`,
      lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      pillars,
      dayMaster: eightChar.getDayGan(),
      dayMasterElement: stemToElement(eightChar.getDayGan()),
      zodiac: normalizeZodiacAnimal(lunar.getYearShengXiao()),
      seasonalNode: lunar.getJieQi() || lunar.getNextJie().getName(),
      taiYuan: eightChar.getTaiYuan(),
      taiXi: eightChar.getTaiXi(),
      mingGong: eightChar.getMingGong(),
      shenGong: eightChar.getShenGong(),
      luckCycles,
      relations: calculateBaziRelations(pillars),
      luckStart: yun ? {
        direction: yun.isForward() ? 'forward' : 'backward',
        years: yun.getStartYear(),
        months: yun.getStartMonth(),
        days: yun.getStartDay(),
        startDate: yun.getStartSolar().toYmd(),
      } : undefined,
      timezone: input.timezone,
      trueSolarTimeApplied: false,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('無法辨識')) throw error;
    throw new Error('農曆與八字計算失敗，請確認日期時間後再試一次。');
  }
}
