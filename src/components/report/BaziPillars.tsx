import type { BaziResult } from '../../types/fate';
import { ELEMENT_LABELS } from '../../utils/constants';

const elementColor = {
  wood: 'text-emerald-200', fire: 'text-rose-200', earth: 'text-amber-100', metal: 'text-slate-100', water: 'text-blue-200',
} as const;

export default function BaziPillars({ result }: { result: BaziResult }) {
  return (
    <div>
      <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        {result.pillars.map((pillar) => (
          <div className="bg-[#10172c] px-2 py-4 text-center sm:px-4" key={pillar.label}>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-mist">{pillar.label}</p>
            <p className={`mt-3 font-serif text-3xl font-semibold sm:text-4xl ${elementColor[pillar.stemElement]}`}>{pillar.stem}</p>
            <p className={`mt-1 font-serif text-3xl font-semibold sm:text-4xl ${elementColor[pillar.branchElement]}`}>{pillar.branch}</p>
            <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-[10px] leading-4 text-mist sm:text-xs">
              <p>{ELEMENT_LABELS[pillar.stemElement]}／{ELEMENT_LABELS[pillar.branchElement]}</p>
              <p className="truncate text-gold/90">{pillar.tenGod}</p>
              <p className="truncate" title={pillar.naYin}>{pillar.naYin}</p>
              <p className="truncate" title={`${pillar.hiddenStems.join('、')}｜${pillar.hiddenTenGods.join('、')}`}>藏干 {pillar.hiddenStems.join('、')}</p>
              <p>{pillar.lifeStage} · 空亡 {pillar.xunKong}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-sm text-mist sm:grid-cols-2">
        <p><span className="text-cream">公曆：</span>{result.solarDate}</p>
        <p><span className="text-cream">農曆：</span>{result.lunarDate}</p>
        <p><span className="text-cream">日主：</span>{result.dayMaster} · {ELEMENT_LABELS[result.dayMasterElement]}</p>
        <p><span className="text-cream">節氣參考：</span>{result.seasonalNode}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[['胎元', result.taiYuan], ['胎息', result.taiXi], ['命宮', result.mingGong], ['身宮', result.shenGong]].map(([label, value]) => <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3" key={label}><span className="text-xs text-mist">{label}</span><p className="mt-1 font-serif text-lg text-cream">{value}</p></div>)}
      </div>
      {result.luckCycles?.length ? <div className="mt-5"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-cream">大運</h4><span className="text-xs text-mist">{result.luckStart?.direction === 'forward' ? '順行' : '逆行'} · 約 {result.luckStart?.years} 年 {result.luckStart?.months} 月起運</span></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{result.luckCycles.map((cycle) => <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center" key={`${cycle.ganZhi}-${cycle.startYear}`}><p className="font-serif text-xl text-gold">{cycle.ganZhi}</p><p className="mt-1 text-[11px] text-mist">{cycle.startAge}–{cycle.endAge} 歲</p><p className="text-[10px] text-mist">{cycle.startYear}–{cycle.endYear}</p></div>)}</div><p className="mt-3 text-xs leading-5 text-mist">大運採 lunar-javascript 起運法（sect 2）；排盤性別未指定時不計算順逆與大運。</p></div> : <p className="mt-4 text-xs leading-5 text-mist">未指定男性或女性排盤性別，因此不計算涉及順逆行的大運。</p>}
    </div>
  );
}
