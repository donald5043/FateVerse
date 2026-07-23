import { MAJOR_ARCANA, type TarotCard } from '../data/tarot-cards';

export interface TarotBirthCards {
  sum: number;
  personality: TarotCard;
  soul: TarotCard;
  samePersonalityAndSoul: boolean;
}

export interface TarotSpreadCard {
  position: '過去' | '現在' | '未來';
  positionHint: string;
  card: TarotCard;
  reversed: boolean;
  reading: string;
}

const sumDigits = (value: number): number => String(value).split('').reduce((total, digit) => total + Number(digit), 0);

// 生日塔羅（生命牌）：生日所有數字相加；大於 22 再相加一次，22 對應 0 號愚者。
export function getBirthCards(birthDateDigits: number[]): TarotBirthCards {
  let sum = birthDateDigits.reduce((total, digit) => total + digit, 0);
  while (sum > 22) sum = sumDigits(sum);
  const personalityId = sum === 22 ? 0 : sum;
  const soulSum = personalityId > 9 ? sumDigits(personalityId) : personalityId;
  const personality = MAJOR_ARCANA[personalityId];
  const soul = MAJOR_ARCANA[soulSum];
  return { sum, personality, soul, samePersonalityAndSoul: personality.id === soul.id };
}

const POSITION_HINTS: Record<TarotSpreadCard['position'], string> = {
  過去: '影響走到今天的能量',
  現在: '此刻正在發生的主題',
  未來: '順著目前方向會遇到的課題',
};

export function buildSpread(cardIds: [number, number, number], reversals: [boolean, boolean, boolean]): TarotSpreadCard[] {
  const positions: TarotSpreadCard['position'][] = ['過去', '現在', '未來'];
  return positions.map((position, index) => {
    const card = MAJOR_ARCANA[cardIds[index] % MAJOR_ARCANA.length];
    const reversed = reversals[index];
    return {
      position,
      positionHint: POSITION_HINTS[position],
      card,
      reversed,
      reading: reversed ? card.reversed : card.upright,
    };
  });
}

export function drawSpread(): TarotSpreadCard[] {
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  const deck = Array.from({ length: MAJOR_ARCANA.length }, (_, index) => index);
  const picked: number[] = [];
  for (let index = 0; index < 3; index += 1) {
    const pickIndex = values[index] % deck.length;
    picked.push(deck.splice(pickIndex, 1)[0]);
  }
  const reversalBits = values[3];
  return buildSpread(
    [picked[0], picked[1], picked[2]],
    [(reversalBits & 1) === 1, (reversalBits & 2) === 2, (reversalBits & 4) === 4],
  );
}
