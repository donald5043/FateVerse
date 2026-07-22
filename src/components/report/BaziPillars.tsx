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
    </div>
  );
}
