/**
 * 中文列舉：兩個用「和」，三個以上先用頓號、最後一個才用「和」。
 *
 * 「木和土和水」讀起來像機器翻的，「木、土和水」才是中文。這條規則原本寫在
 * fusion-engine 裡，合盤也要用，所以抽出來共用一份，免得兩邊各自長出不同的接法。
 */
export function joinChinese(items: readonly string[]): string {
  if (items.length <= 2) return items.join('和');
  return `${items.slice(0, -1).join('、')}和${items.at(-1)}`;
}
