import { Moon, RefreshCw, Sparkles, Star, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import BackToReportLink from '../components/common/BackToReportLink';
import Disclaimer from '../components/common/Disclaimer';
import { getBirthCards, drawSpread, type TarotSpreadCard } from '../engines/tarot-engine';
import { useFateStore } from '../store/useFateStore';

const POSITION_ICONS = { 過去: Moon, 現在: Sun, 未來: Star } as const;
const ROMAN = ['0', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ', 'ⅩⅢ', 'ⅩⅣ', 'ⅩⅤ', 'ⅩⅥ', 'ⅩⅦ', 'ⅩⅧ', 'ⅩⅨ', 'ⅩⅩ', 'ⅩⅪ'];

function CardBack() {
  return (
    <div className="grid size-full place-items-center rounded-[20px] border border-gold/30 bg-gradient-to-b from-[#12183a] to-[#0b1020]">
      <svg viewBox="0 0 60 60" className="size-16" fill="none" aria-hidden="true">
        <circle cx="30" cy="30" r="26" stroke="rgba(216,184,117,.35)" strokeWidth="1" />
        <circle cx="30" cy="30" r="21" stroke="rgba(216,184,117,.2)" strokeWidth=".7" strokeDasharray="1.5 3" />
        <path d="M30 14 l4 12 12 4 -12 4 -4 12 -4 -12 -12 -4 12 -4 Z" fill="#d8b875" />
      </svg>
    </div>
  );
}

export default function TarotPage() {
  const profile = useFateStore((state) => state.profileInput);
  const [spread, setSpread] = useState<TarotSpreadCard[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const [drawCount, setDrawCount] = useState(0);
  const birthCards = profile?.birthDate
    ? getBirthCards(profile.birthDate.replaceAll('-', '').split('').map(Number))
    : undefined;

  const draw = () => {
    setSpread(drawSpread());
    setFlipped([false, false, false]);
    setDrawCount((count) => count + 1);
  };
  const flipAll = () => setFlipped([true, true, true]);
  const flipOne = (index: number) => setFlipped((current) => current.map((value, i) => (i === index ? true : value)));

  const allFlipped = spread.length > 0 && flipped.every(Boolean);
  const buttonLabel = spread.length === 0 ? '抽三張牌' : allFlipped ? '再抽一次（重洗）' : '翻開三張牌';
  const onButton = spread.length === 0 || allFlipped ? draw : flipAll;

  return (
    <section className="page-container page-section">
      <BackToReportLink note="你的生日塔羅已計入報告的整合剖面；報告已建立，隨時可回去看，不用重算。" />
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow text-[#c9a0f0]">Tarot</p>
        <h1 className="display-title mt-3">塔羅牌</h1>
        <p className="mx-auto mt-5 max-w-xl muted">先在心裡想一個問題，抽三張牌，分別對應過去、現在、未來。塔羅是幫你換角度思考的鏡子，不是預言機。</p>
        <button className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#c9a0f0] px-6 py-3 font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#d8b6f5] hover:shadow-[0_12px_30px_rgba(201,160,240,0.35)] focus:outline-none focus:ring-2 focus:ring-[#c9a0f0] focus:ring-offset-2 focus:ring-offset-ink active:scale-[0.98]" type="button" onClick={onButton}>
          {spread.length === 0 ? <Sparkles size={17} /> : allFlipped ? <RefreshCw size={17} /> : <Star size={17} />}{buttonLabel}
        </button>
      </div>

      {spread.length > 0 && (
        <div key={drawCount} className="reveal mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
          {spread.map(({ position, card, reversed }, index) => {
            const Icon = POSITION_ICONS[position];
            return (
              <div key={position}>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#c9a0f0]"><Icon size={15} />{position}</div>
                <button type="button" onClick={() => flipOne(index)} className="mt-3 block w-full [perspective:1200px]" aria-label={`翻開${position}的牌`}>
                  <div className={`card3d relative mx-auto aspect-[2/3] w-full max-w-[220px] ${flipped[index] ? 'flipped' : ''}`} style={{ transitionDelay: `${index * 120}ms` }}>
                    <div className="card-face"><CardBack /></div>
                    <div className={`card-face card-back grid place-items-center rounded-[20px] border p-4 text-center ${reversed ? 'border-vermilion/40 bg-gradient-to-b from-vermilion/[0.08] to-[#0b1020]' : 'border-[#c9a0f0]/35 bg-gradient-to-b from-[#c9a0f0]/[0.09] to-[#0b1020]'}`}>
                      <div>
                        <p className="font-display text-4xl italic text-gold">{ROMAN[card.id]}</p>
                        <p className="mt-2 font-display text-[11px] italic tracking-[0.14em] text-mist">{card.en}</p>
                        <h2 className="mt-1 font-serif text-2xl font-black text-cream">{card.name}</h2>
                        <span className={`mt-3 inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${reversed ? 'bg-vermilion/15 text-[#e8927f]' : 'bg-emerald-300/10 text-emerald-200'}`}>{reversed ? '逆位' : '正位'}</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {allFlipped && (
        <div className="reveal mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {spread.map(({ position, card, reversed, reading }) => (
            <article className="rounded-[20px] border border-gold/[0.16] bg-white/[0.03] p-5" key={position}>
              <div className="flex items-center justify-between"><span className="text-sm font-bold text-cream">{card.name}</span><span className="text-[11px] text-mist">{position}</span></div>
              <div className="mt-2 flex flex-wrap gap-1.5">{card.keywords.map((keyword) => <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-mist" key={keyword}>{keyword}</span>)}</div>
              <p className="mt-3 text-sm leading-7 text-mist">{reading}</p>
              <div className="mt-3 border-t border-gold/[0.14] pt-3">
                <span className="font-display text-[11px] italic tracking-wider text-gold">試試</span>
                <p className="mt-1 text-sm leading-6 text-cream">{card.advice}</p>
                {reversed && <p className="mt-1 text-[11px] text-[#e8927f]">此為逆位</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mx-auto mt-12 max-w-3xl">
        <article className="glass-card p-6 sm:p-7">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-bold text-cream"><Star className="text-[#c9a0f0]" size={20} />你的生日塔羅</h2>
          {birthCards ? (
            <div className="mt-4">
              <p className="leading-7 text-mist">把你生日的所有數字相加得到 {birthCards.sum}，對應的人格牌是「<span className="text-cream">{birthCards.personality.name}</span>」——{birthCards.personality.upright}{!birthCards.samePersonalityAndSoul && <>；再把數字加總一次，靈魂牌是「<span className="text-cream">{birthCards.soul.name}</span>」——{birthCards.soul.upright}</>}</p>
              <p className="mt-3 text-sm leading-6 text-mist">人格牌是你外在的行事風格，靈魂牌是內在深層的動力；{birthCards.samePersonalityAndSoul ? '你的兩張牌相同，代表內外一致。' : '兩張牌一起看，就是外在與內在的對照。'}</p>
            </div>
          ) : (
            <p className="mt-4 leading-7 text-mist">完成命盤輸入後，這裡會依你的生日算出專屬的人格牌與靈魂牌。<Link className="ml-1 text-[#c9a0f0] underline-offset-4 hover:underline" to="/profile">前往探索命盤</Link></p>
          )}
        </article>
      </div>
      <div className="mx-auto mt-8 max-w-3xl"><Disclaimer /></div>
    </section>
  );
}
