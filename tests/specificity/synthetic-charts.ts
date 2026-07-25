import { hashString, mulberry32 } from '../../src/utils/seeded-random';
import type { ProfileInput } from '../../src/types/fate';

/** 固定種子，確保每次量測的 500 組命盤完全相同、結果可重現。 */
export const CHART_SEED = 'fateverse-specificity-baseline-v1';
export const CHART_COUNT = 500;

// 涵蓋多樣性：出生年份分散、四季均勻、時辰均勻、性別均勻，並包含閏月與晚子時邊界。
const TIMEZONES = ['Asia/Taipei', 'Asia/Tokyo', 'Asia/Hong_Kong', 'America/Los_Angeles', 'Europe/London'];
const CITIES: { city: string; longitude: number; latitude: number }[] = [
  { city: '臺北市', longitude: 121.5654, latitude: 25.033 },
  { city: '高雄市', longitude: 120.3014, latitude: 22.6273 },
  { city: '東京', longitude: 139.6917, latitude: 35.6895 },
  { city: '洛杉磯', longitude: -118.2437, latitude: 34.0522 },
  { city: '倫敦', longitude: -0.1276, latitude: 51.5072 },
];
const NAMES = ['林安晨', '陳柏宇', '王雅琳', '張哲瑋', '李思妍', '黃冠廷', '吳佩珊', '劉家豪'];
const FOCUS_POOL = ['personality', 'career', 'love', 'finance', 'family', 'relationships', 'direction'];

// 閏月不需硬編年份表：樣本橫跨 1920–2019 共 100 年、每年每月皆有取樣，
// 農曆閏月與節氣邊界會自然落入其中；晚子時則由下方的 hour 輪替明確保證。

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export interface SyntheticChart {
  index: number;
  profile: ProfileInput;
  tags: string[];
}

/**
 * 產生 CHART_COUNT 組具多樣性的合成命盤輸入。
 * 年份、月份、時辰以「等距 + 種子擾動」分配，確保四季與十二時辰皆均勻覆蓋，
 * 而不是全靠亂數導致分布不均。
 */
export function buildSyntheticCharts(count = CHART_COUNT): SyntheticChart[] {
  const random = mulberry32(hashString(CHART_SEED));
  const charts: SyntheticChart[] = [];

  for (let index = 0; index < count; index += 1) {
    const tags: string[] = [];

    // 年份：1920–2019 均勻分散（跨 100 年，涵蓋不同大運與流年結構）。
    const year = 1920 + Math.floor((index / count) * 100);

    // 月份：等距輪替確保四季均勻。
    const month = (index % 12) + 1;
    if (month <= 3) tags.push('spring');
    else if (month <= 6) tags.push('summer');
    else if (month <= 9) tags.push('autumn');
    else tags.push('winter');

    // 日期：在該月合法範圍內以種子取值，並刻意讓部分樣本落在月初與月末邊界。
    const maxDay = daysInMonth(year, month);
    const dayPick = index % 7 === 0 ? 1 : index % 11 === 0 ? maxDay : 1 + Math.floor(random() * maxDay);
    const day = Math.min(maxDay, Math.max(1, dayPick));
    if (day === 1 || day === maxDay) tags.push('month-boundary');

    // 時辰：等距輪替十二時辰；每 12 組保證一次晚子時（23:xx）邊界。
    const hour = index % 24;
    if (hour === 23) tags.push('late-zi');
    if (hour === 0) tags.push('early-zi');
    const minute = index % 3 === 0 ? 30 : index % 3 === 1 ? 0 : 59;

    const gender: ProfileInput['gender'] = index % 3 === 2 ? 'other' : index % 2 === 0 ? 'female' : 'male';
    const place = CITIES[index % CITIES.length];
    const timezone = TIMEZONES[index % TIMEZONES.length];

    // 焦點主題輪替，讓 focusAnalysis 的各分支都被覆蓋；部分樣本用 'all'。
    const focus = index % 4 === 0 ? ['all'] : [FOCUS_POOL[index % FOCUS_POOL.length]];

    // 少量樣本不填姓名與經緯度，覆蓋「缺資料」路徑（姓名分析與上升宮位會缺席）。
    const withoutName = index % 13 === 0;
    const withoutCoords = index % 17 === 0;
    if (withoutName) tags.push('no-name');
    if (withoutCoords) tags.push('no-coords');

    charts.push({
      index,
      tags,
      profile: {
        name: withoutName ? '' : NAMES[index % NAMES.length],
        birthDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        birthTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        gender,
        region: '臺灣',
        timezone,
        ...(withoutCoords ? {} : { city: place.city, longitude: place.longitude, latitude: place.latitude }),
        focus,
      },
    });
  }

  return charts;
}
