import type { ElementName, FateReportInput } from '../types/fate';
import { chartSeedSignature } from './decision-ritual-engine';
import { hashString, mulberry32 } from '../utils/seeded-random';

export interface SoundVoice {
  freq: number;
  gain: number;
  pan: number;
  type: OscillatorType;
}

export interface SoundFingerprint {
  seed: string;
  rootNote: string;
  droneFreq: number;
  voices: SoundVoice[];
  bpm: number;
  scaleName: string;
}

// 各五行對應一個「調性根音」（Hz，近似平均律）與音色，五行分布決定和弦組成。
const ELEMENT_ROOT: Record<ElementName, { freq: number; note: string; type: OscillatorType }> = {
  wood: { freq: 196.0, note: 'G3', type: 'triangle' }, // 木：溫潤三角波
  fire: { freq: 261.63, note: 'C4', type: 'sawtooth' }, // 火：明亮鋸齒波
  earth: { freq: 146.83, note: 'D3', type: 'sine' }, // 土：厚實正弦波
  metal: { freq: 329.63, note: 'E4', type: 'square' }, // 金：清脆方波
  water: { freq: 174.61, note: 'F3', type: 'sine' }, // 水：柔和正弦波
};

// 五聲音階（宮商角徵羽）相對根音的頻率比，呼應五行。
const PENTATONIC_RATIOS = [1, 9 / 8, 81 / 64, 3 / 2, 27 / 16];
const ELEMENT_ORDER: ElementName[] = ['wood', 'fire', 'earth', 'metal', 'water'];

/** 把命盤映射成一段確定性的環境音「聲音指紋」：同命盤永遠得到同一段聲音。 */
export function buildSoundFingerprint(input: FateReportInput): SoundFingerprint {
  const seed = chartSeedSignature(input);
  const random = mulberry32(hashString(seed));

  const dayElement = input.bazi.dayMasterElement;
  const root = ELEMENT_ROOT[dayElement];

  // 依五行占比挑出音量最高的幾個音，組成和弦；占比越高、音量越大。
  const voices: SoundVoice[] = ELEMENT_ORDER
    .map((element, index) => {
      const percent = input.fiveElements.percentages[element] ?? 0;
      return { element, index, percent };
    })
    .filter((entry) => entry.percent > 6)
    .map((entry) => {
      const ratio = PENTATONIC_RATIOS[entry.index];
      const octave = random() < 0.4 ? 2 : 1; // 部分音升八度增添層次
      return {
        freq: Number((root.freq * ratio * octave).toFixed(2)),
        gain: Number(Math.min(0.28, 0.05 + (entry.percent / 100) * 0.5).toFixed(3)),
        pan: Number((random() * 1.6 - 0.8).toFixed(2)),
        type: ELEMENT_ROOT[entry.element].type,
      };
    });

  // 生命靈數決定節奏快慢（1–33 → 約 48–76 bpm）。
  const bpm = 48 + Math.round((input.numerology.lifePathNumber % 12) * 2.4);

  return {
    seed,
    rootNote: root.note,
    droneFreq: Number((root.freq / 2).toFixed(2)),
    voices: voices.length ? voices : [{ freq: root.freq, gain: 0.2, pan: 0, type: root.type }],
    bpm,
    scaleName: '五聲音階（宮商角徵羽）',
  };
}
