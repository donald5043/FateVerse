import { astro } from 'iztro';
import type {
  ProfileInput, ZiweiCalculationSettings, ZiweiHoroscopeLayer, ZiweiMutagen, ZiweiResult, ZiweiStar, ZiweiSurroundedPalace,
} from '../types/fate';

const MUTAGEN_TYPES: ZiweiMutagen['type'][] = ['祿', '權', '科', '忌'];

export const DEFAULT_ZIWEI_SETTINGS: ZiweiCalculationSettings = {
  algorithm: 'default',
  yearDivide: 'normal',
  horoscopeDivide: 'normal',
  ageDivide: 'normal',
  dayDivide: 'current',
};

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

/**
 * @param natalPalaceNames 本命十二宮的名稱，依宮位索引排列。
 *
 * `item.palaceNames` 是「以這一層的命宮為起點重新排過」的宮名，因此
 * `palaceNames[index]` 恆等於「命宮」，講不出任何資訊。有意義的是這一層的
 * 命宮落在本命的哪一宮，所以改查本命宮名。
 */
function mapHoroscopeLayer(item: {
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  index: number;
  palaceNames: readonly string[];
  mutagen: readonly string[];
}, natalPalaceNames: readonly string[]): ZiweiHoroscopeLayer {
  return {
    name: item.name,
    heavenlyStem: item.heavenlyStem,
    earthlyBranch: item.earthlyBranch,
    palaceName: natalPalaceNames[item.index] ?? '未標示',
    mutagens: MUTAGEN_TYPES.flatMap((type, index) => item.mutagen[index] ? [{ type, star: item.mutagen[index] }] : []),
  };
}


/**
 * 已排好的命盤快取。
 *
 * `astro.bySolar` 要 24ms（實測），而它只和出生資料與流派設定有關，
 * 跟「要看哪一天的運限」無關。回顧日誌為了 36 個年份呼叫 36 次，
 * 等於重排了 36 次同一張盤；首頁的今日綜合每次重繪也重排一次。
 *
 * 這裡只快取盤本身，不快取 calculateZiwei 的回傳值——回傳值會流進 React state
 * 並被渲染，共用同一個物件參考的風險不值得為了那幾毫秒去冒。
 */
type ZiweiChartHandle = ReturnType<typeof astro.bySolar>;

const CHART_CACHE_LIMIT = 8;
const chartCache = new Map<string, ZiweiChartHandle>();

function chartCacheKey(
  input: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'>,
  settings: ZiweiCalculationSettings,
): string {
  return [
    input.birthDate, input.birthTime, input.gender,
    settings.algorithm, settings.yearDivide, settings.horoscopeDivide,
    settings.ageDivide, settings.dayDivide,
  ].join('|');
}

function buildChart(
  input: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'>,
  settings: ZiweiCalculationSettings,
): ZiweiChartHandle {
  const key = chartCacheKey(input, settings);
  const cached = chartCache.get(key);
  if (cached) return cached;

  const chart = astro.bySolar(input.birthDate, birthHourToZiweiIndex(input.birthTime), input.gender as 'male' | 'female', true, 'zh-TW');

  // 先進先出。一次通常只看一個人，合盤兩個，8 筆綽綽有餘。
  if (chartCache.size >= CHART_CACHE_LIMIT) {
    const oldest = chartCache.keys().next().value;
    if (oldest !== undefined) chartCache.delete(oldest);
  }
  chartCache.set(key, chart);
  return chart;
}

/** 僅供測試：清掉快取，讓計時與命中測試從乾淨狀態開始。 */
export function clearZiweiChartCache(): void {
  chartCache.clear();
}

export function calculateZiwei(
  input: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'>,
  targetDate: string | Date = new Date(),
  settings: ZiweiCalculationSettings = DEFAULT_ZIWEI_SETTINGS,
): ZiweiResult | undefined {
  if (input.gender === 'other') return undefined;
  try {
    // config 是 iztro 的全域狀態，而 horoscopeDivide／ageDivide 會影響運限計算。
    // 快取命中時如果沒重設，會沿用上一次別人設的流派——所以每次都要設，
    // 不能只在建盤時設。
    astro.config(settings);
    const chart = buildChart(input, settings);
    const horoscope = chart.horoscope(targetDate);
    const natalPalaceNames = chart.palaces.map((palace) => palace.name);
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
        decadal: mapHoroscopeLayer(horoscope.decadal, natalPalaceNames),
        yearly: mapHoroscopeLayer(horoscope.yearly, natalPalaceNames),
        monthly: mapHoroscopeLayer(horoscope.monthly, natalPalaceNames),
        daily: mapHoroscopeLayer(horoscope.daily, natalPalaceNames),
      },
      settings: { ...settings },
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
      calculationNote: `採 iztro 2.5.8 ${settings.algorithm === 'zhongzhou' ? '中州派' : '通行'}安星法、繁體中文輸出；三方四正呈現命宮、遷移、財帛與官祿四個結構位置。不同流派的四化、亮度、晚子時與閏月規則可能不同，本版不自動斷吉凶。`,
      source: { sourceName: 'iztro', sourceUrl: 'https://github.com/SylarLong/iztro', license: 'MIT' },
    };
  } catch {
    throw new Error('紫微斗數排盤失敗，請確認日期、時間與排盤性別。');
  }
}
