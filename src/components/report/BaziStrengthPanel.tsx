import { analyzeDayMaster, calculateYearFortunes } from '../../engines/bazi-analysis-engine';
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
  const analysis = analyzeDayMaster(result);
  const yearFortunes = calculateYearFortunes(result, analysis, new Date().getFullYear());
  const supportPercent = Math.round(analysis.ratio * 100);
  return (
    <>
    <section className="glass-card mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Day master strength</p><h3 className="mt-1 font-serif text-xl font-semibold text-cream">日主強弱與喜用神</h3></div><span className="rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-sm font-semibold text-gold">日主{result.dayMaster} · {analysis.level}</span></div>
      <p className="mt-4 leading-7 text-mist">{analysis.plainSummary}</p>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-mist"><span>幫身（比劫＋印星）{analysis.supportScore} 分</span><span>耗剋（食傷＋財＋官殺）{analysis.opposeScore} 分</span></div>
        <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-l-full bg-gradient-to-r from-emerald-300/70 to-emerald-200" style={{ width: `${supportPercent}%` }} />
          <div className="h-full flex-1 rounded-r-full bg-amber-200/50" />
        </div>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gold">看看分數怎麼算</summary>
        <ul className="mt-3 space-y-1.5">
          {analysis.components.map((component, index) => (
            <li className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs" key={`${component.label}-${index}`}>
              <span className="text-mist"><span className="font-semibold text-cream">{component.label}</span>：{component.detail}</span>
              <span className={`shrink-0 font-semibold tabular-nums ${component.side === 'support' ? 'text-emerald-200' : 'text-amber-200'}`}>{component.side === 'support' ? '+' : '−'}{component.score}</span>
            </li>
          ))}
        </ul>
      </details>
      {analysis.seasonalNote && <p className="mt-4 rounded-xl border border-gold/20 bg-gold/[0.06] p-3.5 text-sm leading-6 text-[#e8ddc5]">{analysis.seasonalNote}</p>}
      {analysis.favorable.length > 0 ? (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-cream">你的喜用五行與生活對應</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.favorable.map((item) => (
              <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={`${item.element}-${item.role}`}>
                <div className="flex items-center justify-between"><span className="font-serif text-2xl font-semibold text-gold">{ELEMENT_LABELS[item.element]}</span><span className="rounded-full bg-gold/10 px-2.5 py-1 text-[11px] text-gold">{item.role}</span></div>
                <p className="mt-2.5 text-sm leading-6 text-mist">{item.reason}。</p>
                <ul className="mt-3 space-y-1 text-xs leading-5 text-mist">
                  <li>顏色：{item.color}</li>
                  <li>方位：{item.direction}</li>
                  <li>習慣：{item.habit}</li>
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-mist">顏色與方位是民俗趣味對應，當成生活情調就好；「習慣」欄比較實際，值得一試。</p>
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-emerald-200/15 bg-emerald-300/[0.05] p-3.5 text-sm leading-6 text-emerald-100">你的盤面接近中和——傳統上這是最舒服的狀態，不用特別補哪個五行，維持現有的流通與平衡就好。</p>
      )}
      <div className="mt-6 border-t border-white/10 pt-5">
        <h4 className="text-sm font-semibold text-cream">流年速覽</h4>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {yearFortunes.map((fortune) => (
            <article className={`rounded-2xl border p-4 ${fortune.match === 'favorable' ? 'border-emerald-200/25 bg-emerald-300/[0.06]' : fortune.match === 'unfavorable' ? 'border-amber-200/20 bg-amber-200/[0.05]' : 'border-white/10 bg-white/[0.035]'}`} key={fortune.year}>
              <div className="flex items-center justify-between"><span className="font-semibold text-cream">{fortune.year} 年</span><span className="font-serif text-lg text-gold">{fortune.ganZhi}</span></div>
              <span className="mt-1 inline-block rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-mist">{fortune.category}之年{fortune.match === 'favorable' ? ' · 喜用' : ''}</span>
              <p className="mt-2.5 text-sm leading-6 text-mist">{fortune.reading}</p>
            </article>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-mist">{analysis.caveat}</p>
    </section>
    <section className="glass-card mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Seasonal structure</p><h3 className="mt-1 font-serif text-xl font-semibold text-cream">月令旺相與藏干比例</h3></div><span className="rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1 text-xs text-gold">月支 {season.monthBranch} · {season.season}</span></div>
      <div className="stagger-grid mt-5 grid grid-cols-5 gap-2">{elements.map((element) => { const state = season.states[element]; return <article className={`rounded-xl border p-3 text-center ${STATE_TONES[state]}`} key={element}><span className="text-xs opacity-80">{ELEMENT_LABELS[element]}</span><p className="mt-1 font-serif text-2xl font-semibold">{STATE_LABELS[state]}</p></article>; })}</div>
      <div className="stagger-grid mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{result.pillars.map((pillar) => {
        const weights = pillar.hiddenStemWeights ?? calculateHiddenStemWeights(pillar.branch, pillar.hiddenStems, pillar.hiddenTenGods);
        return <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={pillar.label}><div className="flex items-center justify-between"><h4 className="font-semibold text-cream">{pillar.label} · {pillar.branch}</h4><span className="text-xs text-mist">藏干</span></div><div className="mt-4 space-y-3">{weights.map((item) => <div key={`${pillar.label}-${item.stem}`}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="text-cream">{item.stem} · {ELEMENT_LABELS[item.element]} · {item.tenGod}</span><span className="text-mist">{ROLE_LABELS[item.role]} {item.weight}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="meter-fill h-full rounded-full bg-gradient-to-r from-gold/60 to-gold" style={{ '--meter-width': `${item.weight}%` } as React.CSSProperties} /></div></div>)}</div></article>;
      })}</div>
      <p className="mt-4 text-xs leading-5 text-mist">藏干比例採 FateVerse 統一的視覺化參考表，用來呈現本氣、中氣、餘氣的相對位置。{season.note}</p>
    </section>
    </>
  );
}
