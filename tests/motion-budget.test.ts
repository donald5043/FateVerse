import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 動態效果的成本預算。
 *
 * 為什麼需要這一條軸：這個站的視覺一直往「更多動畫」加，但沒有任何東西在管
 * 動畫的代價。專案先前已經吃過一次「有測試的軸會贏」的虧——
 * 見 tests/reading-budget.test.tsx 開頭那段。這次在加特效之前先立好界線。
 *
 * 界線只有一條，但它是真正決定捲動順不順的那一條：
 * **一直在跑的動畫只能動 transform 和 opacity。**
 *
 * 這兩個屬性瀏覽器可以完全交給合成器，不必重新計算版面、也不必重畫像素。
 * 其他屬性（box-shadow、background-position、filter、width…）每一幀都要
 * 重畫，元素一多就開始掉幀。
 *
 * 一次性的動畫（進場、翻牌）不受這條限制——它們只播一次，代價有限，
 * 而且那正是視覺效果最值得花錢的地方。
 */

const css = readFileSync(resolve(__dirname, '../src/index.css'), 'utf8');

/** 合成器就能處理的屬性。無限循環的動畫只能碰這些。 */
const COMPOSITOR_SAFE = new Set(['transform', 'opacity', 'visibility']);

/** 取出所有 @keyframes 區塊的名稱與內容。 */
function parseKeyframes(source: string): Map<string, string> {
  const blocks = new Map<string, string>();
  const pattern = /@keyframes\s+([\w-]+)\s*\{/g;
  let match = pattern.exec(source);
  while (match) {
    // 從 { 開始配對到對應的 }，keyframes 內部還有巢狀大括號。
    let depth = 1;
    let index = pattern.lastIndex;
    while (index < source.length && depth > 0) {
      if (source[index] === '{') depth += 1;
      if (source[index] === '}') depth -= 1;
      index += 1;
    }
    blocks.set(match[1], source.slice(pattern.lastIndex, index - 1));
    match = pattern.exec(source);
  }
  return blocks;
}

/** 找出被宣告成 infinite 的 keyframes 名稱。 */
function infiniteAnimationNames(source: string): Set<string> {
  const names = new Set<string>();
  const pattern = /animation:\s*([^;]+);/g;
  let match = pattern.exec(source);
  while (match) {
    const declaration = match[1];
    // 一個 animation 可以用逗號串好幾組，只有標了 infinite 的那幾組要管。
    declaration.split(',').forEach((part) => {
      if (!/\binfinite\b/.test(part)) return;
      const name = part.trim().split(/\s+/)[0];
      if (name) names.add(name);
    });
    match = pattern.exec(source);
  }
  return names;
}

/** 從 keyframes 內容取出被動畫的屬性名。 */
function animatedProperties(block: string): string[] {
  return [...block.matchAll(/([a-z-]+)\s*:/g)]
    .map((match) => match[1])
    .filter((name) => !name.startsWith('--'));
}

describe('動態效果的成本', () => {
  it('一直在跑的動畫只動 transform 與 opacity', () => {
    const keyframes = parseKeyframes(css);
    const infinite = infiniteAnimationNames(css);
    expect(infinite.size, '找不到任何無限動畫，解析大概壞了').toBeGreaterThan(3);

    const offenders: string[] = [];
    infinite.forEach((name) => {
      const block = keyframes.get(name);
      if (!block) return;
      const bad = [...new Set(animatedProperties(block))].filter((prop) => !COMPOSITOR_SAFE.has(prop));
      if (bad.length) offenders.push(`${name}（${bad.join('、')}）`);
    });

    expect(
      offenders,
      '這些無限循環的動畫會動到需要重繪的屬性，捲動時會掉幀。'
      + '把發光改成「固定漸層的偽元素 + 只動 opacity」就能拿到一樣的效果。',
    ).toEqual([]);
  });

  it('游標星光只用 transform 移動，不重畫漸層', () => {
    // radial-gradient(... at var(--x) var(--y)) 每次移動都要重畫整張卡片；
    // 固定漸層 + translate3d 則完全交給合成器。
    const block = /\[data-glow\]::after\s*\{([^}]+)\}/.exec(css);
    expect(block, '找不到 [data-glow]::after，效果大概被改名了').not.toBeNull();
    const rule = block![1];
    expect(rule, '光暈要靠 transform 移動').toContain('translate3d');
    expect(
      /background:[^;]*at\s+var\(/.test(rule),
      '漸層位置不能綁在 CSS 變數上，那會每幀重畫',
    ).toBe(false);
  });

  it('互動特效只在有精準指標的裝置上啟用', () => {
    // 手機沒有 hover，光暈看不到，但每次滑動仍要付出寫 CSS 變數的成本。
    expect(css).toContain('(hover: hover) and (pointer: fine)');
    const source = readFileSync(resolve(__dirname, '../src/utils/pointer-glow.ts'), 'utf8');
    expect(source, '程式端也要擋掉，不能只靠 CSS').toContain('(hover: hover) and (pointer: fine)');
    expect(source, '要尊重 prefers-reduced-motion').toContain('prefers-reduced-motion');
  });

  it('捲動揭示的元素在關閉動畫時仍然看得見', () => {
    // 少一段動畫可以，內容永遠停在透明不行。
    const reduceBlock = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(css);
    expect(reduceBlock, '找不到 reduce 區塊').not.toBeNull();
    expect(reduceBlock![1]).toContain('.reveal-on-scroll { opacity: 1');
  });

  it('捲動揭示共用一個 observer，而且播完就取消觀察', () => {
    const source = readFileSync(resolve(__dirname, '../src/utils/reveal-on-scroll.ts'), 'utf8');
    expect(source, '要共用一個 IntersectionObserver').toContain('let observer');
    expect(source, '一次性動畫播完要 unobserve，不然會一直追蹤').toContain('unobserve');
    expect(source, '沒有 IntersectionObserver 時要直接顯示，不能讓內容消失').toContain("classList.add('is-revealed')");
  });
});
