import type { NumerologyResult } from '../types/fate';

const CONTENT: Record<number, Omit<NumerologyResult, 'birthDateDigits' | 'calculationSteps' | 'lifePathNumber' | 'isMasterNumber'>> = {
  1: { title: '開創者', strengths: ['自主', '行動力', '原創'], challenges: ['練習合作', '避免獨自承擔'], description: '一件事還沒人開頭時，你會是先動手的那個。' },
  2: { title: '協調者', strengths: ['同理', '合作', '敏銳'], challenges: ['建立界線', '表達需求'], description: '一群人講話時，你會先注意到那個沒開口的人。' },
  3: { title: '表達者', strengths: ['創意', '溝通', '樂觀'], challenges: ['維持專注', '完成收尾'], description: '想法要說出來或寫下來，你才知道自己真正在想什麼。' },
  4: { title: '建造者', strengths: ['秩序', '可靠', '務實'], challenges: ['保留彈性', '接受調整'], description: '同一件事做過兩次，你就會想把它變成固定流程。' },
  5: { title: '探索者', strengths: ['適應', '好奇', '多元'], challenges: ['穩定節奏', '衡量風險'], description: '行程被排滿到沒有空檔時，你會想推掉一些。' },
  6: { title: '照顧者', strengths: ['責任', '關懷', '美感'], challenges: ['不過度承擔', '照顧自己'], description: '別人開口之前，你已經先看出他需要什麼。' },
  7: { title: '研究者', strengths: ['分析', '洞察', '專注'], challenges: ['分享感受', '避免孤立'], description: '別人問你「這個好不好」，你會想先弄清楚它怎麼運作才回答。' },
  8: { title: '實踐者', strengths: ['組織', '決斷', '資源感'], challenges: ['兼顧價值', '適度放手'], description: '講到計畫，你第一個問的是「怎麼衡量有沒有做到」。' },
  9: { title: '整合者', strengths: ['包容', '理想', '視野'], challenges: ['適時放下', '務實分配'], description: '遇到具體的爭執，你會往後退一步問「這件事整體是為了什麼」。' },
  11: { title: '啟發者', strengths: ['直覺', '感受力', '啟發'], challenges: ['穩定神經節奏', '把靈感落地'], description: '走進一個房間，你很快就感覺到氣氛不對，但說不出根據。' },
  22: { title: '願景建造者', strengths: ['願景', '系統力', '實踐'], challenges: ['拆小目標', '避免壓力過載'], description: '你會把五年後想達成的事，倒推成這個月要做的三件事。' },
  33: { title: '慈悲引導者', strengths: ['關懷', '教導', '包容'], challenges: ['維持界線', '不追求完美付出'], description: '照顧別人的時候你狀態最好，輪到自己休息反而不知道要幹嘛。' },
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
