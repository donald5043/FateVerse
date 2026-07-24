import { Blend, GitMerge, MessageCircleHeart, Scale, ShieldCheck, Split, Timer } from 'lucide-react';
import type { FusionReading } from '../../types/fate';
import { ELEMENT_LABELS } from '../../utils/constants';

const ELEMENT_BAR_COLORS: Record<string, string> = {
  wood: 'bg-emerald-300/70',
  fire: 'bg-rose-300/70',
  earth: 'bg-amber-300/70',
  metal: 'bg-slate-200/70',
  water: 'bg-sky-300/70',
};

const AGREEMENT_LABELS = { high: '共識度：高', medium: '共識度：中', low: '共識度：低（多面向）' } as const;

export default function FusionInsights({ reading }: { reading: FusionReading }) {
  const maxVotes = reading.consensus.votes[0]?.votes ?? 1;
  return (
    <div className="space-y-6">
      <article className="relative overflow-hidden rounded-[2rem] border border-vermilion/25 bg-gradient-to-br from-vermilion/[0.1] via-[#1a1226] to-[#0b1020] p-6 sm:p-8">
        <span className="pointer-events-none absolute -right-4 -top-12 select-none font-serif text-[12rem] font-black leading-none text-vermilion/[0.07]" aria-hidden="true">融</span>
        <div className="relative">
          <div className="flex items-center gap-3 text-[#e8927f]"><Blend size={22} /><span className="eyebrow text-[#e8927f]">All systems combined</span></div>
          <p className="mt-4 max-w-4xl font-serif text-xl leading-9 text-cream sm:text-2xl sm:leading-10">{reading.headline}</p>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-mist">{reading.plainIntro}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">{reading.systemsUsed.map((system) => <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-mist" key={system}>{system}</span>)}</div>
        </div>
      </article>

      <article className="glass-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><GitMerge className="text-gold" size={20} />五行共識投票</h3>
          <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-xs text-gold">{AGREEMENT_LABELS[reading.consensus.agreementLevel]}</span>
        </div>
        <div className="mt-5 space-y-3">
          {reading.consensus.votes.map((vote) => (
            <div key={vote.element}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-cream">{ELEMENT_LABELS[vote.element]}</span>
                <span className="text-xs text-mist">{vote.systems.join('、')}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${ELEMENT_BAR_COLORS[vote.element]}`} style={{ width: `${Math.round((vote.votes / maxVotes) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 leading-7 text-mist">{reading.consensus.plainSummary}</p>
        <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-xs leading-5 text-mist">
          {reading.consensus.mappingNotes.map((note) => <li key={note}>・{note}</li>)}
        </ul>
      </article>

      <article className="glass-card p-5 sm:p-7">
        <h3 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><Scale className="text-gold" size={20} />跨系統性格光譜</h3>
        <p className="mt-2 text-sm leading-6 text-mist">把每套系統對同一件事的暗示放上同一把尺；正負只是方向，沒有好壞。</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {reading.axes.map((axis) => (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={axis.id}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cream">{axis.label}</span>
                <span className="text-xs tabular-nums text-mist">{axis.score > 0 ? `偏${axis.leftLabel}` : axis.score < 0 ? `偏${axis.rightLabel}` : '居中'}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-mist">
                <span className="w-16 shrink-0">{axis.leftLabel}</span>
                <div className="relative h-2 flex-1 rounded-full bg-white/10">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-white/25" />
                  <div className="absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full border border-ink bg-gold shadow" style={{ left: `calc(${50 + axis.score / 2}% - 7px)` }} />
                </div>
                <span className="w-16 shrink-0 text-right">{axis.rightLabel}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-mist">{axis.verdict}</p>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gold">看看是哪些系統這樣說</summary>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-mist">
                  {axis.evidence.map((item) => <li key={`${item.system}-${item.point}`}><span className="text-cream">{item.system}</span>：{item.point}</li>)}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </article>

      <div className="grid gap-5 lg:grid-cols-2">
        {reading.domains.map((domain) => (
          <article className="glass-card flex flex-col p-5 sm:p-6" key={domain.id}>
            <h3 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-cream"><MessageCircleHeart className="shrink-0 text-gold" size={19} />{domain.title}</h3>
            <p className="mt-4 leading-7 text-mist">{domain.plainReading}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {domain.evidence.map((item) => <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-mist" key={`${item.system}-${item.point}`}><span className="text-gold">{item.system}</span> · {item.point}</span>)}
            </div>
            <p className="mt-auto border-t border-white/10 pt-3 text-xs leading-5 text-mist">{domain.reminder}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {reading.highlights.map((highlight) => (
          <article className={`rounded-3xl border p-5 sm:p-6 ${highlight.kind === 'agreement' ? 'border-emerald-200/20 bg-emerald-300/[0.055]' : 'border-orange-200/20 bg-orange-300/[0.055]'}`} key={highlight.title}>
            <div className={`flex items-center gap-2.5 ${highlight.kind === 'agreement' ? 'text-emerald-200' : 'text-orange-200'}`}>
              {highlight.kind === 'agreement' ? <GitMerge size={18} /> : <Split size={18} />}
              <span className="text-xs font-semibold tracking-wider">{highlight.kind === 'agreement' ? '系統口徑一致' : '系統各說各話'}</span>
            </div>
            <h3 className="mt-3 font-serif text-lg font-semibold text-cream">{highlight.title}</h3>
            <p className="mt-3 leading-7 text-mist">{highlight.plainExplanation}</p>
          </article>
        ))}
      </div>

      {reading.timing && (
        <article className="glass-card p-5 sm:p-7">
          <h3 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><Timer className="text-gold" size={20} />時運交叉比對</h3>
          <p className="mt-4 leading-7 text-mist">{reading.timing.plainReading}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {reading.timing.evidence.map((item) => <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-mist" key={`${item.system}-${item.point}`}><span className="text-gold">{item.system}</span> · {item.point}</span>)}
          </div>
        </article>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <h3 className="text-sm font-semibold text-cream">融合解讀的界線</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-mist">
          {reading.cautions.map((item) => <li className="flex gap-2" key={item}><ShieldCheck className="mt-1 shrink-0 text-gold" size={15} />{item}</li>)}
        </ul>
      </section>
    </div>
  );
}
