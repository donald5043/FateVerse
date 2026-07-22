import type { CSSProperties } from 'react';
import { ASTROLOGY_ASPECT_LIBRARY, ASTROLOGY_HOUSE_LIBRARY, PLANET_LIBRARY } from '../../data/interpretation-library';
import type { AstrologyHouseEmphasis, AstrologyResult } from '../../types/fate';

const ELEMENT_COLORS: Record<string, string> = { 火: '#d98472', 土: '#c9a86a', 風: '#9ab7d7', 水: '#708ac2' };
const MODALITY_COLORS: Record<string, string> = { 開創: '#d8b875', 固定: '#9aa7c8', 變動: '#78a987' };
const CLOSENESS_LABELS = { tight: '緊密', moderate: '中等', wide: '寬鬆' } as const;

function fallbackEmphasis(planetHouses: Record<string, number>): AstrologyHouseEmphasis {
  const groups = new Map<number, string[]>();
  Object.entries(planetHouses).forEach(([planet, house]) => groups.set(house, [...(groups.get(house) ?? []), planet]));
  const occupiedHouses = [...groups].map(([house, planets]) => ({ house, planets })).sort((left, right) => right.planets.length - left.planets.length || left.house - right.house);
  const angularity = { angular: 0, succedent: 0, cadent: 0 };
  occupiedHouses.forEach(({ house, planets }) => {
    if ([1, 4, 7, 10].includes(house)) angularity.angular += planets.length;
    else if ([2, 5, 8, 11].includes(house)) angularity.succedent += planets.length;
    else angularity.cadent += planets.length;
  });
  return { occupiedHouses, angularity };
}

function DistributionBars({ values, colors }: { values: Record<string, number>; colors: Record<string, string> }) {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0) || 1;
  return <div className="mt-4 space-y-3">{Object.entries(values).map(([label, count]) => <div key={label}><div className="mb-1.5 flex justify-between text-xs"><span className="text-cream">{label}</span><span className="tabular-nums text-mist">{count}／{total}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="meter-fill h-full rounded-full" style={{ '--meter-width': `${count / total * 100}%`, backgroundColor: colors[label] } as CSSProperties} /></div></div>)}</div>;
}

export default function AstrologyStructurePanel({ result }: { result: AstrologyResult }) {
  const distribution = result.distribution;
  const comparisons = result.houseComparisons ?? [];
  const aspects = result.aspects ?? [];
  if (!distribution && !comparisons.length && !aspects.length) return null;

  return (
    <section className="mt-6 space-y-5">
      {distribution && <div className="grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div><p className="eyebrow">Elements</p><h3 className="mt-1 font-serif text-xl font-semibold text-cream">十星元素分布</h3></div><span className="text-xs text-gold">{distribution.dominantElements.join('、')}較多</span></div><DistributionBars values={distribution.elements} colors={ELEMENT_COLORS} /></article><article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div><p className="eyebrow">Modalities</p><h3 className="mt-1 font-serif text-xl font-semibold text-cream">十星模式分布</h3></div><span className="text-xs text-gold">{distribution.dominantModalities.join('、')}較多</span></div><DistributionBars values={distribution.modalities} colors={MODALITY_COLORS} /></article></div>}

      {comparisons.length > 0 && <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"><div><p className="eyebrow">House emphasis</p><h3 className="mt-1 font-serif text-xl font-semibold text-cream">宮位集中與人生領域</h3><p className="mt-2 text-xs leading-5 text-mist">同一組天文位置放入不同宮制後，先比較星體集中在哪些宮位；宮位主題是文化閱讀索引，不是事件預測。</p></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{comparisons.map((comparison) => { const emphasis = comparison.emphasis ?? fallbackEmphasis(comparison.planetHouses); return <section className="rounded-xl border border-white/10 bg-[#10172c] p-4" key={comparison.system}><div className="flex items-center justify-between"><h4 className="font-semibold text-gold">{comparison.label}</h4><span className="text-[11px] text-mist">角 {emphasis.angularity.angular} · 續 {emphasis.angularity.succedent} · 果 {emphasis.angularity.cadent}</span></div><div className="mt-3 space-y-3">{emphasis.occupiedHouses.slice(0, 4).map(({ house, planets }) => { const content = ASTROLOGY_HOUSE_LIBRARY[house]; return <div className="rounded-xl bg-white/[0.035] p-3" key={house}><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-cream">第 {house} 宮 · {content.title}</strong><span className="text-xs text-gold">{planets.join('、')}</span></div><p className="mt-1 text-xs leading-5 text-mist">{content.theme}。{content.reflection}</p></div>; })}</div></section>; })}</div><p className="mt-3 text-xs leading-5 text-mist">角宮（1、4、7、10）偏向啟動，續宮（2、5、8、11）偏向維持，果宮（3、6、9、12）偏向調整與轉換；數量只描述星體分布。</p></article>}

      {aspects.length > 0 && <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Aspect dynamics</p><h3 className="mt-1 font-serif text-xl font-semibold text-cream">主要相位互動</h3></div><span className="text-xs text-mist">依容許度由緊密到寬鬆</span></div><div className="stagger-grid mt-4 grid gap-3 md:grid-cols-2">{aspects.slice(0, 8).map((aspect) => { const content = ASTROLOGY_ASPECT_LIBRARY[aspect.type]; const closeness = aspect.closeness ?? (aspect.orb <= 2 ? 'tight' : aspect.orb <= 4 ? 'moderate' : 'wide'); return <section className="rounded-xl border border-white/10 bg-[#10172c] p-4" key={`${aspect.first}-${aspect.second}-${aspect.type}`}><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-cream">{aspect.first} {aspect.type} {aspect.second}</strong><span className="rounded-full bg-gold/10 px-2 py-1 text-[10px] text-gold">{content?.mode ?? '互動'} · {CLOSENESS_LABELS[closeness]} {aspect.orb.toFixed(2)}°</span></div><p className="mt-2 text-xs leading-5 text-mist">「{PLANET_LIBRARY[aspect.first]}」與「{PLANET_LIBRARY[aspect.second]}」之間，{content?.description ?? '形成傳統占星中的主要角度關係。'} {content?.reflection}</p></section>; })}</div></article>}
    </section>
  );
}
