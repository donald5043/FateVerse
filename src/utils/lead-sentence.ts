/**
 * 取一段話的前 n 句。
 *
 * 用在「先給一句最重要的話，想看完整脈絡再點進去」這種版面上。
 * 之所以要有這個工具：報告的「各大系統直接說結論」寫著「每套系統先給你
 * 一句最重要的話」，但實際印出兩到三句——文案承諾一句，實作給三句，
 * 七套系統加起來就是五百多字擋在讀者面前。
 *
 * 切句用中文句末標點。切不出來（沒有標點）就原樣回傳，不硬裁——
 * 截在半句中間比多給一句更難讀。
 */
export function leadSentences(text: string, count = 1): string {
  const sentences = text.split(/(?<=[。！？])/).filter((part) => part.trim().length > 0);
  if (sentences.length <= count) return text;
  return sentences.slice(0, count).join('');
}
