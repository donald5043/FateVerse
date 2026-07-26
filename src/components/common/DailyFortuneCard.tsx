import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { computeDailyFortune, RELATION_LABELS, type ElementRelation } from '../../engines/daily-fortune-engine';
import { useFateStore } from '../../store/useFateStore';
import DailyFeedback from './DailyFeedback';

/** 關係分類的配色。刻意只有三種描述性分類，不是分數或星等。 */
const RELATION_TONE: Record<ElementRelation, string> = {
  support: 'border-emerald-200/25 bg-emerald-300/[0.08] text-emerald-100',
  drain: 'border-amber-200/25 bg-amber-200/[0.08] text-amber-100',
  neutral: 'border-white/15 bg-white/[0.05] text-mist',
};

/**
 * 今日與你：首頁的每日回訪入口。
 * 有命盤時顯示「本命 × 當日干支」的解讀；沒有命盤時顯示建檔引導。
 * 與既有的「今日指引」靜態卡並存，不取代它。
 */
export default function DailyFortuneCard({ today = new Date() }: { today?: Date }) {
  const input = useFateStore((state) => state.reportInput);

  if (!input) {
    return (
      <section className="rounded-[22px] border border-gold/[0.16] bg-white/[0.03] p-6">
        <div className="flex items-center gap-2.5 text-gold"><CalendarDays size={18} /><p className="eyebrow text-gold">Today</p></div>
        <h3 className="mt-3 font-serif text-xl font-bold text-cream">今日與你</h3>
        <p className="mt-2.5 text-sm leading-7 text-mist">建立命盤之後，這裡每天會用你的本命盤對照當日干支，給一件今天可以做的具體小事。</p>
        <Link className="btn-secondary mt-5" to="/profile">先建立命盤 <ArrowRight size={15} /></Link>
      </section>
    );
  }

  const fortune = computeDailyFortune(input.bazi, today);

  return (
    <section className="rounded-[22px] border border-gold/25 bg-gradient-to-br from-gold/[0.09] to-white/[0.02] p-6" aria-labelledby="daily-fortune-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-gold"><CalendarDays size={18} /><p className="eyebrow text-gold">Today</p></div>
        <span className={`rounded-full border px-3 py-1 text-xs ${RELATION_TONE[fortune.elementRelation]}`}>
          {fortune.dayPillar}日 · {RELATION_LABELS[fortune.elementRelation]}
        </span>
      </div>
      <h3 id="daily-fortune-title" className="mt-3 font-serif text-xl font-bold text-cream">今日與你</h3>

      <p className="mt-3 text-sm leading-7 text-mist">{fortune.relationExplanation}</p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-ink/40 p-4">
        <span className="text-[11px] font-semibold tracking-wider text-gold">今天可以做的一件事</span>
        <p className="mt-1.5 leading-7 text-cream">{fortune.behaviorAdvice}</p>
      </div>

      <p className="mt-3 text-xs leading-6 text-mist">{fortune.watchOut}</p>

      <DailyFeedback today={today} />

      <p className="mt-3 text-[11px] leading-5 text-mist/70">
        依你的日主與當日天干（{fortune.tenGodCategory}）推得，全程在你的裝置上計算。這是反思用的參考，不是預言。
      </p>
    </section>
  );
}
