import { useEffect, useRef } from 'react';

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const SIGNS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const CENTER = 220;

function pol(radius: number, deg: number) {
  const angle = ((deg - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

/** 手繪天文曆式星盤輪：雙環反向旋轉、地支與星座圈、中央新月四角星，並有滑鼠視差。 */
export default function StarChartWheel() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const node = ref.current;
    if (!node) return;
    const onMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
      node.style.transform = `translate(${dx * 16}px, ${dy * 16}px)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const ticks = Array.from({ length: 72 }, (_, index) => index * 5);

  return (
    <div ref={ref} className="float-y mx-auto w-full max-w-[440px] transition-transform duration-300 ease-out" aria-hidden="true">
      <svg viewBox="0 0 440 440" className="h-auto w-full">
        <circle cx={CENTER} cy={CENTER} r="212" stroke="rgba(216,184,117,.1)" strokeWidth="1" fill="none" />

        {/* 逆時針旋轉群：外環 + 刻度 */}
        <g className="spin-reverse" style={{ transformOrigin: '220px 220px' }}>
          <circle cx={CENTER} cy={CENTER} r="200" stroke="rgba(216,184,117,.2)" strokeWidth="1" fill="none" />
          <circle cx={CENTER} cy={CENTER} r="182" stroke="rgba(216,184,117,.14)" strokeWidth=".8" fill="none" />
          {ticks.map((deg, index) => {
            const long = index % 6 === 0;
            const outer = pol(200, deg);
            const inner = pol(long ? 188 : 193, deg);
            return <line key={deg} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={long ? 'rgba(216,184,117,.55)' : 'rgba(216,184,117,.25)'} strokeWidth={long ? 1.1 : 0.7} />;
          })}
        </g>

        {/* 順時針旋轉群：藍色虛線圈 + 12 地支 */}
        <g className="spin-slow" style={{ transformOrigin: '220px 220px' }}>
          <circle cx={CENTER} cy={CENTER} r="150" stroke="rgba(124,159,224,.35)" strokeWidth=".8" strokeDasharray="2 5" fill="none" />
          {BRANCHES.map((branch, index) => {
            const point = pol(166, index * 30);
            return <text key={branch} x={point.x} y={point.y} fill="#d8b875" fontSize="17" fontFamily="'Noto Serif TC', serif" textAnchor="middle" dominantBaseline="central">{branch}</text>;
          })}
        </g>

        {/* 逆時針群：12 星座字符 */}
        <g className="spin-reverse" style={{ transformOrigin: '220px 220px' }}>
          {SIGNS.map((sign, index) => {
            const point = pol(134, index * 30 + 15);
            return <text key={sign} x={point.x} y={point.y} fill="rgba(124,159,224,.85)" fontSize="15" textAnchor="middle" dominantBaseline="central">{sign}</text>;
          })}
        </g>

        {/* 中心圓 + 新月四角星 */}
        <circle cx={CENTER} cy={CENTER} r="66" fill="#0b1020" stroke="rgba(216,184,117,.3)" strokeWidth="1" />
        <circle cx={CENTER} cy={CENTER} r="52" fill="none" stroke="rgba(216,184,117,.2)" strokeWidth=".7" />
        <path d="M220 182 A38 38 0 1 0 220 258 A29 29 0 1 1 220 182 Z" fill="#d8b875" />
        <path d="M236 198 l3.4 9 9 3.4 -9 3.4 -3.4 9 -3.4 -9 -9 -3.4 9 -3.4 Z" fill="#ecd39a" />
      </svg>
    </div>
  );
}
