import type { AstrologyResult } from '../../types/fate';

const signs = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];
const abbreviations: Record<string, string> = { 太陽: '日', 月亮: '月', 水星: '水', 金星: '金', 火星: '火', 木星: '木', 土星: '土', 天王星: '天', 海王星: '海', 冥王星: '冥' };

function point(longitude: number, radius: number) {
  const angle = (longitude - 90) * Math.PI / 180;
  return { x: 210 + Math.cos(angle) * radius, y: 210 + Math.sin(angle) * radius };
}

export default function NatalChart({ result }: { result: AstrologyResult }) {
  const planets = result.planets ?? [];
  const aspectMap = new Map(planets.map((planet) => [planet.name, point(planet.longitude, 105)]));
  return (
    <div>
      <svg className="mx-auto h-auto w-full max-w-[480px]" viewBox="0 0 420 420" role="img" aria-label="西洋星盤行星黃道位置圖">
        <circle cx="210" cy="210" r="188" fill="#0d1428" stroke="rgba(216,184,117,.45)" />
        <circle cx="210" cy="210" r="150" fill="none" stroke="rgba(255,255,255,.15)" />
        <circle cx="210" cy="210" r="92" fill="none" stroke="rgba(255,255,255,.1)" />
        {signs.map((sign, index) => {
          const outer = point(index * 30, 188);
          const inner = point(index * 30, 92);
          const label = point(index * 30 + 15, 169);
          return <g key={sign}><line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,.14)" /><text x={label.x} y={label.y} fill="#aeb7ca" fontSize="10" textAnchor="middle" dominantBaseline="middle">{sign}</text></g>;
        })}
        {(result.aspects ?? []).slice(0, 18).map((aspect) => {
          const first = aspectMap.get(aspect.first); const second = aspectMap.get(aspect.second);
          if (!first || !second) return null;
          const tone = aspect.type === '三分相' || aspect.type === '六合' ? 'rgba(110,231,183,.38)' : aspect.type === '四分相' || aspect.type === '對分相' ? 'rgba(251,146,160,.32)' : 'rgba(216,184,117,.35)';
          return <line key={`${aspect.first}-${aspect.second}-${aspect.type}`} x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke={tone} strokeWidth="1" />;
        })}
        {planets.map((planet, index) => {
          const position = point(planet.longitude, 112 + (index % 2) * 15);
          return <g key={planet.name}><circle cx={position.x} cy={position.y} r="11" fill="#182143" stroke="rgba(216,184,117,.7)" /><text x={position.x} y={position.y} fill="#f4e7c8" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="middle">{abbreviations[planet.name]}</text></g>;
        })}
        <text x="210" y="202" fill="#d8b875" fontSize="13" textAnchor="middle">太陽 {result.sunSign}</text>
        <text x="210" y="222" fill="#aeb7ca" fontSize="12" textAnchor="middle">月亮 {result.moonSign ?? '未計算'}</text>
        <text x="210" y="241" fill="#778199" fontSize="9" textAnchor="middle">{result.risingSign ? `上升 ${result.risingSign} · 等宮制` : '未提供經緯度，未計算上升／宮位'}</text>
      </svg>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">{planets.map((planet) => <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3" key={planet.name}><div className="flex items-center justify-between gap-2"><span className="text-xs text-mist">{planet.name}</span>{planet.retrograde && <span className="text-[10px] text-amber-100">逆行</span>}</div><p className="mt-1 text-sm font-semibold text-cream">{planet.sign}</p><p className="text-[11px] tabular-nums text-mist">{planet.degreeInSign.toFixed(2)}°{planet.house ? ` · 第 ${planet.house} 宮` : ''}</p></div>)}</div>
      {(result.aspects?.length ?? 0) > 0 && <details className="mt-4 rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-semibold text-cream">主要相位 {result.aspects?.length} 組</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{result.aspects?.map((aspect) => <p className="text-xs text-mist" key={`${aspect.first}-${aspect.second}-${aspect.type}`}>{aspect.first} × {aspect.second}：<span className="text-cream">{aspect.type}</span>（容許度 {aspect.orb.toFixed(2)}°）</p>)}</div></details>}
    </div>
  );
}
