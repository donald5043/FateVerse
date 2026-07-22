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

function focusNarrative(topic: string, input: FateReportInput, strongest: string, weakest: string): string {
  const zodiacTrait = input.zodiac.positiveTraits[0];
  const starTrait = input.astrology.strengths[0];
  const numberTrait = input.numerology.strengths[0];
  const narratives: Record<string, string> = {
    personality: `從日主${ELEMENT_LABELS[input.bazi.dayMasterElement]}、${input.astrology.sunSign}的「${starTrait}」與生命靈數的「${numberTrait}」來看，可以觀察自己在有把握與承受壓力時，是否會展現不同的節奏。`,
    career: `工作上可先運用「${zodiacTrait}」與「${numberTrait}」建立可見成果；五行以${strongest}相對突出、${weakest}較少，適合拿來檢查目前是否只使用熟悉能力，而忽略協作或調整。`,
    love: `關係中可把${input.zodiac.animal}生肖的「${input.zodiac.positiveTraits[1]}」和${input.astrology.sunSign}的表達方式並看；重點不是替彼此貼標籤，而是說清楚需求、界線與期待。`,
    finance: `財務主題可借用生命靈數「${input.numerology.title}」的課題，檢查資源安排是否同時兼顧目標與風險；命理象徵不構成投資判斷。`,
    family: `家庭互動可觀察「${zodiacTrait}」何時成為支持、何時可能變成過度承擔；先分清責任，再討論能提供的協助。`,
    relationships: `人際上可運用${input.astrology.sunSign}的「${starTrait}」，同時留意「${input.astrology.blindSpots[0]}」是否在壓力下出現，以具體回饋取代猜測。`,
    direction: `人生方向不需要由任何單一系統決定。可把日主${input.bazi.dayMaster}、生命靈數 ${input.numerology.lifePathNumber} 與你真正重視的價值並列，透過小型實驗找出有持續感的方向。`,
    all: `目前可先從${strongest}較突出的做事模式、${input.zodiac.animal}生肖的「${zodiacTrait}」與生命靈數的「${numberTrait}」選一項最有共鳴的線索，再回到現實情境驗證。`,
  };
  return narratives[topic] ?? narratives.all;
}

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
  const requestedFocus = input.userFocus.length ? input.userFocus : ['all'];
  const focus = requestedFocus.includes('all') ? ['personality', 'career', 'love', 'direction'] : requestedFocus;
  return {
    summary: `四柱資料顯示五行以${strongest}較突出、${weakest}相對較少；搭配${input.zodiac.animal}生肖、${input.astrology.sunSign}與生命靈數 ${input.numerology.lifePathNumber}，可觀察到「${input.zodiac.positiveTraits[0]}」與「${input.astrology.strengths[0]}」並存的傾向。這些是文化模型的自我反思線索，不是固定命運。`,
    sharedPatterns,
    differences,
    sections: {
      bazi: `你的日主為${input.bazi.dayMaster}（${ELEMENT_LABELS[input.bazi.dayMasterElement]}），四柱為${input.bazi.pillars.map((pillar) => pillar.value).join('、')}。節氣參考為${input.bazi.seasonalNode}；八個天干地支的簡化統計中，${strongest}比例較高，${weakest}比例較低。五行多寡不等於需要直接「補」某種元素。`,
      zodiac: `${input.zodiac.animal}對應${input.zodiac.branch}支，傳統象徵為「${input.zodiac.symbol}」。正向面可參考${input.zodiac.positiveTraits.join('、')}，同時留意${input.zodiac.blindSpots.join('、')}。`,
      astrology: `太陽位於${input.astrology.sunSign}，屬${input.astrology.element}元素、${input.astrology.modality}模式。這個角度重視${input.astrology.description}，優勢包括${input.astrology.strengths.join('、')}。`,
      numerology: `${input.numerology.description} 本次計算結果為 ${input.numerology.lifePathNumber}${input.numerology.isMasterNumber ? '（大師數）' : ''}，可發揮${input.numerology.strengths.join('、')}，並練習${input.numerology.challenges.join('、')}。`,
      ...(input.nameAnalysis ? { name: `${input.nameAnalysis.overallImpression}${input.nameAnalysis.elementComparison}${input.nameAnalysis.characters.some((item) => item.strokeSource === 'insufficient') ? '部分文字尚無正式字典資料，因此不延伸筆畫吉凶。' : ''}` } : {}),
    },
    focusAnalysis: focus.map((topic) => ({
      topic: TOPIC_LABELS[topic] ?? topic,
      analysis: focusNarrative(topic, input, strongest, weakest),
      suggestions: focusSuggestions[topic] ?? focusSuggestions.all,
    })),
    cautions: ['本報告僅供文化探索、娛樂與自我反思。', '重大醫療、法律、投資或人生決策，請依實際證據並諮詢合格專業人士。'],
    mode: 'template',
  };
}
