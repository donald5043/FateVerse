import type { TarotCard } from '../../data/tarot-cards';

const ROMAN = ['0', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'Ⅺ', 'Ⅻ', 'ⅩⅢ', 'ⅩⅣ', 'ⅩⅤ', 'ⅩⅥ', 'ⅩⅦ', 'ⅩⅧ', 'ⅩⅨ', 'ⅩⅩ', 'ⅩⅪ'];

/** 牌背。三牌陣與今日一張牌共用同一個背面。 */
export function TarotCardBack() {
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

interface TarotFlipCardProps {
  card: TarotCard;
  reversed: boolean;
  flipped: boolean;
  onFlip?: () => void;
  /** 無障礙標籤，例如「翻開今天的牌」。 */
  label: string;
  /** 卡面最大寬度，預設 220px（三牌陣的尺寸）。 */
  maxWidth?: string;
  /** 翻牌動畫的延遲，讓多張牌依序翻開。 */
  delayMs?: number;
}

/**
 * 塔羅牌的 3D 翻牌卡：牌背 → 翻面 → 插畫 + 牌名。
 *
 * 從 TarotPage 抽出來共用。今日一張牌本來只有文字，看起來像另一個功能，
 * 但它們就是同一副牌——用同一張卡面才對得起來。
 */
export default function TarotFlipCard({
  card, reversed, flipped, onFlip, label, maxWidth = '220px', delayMs = 0,
}: TarotFlipCardProps) {
  const face = (
    <div
      className={`card3d relative mx-auto aspect-[2/3] w-full ${flipped ? 'flipped' : ''}`}
      style={{ maxWidth, transitionDelay: `${delayMs}ms` }}
    >
      <div className="card-face"><TarotCardBack /></div>
      <div className={`card-face card-back tarot-card-front rounded-[20px] border ${reversed ? 'border-vermilion/45' : 'border-[#c9a0f0]/40'}`}>
        <img
          className={`tarot-card-image ${reversed ? 'tarot-card-image-reversed' : ''}`}
          src={`${import.meta.env.BASE_URL}art/tarot/${String(card.id).padStart(2, '0')}.webp`}
          alt={`${card.name}（${card.en}）塔羅牌插畫`}
          decoding="async"
        />
        <span className="tarot-card-sheen" aria-hidden="true" />
        <div className="tarot-card-label">
          <p className="font-display text-2xl italic text-gold">{ROMAN[card.id]}</p>
          <div>
            <p className="font-display text-[9px] italic tracking-[0.14em] text-mist">{card.en}</p>
            <h2 className="font-serif text-lg font-black text-cream">{card.name}</h2>
          </div>
          <span className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${reversed ? 'bg-vermilion/20 text-[#f1a08d]' : 'bg-emerald-300/15 text-emerald-100'}`}>
            {reversed ? '逆位' : '正位'}
          </span>
        </div>
      </div>
    </div>
  );

  if (!onFlip) return <div className="[perspective:1200px]">{face}</div>;
  return (
    <button type="button" onClick={onFlip} className="block w-full [perspective:1200px]" aria-label={label}>
      {face}
    </button>
  );
}
