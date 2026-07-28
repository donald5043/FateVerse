import type { AstrologyResult, BaziResult, ZiweiResult } from '../../types/fate';
import {
  PLANET_TOPIC_PLAIN, SIGN_BEHAVIOUR_PLAIN, TEN_GOD_LIBRARY,
  ZIWEI_PALACE_PLAIN, ZIWEI_STAR_PLAIN,
} from '../../data/interpretation-library';

export function BaziTenGodInsights({ result }: { result: BaziResult }) {
  const counts = new Map<string, number>();
  result.pillars.flatMap((pillar) => [pillar.tenGod, ...pillar.hiddenTenGods]).filter((name) => name !== '日主').forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1));
  const entries = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  return <div className="mt-6"><h3 className="font-serif text-xl font-semibold text-cream">十神結構參考</h3><p className="mt-2 text-xs leading-5 text-mist">計數同時包含天干與藏干，只表示盤面出現次數，不等同旺衰、喜忌或吉凶。</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{entries.map(([name, count]) => { const content = TEN_GOD_LIBRARY[name]; return <article className="rounded-xl border border-white/10 bg-white/[0.035] p-4" key={name}><div className="flex items-center justify-between"><h4 className="font-semibold text-gold">{name}</h4><span className="text-xs text-mist">出現 {count} 次</span></div><p className="mt-2 text-sm text-cream">{content?.theme ?? '傳統十神關係'}</p><p className="mt-2 text-xs leading-5 text-mist">{content?.reflection ?? '需結合日主強弱、月令與整體結構閱讀。'}</p></article>; })}</div></div>;
}

/**
 * 走得快的個人行星才因人而異；外行星換一次星座要好幾年，
 * 同齡人多半落在一樣的位置。兩者分開講，否則會把世代背景說成個人特色。
 */
const PERSONAL_PLANETS = ['太陽', '月亮', '水星', '金星', '火星'];

export function AstrologyPositionInsights({ result }: { result: AstrologyResult }) {
  const planets = result.planets ?? [];
  const personal = planets.filter((planet) => PERSONAL_PLANETS.includes(planet.name));
  const outer = planets.filter((planet) => !PERSONAL_PLANETS.includes(planet.name));

  return (
    <div className="mt-6">
      <h3 className="font-serif text-xl font-semibold text-cream">行星落在哪裡，實際上是什麼意思</h3>
      <p className="mt-2 text-xs leading-5 text-mist">每顆行星問你一件事，落入的星座決定你怎麼回答。</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {personal.map((planet) => (
          <article className="rounded-xl border border-white/10 bg-white/[0.035] p-4" key={planet.name}>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gold">{planet.name}在{planet.sign}</h4>
              {planet.retrograde && <span className="text-xs text-amber-100">逆行</span>}
            </div>
            <p className="mt-2 text-sm leading-7 text-cream">{PLANET_TOPIC_PLAIN[planet.name]}？</p>
            <p className="mt-1 text-sm leading-7 text-mist">{SIGN_BEHAVIOUR_PLAIN[planet.sign]}。</p>
          </article>
        ))}
      </div>

      {outer.length > 0 && (
        <article className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="font-semibold text-mist">走得慢的那幾顆</h4>
          <p className="mt-2 text-sm leading-7 text-mist">
            {outer.map((planet) => `${planet.name}在${planet.sign}`).join('、')}。
            這幾顆換一次星座要好幾年，所以和你同齡的人多半落在一樣的位置——它們描述的是一整代人的背景，不是你和別人的差別。要看你自己，上面那幾顆才是。
          </p>
        </article>
      )}
    </div>
  );
}

export function ZiweiKeyPalaceInsights({ result }: { result: ZiweiResult }) {
  const keyNames = ['命宮', '官祿', '財帛', '夫妻', '福德'];
  const palaces = keyNames
    .map((name) => result.palaces.find((palace) => palace.name === name))
    .filter((palace) => palace !== undefined);

  return (
    <div className="mt-6">
      <h3 className="font-serif text-xl font-semibold text-cream">五個主要宮位在講什麼</h3>
      <p className="mt-2 text-xs leading-5 text-mist">宮位是題目，坐在裡面的主星是你回答那道題的方式。空宮要借對宮看，這裡只給入口。</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {palaces.map((palace) => (
          <article className="rounded-xl border border-white/10 bg-white/[0.035] p-4" key={palace.name}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gold">{palace.name}</h4>
                <p className="mt-1 text-sm text-cream">{ZIWEI_PALACE_PLAIN[palace.name] ?? palace.name}</p>
              </div>
              <span className="shrink-0 text-xs text-mist">{palace.heavenlyStem}{palace.earthlyBranch}</span>
            </div>
            <div className="mt-3 space-y-2">
              {palace.majorStars.length ? palace.majorStars.map((star) => (
                <p className="text-sm leading-7 text-mist" key={star.name}>
                  <span className="text-cream">{star.name}</span>：{ZIWEI_STAR_PLAIN[star.name] ?? '這顆星要連同宮位與其他星一起看'}
                  {star.mutagen ? `。本命化${star.mutagen}，代表這一塊在你身上被放大。` : '。'}
                </p>
              )) : (
                <p className="text-sm leading-7 text-mist">這個宮位沒有主星。紫微的做法是借對面那一宮來看——實際的意思是這一塊比較跟著環境走，沒有固定的預設值。</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
