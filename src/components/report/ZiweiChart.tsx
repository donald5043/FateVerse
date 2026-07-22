import type { ZiweiPalace, ZiweiResult } from '../../types/fate';

const gridPositions = [
  [1, 1], [1, 2], [1, 3], [1, 4], [2, 4], [3, 4],
  [4, 4], [4, 3], [4, 2], [4, 1], [3, 1], [2, 1],
] as const;

function PalaceCard({ palace, style }: { palace: ZiweiPalace; style?: React.CSSProperties }) {
  return <article className={`min-h-32 border border-white/10 bg-[#10172c] p-3 ${palace.name === '命宮' ? 'ring-1 ring-inset ring-gold/50' : ''}`} style={style}><div className="flex items-start justify-between gap-2"><div><span className="text-xs text-mist">{palace.heavenlyStem}{palace.earthlyBranch}</span><h4 className="font-serif text-base font-semibold text-cream">{palace.name}</h4></div><div className="flex gap-1">{palace.isBodyPalace && <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[9px] text-gold">身宮</span>}{palace.isOriginalPalace && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-mist">來因</span>}</div></div><div className="mt-2 space-y-1">{palace.majorStars.length ? palace.majorStars.map((star) => <p className="text-xs font-semibold text-gold" key={star.name}>{star.name}{star.brightness ? ` · ${star.brightness}` : ''}{star.mutagen ? ` · 化${star.mutagen}` : ''}</p>) : <p className="text-xs text-mist">無十四主星</p>}</div>{palace.minorStars.length > 0 && <p className="mt-2 text-[10px] leading-4 text-mist">{palace.minorStars.slice(0, 4).map((star) => star.name).join('、')}</p>}<p className="mt-2 text-[9px] text-mist">大限 {palace.decadalRange[0]}–{palace.decadalRange[1]}</p></article>;
}

export default function ZiweiChart({ result }: { result: ZiweiResult }) {
  return <div><div className="hidden grid-cols-4 md:grid">{result.palaces.map((palace, index) => <PalaceCard key={`${palace.name}-${palace.earthlyBranch}`} palace={palace} style={{ gridRow: gridPositions[index][0], gridColumn: gridPositions[index][1] }} />)}<div className="col-span-2 row-span-2 flex flex-col items-center justify-center border border-gold/25 bg-gold/[0.055] p-5 text-center" style={{ gridRow: '2 / span 2', gridColumn: '2 / span 2' }}><p className="eyebrow">Zi Wei Dou Shu</p><h3 className="mt-2 font-serif text-2xl font-semibold text-cream">{result.fiveElementsClass}</h3><p className="mt-3 text-sm text-mist">命主 <span className="text-gold">{result.soul}</span> · 身主 <span className="text-gold">{result.body}</span></p><p className="mt-1 text-xs text-mist">命宮 {result.soulPalaceBranch} · 身宮 {result.bodyPalaceBranch}</p></div></div><div className="grid grid-cols-2 md:hidden">{result.palaces.map((palace) => <PalaceCard key={`${palace.name}-${palace.earthlyBranch}`} palace={palace} />)}</div><p className="mt-4 text-xs leading-5 text-mist">{result.calculationNote}</p></div>;
}
