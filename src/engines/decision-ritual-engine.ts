import { RITUAL_CARDS, type RitualCard } from '../data/ritual-cards';
import type { FateReportInput } from '../types/fate';

export type DiceSide = 'act' | 'wait';
export type HopedSide = 'act' | 'wait' | 'unknown';
export type Reaction = 'relief' | 'disappoint' | 'neutral';

export interface FateThrow {
  side: DiceSide;
  sideLabel: string;
  yinYang: '陽' | '陰';
  flavor: string;
  card: RitualCard;
  seed: string;
}

export interface RitualReflection {
  favored: DiceSide | null;
  headline: string;
  body: string;
  closing: string;
}

const SIDE_LABELS: Record<DiceSide, string> = { act: '動', wait: '靜' };
const opposite = (side: DiceSide): DiceSide => (side === 'act' ? 'wait' : 'act');

// FNV-1a 字串雜湊，接 mulberry32：同一顆種子永遠得到同一擲，方便測試與可重現。
function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seedNumber: number): () => number {
  let state = seedNumber;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 用命盤的穩定特徵組出一段「骰種簽名」；命盤只是種子，不影響擲骰的隨機性。 */
export function chartSeedSignature(input: FateReportInput): string {
  return [
    input.bazi.dayMaster,
    input.bazi.dayMasterElement,
    input.fiveElements.strongest[0],
    input.zodiac.branch,
    input.numerology.lifePathNumber,
  ].join('-');
}

const ACT_FLAVORS = [
  '骰面停在「動」。這一擲是隨機的——你的命盤只是它的骰種，不是它的理由。重點不在骰子怎麼落，而在你看到它時心裡怎麼動。',
  '這一擲給了「動」。它沒有預知任何事，它只是逼你面對：如果真要往前，你現在的感覺是什麼？',
];
const WAIT_FLAVORS = [
  '骰面停在「靜」。這一擲是隨機的——你的命盤只是它的骰種，不是它的理由。骰子不決定你要不要等，你對「等」的反應才是線索。',
  '這一擲給了「靜」。它不是叫你放棄，而是給你一個藉口停一秒，聽聽看「先不動」讓你鬆一口氣還是不甘心。',
];

/** 擲一次命運骰。seed 為外部傳入的完整種子字串（命盤簽名＋問題＋nonce），確保可重現。 */
export function throwFateDice(seed: string): FateThrow {
  const random = mulberry32(hashString(seed));
  const side: DiceSide = random() < 0.5 ? 'act' : 'wait';
  const flavors = side === 'act' ? ACT_FLAVORS : WAIT_FLAVORS;
  const flavor = flavors[Math.floor(random() * flavors.length)];
  const card = RITUAL_CARDS[Math.floor(random() * RITUAL_CARDS.length)];
  return {
    side,
    sideLabel: SIDE_LABELS[side],
    yinYang: side === 'act' ? '陽' : '陰',
    flavor,
    card,
    seed,
  };
}

/** 組出這次擲骰的完整種子字串（含隨機 nonce，讓每次擲骰都不同但可重現）。 */
export function buildThrowSeed(input: FateReportInput | undefined, question: string, nonce: number): string {
  const chart = input ? chartSeedSignature(input) : 'no-chart';
  return `${chart}|${question.trim()}|${nonce}`;
}

const FAVORED_LABEL: Record<DiceSide, string> = {
  act: '往前、去做、改變',
  wait: '先等、先守、再看看',
};

/**
 * 投射式綜合：真正的答案不在骰面，而在你對骰面的情緒反應。
 * 鬆一口氣 → 你其實傾向骰面那一邊；失望 → 你想要的是另一邊。
 */
export function synthesizeReflection(diceSide: DiceSide, hoped: HopedSide, reaction: Reaction): RitualReflection {
  let favored: DiceSide | null;
  if (reaction === 'relief') favored = diceSide;
  else if (reaction === 'disappoint') favored = opposite(diceSide);
  else favored = hoped === 'unknown' ? null : hoped;

  const diceLabel = SIDE_LABELS[diceSide];

  if (favored === null) {
    return {
      favored: null,
      headline: '你還沒準備好決定——這也是一種誠實的答案',
      body: `骰子給了「${diceLabel}」，而你看到時沒有明顯的鬆一口氣或失望。這通常代表兩件事之一：你手上的資訊還不夠，或這個決定其實沒有你以為的那麼急。與其硬逼自己選，不如先去補齊資訊，或先放它幾天。`,
      closing: '骰子不決定你的人生。今天它只幫你確認了一件事：現在還不是拍板的時候。',
    };
  }

  const favoredLabel = FAVORED_LABEL[favored];
  const matchedDice = favored === diceSide;
  const reactionText = reaction === 'relief' ? '鬆了一口氣' : reaction === 'disappoint' ? '有點失望' : '說不上來';

  const headline = matchedDice
    ? `看到「${diceLabel}」你${reactionText}——你心裡其實傾向「${favoredLabel}」`
    : `骰子給了「${diceLabel}」，但你${reactionText}——你真正想要的是「${favoredLabel}」`;

  const body = matchedDice
    ? `這很關鍵：骰子是隨機的，但你對它的反應不是。看到這個結果讓你${reactionText}，代表這個方向本來就在你心裡了，你可能只是需要一個「允許自己」的時刻。骰子給了你這個時刻。`
    : `這正是這個儀式最有用的地方：一個隨機的結果，逼出了你真實的偏好。你對「${diceLabel}」感到${reactionText}，那個瞬間的反應，比任何分析都誠實地告訴你——你想要的是「${favoredLabel}」。`;

  return {
    favored,
    headline,
    body,
    closing: '記住：做決定的是你，不是骰子。它只是一面鏡子，把你早就有的答案照出來。接下來，用下面那張行動卡，踏出可以承擔的第一步。',
  };
}

export function diceSideLabel(side: DiceSide): string {
  return SIDE_LABELS[side];
}
