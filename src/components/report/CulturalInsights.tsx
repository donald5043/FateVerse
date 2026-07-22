import type { AstrologyResult, BaziResult, ZiweiResult } from '../../types/fate';
import { PLANET_LIBRARY, SIGN_STYLE_LIBRARY, TEN_GOD_LIBRARY, ZIWEI_PALACE_LIBRARY, ZIWEI_STAR_LIBRARY } from '../../data/interpretation-library';

export function BaziTenGodInsights({ result }: { result: BaziResult }) {
  const counts = new Map<string, number>();
  result.pillars.flatMap((pillar) => [pillar.tenGod, ...pillar.hiddenTenGods]).filter((name) => name !== '日主').forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1));
  const entries = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  return <div className="mt-6"><h3 className="font-serif text-xl font-semibold text-cream">十神結構參考</h3><p className="mt-2 text-xs leading-5 text-mist">計數同時包含天干與藏干，只表示盤面出現次數，不等同旺衰、喜忌或吉凶。</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{entries.map(([name, count]) => { const content = TEN_GOD_LIBRARY[name]; return <article className="rounded-xl border border-white/10 bg-white/[0.035] p-4" key={name}><div className="flex items-center justify-between"><h4 className="font-semibold text-gold">{name}</h4><span className="text-xs text-mist">出現 {count} 次</span></div><p className="mt-2 text-sm text-cream">{content?.theme ?? '傳統十神關係'}</p><p className="mt-2 text-xs leading-5 text-mist">{content?.reflection ?? '需結合日主強弱、月令與整體結構閱讀。'}</p></article>; })}</div></div>;
}

export function AstrologyPositionInsights({ result }: { result: AstrologyResult }) {
  return <div className="mt-6"><h3 className="font-serif text-xl font-semibold text-cream">行星落座反思</h3><p className="mt-2 text-xs leading-5 text-mist">以下將天文位置與自編文化關鍵詞組合，不代表科學人格測量。</p><div className="mt-4 grid gap-3 md:grid-cols-2">{result.planets?.map((planet) => <article className="rounded-xl border border-white/10 bg-white/[0.035] p-4" key={planet.name}><div className="flex items-center justify-between"><h4 className="font-semibold text-gold">{planet.name}落入{planet.sign}</h4>{planet.retrograde && <span className="text-xs text-amber-100">逆行</span>}</div><p className="mt-2 text-sm leading-6 text-mist">以「{SIGN_STYLE_LIBRARY[planet.sign]}」的方式處理「{PLANET_LIBRARY[planet.name]}」；可回到實際經驗檢查何時最明顯。</p></article>)}</div></div>;
}

export function ZiweiKeyPalaceInsights({ result }: { result: ZiweiResult }) {
  const keyNames = ['命宮', '官祿', '財帛', '夫妻', '福德'];
  const palaces = keyNames.map((name) => result.palaces.find((palace) => palace.name === name)).filter((palace) => palace !== undefined);
  return <div className="mt-6"><h3 className="font-serif text-xl font-semibold text-cream">五個核心宮位索引</h3><p className="mt-2 text-xs leading-5 text-mist">這是閱讀入口，不是完整論盤；空宮仍需借對宮並查看三方四正。</p><div className="mt-4 grid gap-3 md:grid-cols-2">{palaces.map((palace) => <article className="rounded-xl border border-white/10 bg-white/[0.035] p-4" key={palace.name}><div className="flex items-start justify-between gap-3"><div><h4 className="font-semibold text-gold">{palace.name}</h4><p className="mt-1 text-xs text-mist">{ZIWEI_PALACE_LIBRARY[palace.name]}</p></div><span className="text-xs text-mist">{palace.heavenlyStem}{palace.earthlyBranch}</span></div><div className="mt-3 space-y-2">{palace.majorStars.length ? palace.majorStars.map((star) => <p className="text-sm leading-6 text-mist" key={star.name}><span className="text-cream">{star.name}</span>：{ZIWEI_STAR_LIBRARY[star.name] ?? '需結合宮位與星曜組合閱讀'}{star.mutagen ? `；本命化${star.mutagen}` : ''}</p>) : <p className="text-sm text-mist">命盤此宮無十四主星，需從對宮與三方四正取得主要線索。</p>}</div></article>)}</div></div>;
}
