import { Layers, Link2, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UnifiedElementProfile } from '../../engines/integration-engine';
import type { ElementName } from '../../types/fate';
import { ELEMENT_LABELS } from '../../utils/constants';

const ELEMENT_BAR: Record<ElementName, string> = {
  wood: 'bg-emerald-300/70',
  fire: 'bg-rose-300/70',
  earth: 'bg-amber-300/70',
  metal: 'bg-slate-200/70',
  water: 'bg-sky-300/70',
};

export default function UnifiedIntegrationPanel({ profile }: { profile: UnifiedElementProfile }) {
  const maxPercent = profile.percentages[profile.ranked[0]] || 100;
  return (
    <div className="space-y-6">
      <article className="relative overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-[#1a2140] via-[#12183044] to-[#0b1020] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-60 rounded-full border border-gold/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3 text-gold"><Layers size={22} /><span className="eyebrow">All systems, one profile</span></div>
          <div className="text-right">
            <div className="font-serif text-3xl font-bold text-gold">{profile.completeness}%</div>
            <div className="text-[11px] text-mist">整合完成度 · 已接上 {profile.connectedSystems.length} 套</div>
          </div>
        </div>
        <p className="relative mt-4 max-w-3xl leading-8 text-mist">{profile.plainSummary}</p>
        <div className="relative mt-6 space-y-3">
          {profile.ranked.map((element) => (
            <div key={element}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-cream">{ELEMENT_LABELS[element]}</span>
                <span className="tabular-nums text-mist">{profile.percentages[element]}%</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className={`meter-fill h-full rounded-full ${ELEMENT_BAR[element]}`} style={{ '--meter-width': `${Math.round((profile.percentages[element] / maxPercent) * 100)}%` } as React.CSSProperties} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-card p-5 sm:p-7">
        <h3 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><Link2 className="text-gold" size={20} />每套系統各貢獻了什麼</h3>
        <p className="mt-2 text-sm leading-6 text-mist">權重由資訊量決定：八字最高，其餘依序遞減。點名的「主向」是該系統換算後最突出的五行。</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-mist">
                <th className="py-2 pr-3 font-semibold">系統</th>
                <th className="py-2 pr-3 font-semibold">權重</th>
                <th className="py-2 pr-3 font-semibold">主向</th>
                <th className="py-2 font-semibold">依據</th>
              </tr>
            </thead>
            <tbody>
              {profile.contributions.map((contribution) => (
                <tr className="border-b border-white/5" key={contribution.system}>
                  <td className="py-2.5 pr-3 font-semibold text-cream">{contribution.system}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-mist">×{contribution.weight}</td>
                  <td className="py-2.5 pr-3"><span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-cream">{ELEMENT_LABELS[contribution.dominant]}</span></td>
                  <td className="py-2.5 text-xs leading-5 text-mist">{contribution.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {profile.missingSystems.length > 0 && (
        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h3 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-cream"><PlusCircle className="text-emerald-200" size={19} />再接上這些，剖面會更準</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.missingSystems.map((missing) => (
              <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={missing.system}>
                <span className="font-semibold text-cream">{missing.system}</span>
                <span className="mt-1 flex-1 text-xs leading-5 text-mist">{missing.reason}</span>
                {missing.to && <Link className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:underline" to={missing.to}>去接上 <PlusCircle size={14} /></Link>}
              </div>
            ))}
          </div>
        </article>
      )}

      <p className="text-xs leading-5 text-mist">{profile.caveat}</p>
    </div>
  );
}
