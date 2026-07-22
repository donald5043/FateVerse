import type { FiveElementResult } from '../../types/fate';
import { ELEMENT_LABELS } from '../../utils/constants';

const colors = { wood: '#78a987', fire: '#d98472', earth: '#c9a86a', metal: '#c2c8d7', water: '#708ac2' } as const;

export default function FiveElementChart({ result }: { result: FiveElementResult }) {
  return (
    <div className="space-y-4" aria-label="五行分布圖">
      {(Object.keys(ELEMENT_LABELS) as (keyof typeof ELEMENT_LABELS)[]).map((key) => (
        <div key={key} className="grid grid-cols-[2rem_1fr_3.5rem] items-center gap-3">
          <span className="font-serif font-semibold text-cream">{ELEMENT_LABELS[key]}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${result.percentages[key]}%`, backgroundColor: colors[key] }} />
          </div>
          <span className="text-right text-sm tabular-nums text-mist">{result.percentages[key]}%</span>
        </div>
      ))}
    </div>
  );
}
