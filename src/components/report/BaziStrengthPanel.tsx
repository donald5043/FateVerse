import { calculateHiddenStemWeights } from '../../engines/bazi-strength-engine';
import type { BaziResult, ElementName, SeasonalStrengthState } from '../../types/fate';
import { ELEMENT_LABELS } from '../../utils/constants';

const STATE_LABELS: Record<SeasonalStrengthState, string> = {
  prosperous: '旺', supportive: '相', resting: '休', imprisoned: '囚', declining: '死',
};

const STATE_TONES: Record<SeasonalStrengthState, string> = {
  prosperous: 'border-emerald-200/25 bg-emerald-300/[0.09] text-emerald-100',
  supportive: 'border-gold/25 bg-gold/[0.08] text-gold',
  resting: 'border-blue-200/20 bg-blue-300/[0.06] text-blue-100',
  imprisoned: 'border-white/10 bg-white/[0.035] text-mist',
  declining: 'border-rose-200/15 bg-rose-300/[0.04] text-rose-100',
};

const ROLE_LABELS = { main: '本氣', middle: '中氣', residual: '餘氣' } as const;

export default function BaziStrengthPanel({ result }: { result: BaziResult }) {
  const season = result.seasonStrength;
  if (!season) return null;
  const elements = Object.keys(ELEMENT_LABELS) as ElementName[];
  return (
    <section className="glass-card mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Seasonal structure</p><h3 className="mt-1 font-serif text-xl font-semibold text-cream">月令旺相與藏干比例</h3></div><span className="rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1 text-xs text-gold">月支 {season.monthBranch} · {season.season}</span></div>
      <div className="stagger-grid mt-5 grid grid-cols-5 gap-2">{elements.map((element) => { const state = season.states[element]; return <article className={`rounded-xl border p-3 text-center ${STATE_TONES[state]}`} key={element}><span className="text-xs opacity-80">{ELEMENT_LABELS[element]}</span><p className="mt-1 font-serif text-2xl font-semibold">{STATE_LABELS[state]}</p></article>; })}</div>
      <div className="stagger-grid mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{result.pillars.map((pillar) => {
        const weights = pillar.hiddenStemWeights ?? calculateHiddenStemWeights(pillar.branch, pillar.hiddenStems, pillar.hiddenTenGods);
        return <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={pillar.label}><div className="flex items-center justify-between"><h4 className="font-semibold text-cream">{pillar.label} · {pillar.branch}</h4><span className="text-xs text-mist">藏干</span></div><div className="mt-4 space-y-3">{weights.map((item) => <div key={`${pillar.label}-${item.stem}`}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-cream">{item.stem} · {ELEMENT_LABELS[item.element]} · {item.tenGod}</span><span className="text-mist">{ROLE_LABELS[item.role]} {item.weight}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="meter-fill h-full rounded-full bg-gradient-to-r from-gold/60 to-gold" style={{ '--meter-width': `${item.weight}%` } as React.CSSProperties} /></div></div>)}</div></article>;
      })}</div>
      <p className="mt-4 text-xs leading-5 text-mist">藏干比例採 FateVerse 統一的視覺化參考表，用來呈現本氣、中氣、餘氣的相對位置，並非 lunar-javascript 的旺衰分數。{season.note}</p>
    </section>
  );
}
