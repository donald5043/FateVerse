import type { FateReportInput } from '../types/fate';

export interface SkyFact {
  label: string;
  value: string;
  note?: string;
}

export interface BirthdaySky {
  weekday: string;
  moonPhase: string;
  moonIllumination: number;
  dayOfYear: number;
  daysSince: number;
  facts: SkyFact[];
  intro: string;
  caveat: string;
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// 依日月黃道經度差計算月相；0°新月、90°上弦、180°滿月、270°下弦。
const MOON_PHASES = [
  { max: 22.5, name: '新月', emoji: '🌑' },
  { max: 67.5, name: '眉月', emoji: '🌒' },
  { max: 112.5, name: '上弦月', emoji: '🌓' },
  { max: 157.5, name: '盈凸月', emoji: '🌔' },
  { max: 202.5, name: '滿月', emoji: '🌕' },
  { max: 247.5, name: '虧凸月', emoji: '🌖' },
  { max: 292.5, name: '下弦月', emoji: '🌗' },
  { max: 337.5, name: '殘月', emoji: '🌘' },
  { max: 360.1, name: '新月', emoji: '🌑' },
];

function moonPhaseFromAngle(angle: number): { name: string; emoji: string } {
  const normalized = ((angle % 360) + 360) % 360;
  return MOON_PHASES.find((phase) => normalized < phase.max) ?? MOON_PHASES[0];
}

/**
 * 誠實命理：呈現使用者出生那一刻，天空與曆法真實的樣子。
 * 不宣稱任何因果，只是「你來到世界的那一刻，宇宙長這樣」。
 */
export function buildBirthdaySky(input: FateReportInput, birthDate: string, now: Date = new Date()): BirthdaySky {
  const [year, month, day] = birthDate.split('-').map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));
  const weekday = WEEKDAYS[birth.getUTCDay()];

  const startOfYear = Date.UTC(year, 0, 0);
  const dayOfYear = Math.floor((birth.getTime() - startOfYear) / 86400000);
  const daysSince = Math.max(0, Math.floor((now.getTime() - birth.getTime()) / 86400000));

  const sun = input.astrology.planets?.find((planet) => planet.name === '太陽');
  const moon = input.astrology.planets?.find((planet) => planet.name === '月亮');
  const hasFullSky = Boolean(sun && moon);
  const phaseAngle = hasFullSky ? moon!.longitude - sun!.longitude : 0;
  const phase = moonPhaseFromAngle(phaseAngle);
  const illuminationFraction = hasFullSky ? (1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2 : 0;
  const moonIllumination = Math.round(illuminationFraction * 100);

  const retrogrades = input.astrology.planets?.filter((planet) => planet.retrograde) ?? [];

  const facts: SkyFact[] = [
    { label: '那天是', value: weekday },
    { label: '農曆', value: input.bazi.lunarDate },
    { label: '干支・生肖', value: `${input.bazi.pillars[0]?.value ?? ''}年・屬${input.zodiac.animal}` },
    { label: '節氣參考', value: input.bazi.seasonalNode || '—' },
    { label: '一年中的第', value: `${dayOfYear} 天` },
    { label: '距離今天', value: `${daysSince.toLocaleString('zh-TW')} 天` },
  ];

  if (hasFullSky) {
    facts.push(
      { label: '當天月相', value: `${phase.emoji} ${phase.name}`, note: `月面明亮度約 ${moonIllumination}%` },
      { label: '太陽・月亮', value: `太陽在${sun!.sign}・月亮在${moon!.sign}` },
    );
    if (retrogrades.length) {
      facts.push({ label: '當時逆行的行星', value: retrogrades.map((planet) => planet.name).join('、'), note: '逆行是視覺現象，不是行星真的倒退' });
    } else {
      facts.push({ label: '當時逆行的行星', value: '沒有主要行星逆行' });
    }
  } else {
    facts.push({ label: '天空快照', value: '填入出生地經緯度後，可顯示當天月相與行星落座' });
  }

  return {
    weekday,
    moonPhase: `${phase.emoji} ${phase.name}`,
    moonIllumination,
    dayOfYear,
    daysSince,
    facts,
    intro: `${year} 年 ${month} 月 ${day} 日，你來到這個世界。那一刻，天空與曆法是這個樣子——`,
    caveat: '以上都是天文與曆法上真實可算的事實，不宣稱任何因果或吉凶，只是一份屬於你出生那刻的宇宙快照。',
  };
}
