import { Orbit } from 'lucide-react';
import { useMemo } from 'react';
import { computeDailyHoroscope } from '../../engines/daily-horoscope-engine';
import { useFateStore } from '../../store/useFateStore';

/** 相位形狀的配色。描述性分類，不是好壞。 */
const TONE: Record<string, string> = {
  fusion: 'border-gold/30 bg-gold/[0.08] text-gold',
  flow: 'border-emerald-200/25 bg-emerald-300/[0.08] text-emerald-100',
  tension: 'border-amber-200/25 bg-amber-200/[0.08] text-amber-100',
  polarity: 'border-vermilion/30 bg-vermilion/[0.08] text-[#e8927f]',
};

/**
 * 今日星座運勢：今天天上的行星對你出生那一刻的行星。
 *
 * 和查太陽星座的那種運勢不同——同一個星座的人，這裡讀到的東西不一樣，
 * 因為對的是各自的本命盤。
 */
export default function DailyHoroscopeCard({ today }: { today?: Date }) {
  const input = useFateStore((state) => state.reportInput);
  const horoscope = useMemo(
    () => (input ? computeDailyHoroscope(input.astrology, today ?? new Date()) : undefined),
    [input, today],
  );

  if (!horoscope) return null;

  return (
    <article className="flex h-full flex-col rounded-[22px] border border-celeste/25 bg-gradient-to-br from-celeste/[0.07] to-white/[0.02] p-6">
      <div className="flex items-center gap-2.5 text-celeste">
        <Orbit size={18} /><p className="eyebrow text-celeste">今日星象</p>
      </div>
      <h3 className="mt-3 font-serif text-xl font-bold text-cream">今天的天空對上你</h3>
      <p className="mt-1.5 text-xs text-mist/70">月亮走在{horoscope.moonSign} · 你的太陽在{horoscope.sunSign}</p>

      <p className="mt-3 leading-7 text-cream">{horoscope.headline}</p>

      {horoscope.quietNote && <p className="mt-3 text-sm leading-7 text-mist">{horoscope.quietNote}</p>}

      <ul className="mt-3 space-y-2.5">
        {horoscope.transits.map((transit) => (
          <li className="rounded-2xl border border-white/10 bg-ink/40 p-3.5" key={`${transit.transitPlanet}-${transit.natalPlanet}-${transit.type}`}>
            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] ${TONE[transit.quality] ?? TONE.flow}`}>
              今日{transit.transitPlanet} {transit.type} 本命{transit.natalPlanet}
            </span>
            <p className="mt-1.5 text-sm leading-6 text-mist">{transit.reading}</p>
          </li>
        ))}
      </ul>

      <p className="mt-auto pt-3 text-[11px] leading-5 text-mist/60">
        用的是你出生那一刻的行星位置，不是太陽星座查表——所以同星座的人看到的不會一樣。
      </p>
    </article>
  );
}
