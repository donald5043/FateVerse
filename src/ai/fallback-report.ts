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
  const moonDescription = input.astrology.moonSign ? `、月亮${input.astrology.moonSign}` : '';
  const ziweiDescription = input.ziwei ? `、紫微${input.ziwei.fiveElementsClass}` : '';
  const soulPalace = input.ziwei?.palaces.find((palace) => palace.name === '命宮');
  const soulPalaceStars = soulPalace?.majorStars.map((star) => star.name).join('、') || '命宮無十四主星，需連同對宮與三方四正閱讀';
  const ziweiHoroscopeDescription = input.ziwei?.currentHoroscope
    ? `；${input.ziwei.currentHoroscope.targetDate} 的大限命宮落在${input.ziwei.currentHoroscope.decadal.palaceName}、流年命宮落在${input.ziwei.currentHoroscope.yearly.palaceName}`
    : '';
  const sharedPatterns = [
    `${input.zodiac.positiveTraits[0]}與${input.astrology.strengths[0]}都指向你能主動運用既有優勢。`,
    `日主${ELEMENT_LABELS[input.bazi.dayMasterElement]}與${input.astrology.element}象徵的特質，都可作為觀察做事節奏的文化線索。`,
    `${input.numerology.title}所強調的「${input.numerology.strengths[0]}」，可和生肖的「${input.zodiac.positiveTraits[1]}」交叉參照。`,
    ...(input.ziwei ? [`紫微命主${input.ziwei.soul}、身主${input.ziwei.body}提供另一組傳統象徵，可和八字日主並列觀察，但不互相取代。`] : []),
  ];
  const differences = [
    `八字五行較著重出生時間形成的結構與平衡；太陽星座則以季節區間描述自我表達，兩者回答的問題不同。`,
    `生命靈數偏向以數字象徵整理人生課題，生肖則以年支文化意象描述群體熟悉的特質。`,
    ...(input.ziwei ? ['紫微斗數以十二宮與星曜組合觀察人生領域；八字則以干支、節氣與五行關係為核心，兩者採用不同座標系統。'] : []),
  ];
  const requestedFocus = input.userFocus.length ? input.userFocus : ['all'];
  const focus = requestedFocus.includes('all') ? ['personality', 'career', 'love', 'direction'] : requestedFocus;
  return {
    summary: `四柱資料顯示五行以${strongest}較突出、${weakest}相對較少；搭配${input.zodiac.animal}生肖、太陽${input.astrology.sunSign}${moonDescription}${ziweiDescription}與生命靈數 ${input.numerology.lifePathNumber}，可觀察到「${input.zodiac.positiveTraits[0]}」與「${input.astrology.strengths[0]}」並存的傾向。這些是文化模型的自我反思線索，不是固定命運。`,
    sharedPatterns,
    differences,
    sections: {
      bazi: `你的日主為${input.bazi.dayMaster}（${ELEMENT_LABELS[input.bazi.dayMasterElement]}），四柱為${input.bazi.pillars.map((pillar) => pillar.value).join('、')}。胎元${input.bazi.taiYuan}、命宮${input.bazi.mingGong}、身宮${input.bazi.shenGong}；節氣參考為${input.bazi.seasonalNode}。藏干、十神與大運已列入原始盤面，但五行多寡仍不等於需要直接「補」某種元素。`,
      zodiac: `${input.zodiac.animal}對應${input.zodiac.branch}支，傳統象徵為「${input.zodiac.symbol}」。正向面可參考${input.zodiac.positiveTraits.join('、')}，同時留意${input.zodiac.blindSpots.join('、')}。`,
      astrology: `太陽位於${input.astrology.sunSign}${input.astrology.moonSign ? `，月亮位於${input.astrology.moonSign}` : ''}${input.astrology.risingSign ? `，上升位於${input.astrology.risingSign}` : ''}，太陽星座屬${input.astrology.element}元素、${input.astrology.modality}模式。${input.astrology.planets?.length ? `本次已用天文函式庫計算 ${input.astrology.planets.length} 個星體與 ${input.astrology.aspects?.length ?? 0} 組主要相位；` : ''}${input.astrology.risingSign ? '宮位採等宮制，需和其他宮制分開比較。' : '未提供完整經緯度，因此上升與宮位不以猜測補齊。'}`,
      ...(input.ziwei ? { ziwei: `紫微排盤為${input.ziwei.fiveElementsClass}，命主${input.ziwei.soul}、身主${input.ziwei.body}，命宮在${input.ziwei.soulPalaceBranch}、身宮在${input.ziwei.bodyPalaceBranch}。命宮主星欄為「${soulPalaceStars}」${ziweiHoroscopeDescription}。星曜與運限需連同三方四正及流派設定閱讀，本版只呈現文化結構，不由單星預言事件。` } : {}),
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
