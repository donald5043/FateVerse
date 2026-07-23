import type { ElementName } from '../types/fate';

export interface PalmOption {
  id: string;
  label: string;
  hint: string;
  reading: string;
  tip: string;
}

// 手型四類直接對應傳統四元素；沿用本站「風≈木」的跨文化約定。
const HAND_SHAPE_ELEMENTS: Record<string, ElementName> = {
  earth: 'earth',
  air: 'wood',
  water: 'water',
  fire: 'fire',
};

/** 手型的五行訊號；未指認手型時回傳 undefined。 */
export function palmShapeElement(selections: PalmSelections): ElementName | undefined {
  const shape = selections.handShape;
  return shape ? HAND_SHAPE_ELEMENTS[shape] : undefined;
}

export interface PalmFeature {
  id: 'handShape' | 'lifeLine' | 'headLine' | 'heartLine' | 'fateLine';
  title: string;
  question: string;
  howTo: string;
  options: PalmOption[];
}

export interface PalmSectionReading {
  featureId: PalmFeature['id'];
  featureTitle: string;
  optionLabel: string;
  reading: string;
  tip: string;
}

export interface PalmReading {
  headline: string;
  sections: PalmSectionReading[];
  synthesis: string;
  cautions: string[];
}

export const PALM_FEATURES: PalmFeature[] = [
  {
    id: 'handShape',
    title: '手型',
    question: '你的手掌和手指比例比較接近哪一種？',
    howTo: '看整個手掌：掌是偏方形還是長形？手指相對掌心是長還是短？',
    options: [
      { id: 'earth', label: '方掌短指（土型手）', hint: '掌方厚實、手指較短', reading: '土型手在傳統手相裡是「務實派」：喜歡看得到、摸得到的成果，答應的事會做到，是別人眼中可靠的人。', tip: '你的穩定是優勢，但記得偶爾讓自己試點沒把握的新東西。' },
      { id: 'air', label: '方掌長指（風型手）', hint: '掌方、手指修長', reading: '風型手偏「思考與溝通派」：對資訊好奇、喜歡把事情講清楚，適合需要動腦和表達的事。', tip: '想很多是天賦，但想完記得選一個真的去做。' },
      { id: 'water', label: '長掌長指（水型手）', hint: '掌長窄、手指修長', reading: '水型手是「感受派」：情感細膩、想像力豐富，容易接收到別人沒說出口的情緒。', tip: '感受力強也容易累，安排固定的獨處時間幫自己排水。' },
      { id: 'fire', label: '長掌短指（火型手）', hint: '掌長、手指相對短', reading: '火型手是「行動派」：熱情來得快、決定下得快，帶動氣氛的能力很強。', tip: '衝勁是你的引擎，重大決定前給自己二十四小時冷卻。' },
    ],
  },
  {
    id: 'lifeLine',
    title: '生命線',
    question: '從虎口繞著拇指根部的那條線，看起來如何？',
    howTo: '生命線反映的是「能量與生活節奏」，不是壽命長短。',
    options: [
      { id: 'deep', label: '深而清晰', hint: '線條明顯、弧度完整', reading: '傳統上代表底氣足：體力和恢復力不錯，遇到壓力撐得住，生活步調有自己的節奏。', tip: '底子好也別揮霍，把運動和睡眠當存款。' },
      { id: 'faint', label: '淺而細', hint: '線條較淡、不明顯', reading: '傳統上讀作能量偏向細水長流：不適合連續硬仗，但只要節奏對，續航力其實很好。', tip: '學會分段工作、主動休息，比硬撐更適合你。' },
      { id: 'wide', label: '弧度開闊', hint: '線往掌心中央畫出大弧', reading: '弧度大傳統上代表活力外放：喜歡動、喜歡出門，行動範圍越大越有精神。', tip: '悶太久會沒電，定期安排出走或運動幫自己充電。' },
      { id: 'close', label: '貼近拇指', hint: '弧度小、線貼著拇指根', reading: '傳統上讀作能量內收：偏好熟悉的環境和小圈子，在安全範圍裡最能發揮。', tip: '不用勉強變外向，但每個月給自己一次小小的舒適圈外體驗。' },
    ],
  },
  {
    id: 'headLine',
    title: '智慧線',
    question: '橫過掌心中段的那條線，走向偏哪一種？',
    howTo: '智慧線反映「思考風格」，長短跟聰不聰明無關。',
    options: [
      { id: 'long', label: '長而平直', hint: '幾乎橫貫整個手掌', reading: '傳統上代表分析型思考：想事情全面、講邏輯，適合規劃與研究類的任務。', tip: '分析是強項，但小事別過度分析，留力氣給大事。' },
      { id: 'short', label: '偏短', hint: '大約到掌心中央就結束', reading: '傳統上讀作直覺型：反應快、抓重點快，不愛冗長的討論，行動導向。', tip: '快是優勢，重要文件和合約還是放慢速度多看一次。' },
      { id: 'curved', label: '往下彎向掌底', hint: '尾端彎向手腕方向', reading: '傳統上代表想像力豐富：容易有創意和畫面感，適合創作、企劃與需要靈感的事。', tip: '靈感要有出口，養成隨手記下想法的習慣。' },
      { id: 'forked', label: '尾端分叉', hint: '末端分成兩條以上', reading: '傳統上讀作多角度思考：能同時理解不同立場，是天生的翻譯者與協調者。', tip: '看得到兩邊也容易搖擺，練習幫自己設決定期限。' },
    ],
  },
  {
    id: 'heartLine',
    title: '感情線',
    question: '掌心最上方、靠近手指根部的那條線呢？',
    howTo: '感情線反映「情感表達方式」，不是感情運好壞。',
    options: [
      { id: 'long', label: '長而清晰', hint: '延伸到食指或中指下方', reading: '傳統上代表重感情、願意投入：在乎的人事物會全心對待，也期待同等的回應。', tip: '付出前先確認對方要的是什麼，愛才不會變成壓力。' },
      { id: 'short', label: '偏短', hint: '大約到中指下方就結束', reading: '傳統上讀作務實型情感：不擅長甜言蜜語，但用行動照顧人，愛得很實際。', tip: '偶爾把在乎說出口，行動加上語言效果加倍。' },
      { id: 'chained', label: '鏈狀或多細紋', hint: '線像鎖鏈或有很多小分支', reading: '傳統上代表感受細膩：情緒的解析度很高，能察覺關係裡微小的變化。', tip: '感覺到的不一定是事實，察覺之後先求證再反應。' },
      { id: 'upward', label: '末端上揚', hint: '尾端朝食指方向翹起', reading: '傳統上讀作樂觀的情感表達：願意主動示好、化解尷尬，是關係裡的暖場者。', tip: '照顧氣氛之餘，也留一點空間表達自己的需要。' },
    ],
  },
  {
    id: 'fateLine',
    title: '事業線',
    question: '從掌底往中指方向的縱線，你的看起來如何？',
    howTo: '很多人沒有明顯事業線，這完全正常，不代表沒有事業。',
    options: [
      { id: 'clear', label: '清晰一條到底', hint: '從掌底直上中指方向', reading: '傳統上代表目標感清楚：知道自己要什麼，職涯路線相對聚焦，適合深耕一個領域。', tip: '專注是資產，但每年抬頭看一次產業變化，避免走成死巷。' },
      { id: 'broken', label: '斷斷續續', hint: '有中斷或分段', reading: '傳統上讀作階段轉換多：職涯可能換過方向或還會再換，每一段都在累積不同的能力。', tip: '把每段經歷的收穫寫下來，你的優勢是組合技。' },
      { id: 'multiple', label: '不只一條', hint: '有平行或分支線', reading: '傳統上代表多線發展：可能同時有正職與副業、專業與興趣，多重身分是你的常態。', tip: '多線可以，但同一時間只讓一條當主線，其他當支線。' },
      { id: 'none', label: '沒有明顯的線', hint: '找不太到縱向的線', reading: '傳統上讀作自由型：職涯不被單一路線定義，機會來了就接得住，彈性本身就是你的路線。', tip: '沒有固定路線更需要方向感，用價值觀代替職稱來導航。' },
    ],
  },
];

export type PalmSelections = Partial<Record<PalmFeature['id'], string>>;

export function buildPalmReading(selections: PalmSelections): PalmReading | undefined {
  const sections: PalmSectionReading[] = [];
  for (const feature of PALM_FEATURES) {
    const optionId = selections[feature.id];
    if (!optionId) continue;
    const option = feature.options.find((item) => item.id === optionId);
    if (!option) continue;
    sections.push({ featureId: feature.id, featureTitle: feature.title, optionLabel: option.label, reading: option.reading, tip: option.tip });
  }
  if (sections.length < 3) return undefined;
  const shape = PALM_FEATURES[0].options.find((item) => item.id === selections.handShape);
  const headline = shape
    ? `整體來看，你是${shape.label.replace(/（.+）/, '')}搭配${sections.length - (selections.handShape ? 1 : 0)}條主要線紋的組合。`
    : `你選出了 ${sections.length} 項掌紋特徵，以下逐一用白話說明。`;
  return {
    headline,
    sections,
    synthesis: '手相把「手」當成個性的地圖：手型是底色，生命線談能量節奏，智慧線談思考風格，感情線談表達方式，事業線談路線感。把上面幾段合起來讀，比單看一條線更接近傳統手相的讀法。',
    cautions: [
      '掌紋會隨年齡與生活改變，左右手也常不同（傳統上一手看先天、一手看後天）。',
      '手相是文化觀察工具，反映的是「傾向」，不能預測健康、壽命或具體事件。',
      '照片只在你的瀏覽器顯示，不會上傳到任何伺服器。',
    ],
  };
}
