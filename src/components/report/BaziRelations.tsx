import type { BaziResult } from '../../types/fate';
import { ELEMENT_LABELS } from '../../utils/constants';
import { calculateBaziRelations } from '../../engines/bazi-relations-engine';

export default function BaziRelations({ result }: { result: BaziResult }) {
  const relations = result.relations ?? calculateBaziRelations(result.pillars);
  return (
    <section className="glass-card mt-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><p className="eyebrow">Stem & branch relations</p><h3 className="mt-1 font-serif text-xl font-semibold text-cream">四柱合沖刑害結構</h3></div>
        <span className="text-xs text-mist">偵測到 {relations.length} 組</span>
      </div>
      {relations.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {relations.map((relation, index) => (
            <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={`${relation.kind}-${relation.members.join('')}-${index}`}>
              <div className="flex items-center justify-between gap-3"><strong className="text-cream">{relation.label}</strong>{relation.element && <span className="rounded-full bg-gold/10 px-2 py-1 text-[10px] text-gold">{ELEMENT_LABELS[relation.element]}</span>}</div>
              <p className="mt-2 font-serif text-2xl text-gold">{relation.members.join(' · ')}</p>
              <p className="mt-1 text-xs text-mist">涉及：{relation.pillarLabels.join('、')}</p>
              <p className="mt-3 text-xs leading-5 text-mist">{relation.note}</p>
            </article>
          ))}
        </div>
      ) : <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-mist">四柱主干支未形成目前收錄的五合、六合、六沖、六害、六破、刑、三合或三會組合。這不代表命盤缺少互動，藏干與運限仍會帶來其他關係。</p>}
      <p className="mt-4 text-xs leading-5 text-mist">此區只標記固定表格關係，不判斷是否化氣、喜忌或事件吉凶；完整判讀仍需月令、透干、藏干及運限共同檢視。</p>
    </section>
  );
}
