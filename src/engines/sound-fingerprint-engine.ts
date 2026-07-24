import type { ElementName, FateReportInput } from '../types/fate';
import { chartSeedSignature } from './decision-ritual-engine';
import { hashString, mulberry32 } from '../utils/seeded-random';

export interface SoundVoice {
  freq: number;
  gain: number;
  pan: number;
  type: OscillatorType;
  detune: number; // 種子決定的微幅失諧（cents），讓同一人每次一致、不同人不同。
  lfoHz: number; // 種子決定的音量呼吸速率，取代播放時的隨機值。
}

export interface SoundFingerprint {
  seed: string;
  rootNote: string;
  droneFreq: number;
  voices: SoundVoice[];
  bpm: number;
  scaleName: string;
  transpose: number; // 相對日主根音的整體移調半音數，是「不同人不同聲音」的主要來源。
}

// 各五行對應一個「調性根音」（Hz，近似平均律）與音色，日主五行決定基礎音色。
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

const SEMITONE = Math.pow(2, 1 / 12);
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** 把頻率換算成最接近的音名（含八度），用於顯示實際根音。 */
function frequencyToNote(freq: number): string {
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

/** 把命盤映射成一段確定性的環境音「聲音指紋」：同命盤永遠得到同一段聲音，不同命盤明顯不同。 */
export function buildSoundFingerprint(input: FateReportInput): SoundFingerprint {
  const seed = chartSeedSignature(input);
  const random = mulberry32(hashString(seed));

  const dayElement = input.bazi.dayMasterElement;
  const base = ELEMENT_ROOT[dayElement];

  // 依命盤種子做整體移調（-7..+7 半音）。日主五行只有五種，若僅靠它決定根音，
  // 每五個人就會有一對「根音、鼓音完全相同」而聽起來一樣——這正是使用者遇到的問題。
  // 加入種子移調後，可分辨的音高中心增為約 15×5 種，並讓和聲、失諧也隨命盤變化。
  const transpose = Math.floor(random() * 15) - 7;
  const rootFreq = base.freq * Math.pow(SEMITONE, transpose);

  // 依五行占比挑出要發聲的音，組成和弦；占比越高、音量越大、越靠近根音低八度。
  const voices: SoundVoice[] = ELEMENT_ORDER
    .map((element, index) => {
      const percent = input.fiveElements.percentages[element] ?? 0;
      return { element, index, percent };
    })
    .filter((entry) => entry.percent > 6)
    .map((entry) => {
      const ratio = PENTATONIC_RATIOS[entry.index];
      // 八度由占比與種子共同決定（確定性）：占比高→沉穩留在低八度，占比低→部分升八度添層次。
      const octave = entry.percent >= 22 ? 1 : random() < 0.5 ? 1 : 2;
      return {
        freq: Number((rootFreq * ratio * octave).toFixed(2)),
        gain: Number(Math.min(0.28, 0.05 + (entry.percent / 100) * 0.5).toFixed(3)),
        pan: Number((random() * 1.6 - 0.8).toFixed(2)),
        type: ELEMENT_ROOT[entry.element].type,
        detune: Number(((random() - 0.5) * 14).toFixed(1)),
        lfoHz: Number((0.06 + random() * 0.16).toFixed(3)),
      };
    });

  // 生命靈數決定節奏快慢（1–33 → 約 48–76 bpm）。
  const bpm = 48 + Math.round((input.numerology.lifePathNumber % 12) * 2.4);

  return {
    seed,
    rootNote: frequencyToNote(rootFreq),
    droneFreq: Number((rootFreq / 2).toFixed(2)),
    voices: voices.length
      ? voices
      : [{ freq: Number(rootFreq.toFixed(2)), gain: 0.2, pan: 0, type: base.type, detune: 0, lfoHz: 0.1 }],
    bpm,
    scaleName: '五聲音階（宮商角徵羽）',
    transpose,
  };
}
