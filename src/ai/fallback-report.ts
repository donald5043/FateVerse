import type { AiFateReport, FateReportInput } from '../types/fate';
import { ELEMENT_LABELS, TOPIC_LABELS } from '../utils/constants';

const focusSuggestions: Record<string, string[]> = {
  personality: ['記錄一週中讓你有能量與消耗能量的情境', '為一項習慣設定可觀察的小指標'],
  career: ['建立三個月可衡量目標', '將重大選擇拆成可逆的小步驗證'],
  love: ['先記錄情緒與事實，再與對方溝通', '用具體需求取代猜測對方心意'],
  finance: ['先區分必要、重要與想要的支出', '涉及投資時查核資料並諮詢合格專業人士'],
  family: ['約定一段不被打斷的對話時間', '分清可協助的範圍與彼此責任'],
  relationships: ['在答應前保留思考時間', '練習以一句話清楚表達界線'],
  direction: ['列出三個最重視的生活價值', '選一個兩週內能完成的小型實驗'],
  all: ['本週只選一個優先主題', '月底回顧哪些行動真的帶來幫助'],
};

export function generateFallbackReport(input: FateReportInput): AiFateReport {
  const strongest = input.fiveElements.strongest.map((key) => ELEMENT_LABELS[key]).join('、');
  const weakest = input.fiveElements.weakest.map((key) => ELEMENT_LABELS[key]).join('、');
  const sharedPatterns = [
    `${input.zodiac.positiveTraits[0]}與${input.astrology.strengths[0]}都指向你能主動運用既有優勢。`,
    `日主${ELEMENT_LABELS[input.bazi.dayMasterElement]}與${input.astrology.element}象徵的特質，都可作為觀察做事節奏的文化線索。`,
    `${input.numerology.title}所強調的「${input.numerology.strengths[0]}」，可和生肖的「${input.zodiac.positiveTraits[1]}」交叉參照。`,
  ];
  const differences = [
    `八字五行較著重出生時間形成的結構與平衡；太陽星座則以季節區間描述自我表達，兩者回答的問題不同。`,
    `生命靈數偏向以數字象徵整理人生課題，生肖則以年支文化意象描述群體熟悉的特質。`,
  ];
  const focus = input.userFocus.length ? input.userFocus : ['all'];
  return {
    summary: `四柱資料顯示五行以${strongest}較突出、${weakest}相對較少；搭配${input.zodiac.animal}生肖、${input.astrology.sunSign}與生命靈數 ${input.numerology.lifePathNumber}，可觀察到「${input.zodiac.positiveTraits[0]}」與「${input.astrology.strengths[0]}」並存的傾向。這些是文化模型的自我反思線索，不是固定命運。`,
    sharedPatterns,
    differences,
    sections: {
      bazi: `你的日主為${input.bazi.dayMaster}（${ELEMENT_LABELS[input.bazi.dayMasterElement]}）。八個天干地支的簡化統計中，${strongest}比例較高，${weakest}比例較低；五行多寡不等於需要直接「補」某種元素。`,
      zodiac: `${input.zodiac.animal}對應${input.zodiac.branch}支，傳統象徵為「${input.zodiac.symbol}」。正向面可參考${input.zodiac.positiveTraits.join('、')}，同時留意${input.zodiac.blindSpots.join('、')}。`,
      astrology: `太陽位於${input.astrology.sunSign}，屬${input.astrology.element}元素、${input.astrology.modality}模式。這個角度重視${input.astrology.description}，優勢包括${input.astrology.strengths.join('、')}。`,
      numerology: `${input.numerology.description} 本次計算結果為 ${input.numerology.lifePathNumber}${input.numerology.isMasterNumber ? '（大師數）' : ''}，可發揮${input.numerology.strengths.join('、')}，並練習${input.numerology.challenges.join('、')}。`,
      ...(input.nameAnalysis ? { name: `${input.nameAnalysis.overallImpression}${input.nameAnalysis.elementComparison}` } : {}),
    },
    focusAnalysis: focus.map((topic) => ({
      topic: TOPIC_LABELS[topic] ?? topic,
      analysis: `可把各系統提供的傾向當成整理「${TOPIC_LABELS[topic] ?? topic}」現況的提問框架，先從可觀察的事實與自己的優先順序開始。`,
      suggestions: focusSuggestions[topic] ?? focusSuggestions.all,
    })),
    cautions: ['本報告僅供文化探索、娛樂與自我反思。', '重大醫療、法律、投資或人生決策，請依實際證據並諮詢合格專業人士。'],
    mode: 'template',
  };
}
