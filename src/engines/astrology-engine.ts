import type { AspectResult, AstrologyResult, HouseSystemComparison, PlanetPosition, ProfileInput } from '../types/fate';
import { localDateTimeToUtc } from '../utils/timezone';
import { calculateAscendant, calculatePlanetPositions, zodiacPosition } from './astronomy-adapter';

interface SignData extends AstrologyResult { start: [number, number]; end: [number, number] }

const SIGNS: SignData[] = [
  { sunSign: '摩羯座', start: [12, 22], end: [1, 19], element: '土', modality: '開創', description: '重視結構、責任與可長期累積的成果。', strengths: ['自律', '務實', '耐力'], blindSpots: ['可能過度嚴格', '不易放鬆'] },
  { sunSign: '水瓶座', start: [1, 20], end: [2, 18], element: '風', modality: '固定', description: '重視獨立思考、觀念革新與群體價值。', strengths: ['創新', '客觀', '自主'], blindSpots: ['可能顯得疏離', '容易堅持理念'] },
  { sunSign: '雙魚座', start: [2, 19], end: [3, 20], element: '水', modality: '變動', description: '感受力細膩，擅長想像、共情與連結不同經驗。', strengths: ['同理', '想像力', '包容'], blindSpots: ['界線容易模糊', '可能逃避壓力'] },
  { sunSign: '牡羊座', start: [3, 21], end: [4, 19], element: '火', modality: '開創', description: '傾向直接行動，以勇氣與速度開啟新的局面。', strengths: ['果決', '熱情', '開創'], blindSpots: ['可能急躁', '需要練習傾聽'] },
  { sunSign: '金牛座', start: [4, 20], end: [5, 20], element: '土', modality: '固定', description: '重視穩定、感官品質與一步一腳印的累積。', strengths: ['可靠', '耐心', '品味'], blindSpots: ['不易改變', '可能留戀熟悉模式'] },
  { sunSign: '雙子座', start: [5, 21], end: [6, 20], element: '風', modality: '變動', description: '透過資訊、對話與多角度思考理解世界。', strengths: ['好奇', '靈活', '表達'], blindSpots: ['容易分散', '深度需要刻意培養'] },
  { sunSign: '巨蟹座', start: [6, 21], end: [7, 22], element: '水', modality: '開創', description: '重視情感安全、照顧關係與熟悉的歸屬感。', strengths: ['體貼', '記憶力', '保護力'], blindSpots: ['容易防衛', '情緒受環境影響'] },
  { sunSign: '獅子座', start: [7, 23], end: [8, 22], element: '火', modality: '固定', description: '渴望真誠表達，以創造力、熱度與自信感染他人。', strengths: ['慷慨', '創意', '領導'], blindSpots: ['在意肯定', '可能不易示弱'] },
  { sunSign: '處女座', start: [8, 23], end: [9, 22], element: '土', modality: '變動', description: '善於觀察細節、改善流程並把抽象想法落實。', strengths: ['分析', '細緻', '服務精神'], blindSpots: ['容易過度檢查', '對自己要求高'] },
  { sunSign: '天秤座', start: [9, 23], end: [10, 22], element: '風', modality: '開創', description: '在關係與觀點之間尋找平衡，重視公平與美感。', strengths: ['協調', '審美', '外交'], blindSpots: ['決策可能延後', '容易忽略自身需求'] },
  { sunSign: '天蠍座', start: [10, 23], end: [11, 21], element: '水', modality: '固定', description: '傾向深入核心，重視信任、真實與深層轉化。', strengths: ['專注', '洞察', '韌性'], blindSpots: ['不易放下戒心', '可能過度投入'] },
  { sunSign: '射手座', start: [11, 22], end: [12, 21], element: '火', modality: '變動', description: '追求視野、自由與意義，喜歡用探索擴大世界。', strengths: ['樂觀', '坦率', '遠見'], blindSpots: ['容易跳過細節', '承諾需具體化'] },
];

export function calculateSunSign(birthDate: string): AstrologyResult {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) throw new Error('出生日期格式無效，無法計算太陽星座。');
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dateValue = month * 100 + day;
  const sign = SIGNS.find(({ start, end }) => {
    const startValue = start[0] * 100 + start[1];
    const endValue = end[0] * 100 + end[1];
    return startValue <= endValue ? dateValue >= startValue && dateValue <= endValue : dateValue >= startValue || dateValue <= endValue;
  });
  if (!sign) throw new Error('出生日期無法對應太陽星座。');
  return {
    sunSign: sign.sunSign,
    element: sign.element,
    modality: sign.modality,
    description: sign.description,
    strengths: sign.strengths,
    blindSpots: sign.blindSpots,
    calculationLevel: 'sun-only',
  };
}

const aspectDefinitions = [
  { type: '合相', angle: 0, orb: 7 },
  { type: '六合', angle: 60, orb: 4 },
  { type: '四分相', angle: 90, orb: 6 },
  { type: '三分相', angle: 120, orb: 6 },
  { type: '對分相', angle: 180, orb: 7 },
] as const;

export function calculateMajorAspects(planets: PlanetPosition[]): AspectResult[] {
  const aspects: AspectResult[] = [];
  for (let firstIndex = 0; firstIndex < planets.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < planets.length; secondIndex += 1) {
      const first = planets[firstIndex];
      const second = planets[secondIndex];
      const separation = Math.abs(((first.longitude - second.longitude + 540) % 360) - 180);
      const match = aspectDefinitions
        .map((definition) => ({ ...definition, actualOrb: Math.abs(separation - definition.angle) }))
        .filter((definition) => definition.actualOrb <= definition.orb)
        .sort((left, right) => left.actualOrb - right.actualOrb)[0];
      if (match) {
        aspects.push({
          first: first.name,
          second: second.name,
          type: match.type,
          orb: Number(match.actualOrb.toFixed(2)),
          angle: Number(separation.toFixed(2)),
        });
      }
    }
  }
  return aspects.sort((left, right) => left.orb - right.orb);
}

function buildHouseSystemComparisons(ascendant: number, planets: PlanetPosition[]): HouseSystemComparison[] {
  const wholeSignStart = Math.floor(ascendant / 30) * 30;
  return [
    { system: 'equal' as const, label: '等宮制', start: ascendant },
    { system: 'whole-sign' as const, label: '整宮制', start: wholeSignStart },
  ].map(({ system, label, start }) => ({
    system,
    label,
    houses: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, cusp: (start + index * 30) % 360 })),
    planetHouses: Object.fromEntries(planets.map((planet) => [planet.name, Math.floor(((planet.longitude - start + 360) % 360) / 30) + 1])),
  }));
}

export function calculateAstrology(input: Pick<ProfileInput, 'birthDate' | 'birthTime' | 'timezone'> & Partial<Pick<ProfileInput, 'latitude' | 'longitude'>>): AstrologyResult {
  const utcDate = localDateTimeToUtc(input.birthDate, input.birthTime, input.timezone);
  const planets = calculatePlanetPositions(utcDate);
  const sun = planets.find((planet) => planet.name === '太陽');
  const moon = planets.find((planet) => planet.name === '月亮');
  if (!sun || !moon) throw new Error('天文位置計算缺少太陽或月亮資料。');
  const sign = SIGNS.find((item) => item.sunSign === sun.sign);
  if (!sign) throw new Error('太陽黃道位置無法對應星座。');

  const hasCoordinates = typeof input.latitude === 'number' && typeof input.longitude === 'number';
  const ascendantLongitude = hasCoordinates ? calculateAscendant(utcDate, input.latitude as number, input.longitude as number) : undefined;
  const risingSign = ascendantLongitude === undefined ? undefined : zodiacPosition(ascendantLongitude).sign;
  const houseComparisons = ascendantLongitude === undefined ? undefined : buildHouseSystemComparisons(ascendantLongitude, planets);
  const houses = houseComparisons?.find((item) => item.system === 'equal')?.houses;
  const equalPlanetHouses = houseComparisons?.find((item) => item.system === 'equal')?.planetHouses;
  const planetsWithHouses = houses ? planets.map((planet) => ({
    ...planet,
    house: equalPlanetHouses?.[planet.name],
  })) : planets;

  return {
    sunSign: sun.sign,
    moonSign: moon.sign,
    risingSign,
    element: sign.element,
    modality: sign.modality,
    description: sign.description,
    strengths: sign.strengths,
    blindSpots: sign.blindSpots,
    planets: planetsWithHouses,
    houses,
    houseComparisons,
    houseSystem: houses ? 'equal' : undefined,
    aspects: calculateMajorAspects(planetsWithHouses),
    calculatedAtUtc: utcDate.toISOString(),
    calculationLevel: 'planetary',
    source: {
      sourceName: 'Astronomy Engine 2.1.19',
      sourceUrl: 'https://github.com/cosinekitty/astronomy',
      license: 'MIT',
      notes: '地心、真黃道（日期當下）位置；提供等宮制與整宮制落宮比較，不包含宮主星詮釋。',
    },
  };
}
