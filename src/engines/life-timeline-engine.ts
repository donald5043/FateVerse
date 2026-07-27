import { Solar } from 'lunar-javascript';
import { tenGodCategory, type TenGodCategory } from './bazi-analysis-engine';
import { stemToElement } from './five-elements-engine';
import { calculateZiwei } from './ziwei-engine';
import { ELEMENT_LABELS } from '../utils/constants';
import type {
  BaziLuckCycle, BaziResult, ElementName, ProfileInput, ZiweiMutagen,
} from '../types/fate';

/**
 * 命運回顧日誌：把過去的每一年，並排放在傳統命理當年給的「框」旁邊。
 *
 * 這頁的用途是回顧，不是預測。它只處理已經過完的年份——你已經知道那年
 * 發生了什麼，命理只是提供一個回頭看的角度。
 *
 * 三件刻意不做的事：
 * 1. 不宣稱因果。命盤不會「造成」任何事，最多只是一種事後的敘事框架。
 * 2. 健康事件不做任何醫學歸因。生病的原因是醫學問題，不是命理問題。
 * 3. 不預測未來。今年還沒過完，未來的年份一律不進這份日誌。
 */

/** 一年份的命理框架。 */
export interface TimelineYear {
  year: number;
  /** 虛歲。傳統命理用虛歲對照大運，跟著慣例走。 */
  nominalAge: number;
  /** 流年干支，例如「甲子」。 */
  yearGanZhi: string;
  yearStemElement: ElementName;
  /** 流年天干對本命日主的十神。 */
  tenGod: TenGodCategory;
  /** 那一年所在的大運，出生後尚未起運時為 undefined。 */
  luckCycle?: BaziLuckCycle;
  /** 紫微流年命宮。命盤未排出（性別未指定）時為 undefined。 */
  yearlyPalace?: string;
  /** 紫微流年四化。 */
  yearlyMutagens: ZiweiMutagen[];
  /** 規則式的一句話，描述傳統命理對這一年的框。 */
  framing: string;
}

/** 使用者自己寫下的回顧。只存在他自己的裝置上。 */
export interface TimelineNote {
  year: number;
  /** 那一年對你來說發生了什麼。使用者自由書寫。 */
  text: string;
  /** 使用者自評那一年的調性。刻意不是分數，也不參與任何計算。 */
  tone?: 'good' | 'mixed' | 'hard';
}

export const TONE_LABELS: Record<NonNullable<TimelineNote['tone']>, string> = {
  good: '順的一年',
  mixed: '有好有壞',
  hard: '難的一年',
};

const TEN_GOD_FRAMING: Record<TenGodCategory, string> = {
  比劫: '傳統上把這種年份看成「同輩的年」——人際、合作與競爭的比重會被放大。',
  印星: '傳統上把這種年份看成「學習與依靠的年」——進修、長輩、後盾這類題目容易浮上來。',
  食傷: '傳統上把這種年份看成「表達與產出的年」——想做的事、想講的話比較容易往外跑。',
  財星: '傳統上把這種年份看成「務實的年」——錢、資源與具體成果會被放到台面上。',
  官殺: '傳統上把這種年份看成「責任與壓力的年」——規則、職位、被要求的事情變多。',
};

/** 用當年年中取年柱，避開立春前後的歸年爭議。 */
function yearPillarOf(year: number): string {
  return Solar.fromYmdHms(year, 6, 1, 12, 0, 0).getLunar().getEightChar().getYear();
}

function findLuckCycle(cycles: BaziLuckCycle[] | undefined, year: number): BaziLuckCycle | undefined {
  return cycles?.find((cycle) => year >= cycle.startYear && year <= cycle.endYear);
}

/**
 * 組出這一年的框。刻意寫成「傳統上會這樣看」而不是「這一年你會如何」——
 * 主詞是那套說法，不是使用者的人生。
 */
function buildFraming(
  tenGod: TenGodCategory,
  stemElement: ElementName,
  luckCycle: BaziLuckCycle | undefined,
  yearlyPalace: string | undefined,
  mutagens: ZiweiMutagen[],
): string {
  const parts = [`流年天干屬${ELEMENT_LABELS[stemElement]}，對你的日主而言是${tenGod}。${TEN_GOD_FRAMING[tenGod]}`];
  if (luckCycle) {
    parts.push(`八字這邊，那時候你走的是${luckCycle.ganZhi}大運（${luckCycle.startYear}–${luckCycle.endYear}）。`);
  }
  if (yearlyPalace) {
    const mutagenText = mutagens.length
      ? `，四化落在${mutagens.map((item) => `${item.star}化${item.type}`).join('、')}`
      : '';
    parts.push(`紫微那邊，流年命宮在${yearlyPalace}${mutagenText}。`);
  }
  return parts.join('');
}

/**
 * 產生回顧日誌的年份清單。只回傳已經過完的年份，最新的排前面。
 *
 * @param bazi    本命八字
 * @param profile 出生資料（紫微流年需要重排每一年的盤）
 * @param today   以哪一天為「現在」。今年尚未結束，因此不列入。
 * @param maxYears 最多回顧幾年
 */
export function buildLifeTimeline(
  bazi: BaziResult,
  profile: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'>,
  today = new Date(),
  maxYears = 40,
): TimelineYear[] {
  const birthYear = Number(profile.birthDate.slice(0, 4));
  if (!Number.isFinite(birthYear)) return [];

  // 今年還沒過完，回顧日誌不碰它——這頁的前提是「你已經知道結果」。
  const lastCompleteYear = today.getFullYear() - 1;
  const firstYear = Math.max(birthYear, lastCompleteYear - maxYears + 1);
  if (lastCompleteYear < firstYear) return [];

  const years: TimelineYear[] = [];
  for (let year = lastCompleteYear; year >= firstYear; year -= 1) {
    const yearGanZhi = yearPillarOf(year);
    const stemElement = stemToElement(yearGanZhi[0]);
    const tenGod = tenGodCategory(bazi.dayMasterElement, stemElement);
    const luckCycle = findLuckCycle(bazi.luckCycles, year);

    // 紫微流年要用當年的日期重排一次盤。性別未指定時整段會是 undefined。
    const ziwei = calculateZiwei(profile, `${year}-06-01`);
    const yearly = ziwei?.currentHoroscope.yearly;

    years.push({
      year,
      nominalAge: year - birthYear + 1,
      yearGanZhi,
      yearStemElement: stemElement,
      tenGod,
      luckCycle,
      yearlyPalace: yearly?.palaceName,
      yearlyMutagens: yearly?.mutagens ?? [],
      framing: buildFraming(tenGod, stemElement, luckCycle, yearly?.palaceName, yearly?.mutagens ?? []),
    });
  }
  return years;
}

export interface TimelineSummary {
  /** 有寫下回顧的年份數。 */
  noted: number;
  /** 樣本太少時不做任何歸納。 */
  hasEnough: boolean;
  /** 規則式的觀察句。永遠是複數句：一句歸納 + 一句提醒它不是因果。 */
  lines: string[];
}

/** 少於這個筆數就不歸納——三兩筆看出來的「規律」通常是錯覺。 */
export const MIN_NOTES_FOR_SUMMARY = 5;

/**
 * 規則式摘要：把使用者自評的調性，和那些年的十神分佈並排。
 *
 * 這裡最容易出錯的是語氣。摘要只能說「你標成難的那幾年，剛好都是 X」，
 * 不能說「因為 X，所以那幾年難」——後者是命盤造成人生，那不成立。
 */
export function summarizeTimeline(years: TimelineYear[], notes: TimelineNote[]): TimelineSummary {
  const withTone = notes.filter((note) => note.tone);
  if (withTone.length < MIN_NOTES_FOR_SUMMARY) {
    return {
      noted: withTone.length,
      hasEnough: false,
      lines: [`目前標了 ${withTone.length} 年。累積到 ${MIN_NOTES_FOR_SUMMARY} 年以上，這裡才會試著幫你歸納。`],
    };
  }

  const byYear = new Map(years.map((entry) => [entry.year, entry]));
  const tally = new Map<string, Map<TenGodCategory, number>>();
  withTone.forEach((note) => {
    const entry = byYear.get(note.year);
    if (!entry || !note.tone) return;
    const bucket = tally.get(note.tone) ?? new Map<TenGodCategory, number>();
    bucket.set(entry.tenGod, (bucket.get(entry.tenGod) ?? 0) + 1);
    tally.set(note.tone, bucket);
  });

  const lines: string[] = [];
  (['hard', 'good'] as const).forEach((tone) => {
    const bucket = tally.get(tone);
    if (!bucket || bucket.size === 0) return;
    const total = [...bucket.values()].reduce((sum, count) => sum + count, 0);
    const [topCategory, topCount] = [...bucket.entries()].sort((left, right) => right[1] - left[1])[0];
    // 沒有集中就不要硬講出一個規律。
    if (topCount < 2 || topCount * 2 <= total) return;
    lines.push(`你標成「${TONE_LABELS[tone]}」的 ${total} 年裡，有 ${topCount} 年的流年十神是${topCategory}。`);
  });

  if (lines.length === 0) {
    lines.push('你標記的年份分散在不同的流年十神上，沒有集中到某一類。這也是一種結果——那幾年的差別，可能來自命盤以外的地方。');
  }
  lines.push('這只是把兩份紀錄疊在一起看到的巧合，不是因果。日子過得順或難，原因在當年的處境、選擇與身邊的人，不在命盤。');
  return { noted: withTone.length, hasEnough: true, lines };
}
