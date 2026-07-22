import { CalendarDays, CircleDot, Sparkles } from 'lucide-react';
import type { BaziResult, FiveElementResult } from '../../types/fate';
import { ELEMENT_LABELS } from '../../utils/constants';

const elementTone = {
  wood: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
  fire: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
  earth: 'border-amber-200/20 bg-amber-200/10 text-amber-100',
  metal: 'border-slate-200/20 bg-slate-200/10 text-slate-100',
  water: 'border-blue-300/20 bg-blue-300/10 text-blue-100',
} as const;

interface BirthChartPreviewProps {
  bazi: BaziResult;
  fiveElements: FiveElementResult;
}

export default function BirthChartPreview({ bazi, fiveElements }: BirthChartPreviewProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/[0.11] via-white/[0.04] to-indigo/70" aria-label="即時命盤試算">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow">即時試算 · 資料已生效</span>
          <div className="mt-2 flex items-center gap-2 text-sm text-mist"><CalendarDays size={16} className="text-gold" />農曆 {bazi.lunarDate}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm">生肖 {bazi.zodiac}</span>
          <span className={`rounded-full border px-3 py-1.5 text-sm ${elementTone[bazi.dayMasterElement]}`}>日主 {bazi.dayMaster} · {ELEMENT_LABELS[bazi.dayMasterElement]}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px bg-white/10">
        {bazi.pillars.map((pillar) => (
          <div className="bg-[#11182f] p-3 text-center sm:p-4" key={pillar.label}>
            <span className="text-[11px] tracking-wider text-mist">{pillar.label}</span>
            <div className="mt-2 font-serif text-2xl font-semibold tracking-widest text-cream sm:text-3xl">
              <span>{pillar.stem}</span><span>{pillar.branch}</span>
            </div>
            <p className="mt-2 truncate text-[11px] text-gold/90">{pillar.tenGod}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-cream"><CircleDot size={16} className="text-gold" />五行快速分布</div>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/10" aria-label="五行比例">
            {(Object.keys(ELEMENT_LABELS) as (keyof typeof ELEMENT_LABELS)[]).map((key) => (
              <span key={key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${fiveElements.percentages[key]}%`, backgroundColor: { wood: '#78a987', fire: '#d98472', earth: '#c9a86a', metal: '#c2c8d7', water: '#708ac2' }[key] }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1 text-center text-xs text-mist">
            {(Object.keys(ELEMENT_LABELS) as (keyof typeof ELEMENT_LABELS)[]).map((key) => <span key={key}>{ELEMENT_LABELS[key]} {fiveElements.percentages[key]}%</span>)}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white/[0.05] px-4 py-3 text-xs leading-5 text-mist"><Sparkles size={16} className="shrink-0 text-gold" />送出後整合星座、靈數與姓名</div>
      </div>
    </section>
  );
}
