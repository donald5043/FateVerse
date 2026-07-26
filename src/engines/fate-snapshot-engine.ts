import type { FusionMatrix, FusionReading } from '../types/fate';
import { elementVibe } from './fusion-engine';
import { ELEMENT_LABELS } from '../utils/constants';

/**
 * 命運速寫：把整份融合解讀濃縮成 2–3 句，讓使用者第一眼讀到的是「一句說中他的話」，
 * 而不是一堆圖表。純函式、決定論：相同輸入必得相同輸出。
 */
export interface FateSnapshot {
  /** 最強共識句。永遠有值。 */
  consensusLine: string;
  /** 最大矛盾句。沒有可報的矛盾時為 null——不硬掰。 */
  tensionLine: string | null;
  /** 一句收尾。 */
  closingLine: string;
  /** 貢獻此共識結論的系統名稱。 */
  supportingSystems: string[];
}

/** 列出系統名稱，最多三個，其餘以「等 N 套」帶過。 */
function listSystems(systems: string[], max = 3): string {
  const unique = [...new Set(systems)];
  if (unique.length <= max) return unique.join('、');
  return `${unique.slice(0, max).join('、')}等 ${unique.length} 套`;
}

interface AxisSplit {
  axisLabel: string;
  majorityLabel: string;
  minorityLabel: string;
  majorityCount: number;
  minoritySystems: string[];
  /** 少數方的立場強度總和，用來挑出「分裂得最明顯」的那條軸。 */
  strength: number;
}

/**
 * 從系統×軸線矩陣找出分裂最明顯的一條光譜。
 * 矩陣的 value 正值代表 leftLabel、負值代表 rightLabel（見 fusion-engine 的 buildAxis）。
 * 只有在「多數方至少兩套、少數方至少一套」時才算數，避免把 1 對 1 說成分裂。
 */
function findAxisSplit(matrix: FusionMatrix | undefined): AxisSplit | null {
  if (!matrix) return null;
  let best: AxisSplit | null = null;

  for (const row of matrix.rows) {
    const left = row.cells.filter((cell) => cell.value > 0);
    const right = row.cells.filter((cell) => cell.value < 0);
    if (!left.length || !right.length) continue;

    const leftIsMajority = left.length >= right.length;
    const majority = leftIsMajority ? left : right;
    const minority = leftIsMajority ? right : left;
    // 必須是真正的多數對少數；2 對 2 用「只有」描述並不成立。
    if (majority.length < 2 || minority.length < 1 || majority.length <= minority.length) continue;

    const strength = minority.reduce((sum, cell) => sum + Math.abs(cell.value), 0);
    const candidate: AxisSplit = {
      axisLabel: row.label,
      majorityLabel: leftIsMajority ? row.leftLabel : row.rightLabel,
      minorityLabel: leftIsMajority ? row.rightLabel : row.leftLabel,
      majorityCount: majority.length,
      // 依立場強度排序，讓被指名的是「反對得最用力」的系統。
      minoritySystems: [...minority].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).map((cell) => cell.system),
      strength,
    };
    if (!best || candidate.strength > best.strength) best = candidate;
  }

  return best;
}

/** 共識句：依系統之間的一致程度選用，三種樣態。 */
function buildConsensusLine(reading: FusionReading): string {
  const { consensus, systemsUsed } = reading;
  const leading = consensus.leading[0];
  const leadingVote = consensus.votes.find((vote) => vote.element === leading);
  // 直接取用 fusion-engine 匯出的元素白話，不解析已組好的散文。
  const vibe = leading ? elementVibe(leading) : '';
  const label = leading ? ELEMENT_LABELS[leading] : '';
  const agreeCount = leadingVote?.votes ?? 0;
  const total = systemsUsed.length;

  if (consensus.agreementLevel === 'high') {
    return `${total} 套彼此沒有淵源的系統，有 ${agreeCount} 套指向同一件事——${label}：${vibe}。這是你身上最不需要懷疑的部分。`;
  }
  if (consensus.agreementLevel === 'medium') {
    return `${total} 套系統裡有 ${agreeCount} 套講到同一個主題——${label}：${vibe}。稱不上壓倒性，卻是最常出現的底色。`;
  }
  return `這 ${total} 套系統沒有給出一致的答案，被點到最多次的是${label}：${vibe}。與其說這是你的定義，不如說是你其中一面。`;
}

/**
 * 矛盾句：依資料選用四種樣態，全部都指名到具體系統。
 * 找不到任何可報的矛盾時回傳 null。
 */
function buildTensionLine(reading: FusionReading, matrix: FusionMatrix | undefined): string | null {
  // 樣態一：某條性格光譜上系統分裂，且能指名是誰站在少數方。
  const split = findAxisSplit(matrix);
  if (split) {
    return `在「${split.axisLabel}」上，${split.majorityCount} 套系統把你放在「${split.majorityLabel}」這邊，`
      + `只有${listSystems(split.minoritySystems)}指向「${split.minorityLabel}」——這種拉扯，大概就是你反覆卡住的地方。`;
  }

  const tensions = reading.highlights.filter((highlight) => highlight.kind === 'tension');

  // 樣態二：西洋星座強調的能量，正好是四柱裡最少的五行。
  const elementGap = tensions.find((highlight) => highlight.systems.includes('西洋星座'));
  if (elementGap) {
    return `${listSystems(elementGap.systems)}給出的方向剛好相反：${elementGap.title}。`
      + '一邊是你想活成的樣子，一邊是你做起來順手的方式，兩者不同步的時候最耗力氣。';
  }

  // 樣態三：票數分散在四種以上元素，沒有主旋律。
  const scattered = tensions.find((highlight) => highlight.systems.length >= 4);
  if (scattered) {
    return `${listSystems(scattered.systems)}各自看到不同的你，沒有一個元素過半。`
      + '身邊不同的人形容你會差很多，而他們講的都是真的。';
  }

  // 樣態四：仍有矛盾亮點，但不屬於上述形狀，直接引用其標題與涉及系統。
  const generic = tensions[0];
  if (generic) {
    return `${listSystems(generic.systems)}之間對不上：${generic.title}。這一段落差值得你自己驗證看看。`;
  }

  return null;
}

/** 收尾句：依「有無矛盾」×「一致程度」選用。 */
function buildClosingLine(reading: FusionReading, hasTension: boolean): string {
  const high = reading.consensus.agreementLevel === 'high';
  if (hasTension && high) return '底色很清楚，分歧的那一點就是你最常卡住的地方。';
  if (hasTension) return '這些說法本來就不完全一致，不一致的地方反而最值得看。';
  if (high) return '幾套系統這次講的是同一個人，讀起來會有種被說中的感覺。';
  return '沒有互相打架的地方，把上面這些當成描述你的不同角度就好。';
}

/**
 * 產生命運速寫。
 * @param reading 融合解讀結果
 * @param matrix 系統×軸線矩陣。有提供時才能指名「哪些系統站在少數方」，強烈建議一併傳入。
 */
export function computeFateSnapshot(reading: FusionReading, matrix?: FusionMatrix): FateSnapshot {
  const leadingVote = reading.consensus.votes.find((vote) => vote.element === reading.consensus.leading[0]);
  const tensionLine = buildTensionLine(reading, matrix);

  return {
    consensusLine: buildConsensusLine(reading),
    tensionLine,
    closingLine: buildClosingLine(reading, tensionLine !== null),
    supportingSystems: [...new Set(leadingVote?.systems ?? [])],
  };
}
