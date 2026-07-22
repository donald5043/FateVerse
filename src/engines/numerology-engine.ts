import type { NumerologyResult } from '../types/fate';

const CONTENT: Record<number, Omit<NumerologyResult, 'birthDateDigits' | 'calculationSteps' | 'lifePathNumber' | 'isMasterNumber'>> = {
  1: { title: '開創者', strengths: ['自主', '行動力', '原創'], challenges: ['練習合作', '避免獨自承擔'], description: '生命靈數 1 象徵開端與自主，適合把想法化為第一步。' },
  2: { title: '協調者', strengths: ['同理', '合作', '敏銳'], challenges: ['建立界線', '表達需求'], description: '生命靈數 2 關注關係與平衡，擅長看見互動中的細節。' },
  3: { title: '表達者', strengths: ['創意', '溝通', '樂觀'], challenges: ['維持專注', '完成收尾'], description: '生命靈數 3 透過文字、創作與交流帶來活力。' },
  4: { title: '建造者', strengths: ['秩序', '可靠', '務實'], challenges: ['保留彈性', '接受調整'], description: '生命靈數 4 重視結構與穩固，善於讓計畫成為可持續的系統。' },
  5: { title: '探索者', strengths: ['適應', '好奇', '多元'], challenges: ['穩定節奏', '衡量風險'], description: '生命靈數 5 透過變化與經驗學習，需要自由也需要可回歸的重心。' },
  6: { title: '照顧者', strengths: ['責任', '關懷', '美感'], challenges: ['不過度承擔', '照顧自己'], description: '生命靈數 6 重視照顧、承諾與和諧，課題是讓責任保持平衡。' },
  7: { title: '研究者', strengths: ['分析', '洞察', '專注'], challenges: ['分享感受', '避免孤立'], description: '生命靈數 7 傾向深入理解，珍惜獨處與知識上的真實。' },
  8: { title: '實踐者', strengths: ['組織', '決斷', '資源感'], challenges: ['兼顧價值', '適度放手'], description: '生命靈數 8 關注成果與資源運用，適合把目標轉成可衡量的行動。' },
  9: { title: '整合者', strengths: ['包容', '理想', '視野'], challenges: ['適時放下', '務實分配'], description: '生命靈數 9 象徵整合與完成，常從更大的視角理解經驗。' },
  11: { title: '啟發者', strengths: ['直覺', '感受力', '啟發'], challenges: ['穩定神經節奏', '把靈感落地'], description: '大師數 11 放大直覺與理想，也提醒以穩定方法承接敏銳感受。' },
  22: { title: '願景建造者', strengths: ['願景', '系統力', '實踐'], challenges: ['拆小目標', '避免壓力過載'], description: '大師數 22 結合遠見與建造力，適合用可驗證的小步驟實現長期構想。' },
  33: { title: '慈悲引導者', strengths: ['關懷', '教導', '包容'], challenges: ['維持界線', '不追求完美付出'], description: '大師數 33 重視關懷與貢獻，也需要讓照顧他人與自我恢復並存。' },
};

const MASTER_NUMBERS = new Set([11, 22, 33]);
const sumDigits = (value: number): number => String(value).split('').reduce((sum, digit) => sum + Number(digit), 0);

export function calculateNumerology(birthDate: string): NumerologyResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new Error('出生日期格式無效，無法計算生命靈數。');
  const birthDateDigits = birthDate.replaceAll('-', '').split('').map(Number);
  let current = birthDateDigits.reduce((sum, digit) => sum + digit, 0);
  const calculationSteps = [current];
  while (current > 9 && !MASTER_NUMBERS.has(current)) {
    current = sumDigits(current);
    calculationSteps.push(current);
  }
  const content = CONTENT[current];
  if (!content) throw new Error('生命靈數資料暫時無法取得。');
  return { birthDateDigits, calculationSteps, lifePathNumber: current, isMasterNumber: MASTER_NUMBERS.has(current), ...content };
}
