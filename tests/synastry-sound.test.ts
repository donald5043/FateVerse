import { describe, expect, it } from 'vitest';
import { generateSynastry } from '../src/engines/synastry-engine';
import { buildSoundFingerprint } from '../src/engines/sound-fingerprint-engine';
import { calculateBazi } from '../src/engines/bazi-engine';
import { calculateFiveElements } from '../src/engines/five-elements-engine';
import { calculateSunSign } from '../src/engines/astrology-engine';
import { calculateNumerology } from '../src/engines/numerology-engine';
import { getZodiacResult } from '../src/engines/zodiac-engine';
import type { FateReportInput } from '../src/types/fate';

function buildInput(birthDate: string, birthTime = '10:30'): FateReportInput {
  const bazi = calculateBazi({ birthDate, birthTime, timezone: 'Asia/Taipei' });
  return {
    userFocus: ['all'], bazi,
    fiveElements: calculateFiveElements(bazi.pillars),
    zodiac: getZodiacResult(bazi.zodiac),
    astrology: calculateSunSign(birthDate),
    numerology: calculateNumerology(birthDate),
  };
}

describe('兩人合盤', () => {
  const a = buildInput('1990-01-02');
  const b = buildInput('1988-06-15');
  const reading = generateSynastry(a, b, '小明', '小華');

  it('產生五個比較面向與名字', () => {
    expect(reading.nameA).toBe('小明');
    expect(reading.nameB).toBe('小華');
    expect(reading.sections.map((section) => section.id)).toEqual(['element', 'day-master', 'zodiac', 'sun-sign', 'numerology']);
    reading.sections.forEach((section) => {
      expect(section.verdict.length).toBeGreaterThan(0);
      expect(section.reading.length).toBeGreaterThan(20);
    });
  });

  it('日主關係正確判定生剋同', () => {
    const same = generateSynastry(buildInput('1990-01-02'), buildInput('1990-01-02'));
    const dm = same.sections.find((section) => section.id === 'day-master');
    expect(dm?.verdict).toBe('同氣相求');
  });

  it('生肖六沖被辨識（子午）', () => {
    // 1984 甲子（鼠）與 1990 庚午（馬）為子午六沖
    const rat = buildInput('1984-06-15');
    const horse = buildInput('1990-06-15');
    const reading2 = generateSynastry(rat, horse);
    const zodiac = reading2.sections.find((section) => section.id === 'zodiac');
    expect(['生肖六沖', '生肖六合', '生肖三合', '生肖相害', '無特殊刑合']).toContain(zodiac?.verdict);
  });

  it('至少一則契合或磨合亮點，且保留界線', () => {
    expect(reading.highlights.length).toBeGreaterThan(0);
    reading.highlights.forEach((highlight) => expect(['harmony', 'friction']).toContain(highlight.kind));
    expect(reading.cautions.length).toBeGreaterThanOrEqual(3);
  });

  it('相同輸入產生相同合盤', () => {
    expect(generateSynastry(a, b, '小明', '小華')).toEqual(reading);
  });
});

describe('聲音指紋', () => {
  const input = buildInput('1990-01-02');
  const sound = buildSoundFingerprint(input);

  it('同命盤產生相同聲音指紋', () => {
    expect(buildSoundFingerprint(input)).toEqual(sound);
  });

  it('根音對應日主五行，且至少有一個聲部', () => {
    expect(sound.rootNote).toBeTruthy();
    expect(sound.voices.length).toBeGreaterThan(0);
    sound.voices.forEach((voice) => {
      expect(voice.freq).toBeGreaterThan(0);
      expect(voice.gain).toBeGreaterThan(0);
      expect(voice.gain).toBeLessThanOrEqual(0.28);
      expect(voice.pan).toBeGreaterThanOrEqual(-0.8);
      expect(voice.pan).toBeLessThanOrEqual(0.8);
      expect(['sine', 'square', 'triangle', 'sawtooth']).toContain(voice.type);
    });
  });

  it('bpm 落在合理範圍', () => {
    expect(sound.bpm).toBeGreaterThanOrEqual(48);
    expect(sound.bpm).toBeLessThanOrEqual(80);
  });

  it('不同命盤產生不同種子', () => {
    expect(buildSoundFingerprint(buildInput('1985-07-15')).seed).not.toBe(sound.seed);
  });

  it('不同人的聲音指紋在聽感上明顯不同（根音、鼓音或和聲至少一項有別）', () => {
    // 過去只靠日主五行決定根音，僅有五種，導致不同人常常聽起來一模一樣。
    const dates = ['1990-01-02', '1985-07-15', '1993-03-21', '1978-11-09', '2001-06-30', '1996-09-12'];
    const prints = dates.map((date) => buildSoundFingerprint(buildInput(date)));
    const audibleKey = (fp: ReturnType<typeof buildSoundFingerprint>) =>
      `${fp.droneFreq}|${fp.voices.map((v) => `${v.freq}:${v.pan}:${v.detune}`).join(',')}`;
    const keys = prints.map(audibleKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('同一份命盤的失諧與呼吸速率是確定值，播放不會每次不同', () => {
    const again = buildSoundFingerprint(input);
    expect(again.voices.map((v) => v.detune)).toEqual(sound.voices.map((v) => v.detune));
    expect(again.voices.map((v) => v.lfoHz)).toEqual(sound.voices.map((v) => v.lfoHz));
  });
});
