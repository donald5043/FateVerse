import type { ChartFingerprint } from '../../engines/chart-fingerprint-engine';

export default function ChartFingerprintArt({ fingerprint }: { fingerprint: ChartFingerprint }) {
  const { size } = fingerprint;
  const center = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="chart-enter mx-auto h-auto w-full max-w-[360px]" role="img" aria-label="由你的命盤生成的獨一無二命之圖騰">
      <defs>
        <radialGradient id="fp-core-glow">
          <stop offset="0%" stopColor={fingerprint.coreColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={fingerprint.coreColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={size} height={size} fill="#0a0f20" rx="20" />
      <circle cx={center} cy={center} r={size * 0.28} fill="url(#fp-core-glow)" />

      {fingerprint.rings.map((ring, index) => (
        <circle key={`ring-${index}`} cx={center} cy={center} r={ring.radius} fill="none" stroke={ring.color} strokeWidth={ring.width} strokeOpacity="0.55" strokeDasharray={ring.dash ? '3 5' : undefined} />
      ))}
      {fingerprint.spokes.map((spoke, index) => (
        <line key={`spoke-${index}`} x1={spoke.x1} y1={spoke.y1} x2={spoke.x2} y2={spoke.y2} stroke={spoke.color} strokeWidth={spoke.width} strokeOpacity="0.28" />
      ))}
      <polygon points={fingerprint.corePolygon.map((point) => `${point.x},${point.y}`).join(' ')} fill={fingerprint.coreColor} fillOpacity="0.16" stroke={fingerprint.coreColor} strokeWidth="1.4" strokeOpacity="0.8" />
      {fingerprint.nodes.map((node, index) => (
        <circle key={`node-${index}`} cx={node.x} cy={node.y} r={node.size} fill={node.color} fillOpacity="0.85" />
      ))}
      <circle cx={center} cy={center} r="3" fill={fingerprint.coreColor} />
      <text x={center} y={size - 12} textAnchor="middle" fill="rgba(174,184,214,0.6)" fontSize="9" fontFamily="ui-monospace, monospace" style={{ letterSpacing: '0.2em' }}>{fingerprint.binaryCode} · 卦 {fingerprint.hexagramIndex}</text>
    </svg>
  );
}
