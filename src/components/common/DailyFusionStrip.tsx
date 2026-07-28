import { ArrowRight, Compass } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { computeDailyFusion, TONE_LABELS, type DayTone } from '../../engines/daily-fusion-engine';
import { useFateStore } from '../../store/useFateStore';
import { preferredScrollBehavior } from '../../utils/scroll';

const TONE_STYLE: Record<DayTone, string> = {
  smooth: 'border-emerald-200/30 bg-emerald-300/[0.1] text-emerald-100',
  friction: 'border-amber-200/30 bg-amber-200/[0.1] text-amber-100',
  neutral: 'border-white/15 bg-white/[0.05] text-mist',
};

/**
 * 首頁最上方的今日綜合條。
 *
 * 五套系統對同一天各講各的，這裡只做一件事：數有幾套說順、幾套說卡。
 * 不加權、不平均、不給總分——把五套不同前提的系統加總成一個數字，
 * 那個數字沒有意義，而且會讓人以為我們在算命。
 */
export default function DailyFusionStrip({ today }: { today?: Date }) {
  const input = useFateStore((state) => state.reportInput);
  const profile = useFateStore((state) => state.profileInput);

  const fusion = useMemo(
    () => computeDailyFusion(input, profile, today ?? new Date()),
    [input, profile, today],
  );

  return (
    <section className="rounded-[22px] border border-gold/25 bg-gradient-to-br from-gold/[0.1] to-white/[0.02] p-5" data-testid="daily-fusion">
      <div className="flex items-center gap-2 text-gold">
        <Compass size={16} />
        <p className="eyebrow text-gold">今日綜合</p>
      </div>

      <p className="mt-2.5 font-serif text-lg font-bold leading-8 text-cream">{fusion.headline}</p>

      {fusion.signals.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {fusion.signals.map((signal) => (
            <span
              key={signal.system}
              title={signal.note}
              className={`rounded-full border px-3 py-1 text-xs ${TONE_STYLE[signal.tone]}`}
            >
              {signal.system} · {TONE_LABELS[signal.tone]}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-sm leading-7 text-mist">{fusion.closing}</p>

      {input ? (
        // HashRouter 底下 <a href="#today"> 會被當成路由，只能自己捲。
        <button
          type="button"
          onClick={() => document.getElementById('today')?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' })}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-cream"
        >
          看今天的完整解讀 <ArrowRight size={14} />
        </button>
      ) : (
        <Link to="/profile" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-cream">
          建立命盤，讓五套系統一起講 <ArrowRight size={14} />
        </Link>
      )}
    </section>
  );
}
