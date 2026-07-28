import { Moon, RefreshCw, Sparkles, Star, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import BackToReportLink from '../components/common/BackToReportLink';
import Disclaimer from '../components/common/Disclaimer';
import TarotFlipCard from '../components/common/TarotFlipCard';
import { getBirthCards, drawSpread, type TarotSpreadCard } from '../engines/tarot-engine';
import { useFateStore } from '../store/useFateStore';

const POSITION_ICONS = { 過去: Moon, 現在: Sun, 未來: Star } as const;

export default function TarotPage() {
  const profile = useFateStore((state) => state.profileInput);
  const [spread, setSpread] = useState<TarotSpreadCard[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const [drawCount, setDrawCount] = useState(0);
  const birthCards = profile?.birthDate
    ? getBirthCards(profile.birthDate.replaceAll('-', '').split('').map(Number))
    : undefined;
  const birthCardDisplay = birthCards
    ? birthCards.samePersonalityAndSoul
      ? [{ label: '人格與靈魂牌', card: birthCards.personality }]
      : [
          { label: '人格牌', card: birthCards.personality },
          { label: '靈魂牌', card: birthCards.soul },
        ]
    : [];

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
                <div className="mt-3">
                  <TarotFlipCard
                    card={card}
                    reversed={reversed}
                    flipped={flipped[index]}
                    onFlip={() => flipOne(index)}
                    label={`翻開${position}的牌`}
                    delayMs={index * 120}
                  />
                </div>
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
              <div className={`mb-5 grid gap-3 ${birthCardDisplay.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                {birthCardDisplay.map(({ label, card }) => (
                  <figure className="tarot-birth-card" key={label}>
                    <img
                      src={`${import.meta.env.BASE_URL}art/tarot/${String(card.id).padStart(2, '0')}.webp`}
                      alt={`${card.name}（${card.en}）塔羅牌插畫`}
                      loading="lazy"
                      decoding="async"
                    />
                    <figcaption><span>{label}</span><strong>{card.name}</strong><small>{card.en}</small></figcaption>
                  </figure>
                ))}
              </div>
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
