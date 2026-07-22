import type { AstrologyResult } from '../../types/fate';

export default function HouseSystemComparison({ result }: { result: AstrologyResult }) {
  const comparisons = result.houseComparisons ?? [];
  if (comparisons.length < 2 || !result.planets?.length) return null;
  const equal = comparisons.find((item) => item.system === 'equal');
  const wholeSign = comparisons.find((item) => item.system === 'whole-sign');
  if (!equal || !wholeSign) return null;

  const differences = result.planets.filter((planet) => equal.planetHouses[planet.name] !== wholeSign.planetHouses[planet.name]);
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">House systems</p><h3 className="mt-1 font-serif text-xl font-semibold text-cream">等宮制／整宮制落宮比較</h3></div><span className="text-xs text-mist">{differences.length} 顆星落宮不同</span></div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm"><thead className="text-xs text-mist"><tr><th className="pb-2 font-medium">星體</th><th className="pb-2 font-medium">星座位置</th><th className="pb-2 font-medium">等宮制</th><th className="pb-2 font-medium">整宮制</th><th className="pb-2 font-medium">比較</th></tr></thead><tbody className="divide-y divide-white/10">{result.planets.map((planet) => { const equalHouse = equal.planetHouses[planet.name]; const wholeHouse = wholeSign.planetHouses[planet.name]; return <tr key={planet.name}><td className="py-2.5 font-semibold text-cream">{planet.name}</td><td className="py-2.5 text-mist">{planet.sign} {planet.degreeInSign.toFixed(1)}°</td><td className="py-2.5 text-mist">第 {equalHouse} 宮</td><td className="py-2.5 text-mist">第 {wholeHouse} 宮</td><td className="py-2.5"><span className={equalHouse === wholeHouse ? 'text-mist' : 'text-gold'}>{equalHouse === wholeHouse ? '相同' : '不同'}</span></td></tr>; })}</tbody></table>
      </div>
      <p className="mt-3 text-xs leading-5 text-mist">兩種宮制是不同的座標切分方法，不代表其中一種必然正確。宮位主題已另列為文化閱讀索引；宮主星、飛星與不等宮制仍未納入。</p>
    </section>
  );
}
