import { describe, expect, it } from 'vitest';
import { MAJOR_ARCANA, TAROT_ELEMENTS } from '../src/data/tarot-cards';
import { birthCardElements, buildSpread, drawSpread, getBirthCards } from '../src/engines/tarot-engine';

const digitsOf = (birthDate: string) => birthDate.replaceAll('-', '').split('').map(Number);

describe('塔羅資料', () => {
  it('收錄完整 22 張大阿爾克那且欄位齊全', () => {
    expect(MAJOR_ARCANA).toHaveLength(22);
    MAJOR_ARCANA.forEach((card, index) => {
      expect(card.id).toBe(index);
      expect(card.keywords.length).toBeGreaterThanOrEqual(2);
      expect(card.upright.length).toBeGreaterThan(10);
      expect(card.reversed.length).toBeGreaterThan(10);
      expect(card.advice.length).toBeGreaterThan(5);
    });
  });
});

describe('塔羅五行對應', () => {
  it('22 張大牌都有五行歸屬，且傳統四元素不含金', () => {
    MAJOR_ARCANA.forEach((card) => {
      expect(['wood', 'fire', 'earth', 'water']).toContain(TAROT_ELEMENTS[card.id]);
    });
  });
  it('生日塔羅回傳人格牌（與靈魂牌）的五行訊號', () => {
    const same = birthCardElements('1990-01-02'.replaceAll('-', '').split('').map(Number));
    expect(same).toEqual(['wood']); // 22 → 愚者（風≈木），人格靈魂同一張
    const two = birthCardElements('1998-07-22'.replaceAll('-', '').split('').map(Number));
    expect(two).toHaveLength(2);
  });
});

describe('生日塔羅', () => {
  it('加總為 22 時對應 0 號愚者，人格與靈魂相同', () => {
    const cards = getBirthCards(digitsOf('1990-01-02'));
    expect(cards.sum).toBe(22);
    expect(cards.personality.name).toBe('愚者');
    expect(cards.samePersonalityAndSoul).toBe(true);
  });
  it('兩位數人格牌再加總得到靈魂牌', () => {
    const cards = getBirthCards(digitsOf('1998-07-22'));
    expect(cards.sum).toBe(11);
    expect(cards.personality.name).toBe('正義');
    expect(cards.soul.name).toBe('女祭司');
    expect(cards.samePersonalityAndSoul).toBe(false);
  });
});

describe('三張牌陣', () => {
  it('固定輸入產生固定牌陣，逆位取逆位解讀', () => {
    const spread = buildSpread([0, 13, 19], [false, true, false]);
    expect(spread.map((item) => item.position)).toEqual(['過去', '現在', '未來']);
    expect(spread[1].card.name).toBe('死神');
    expect(spread[1].reversed).toBe(true);
    expect(spread[1].reading).toBe(spread[1].card.reversed);
    expect(spread[2].reading).toBe(spread[2].card.upright);
  });
  it('隨機抽牌不重複且共三張', () => {
    const spread = drawSpread();
    expect(spread).toHaveLength(3);
    expect(new Set(spread.map((item) => item.card.id)).size).toBe(3);
  });
});
