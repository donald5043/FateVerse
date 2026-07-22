import { astro } from 'iztro';
import type { ProfileInput, ZiweiResult, ZiweiStar } from '../types/fate';

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

export function calculateZiwei(input: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'>): ZiweiResult | undefined {
  if (input.gender === 'other') return undefined;
  try {
    const chart = astro.bySolar(input.birthDate, birthHourToZiweiIndex(input.birthTime), input.gender, true, 'zh-TW');
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
      calculationNote: '採 iztro 2.5.8 通行排法、繁體中文輸出；不同流派的四化、亮度、晚子時與閏月規則可能不同。本版只呈現排盤資料，不自動斷吉凶。',
      source: { sourceName: 'iztro', sourceUrl: 'https://github.com/SylarLong/iztro', license: 'MIT' },
    };
  } catch {
    throw new Error('紫微斗數排盤失敗，請確認日期、時間與排盤性別。');
  }
}
