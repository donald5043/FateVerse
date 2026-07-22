import { astro } from 'iztro';
import type {
  ProfileInput, ZiweiHoroscopeLayer, ZiweiMutagen, ZiweiResult, ZiweiStar, ZiweiSurroundedPalace,
} from '../types/fate';

const MUTAGEN_TYPES: ZiweiMutagen['type'][] = ['祿', '權', '科', '忌'];

export function birthHourToZiweiIndex(birthTime: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(birthTime);
  if (!match) throw new Error('出生時間格式無效，無法建立紫微斗數命盤。');
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error('出生時間不存在，無法建立紫微斗數命盤。');
  return hour === 23 ? 12 : Math.floor((hour + 1) / 2);
}

function mapStar(star: { name: string; type: string; brightness?: string; mutagen?: string }): ZiweiStar {
  return {
    name: star.name,
    type: star.type,
    brightness: star.brightness || undefined,
    mutagen: star.mutagen || undefined,
  };
}

function mapHoroscopeLayer(item: {
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  index: number;
  palaceNames: readonly string[];
  mutagen: readonly string[];
}): ZiweiHoroscopeLayer {
  return {
    name: item.name,
    heavenlyStem: item.heavenlyStem,
    earthlyBranch: item.earthlyBranch,
    palaceName: item.palaceNames[item.index] ?? '未標示',
    mutagens: MUTAGEN_TYPES.flatMap((type, index) => item.mutagen[index] ? [{ type, star: item.mutagen[index] }] : []),
  };
}

export function calculateZiwei(
  input: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'>,
  targetDate: string | Date = new Date(),
): ZiweiResult | undefined {
  if (input.gender === 'other') return undefined;
  try {
    const chart = astro.bySolar(input.birthDate, birthHourToZiweiIndex(input.birthTime), input.gender, true, 'zh-TW');
    const horoscope = chart.horoscope(targetDate);
    const surrounded = chart.surroundedPalaces('命宮');
    const soulPalaceSurround = ([
      ['本宮', surrounded.target],
      ['對宮', surrounded.opposite],
      ['財帛位', surrounded.wealth],
      ['官祿位', surrounded.career],
    ] as const).map(([role, palace]): ZiweiSurroundedPalace => ({
      role,
      palaceName: palace.name,
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      majorStars: palace.majorStars.map((star) => star.name),
    }));
    return {
      solarDate: chart.solarDate,
      lunarDate: chart.lunarDate,
      time: chart.time,
      timeRange: chart.timeRange,
      soul: chart.soul,
      body: chart.body,
      fiveElementsClass: chart.fiveElementsClass,
      soulPalaceBranch: chart.earthlyBranchOfSoulPalace,
      bodyPalaceBranch: chart.earthlyBranchOfBodyPalace,
      soulPalaceSurround,
      currentHoroscope: {
        targetDate: horoscope.solarDate,
        lunarDate: horoscope.lunarDate,
        nominalAge: horoscope.age.nominalAge,
        decadal: mapHoroscopeLayer(horoscope.decadal),
        yearly: mapHoroscopeLayer(horoscope.yearly),
        monthly: mapHoroscopeLayer(horoscope.monthly),
        daily: mapHoroscopeLayer(horoscope.daily),
      },
      palaces: chart.palaces.map((palace) => ({
        index: palace.index,
        name: palace.name,
        heavenlyStem: palace.heavenlyStem,
        earthlyBranch: palace.earthlyBranch,
        isBodyPalace: palace.isBodyPalace,
        isOriginalPalace: palace.isOriginalPalace,
        majorStars: palace.majorStars.map(mapStar),
        minorStars: palace.minorStars.map(mapStar),
        changsheng12: palace.changsheng12,
        decadalRange: palace.decadal.range,
      })),
      calculationNote: '採 iztro 2.5.8 通行排法、繁體中文輸出；流年以目前日期計算，三方四正呈現命宮、遷移、財帛與官祿四個結構位置。不同流派的四化、亮度、晚子時與閏月規則可能不同，本版不自動斷吉凶。',
      source: { sourceName: 'iztro', sourceUrl: 'https://github.com/SylarLong/iztro', license: 'MIT' },
    };
  } catch {
    throw new Error('紫微斗數排盤失敗，請確認日期、時間與排盤性別。');
  }
}
