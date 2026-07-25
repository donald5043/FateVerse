import { splitSentences } from './extract-sentences';

/** docs/voice.md 中可機器驗證的規則。 */
export type VoiceRuleId = 'R1-formal-pronoun' | 'R2-future-assertion' | 'R3-paragraph-length' | 'R4-hedges';

export interface VoiceViolation {
  rule: VoiceRuleId;
  detail: string;
}

/** R1：禁用「您」。 */
const FORMAL_PRONOUN = '您';

/** R2：未來斷言詞。命理算得出盤面，算不出未來事件。 */
const FUTURE_ASSERTIONS = ['將會', '必定', '注定', '終將', '一定會', '肯定會', '勢必'];

/** R4：模糊限定詞——巴納姆句的主要載體，全篇至多一次。 */
export const HEDGES = ['可能', '或許', '傾向於', '往往', '有時'];

/** 檢查單一文字欄位是否違反 R1／R2／R3。 */
export function checkFieldRules(text: string): VoiceViolation[] {
  const violations: VoiceViolation[] = [];

  if (text.includes(FORMAL_PRONOUN)) {
    violations.push({ rule: 'R1-formal-pronoun', detail: '出現「您」，應改用「你」' });
  }

  const assertion = FUTURE_ASSERTIONS.find((word) => text.includes(word));
  if (assertion) {
    violations.push({ rule: 'R2-future-assertion', detail: `出現未來斷言詞「${assertion}」` });
  }

  const sentenceCount = splitSentences(text).length;
  if (sentenceCount > 3) {
    violations.push({ rule: 'R3-paragraph-length', detail: `單一段落 ${sentenceCount} 句，超過上限 3 句` });
  }

  return violations;
}

/** 計算一段文字中模糊限定詞的總出現次數（R4 以整份報告為單位彙總）。 */
export function countHedges(text: string): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let total = 0;
  for (const hedge of HEDGES) {
    // 「傾向於」包含「傾向」，為避免重複計數，此處各詞獨立比對且不重疊拆分。
    const matches = text.split(hedge).length - 1;
    if (matches > 0) {
      breakdown[hedge] = matches;
      total += matches;
    }
  }
  return { total, breakdown };
}

/** R4 上限：整份報告合計至多 1 次。 */
export const HEDGE_LIMIT = 1;
