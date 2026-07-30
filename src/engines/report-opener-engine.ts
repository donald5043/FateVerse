import { generateFusionReading } from './fusion-engine';
import { detectFeatures, describeRate, RARE_THRESHOLD } from './rare-features-engine';
import { RARE_FEATURE_RATES } from '../data/rare-feature-rates';
import { ELEMENT_LABELS } from '../utils/constants';
import type { FateReportInput } from '../types/fate';

/**
 * 報告首屏：一句話結論 + 一個依據。
 *
 * 為什麼需要這個檔案：報告本來的第一屏是四張數字卡加一段 74 字的核心摘要，
 * 而整份 overview 有 4,000 多字。使用者的回饋是「看不懂、不想用」——
 * 問題不是內容不對，是要讀完才知道有沒有講到自己。
 *
 * 所以第一屏只給兩件事，總長不超過 OPENER_TOTAL_MAX 字：
 *   1. 一句話：你是什麼樣的人（不講方法、不講幾套系統）
 *   2. 一個依據：你命盤上最少見的那一項，附實測出現率
 *
 * 第二點是照使用者自己說的話做的。他說「我自己的命盤有多顆逆行……
 * 內容有準確的感覺了」——會打中人的是罕見特徵，不是總結。
 */

/** 一句話結論的字數上限。 */
export const OPENER_LINE_MAX = 46;
/** 依據那一句的字數上限。 */
export const OPENER_EVIDENCE_MAX = 44;
/** 首屏總字數上限。這是硬性的，由測試守住。 */
export const OPENER_TOTAL_MAX = 80;

export interface ReportOpener {
  /** 一句話結論。 */
  line: string;
  /** 支持它的一個具體依據。 */
  evidence: string;
  /** 依據是不是來自罕見特徵（決定要不要標成亮點）。 */
  evidenceIsRare: boolean;
}

/**
 * 把一段話收進字數上限內。
 *
 * 以中文句號切，能塞幾句塞幾句——寧可少一句，也不要截在半句中間留一個
 * 「……」。上限是給撰稿人的約束，不是給執行期的裁刀：如果連第一句都超長，
 * 那是文案要改，這裡照原樣回傳讓測試抓到，不要默默截斷把問題藏起來。
 */
function fitSentences(text: string, max: number): string {
  const sentences = text.split(/(?<=[。！？])/).filter((part) => part.trim().length > 0);
  let out = '';
  for (const sentence of sentences) {
    if (out.length + sentence.length > max) break;
    out += sentence;
  }
  return out || (sentences[0] ?? text);
}

export function buildReportOpener(input: FateReportInput): ReportOpener {
  const fusion = generateFusionReading(input);

  /*
   * headline 長成「把 8 套系統疊起來看，你的主旋律偏「土」：求穩、講信用……」。
   * 前半是方法說明，把它放在使用者讀到的第一句是本末倒置——他要知道的是
   * 「我是什麼樣的人」，不是「你用了幾套系統」。所以只取冒號後面那段真結論，
   * 再自己組主詞。
   */
  const leading = fusion.consensus.leading;
  const leadingLabels = leading.map((element) => ELEMENT_LABELS[element]).join('、');
  const vibe = fitSentences(fusion.headline.split('：').slice(1).join('：'), OPENER_LINE_MAX - 12);
  const line = `你的底色偏「${leadingLabels}」——${vibe}`;

  // 依據優先用罕見特徵：實測出現率低的那一項，才是這張盤真正跟別人不同的地方。
  const rarest = detectFeatures(input)
    .map((feature) => ({ ...feature, rate: RARE_FEATURE_RATES[feature.id] ?? 1 }))
    .filter((feature) => feature.rate <= RARE_THRESHOLD)
    .sort((left, right) => left.rate - right.rate)[0];

  if (rarest) {
    return {
      line,
      evidence: fitSentences(`你的盤上有「${rarest.label}」，${describeRate(rarest.rate)}。`, OPENER_EVIDENCE_MAX),
      evidenceIsRare: true,
    };
  }

  // 沒有罕見特徵就退回跨系統共識——那是這份報告的主張本身。
  const votes = fusion.consensus.votes.find((vote) => vote.element === leading[0])?.votes ?? 0;
  return {
    line,
    evidence: fitSentences(`不同文化的 ${votes} 套系統換算之後都指向這裡。`, OPENER_EVIDENCE_MAX),
    evidenceIsRare: false,
  };
}
