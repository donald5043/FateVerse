import { Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { drawDailyCard } from '../../engines/tarot-engine';
import { useFateStore } from '../../store/useFateStore';

/**
 * 今日一張牌。
 *
 * 牌面預設蓋著，要自己翻。抽牌的重點是翻開前那一秒——你心裡已經希望是哪一張，
 * 那個念頭比牌面本身更值得注意。
 *
 * 同一天重新整理是同一張牌，不會因為你不喜歡就換一張。
 */
export default function DailyTarotCard({ today }: { today?: Date }) {
  const profile = useFateStore((state) => state.profileInput);
  const [flipped, setFlipped] = useState(false);

  // 有命盤就每個人一張，沒有就全站同一張——都不影響「同一天不會變」。
  const daily = useMemo(
    () => drawDailyCard(today ?? new Date(), profile?.birthDate ?? ''),
    [today, profile?.birthDate],
  );

  return (
    <article className="flex h-full flex-col rounded-[22px] border border-violet-300/25 bg-gradient-to-br from-violet-400/[0.08] to-white/[0.02] p-6">
      <div className="flex items-center gap-2.5 text-violet-300">
        <Sparkles size={18} /><p className="eyebrow text-violet-300">今日一張牌</p>
      </div>

      {!flipped ? (
        <>
          <h3 className="mt-3 font-serif text-xl font-bold text-cream">先別急著翻</h3>
          <p className="mt-2.5 text-sm leading-7 text-mist">
            翻開之前，先問自己一句：你現在希望翻到什麼樣的牌？
            記住那個念頭——它比牌面更誠實。
          </p>
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="mt-4 flex w-full flex-col items-center justify-center rounded-2xl border border-violet-300/30 bg-ink/50 py-10 transition hover:border-violet-300/60 hover:bg-ink/70"
          >
            <span className="font-serif text-4xl text-violet-200/70" aria-hidden="true">✦</span>
            <span className="mt-2.5 text-sm font-semibold text-violet-100">翻開今天的牌</span>
          </button>
          <p className="mt-auto pt-3 text-[11px] text-mist/60">同一天翻到的是同一張，重新整理不會換。</p>
        </>
      ) : (
        <>
          <h3 className="mt-3 font-serif text-2xl font-bold text-cream">
            {daily.card.name}
            {daily.reversed && <span className="ml-2 align-middle text-xs font-normal text-mist">逆位</span>}
          </h3>
          <p className="mt-1 font-display text-sm italic text-mist/70">{daily.card.en}</p>

          <p className="mt-3 leading-7 text-cream">{daily.reading}</p>

          <div className="mt-3.5 rounded-2xl border border-white/10 bg-ink/40 p-4">
            <span className="text-[11px] font-semibold tracking-wider text-violet-200">今天可以做的一件事</span>
            <p className="mt-1.5 leading-7 text-cream">{daily.advice}</p>
          </div>

          <p className="mt-auto pt-3 text-[11px] leading-5 text-mist/60">
            翻開之前你希望是哪一張？如果現在有點失望，那個失望比這張牌更值得想一下。
          </p>
        </>
      )}
    </article>
  );
}
