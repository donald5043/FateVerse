/**
 * 口語度量測（voice.md R7–R9）。
 *
 * 為什麼要這一軸：原本的量測只有一個方向——句子夠不夠「不通用」。
 * 文案為了通過檢查就往「多引用一點命盤數據」走，結果具體了，但更像資料表。
 * 使用者的原話是「用字遣詞還是太資料感、不夠口語化」，那正是這一軸沒被量到。
 *
 * 三件機器查得動的事：
 *   R7 對沖語   把斷言洗掉的句型，句子因此不可能說錯，也就不可能命中
 *   R8 自我說明 邊講邊解釋自己怎麼講的，效果就沒了
 *   R9 書面語   論文腔的詞，換成日常講法後意思不變但讀起來像人話
 */

export type PlainnessRuleId = 'R7-hedged-assertion' | 'R8-meta-commentary' | 'R9-bookish';

export interface PlainnessHit {
  rule: PlainnessRuleId;
  marker: string;
  /** 建議改法。純提示，不影響判定。 */
  suggestion?: string;
}

/**
 * R7：對沖語。
 *
 * 「可觀察到 X 的傾向」這種句子把所有斷言都洗掉了——換成任何一張命盤都成立，
 * 所以它不可能說錯，也就不可能讓人覺得被說中。命中感的前提是那句話有風險。
 *
 * 注意這一組和 voice.md R4 的 HEDGES（可能／或許／往往）不同：R4 抓的是
 * 單一模糊副詞，這裡抓的是整個「不敢下判斷」的句型。
 */
const HEDGED_ASSERTIONS: { marker: string; suggestion: string }[] = [
  { marker: '可觀察到', suggestion: '直接講你觀察到什麼' },
  { marker: '可參考', suggestion: '直接講那件事' },
  { marker: '可發揮', suggestion: '改成「你擅長…」' },
  { marker: '適合拿來', suggestion: '改成「拿它來…」' },
  { marker: '有助於', suggestion: '改成「會讓…變容易」' },
  { marker: '的傾向', suggestion: '刪掉，直接說那個行為' },
  { marker: '可作為', suggestion: '改成「可以當成」或直接刪' },
  { marker: '不妨', suggestion: '改成祈使句' },
  { marker: '建議可', suggestion: '改成祈使句' },
  { marker: '值得留意的是', suggestion: '直接講那件事' },
  { marker: '在某種程度上', suggestion: '刪掉' },
  { marker: '相對而言', suggestion: '刪掉或講清楚跟什麼比' },
];

/**
 * R8：自我說明。
 *
 * 免責與方法說明該放在固定的一處（Disclaimer、方法說明區塊），不是每句都放。
 * 在解讀句裡講「這是文化模型的線索」，等於一邊表演一邊解釋魔術怎麼變的。
 */
const META_COMMENTARY: { marker: string; suggestion: string }[] = [
  { marker: '文化模型', suggestion: '免責放在 Disclaimer，解讀句裡不要重述' },
  { marker: '交叉參照', suggestion: '直接寫出兩者一致或衝突的地方' },
  { marker: '本次計算結果為', suggestion: '直接給結果' },
  { marker: '自我反思線索', suggestion: '刪掉，讓句子自己站著' },
  { marker: '可作為觀察', suggestion: '直接講要觀察什麼' },
  { marker: '並排參照', suggestion: '直接寫出並排之後看到什麼' },
  { marker: '此處採用', suggestion: '方法說明另置，不進解讀句' },
  { marker: '象徵意義上', suggestion: '刪掉' },
];

/**
 * R9：書面語。
 *
 * 這些詞不算錯，只是不會有人講話這樣講。換成右邊的說法意思不變，
 * 但讀起來從報告變成人在跟你說話。
 */
const BOOKISH: { marker: string; suggestion: string }[] = [
  { marker: '並存', suggestion: '一起出現' },
  { marker: '著重', suggestion: '比較看重' },
  { marker: '象徵為', suggestion: '說的是' },
  { marker: '予以', suggestion: '刪掉' },
  { marker: '加以', suggestion: '刪掉' },
  { marker: '進行', suggestion: '刪掉，直接用動詞' },
  { marker: '較為', suggestion: '比較' },
  { marker: '之處', suggestion: '的地方' },
  { marker: '呈現出', suggestion: '看起來' },
  { marker: '顯示出', suggestion: '看得出' },
  { marker: '具有', suggestion: '有' },
  { marker: '該項', suggestion: '這個' },
  { marker: '此類', suggestion: '這類' },
  { marker: '亦', suggestion: '也' },
];

const RULE_SETS: { rule: PlainnessRuleId; entries: { marker: string; suggestion: string }[] }[] = [
  { rule: 'R7-hedged-assertion', entries: HEDGED_ASSERTIONS },
  { rule: 'R8-meta-commentary', entries: META_COMMENTARY },
  { rule: 'R9-bookish', entries: BOOKISH },
];

/**
 * 形上包含標記、語意上不是的情況，比對前先剔除，避免假陽性。
 * 上一輪的 R4 就吃過這個虧——「其他可能」是名詞，被當成模糊語氣算進去了。
 */
const EXEMPTIONS = [
  '進行式',   // 文法術語
  '進行事曆', // 「排進行事曆」是「排進＋行事曆」，不是「進行」
  '同時進行', // 這個講法本來就很口語
];

/*
 * 刻意「不」列入的詞：
 * 「其中」「方面」形上很像論文腔，但日常對話用得極頻繁（其中一個、另一方面），
 * 列進來只會製造假陽性，逼撰稿人繞路寫出更不自然的句子。
 * 這一軸的價值在於誤報要夠低，否則大家會學會忽略它。
 */

/** 掃一段文字，回報命中的口語度問題。 */
export function checkPlainness(text: string): PlainnessHit[] {
  let scannable = text;
  for (const exemption of EXEMPTIONS) scannable = scannable.split(exemption).join('');

  const hits: PlainnessHit[] = [];
  for (const { rule, entries } of RULE_SETS) {
    for (const { marker, suggestion } of entries) {
      if (scannable.includes(marker)) hits.push({ rule, marker, suggestion });
    }
  }
  return hits;
}

/** 一段文字裡的口語度問題總數（同一個標記出現多次算多次）。 */
export function countPlainnessHits(text: string): number {
  let scannable = text;
  for (const exemption of EXEMPTIONS) scannable = scannable.split(exemption).join('');

  let total = 0;
  for (const { entries } of RULE_SETS) {
    for (const { marker } of entries) total += scannable.split(marker).length - 1;
  }
  return total;
}

/** 供報表列出所有標記，方便撰稿時查。 */
export function allPlainnessMarkers(): { rule: PlainnessRuleId; marker: string; suggestion: string }[] {
  return RULE_SETS.flatMap(({ rule, entries }) => entries.map((entry) => ({ rule, ...entry })));
}
