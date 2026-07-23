import type { AspectResult, AstrologyResult } from '../../types/fate';

const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const SIGN_NAMES = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];
// 火土風水四元素分色
const SIGN_COLORS = ['#fb7185', '#d8b875', '#5eead4', '#7dd3fc'];
const PLANET_GLYPHS: Record<string, string> = { 太陽: '☉', 月亮: '☽', 水星: '☿', 金星: '♀', 火星: '♂', 木星: '♃', 土星: '♄', 天王星: '♅', 海王星: '♆', 冥王星: '♇' };

const ASPECT_COLORS: Record<AspectResult['quality'], string> = {
  fusion: 'rgba(216,184,117,.55)',
  flow: 'rgba(110,231,183,.5)',
  tension: 'rgba(251,113,133,.45)',
  polarity: 'rgba(167,139,250,.5)',
};

const CENTER = 220;

export default function NatalChart({ result }: { result: AstrologyResult }) {
  const planets = result.planets ?? [];
  const ascCusp = result.houses?.find((house) => house.house === 1)?.cusp;

  // 有上升時採傳統排列：上升在左、黃道逆時針；否則牡羊 0 度在上。
  const toRadians = (longitude: number) => ((ascCusp !== undefined ? 180 + (longitude - ascCusp) : 90 - longitude) * Math.PI) / 180;
  const point = (longitude: number, radius: number) => {
    const angle = toRadians(longitude);
    return { x: CENTER + Math.cos(angle) * radius, y: CENTER - Math.sin(angle) * radius };
  };

  // 依經度排序後，鄰近行星改用不同半徑，避免符號互相重疊。
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const radiusByName = new Map<string, number>();
  const RADII = [148, 128, 166];
  sorted.forEach((planet, index) => {
    const previous = sorted[index - 1];
    if (previous && Math.abs(planet.longitude - previous.longitude) < 9) {
      const previousRadius = radiusByName.get(previous.name) ?? RADII[0];
      const nextIndex = (RADII.indexOf(previousRadius) + 1) % RADII.length;
      radiusByName.set(planet.name, RADII[nextIndex]);
    } else {
      radiusByName.set(planet.name, RADII[0]);
    }
  });
  const hubPoint = new Map(planets.map((planet) => [planet.name, point(planet.longitude, 108)]));

  return (
    <div>
      <svg className="chart-enter mx-auto h-auto w-full max-w-[520px]" viewBox="0 0 440 440" role="img" aria-label="西洋出生星盤輪盤圖">
        <circle cx={CENTER} cy={CENTER} r={212} fill="#0c1226" stroke="rgba(216,184,117,.5)" strokeWidth="1.5" />
        <circle cx={CENTER} cy={CENTER} r={178} fill="#0e1530" stroke="rgba(255,255,255,.16)" />
        <circle cx={CENTER} cy={CENTER} r={108} fill="#0a0f22" stroke="rgba(255,255,255,.12)" />

        {/* 星座環：符號、名稱與分界 */}
        {SIGN_GLYPHS.map((glyph, index) => {
          const start = point(index * 30, 212);
          const inner = point(index * 30, 178);
          const glyphPosition = point(index * 30 + 15, 200);
          const namePosition = point(index * 30 + 15, 187);
          const color = SIGN_COLORS[index % 4];
          return (
            <g key={glyph}>
              <line x1={inner.x} y1={inner.y} x2={start.x} y2={start.y} stroke="rgba(216,184,117,.3)" />
              <text x={glyphPosition.x} y={glyphPosition.y} fill={color} fontSize="15" textAnchor="middle" dominantBaseline="middle">{glyph}</text>
              <text x={namePosition.x} y={namePosition.y} fill="rgba(174,184,214,.75)" fontSize="7.5" textAnchor="middle" dominantBaseline="middle">{SIGN_NAMES[index]}</text>
            </g>
          );
        })}

        {/* 刻度：每 10 度一格、每 5 度小格 */}
        {Array.from({ length: 72 }, (_, index) => index * 5).map((degree) => {
          const isMajor = degree % 10 === 0;
          const outer = point(degree, 178);
          const inner = point(degree, isMajor ? 171 : 174.5);
          return <line key={degree} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={isMajor ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.12)'} strokeWidth="0.8" />;
        })}

        {/* 宮位：等宮制宮首線與宮號 */}
        {result.houses?.map((house) => {
          const outer = point(house.cusp, 178);
          const inner = point(house.cusp, 108);
          const label = point(house.cusp + 15, 117);
          const isAsc = house.house === 1;
          return (
            <g key={house.house}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={isAsc ? 'rgba(216,184,117,.8)' : 'rgba(255,255,255,.14)'} strokeWidth={isAsc ? 1.6 : 0.8} strokeDasharray={isAsc ? undefined : '3 3'} />
              <text x={label.x} y={label.y} fill="rgba(174,184,214,.6)" fontSize="8" textAnchor="middle" dominantBaseline="middle">{house.house}</text>
            </g>
          );
        })}
        {ascCusp !== undefined && (() => { const label = point(ascCusp, 196); return <text x={label.x} y={label.y} fill="#d8b875" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="middle">ASC</text>; })()}

        {/* 相位線：依性質分色，緊密相位較粗 */}
        {(result.aspects ?? []).map((aspect) => {
          const first = hubPoint.get(aspect.first);
          const second = hubPoint.get(aspect.second);
          if (!first || !second) return null;
          return (
            <line
              key={`${aspect.first}-${aspect.second}-${aspect.type}`}
              x1={first.x} y1={first.y} x2={second.x} y2={second.y}
              stroke={ASPECT_COLORS[aspect.quality]}
              strokeWidth={aspect.closeness === 'tight' ? 1.7 : aspect.closeness === 'moderate' ? 1.1 : 0.7}
            />
          );
        })}

        {/* 行星：符號、度數與逆行標記 */}
        {planets.map((planet) => {
          const radius = radiusByName.get(planet.name) ?? 148;
          const position = point(planet.longitude, radius);
          const anchor = point(planet.longitude, 108);
          const tick = point(planet.longitude, 172);
          return (
            <g key={planet.name}>
              <line x1={anchor.x} y1={anchor.y} x2={tick.x} y2={tick.y} stroke="rgba(216,184,117,.16)" strokeWidth="0.7" />
              <circle cx={position.x} cy={position.y} r="12.5" fill="#182143" stroke={planet.retrograde ? 'rgba(251,191,36,.75)' : 'rgba(216,184,117,.7)'} strokeWidth="1.2" />
              <text x={position.x} y={position.y - 1} fill="#f4e7c8" fontSize="13" textAnchor="middle" dominantBaseline="middle">{PLANET_GLYPHS[planet.name] ?? planet.name[0]}</text>
              <text x={position.x} y={position.y + 20} fill="rgba(174,184,214,.85)" fontSize="7.5" textAnchor="middle">{Math.floor(planet.degreeInSign)}°{planet.retrograde ? ' ℞' : ''}</text>
            </g>
          );
        })}

        <text x={CENTER} y={CENTER - 12} fill="#d8b875" fontSize="13" textAnchor="middle">☉ {result.sunSign}</text>
        <text x={CENTER} y={CENTER + 8} fill="#aeb7ca" fontSize="12" textAnchor="middle">☽ {result.moonSign ?? '未計算'}</text>
        <text x={CENTER} y={CENTER + 27} fill="#778199" fontSize="9" textAnchor="middle">{result.risingSign ? `ASC ${result.risingSign}` : '未提供座標，未計算上升'}</text>
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-mist">
        <span><span className="text-[#d8b875]">━</span> 合相</span>
        <span><span className="text-emerald-300">━</span> 三分／六合</span>
        <span><span className="text-rose-400">━</span> 四分</span>
        <span><span className="text-violet-400">━</span> 對分</span>
        <span className="text-amber-200">℞ 逆行</span>
        {ascCusp !== undefined && <span>上升在左 · 傳統排列</span>}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">{planets.map((planet) => <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3" key={planet.name}><div className="flex items-center justify-between gap-2"><span className="text-xs text-mist">{PLANET_GLYPHS[planet.name]} {planet.name}</span>{planet.retrograde && <span className="text-[10px] text-amber-100">逆行</span>}</div><p className="mt-1 text-sm font-semibold text-cream">{planet.sign}</p><p className="text-[11px] tabular-nums text-mist">{planet.degreeInSign.toFixed(2)}°{planet.house ? ` · 第 ${planet.house} 宮` : ''}</p></div>)}</div>
      {(result.aspects?.length ?? 0) > 0 && <details className="mt-4 rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-semibold text-cream">主要相位 {result.aspects?.length} 組</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{result.aspects?.map((aspect) => <p className="text-xs text-mist" key={`${aspect.first}-${aspect.second}-${aspect.type}`}>{aspect.first} × {aspect.second}：<span className="text-cream">{aspect.type}</span>（容許度 {aspect.orb.toFixed(2)}°）</p>)}</div></details>}
    </div>
  );
}
