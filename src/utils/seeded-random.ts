/** FNV-1a 字串雜湊：把任意字串轉成 32-bit 無號整數，供亂數種子使用。 */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32：以整數種子產生確定性的 [0,1) 亂數序列。 */
export function mulberry32(seedNumber: number): () => number {
  let state = seedNumber;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 便利函式：直接用字串種子取得確定性亂數產生器。 */
export function seededRandom(seed: string): () => number {
  return mulberry32(hashString(seed));
}
