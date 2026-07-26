import { Sparkles, Split } from 'lucide-react';
import type { FateSnapshot } from '../../engines/fate-snapshot-engine';

/**
 * 命運速寫卡：融合解讀頁的第一個區塊。
 * 視覺上刻意比下方所有圖表更重（金色描邊、漸層底、較大字級），
 * 讓使用者第一眼讀到結論而不是資料。
 */
export default function FateSnapshotCard({ snapshot }: { snapshot: FateSnapshot }) {
  return (
    <section
      className="reveal overflow-hidden rounded-[2rem] border border-gold/40 bg-gradient-to-br from-gold/[0.12] via-white/[0.05] to-transparent p-6 shadow-glow sm:p-8"
      aria-labelledby="fate-snapshot-title"
    >
      <div className="flex items-center gap-2.5 text-gold">
        <Sparkles size={18} />
        <p className="eyebrow text-gold">Fate snapshot</p>
      </div>
      <h2 id="fate-snapshot-title" className="mt-3 font-serif text-2xl font-bold text-cream sm:text-3xl">命運速寫</h2>

      <p className="mt-5 font-serif text-lg leading-9 text-cream sm:text-xl sm:leading-10">{snapshot.consensusLine}</p>

      {snapshot.tensionLine && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-vermilion/30 bg-vermilion/[0.07] p-4 sm:p-5">
          <Split className="mt-1 shrink-0 text-[#e8927f]" size={18} />
          <p className="leading-8 text-mist">{snapshot.tensionLine}</p>
        </div>
      )}

      <p className="mt-5 text-[15px] leading-7 text-mist/90">{snapshot.closingLine}</p>

      {snapshot.supportingSystems.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gold/[0.18] pt-4">
          <span className="text-xs text-mist">共識來自</span>
          {snapshot.supportingSystems.map((system) => (
            <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-2.5 py-1 text-xs text-gold" key={system}>{system}</span>
          ))}
        </div>
      )}
    </section>
  );
}
