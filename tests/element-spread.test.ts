import { describe, expect, it } from 'vitest';
import { describeElementSpread, NEAR_TIE_POINTS } from '../src/engines/five-elements-engine';

describe('五行分布形狀', () => {
  it('差距明顯時只有一個最高、一個最低', () => {
    const spread = describeElementSpread({ wood: 50, fire: 20, earth: 15, metal: 10, water: 5 });
    expect(spread.top).toEqual(['wood']);
    expect(spread.bottom).toEqual(['water']);
    expect(spread.topTied).toBe(false);
    expect(spread.bottomTied).toBe(false);
  });

  it('完全相同的值算並列', () => {
    const spread = describeElementSpread({ wood: 30, fire: 30, earth: 20, metal: 10, water: 10 });
    expect(spread.top.sort()).toEqual(['fire', 'wood']);
    expect(spread.bottom.sort()).toEqual(['metal', 'water']);
    expect(spread.topTied).toBe(true);
  });

  it('差距在門檻之內也算並列', () => {
    const spread = describeElementSpread({ wood: 30, fire: 30 - NEAR_TIE_POINTS, earth: 20, metal: 12, water: 8 });
    expect(spread.top.sort()).toEqual(['fire', 'wood']);
  });

  it('差距超過門檻就不算並列', () => {
    const spread = describeElementSpread({ wood: 30, fire: 30 - NEAR_TIE_POINTS - 0.1, earth: 20, metal: 12, water: 8 });
    expect(spread.top).toEqual(['wood']);
  });

  it('全距很小的盤標為 flat', () => {
    const spread = describeElementSpread({ wood: 21, fire: 20, earth: 20, metal: 20, water: 19 });
    expect(spread.flat).toBe(true);
    expect(spread.range).toBeCloseTo(2);
  });

  it('全距夠大就不是 flat', () => {
    expect(describeElementSpread({ wood: 40, fire: 20, earth: 20, metal: 15, water: 5 }).flat).toBe(false);
  });

  it('五個都一樣時，最高與最低是同一群', () => {
    const spread = describeElementSpread({ wood: 20, fire: 20, earth: 20, metal: 20, water: 20 });
    expect(spread.top).toHaveLength(5);
    expect(spread.bottom).toHaveLength(5);
    expect(spread.range).toBe(0);
    expect(spread.flat).toBe(true);
  });
});
