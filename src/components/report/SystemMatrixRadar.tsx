import { Radar } from 'lucide-react';
import { useState } from 'react';
import type { FusionMatrix } from '../../types/fate';

const SYSTEM_COLORS: Record<string, string> = {
  八字: '#d8b875',
  西洋星座: '#5eead4',
  生肖: '#a78bfa',
  生命靈數: '#fb7185',
  生日塔羅: '#f0abfc',
  手相: '#6ee7b7',
};

const FALLBACK_COLOR = '#aeb8d6';
const CENTER = 160;
const RADIUS = 118;

function color(system: string): string {
  return SYSTEM_COLORS[system] ?? FALLBACK_COLOR;
}

export default function SystemMatrixRadar({ matrix }: { matrix: FusionMatrix }) {
  const [active, setActive] = useState<string | null>(null);
  const axisCount = matrix.rows.length;
  // 每條軸的角度（從正上方順時針）。
  const angleOf = (index: number) => (Math.PI * 2 * index) / axisCount - Math.PI / 2;
  // 軸值 -100..100 → 半徑；0 在中圈，正值往「左側標籤」方向的外圈、負值往內。這裡以絕對距離呈現立場強度，方向用色點在兩端表示。
  const pointOf = (index: number, value: number) => {
    const magnitude = (Math.abs(value) / 100) * RADIUS;
    const angle = angleOf(index);
    return { x: CENTER + Math.cos(angle) * magnitude, y: CENTER + Math.sin(angle) * magnitude };
  };

  const polygonFor = (system: string) => matrix.rows
    .map((row, index) => {
      const cell = row.cells.find((item) => item.system === system);
      const point = pointOf(index, cell?.value ?? 0);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <article className="glass-card p-5 sm:p-7">
      <h3 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><Radar className="text-gold" size={20} />系統 × 面向總覽</h3>
      <p className="mt-2 text-sm leading-6 text-mist">每條軸是一個性格面向，每種顏色是一套系統，離中心越遠代表該系統在這個面向的立場越鮮明。點圖例可單獨看某一套。</p>

      <div className="mt-5 grid items-center gap-6 lg:grid-cols-[320px_1fr]">
        <svg viewBox="0 0 320 340" className="mx-auto h-auto w-full max-w-[320px]" role="img" aria-label="系統與性格面向雷達圖">
          {[0.33, 0.66, 1].map((ratio) => (
            <polygon
              key={ratio}
              points={matrix.rows.map((_, index) => { const angle = angleOf(index); return `${CENTER + Math.cos(angle) * RADIUS * ratio},${CENTER + Math.sin(angle) * RADIUS * ratio}`; }).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
            />
          ))}
          {matrix.rows.map((row, index) => {
            const angle = angleOf(index);
            const outer = { x: CENTER + Math.cos(angle) * RADIUS, y: CENTER + Math.sin(angle) * RADIUS };
            const label = { x: CENTER + Math.cos(angle) * (RADIUS + 22), y: CENTER + Math.sin(angle) * (RADIUS + 22) };
            return (
              <g key={row.axisId}>
                <line x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.12)" />
                <text x={label.x} y={label.y} fill="#aeb8d6" fontSize="11" fontWeight="600" textAnchor="middle" dominantBaseline="middle">{row.label}</text>
              </g>
            );
          })}
          {matrix.systems.filter((system) => !active || active === system).map((system) => (
            <polygon
              key={system}
              points={polygonFor(system)}
              fill={color(system)}
              fillOpacity={active === system ? 0.22 : 0.08}
              stroke={color(system)}
              strokeWidth={active === system ? 2 : 1.3}
              strokeOpacity={0.85}
            />
          ))}
        </svg>

        <div>
          <div className="flex flex-wrap gap-2">
            {matrix.systems.map((system) => (
              <button
                key={system}
                type="button"
                onClick={() => setActive((current) => (current === system ? null : system))}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${active === system ? 'border-white/30 bg-white/[0.08] text-cream' : 'border-white/10 text-mist hover:border-white/20'}`}
                aria-pressed={active === system}
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: color(system) }} />
                {system}
              </button>
            ))}
            {active && <button type="button" onClick={() => setActive(null)} className="rounded-full px-3 py-1.5 text-xs text-gold hover:underline">顯示全部</button>}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[360px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-mist">
                  <th className="py-2 pr-2 text-left font-semibold">面向</th>
                  <th className="py-2 text-left font-semibold" colSpan={2}>立場光譜</th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => {
                  const shown = active ? row.cells.filter((cell) => cell.system === active) : row.cells;
                  return (
                    <tr className="border-b border-white/5 align-top" key={row.axisId}>
                      <td className="py-2.5 pr-2"><span className="font-semibold text-cream">{row.label}</span><div className="mt-0.5 text-[10px] text-mist">{row.leftLabel} ↔ {row.rightLabel}</div></td>
                      <td className="py-2.5" colSpan={2}>
                        <div className="flex flex-wrap gap-1.5">
                          {shown.map((cell) => (
                            <span key={cell.system} className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5" style={{ color: color(cell.system) }}>
                              {cell.system}
                              <span className="text-mist">{cell.value > 8 ? `偏${row.leftLabel}` : cell.value < -8 ? `偏${row.rightLabel}` : '居中'}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-mist">同一面向上顏色都往同一端靠攏，代表各系統少見地口徑一致；散開則代表這個面向比較多元、看場合切換。這是把不同系統並列觀察，不是誰對誰錯。</p>
    </article>
  );
}
