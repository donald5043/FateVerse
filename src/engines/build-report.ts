import { generateFallbackReport } from '../ai/fallback-report';
import type { AiFateReport, FateReportInput, ProfileInput } from '../types/fate';
import { calculateAstrology } from './astrology-engine';
import { calculateBazi } from './bazi-engine';
import { calculateFiveElements } from './five-elements-engine';
import { analyzeName } from './name-engine';
import { calculateNumerology } from './numerology-engine';
import { getZodiacResult } from './zodiac-engine';
import { calculateZiwei } from './ziwei-engine';

/** 從一份 ProfileInput 計算出完整的命盤資料與規則式報告；供表單與分享連結共用。 */
export function buildReportFromProfile(
  profile: ProfileInput,
  manualStrokes: Record<string, number> = {},
): { reportInput: FateReportInput; report: AiFateReport } {
  const bazi = calculateBazi(profile);
  const fiveElements = calculateFiveElements(bazi.pillars);
  const reportInput: FateReportInput = {
    userFocus: profile.focus,
    bazi,
    fiveElements,
    zodiac: getZodiacResult(bazi.zodiac),
    astrology: calculateAstrology(profile),
    ziwei: calculateZiwei(profile),
    numerology: calculateNumerology(profile.birthDate),
    nameAnalysis: profile.name.trim() ? analyzeName(profile.name, fiveElements.weakest, manualStrokes) : undefined,
  };
  return { reportInput, report: generateFallbackReport(reportInput) };
}
