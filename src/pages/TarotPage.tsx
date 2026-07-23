import { Moon, RefreshCw, Sparkles, Star, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Disclaimer from '../components/common/Disclaimer';
import { getBirthCards, drawSpread, type TarotSpreadCard } from '../engines/tarot-engine';
import { useFateStore } from '../store/useFateStore';

const POSITION_ICONS = { 過去: Moon, 現在: Sun, 未來: Star } as const;

export default function TarotPage() {
  const profile = useFateStore((state) => state.profileInput);
  const [spread, setSpread] = useState<TarotSpreadCard[]>([]);
  const [drawCount, setDrawCount] = useState(0);
  const birthCards = profile?.birthDate
    ? getBirthCards(profile.birthDate.replaceAll('-', '').split('').map(Number))
    : undefined;

  const draw = () => {
    setSpread(drawSpread());
    setDrawCount((count) => count + 1);
  };

  return (
    <section className="page-container page-section">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow text-fuchsia-300">Tarot</p>
        <h1 className="display-title mt-3">塔羅牌</h1>
        <p className="mx-auto mt-5 max-w-xl muted">先在心裡想一個問題，抽三張牌，分別對應過去、現在、未來。塔羅是幫你換角度思考的鏡子，不是預言機。</p>
        <button className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-fuchsia-300 px-6 py-3 font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-fuchsia-200 hover:shadow-[0_12px_30px_rgba(240,171,252,0.35)] focus:outline-none focus:ring-2 focus:ring-fuchsia-300 focus:ring-offset-2 focus:ring-offset-ink active:scale-[0.98]" type="button" onClick={draw}>
          {spread.length ? <><RefreshCw size={17} />重新抽三張牌</> : <><Sparkles size={17} />抽三張牌</>}
        </button>
      </div>

      {spread.length > 0 && (
        <div key={drawCount} className="reveal mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-3">
          {spread.map(({ position, positionHint, card, reversed, reading }, index) => {
            const Icon = POSITION_ICONS[position];
            return (
              <article className="flex flex-col overflow-hidden rounded-[24px] border border-fuchsia-300/25 bg-gradient-to-b from-fuchsia-300/[0.07] via-[#161a38] to-[#0b1020]" key={position} style={{ animationDelay: `${index * 120}ms` }}>
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                  <span className="flex items-center gap-2 text-sm font-bold text-fuchsia-200"><Icon size={16} />{position}</span>
                  <span className="text-[11px] text-mist">{positionHint}</span>
                </div>
                <div className="flex flex-1 flex-col p-5 text-center">
                  <p className="text-[11px] tracking-[0.18em] text-mist">{card.en.toUpperCase()}</p>
                  <h2 className="mt-1 font-serif text-3xl font-semibold text-cream">{card.name}</h2>
                  <span className={`mx-auto mt-2 rounded-full px-3 py-1 text-[11px] font-semibold ${reversed ? 'bg-amber-200/10 text-amber-200' : 'bg-emerald-300/10 text-emerald-200'}`}>{reversed ? '逆位' : '正位'}</span>
                  <div className="mx-auto mt-4 flex flex-wrap justify-center gap-1.5">
                    {card.keywords.map((keyword) => <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-mist" key={keyword}>{keyword}</span>)}
                  </div>
                  <p className="mt-5 flex-1 text-left text-sm leading-7 text-mist">{reading}</p>
                  <div className="mt-4 rounded-xl border border-white/10 bg-ink/40 p-3.5 text-left">
                    <span className="text-[11px] font-bold tracking-wider text-fuchsia-300">可以試試</span>
                    <p className="mt-1.5 text-sm leading-6 text-cream">{card.advice}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mx-auto mt-12 max-w-3xl">
        <article className="glass-card p-6 sm:p-7">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><Star className="text-fuchsia-300" size={20} />你的生日塔羅</h2>
          {birthCards ? (
            <div className="mt-4">
              <p className="leading-7 text-mist">把你生日的所有數字相加得到 {birthCards.sum}，對應的人格牌是「<span className="text-cream">{birthCards.personality.name}</span>」——{birthCards.personality.upright}{!birthCards.samePersonalityAndSoul && <>；再把數字加總一次，靈魂牌是「<span className="text-cream">{birthCards.soul.name}</span>」——{birthCards.soul.upright}</>}</p>
              <p className="mt-3 text-sm leading-6 text-mist">人格牌是你外在的行事風格，靈魂牌是內在深層的動力；{birthCards.samePersonalityAndSoul ? '你的兩張牌相同，代表內外一致。' : '兩張牌一起看，就是外在與內在的對照。'}</p>
            </div>
          ) : (
            <p className="mt-4 leading-7 text-mist">完成命盤輸入後，這裡會依你的生日算出專屬的人格牌與靈魂牌。<Link className="ml-1 text-fuchsia-300 underline-offset-4 hover:underline" to="/profile">前往探索命盤</Link></p>
          )}
        </article>
      </div>
      <div className="mx-auto mt-8 max-w-3xl"><Disclaimer /></div>
    </section>
  );
}
