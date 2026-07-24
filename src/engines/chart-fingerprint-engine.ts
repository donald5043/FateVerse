import type { ElementName, FateReportInput } from '../types/fate';
import { chartSeedSignature } from './decision-ritual-engine';
import { hashString, mulberry32 } from '../utils/seeded-random';

export const FINGERPRINT_SIZE = 320;
const CENTER = FINGERPRINT_SIZE / 2;

const ELEMENT_ORDER: ElementName[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const ELEMENT_COLORS: Record<ElementName, string> = {
  wood: '#6ee7b7', fire: '#fb7185', earth: '#d8b875', metal: '#cbd5e1', water: '#67e8f9',
};

export interface FingerprintRing {
  radius: number;
  color: string;
  width: number;
  dash: boolean;
}

export interface FingerprintSpoke {
  x1: number; y1: number; x2: number; y2: number;
  color: string;
  width: number;
}

export interface FingerprintNode {
  x: number; y: number;
  size: number;
  color: string;
}

export interface Point { x: number; y: number; }

export interface ChartFingerprint {
  seed: string;
  binaryCode: string;
  hexagramIndex: number;
  palette: string[];
  rings: FingerprintRing[];
  spokes: FingerprintSpoke[];
  nodes: FingerprintNode[];
  corePolygon: Point[];
  coreColor: string;
  size: number;
}

function polar(angleDeg: number, radius: number): Point {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + Math.cos(angle) * radius, y: CENTER + Math.sin(angle) * radius };
}

/**
 * 把命盤編碼成一段二進位「卦碼」：連結易經—二進位的資訊科學淵源（Leibniz 1703）。
 * 6 個位元對應六爻：五行是否高於平均（5 位）＋ 日主陰陽（1 位）。
 */
function encodeBinary(input: FateReportInput): { binaryCode: string; hexagramIndex: number } {
  const average = 100 / 5;
  const elementBits = ELEMENT_ORDER.map((element) => ((input.fiveElements.percentages[element] ?? 0) >= average ? '1' : '0'));
  // 天干奇數位為陽（甲丙戊庚壬），這裡以日主是否為「陽干」取 1 位。
  const yangStems = new Set(['甲', '丙', '戊', '庚', '壬']);
  const yangBit = yangStems.has(input.bazi.dayMaster) ? '1' : '0';
  const binaryCode = [...elementBits, yangBit].join('');
  return { binaryCode, hexagramIndex: parseInt(binaryCode, 2) };
}

/** 從命盤產生一張確定性、獨一無二的「命之圖騰」繪製參數；同命盤永遠得到同一張圖。 */
export function buildChartFingerprint(input: FateReportInput): ChartFingerprint {
  const seed = chartSeedSignature(input);
  const random = mulberry32(hashString(seed));
  const { binaryCode, hexagramIndex } = encodeBinary(input);

  const dayColor = ELEMENT_COLORS[input.bazi.dayMasterElement];
  const strongColor = ELEMENT_COLORS[input.fiveElements.strongest[0]];
  const weakColor = ELEMENT_COLORS[input.fiveElements.weakest[0]];
  const palette = [dayColor, strongColor, weakColor];

  // 外圈同心環：數量與虛實由種子決定。
  const ringCount = 3 + Math.floor(random() * 3);
  const rings: FingerprintRing[] = Array.from({ length: ringCount }, (_, index) => ({
    radius: 60 + index * (90 / ringCount),
    color: palette[index % palette.length],
    width: 0.6 + random() * 1.4,
    dash: random() < 0.5,
  }));

  // 輻條：以生肖地支（12 宮）為基準，數量再由種子微調。
  const spokeCount = 12;
  const spokeJitter = random() * 15;
  const spokes: FingerprintSpoke[] = Array.from({ length: spokeCount }, (_, index) => {
    const angle = (360 / spokeCount) * index + spokeJitter;
    const inner = polar(angle, 44);
    const outer = polar(angle, 150);
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, color: palette[index % palette.length], width: 0.5 + random() * 0.9 };
  });

  // 節點：若有完整星盤，依十星黃道經度落點；否則依四柱平均分布。
  const planets = input.astrology.planets ?? [];
  const nodeSource = planets.length
    ? planets.map((planet) => planet.longitude)
    : input.bazi.pillars.map((_, index) => (360 / input.bazi.pillars.length) * index);
  const nodes: FingerprintNode[] = nodeSource.map((longitude, index) => {
    const radius = 70 + random() * 70;
    const point = polar(longitude, radius);
    return { x: point.x, y: point.y, size: 2.5 + random() * 3.5, color: palette[index % palette.length] };
  });

  // 核心五角星：每個頂點半徑正比於該五行占比，畫出獨一無二的「五行星形」。
  const maxPercent = Math.max(...ELEMENT_ORDER.map((element) => input.fiveElements.percentages[element] ?? 0)) || 1;
  const corePolygon: Point[] = ELEMENT_ORDER.map((element, index) => {
    const ratio = (input.fiveElements.percentages[element] ?? 0) / maxPercent;
    return polar((360 / 5) * index, 16 + ratio * 30);
  });

  return {
    seed,
    binaryCode,
    hexagramIndex,
    palette,
    rings,
    spokes,
    nodes,
    corePolygon,
    coreColor: dayColor,
    size: FINGERPRINT_SIZE,
  };
}
