import type { AiFateReport, ElementName, FateReportInput } from '../types/fate';
import { ELEMENT_LABELS, TOPIC_LABELS } from '../utils/constants';

const ELEMENT_ORDER: ElementName[] = ['wood', 'fire', 'earth', 'metal', 'water'];

/**
 * 每個主題備有 8 條具體行動，由命盤挑出 2 條：一條依日主五行（你順手的做法），
 * 一條依最弱五行（值得補位的地方）。
 *
 * 改為命盤決定是為了符合 docs/voice.md 的核心判準：靜態清單會讓同一主題的每個人
 * 拿到一模一樣的建議，出現率 100%，等於沒有針對任何人。
 */
const FOCUS_ACTION_POOL: Record<string, string[]> = {
  personality: [
    '記錄一週裡讓你有電和耗電的場合，各三件',
    '挑一個習慣，設一個當天就看得出有沒有做到的標準',
    '找一件你一直說「等有空再做」的事，這週排進行事曆',
    '請一位熟人講三個對你的印象，聽完先不解釋',
    '連續五天記下當天最想逃避的一件事',
    '把一件做順手的事拆開，看看別人卡在哪一步',
    '這週刻意用不習慣的方式做一件小事',
    '睡前寫一句今天最真實的情緒，不加評論',
  ],
  career: [
    '把手上最大的目標，改寫成三個月內可以驗收的樣子',
    '把一個重大選擇拆成兩週內可以回頭的小實驗',
    '找出這季最花時間卻沒有產出的一件事，停掉它',
    '請一位同事說出你最該補強的一項能力',
    '把你重複做過三次的流程寫成文件',
    '主動接一件目前能力搆不太到的任務',
    '列出三件只有你能做的事，其餘想辦法交出去',
    '為現在的職位寫一份你自己會想錄取的履歷',
  ],
  love: [
    '把情緒和事實分開寫下來，再跟對方談',
    '把一個期待講成具體要求，不要讓對方猜',
    '這週問對方一個你從沒問過的問題',
    '回想最近一次爭執，用對方的角度把經過重寫一遍',
    '約一段兩小時不看手機的相處時間',
    '講一件你需要對方幫忙的事，不繞彎',
    '把「我覺得你應該」換成「我希望我們」講一次',
    '寫下三件你欣賞對方卻沒說出口的事，挑一件說',
  ],
  finance: [
    '把上個月的支出分成必要、重要、想要三堆',
    '找出金額最大的一筆非必要支出，決定要不要續訂',
    '把收入的一個固定比例在發薪日當天先轉走',
    '算出你目前的存款可以撐幾個月沒有收入',
    '把一筆準備投入的錢，先查核三個反面資訊',
    '列出所有自動扣款，取消半年沒用到的',
    '設一個金額門檻，超過就強制隔夜再決定',
    '把財務目標寫成日期加數字，不寫「多存一點」',
  ],
  family: [
    '約一段不被打斷的對話時間，先講好不談解決方案',
    '把「我可以幫」和「這不是我的責任」各列三件',
    '這週主動問一位家人最近在煩什麼',
    '把一件長期抱怨的事，改成一個具體請求',
    '回想一次家庭衝突，寫下你當時真正想要的是什麼',
    '幫家人做一件他沒開口但你知道他需要的事',
    '把家裡的固定分工重新談一次',
    '對一位家人說一句你一直覺得說不出口的感謝',
  ],
  relationships: [
    '在答應之前先說「我想一下再回覆你」',
    '練習用一句話講清楚你的界線，不附理由',
    '列出最近三次勉強答應的事，找出共同點',
    '主動聯絡一位半年沒說話但你在意的人',
    '這週拒絕一件你其實不想做的邀約',
    '把一段讓你不舒服的互動寫下來，指出是哪一句',
    '找出耗掉你最多情緒的一段關係，決定調整距離',
    '對一個人講出你真正的想法，即使那會讓對方不高興',
  ],
  direction: [
    '列出三個你最重視的生活價值，排出先後',
    '選一個兩週內能做完的小實驗，測試某個方向',
    '寫下五年後理想的一天，從早上寫到晚上',
    '找出你最近做起來忘記時間的一件事',
    '問自己：如果沒人會知道，你還會做這件事嗎',
    '列出你羨慕的三個人，寫出羨慕的到底是什麼',
    '把一個「總有一天」的念頭排進這個月',
    '寫下你願意為哪件事忍受麻煩',
  ],
  all: [
    '這週只挑一個主題處理，其餘先擱著',
    '月底回頭看，哪些行動真的帶來改變',
    '把一件拖最久的事，切出十五分鐘先開始',
    '找出目前最消耗你的一件事，決定去留',
    '寫下這個月最想改變的一件事，只寫一件',
    '請一個信任的人指出你的盲點',
    '把一個模糊的煩惱寫成具體問題',
    '為下個月設一個你會期待的小目標',
  ],
};

/** 依命盤挑出兩條建議：日主五行決定「順手的做法」，最弱五行決定「補位的地方」。 */
function buildFocusSuggestions(topic: string, input: FateReportInput): string[] {
  const pool = FOCUS_ACTION_POOL[topic] ?? FOCUS_ACTION_POOL.all;
  const leverageIndex = ELEMENT_ORDER.indexOf(input.bazi.dayMasterElement);
  const shoreUpIndex = ELEMENT_ORDER.indexOf(input.fiveElements.weakest[0]);
  const first = pool[(leverageIndex + 5) % pool.length];
  const second = pool[(shoreUpIndex * 2 + 1) % pool.length];
  return first === second ? [first, pool[(pool.indexOf(second) + 3) % pool.length]] : [first, second];
}

function focusNarrative(topic: string, input: FateReportInput, strongest: string, weakest: string): string {
  const zodiacTrait = input.zodiac.positiveTraits[0];
  const starTrait = input.astrology.strengths[0];
  const numberTrait = input.numerology.strengths[0];
  const narratives: Record<string, string> = {
    personality: `日主${ELEMENT_LABELS[input.bazi.dayMasterElement]}、${input.astrology.sunSign}的「${starTrait}」、生命靈數的「${numberTrait}」，講的是同一件事的三個面向。這禮拜留意一下：你有把握的時候和被逼的時候，做事節奏差多少。`,
    career: `工作上先用「${zodiacTrait}」和「${numberTrait}」做出看得見的成果。你的五行${strongest}多、${weakest}少，拿這件事檢查一個問題：最近是不是只用了自己順手的那幾招。`,
    love: `把${input.zodiac.animal}的「${input.zodiac.positiveTraits[1]}」和${input.astrology.sunSign}的表達方式擺在一起看。重點不是替誰貼標籤，是把需求、界線和期待講清楚。`,
    finance: `拿生命靈數「${input.numerology.title}」的課題來檢查你的錢：目標和風險有沒有同時顧到。這裡不給投資建議，錢的決定請看實際數字。`,
    family: `注意「${zodiacTrait}」在家裡什麼時候是支持，什麼時候變成替別人扛。先把界線畫出來，再談你要幫到哪裡。`,
    relationships: `人際上你用得上${input.astrology.sunSign}的「${starTrait}」。壓力大的時候留意「${input.astrology.blindSpots[0]}」會不會冒出來——與其猜對方在想什麼，不如直接問。`,
    direction: `方向不是哪一套系統能替你決定的——把日主${input.bazi.dayMaster}、生命靈數 ${input.numerology.lifePathNumber} 和你真正在乎的東西放在一起，用小實驗去試哪一個撐得久。`,
    all: `從${strongest}偏多的做事方式、${input.zodiac.animal}的「${zodiacTrait}」、生命靈數的「${numberTrait}」裡，挑一個你最有感覺的，回到生活裡驗證看看。`,
  };
  return narratives[topic] ?? narratives.all;
}

export function generateFallbackReport(input: FateReportInput): AiFateReport {
  const strongest = input.fiveElements.strongest.map((key) => ELEMENT_LABELS[key]).join('、');
  const weakest = input.fiveElements.weakest.map((key) => ELEMENT_LABELS[key]).join('、');
  const moonDescription = input.astrology.moonSign ? `、月亮${input.astrology.moonSign}` : '';
  const ziweiDescription = input.ziwei ? `、紫微${input.ziwei.fiveElementsClass}` : '';
  const soulPalace = input.ziwei?.palaces.find((palace) => palace.name === '命宮');
  const soulPalaceStarNames = soulPalace?.majorStars.map((star) => star.name).join('、') ?? '';
  // 空宮要換句型，不能把「沒有主星」當成星名塞進「命宮裡坐的是…」。
  const soulPalaceSentence = soulPalaceStarNames
    ? `命宮裡坐的是${soulPalaceStarNames}`
    : '命宮裡沒有主星，紫微的做法是借對面那一宮來看';
  const ziweiHoroscopeDescription = input.ziwei?.currentHoroscope
    ? `；${input.ziwei.currentHoroscope.targetDate} 的大限命宮落在${input.ziwei.currentHoroscope.decadal.palaceName}、流年命宮落在${input.ziwei.currentHoroscope.yearly.palaceName}`
    : '';
  const baziSeasonDescription = input.bazi.seasonStrength
    ? `月支${input.bazi.seasonStrength.monthBranch}屬${input.bazi.seasonStrength.season}令，以季節來看你的日主五行屬「${({ prosperous: '旺', supportive: '相', resting: '休', imprisoned: '囚', declining: '死' } as const)[input.bazi.seasonStrength.states[input.bazi.dayMasterElement]]}」`
    : '本次沒有月令旺相資料';
  const baziRelationDescription = input.bazi.relations?.length
    ? `另外有 ${input.bazi.relations.length} 組刑沖合害`
    : '這次沒有找到明顯的合、沖、刑、害組合';
  const astrologyDistributionDescription = input.astrology.distribution
    ? `十顆星裡${input.astrology.distribution.dominantElements.join('、')}元素和${input.astrology.distribution.dominantModalities.join('、')}模式的比較多`
    : '這次沒有完整的十星分布資料';
  const equalHouseEmphasis = input.astrology.houseComparisons?.find((item) => item.system === 'equal')?.emphasis?.occupiedHouses[0];
  const astrologyHouseDescription = equalHouseEmphasis
    ? `等宮制中第 ${equalHouseEmphasis.house} 宮聚集${equalHouseEmphasis.planets.join('、')}`
    : '你沒有填出生地座標，所以上升和十二宮這裡不猜，直接留空';
  const sharedPatterns = [
    `「${input.zodiac.positiveTraits[0]}」和「${input.astrology.strengths[0]}」是兩套系統各自算出來、卻都點到的地方——這兩件事你大概最不用懷疑。`,
    `日主${ELEMENT_LABELS[input.bazi.dayMasterElement]}和${input.astrology.element}講的都是你做事的節奏，只是用了不同的詞。`,
    `生命靈數說你「${input.numerology.strengths[0]}」，生肖說你「${input.zodiac.positiveTraits[1]}」——兩邊在講同一種能力。`,
    ...(input.ziwei ? [`紫微用命主${input.ziwei.soul}、身主${input.ziwei.body}描述你，八字用日主。兩套說法不衝突，也不能互相取代。`] : []),
  ];
  const differences = [
    `八字看的是出生時間排出來的結構和平衡，太陽星座看的是季節怎麼影響你的表達方式。兩套在回答不同的問題。`,
    `生命靈數用數字整理人生課題，生肖用年支講一種大家都熟悉的性格側寫。`,
    ...(input.ziwei ? ['紫微斗數以十二宮與星曜組合觀察人生領域；八字則以干支、節氣與五行關係為核心，兩者採用不同座標系統。'] : []),
  ];
  const requestedFocus = input.userFocus.length ? input.userFocus : ['all'];
  const focus = requestedFocus.includes('all') ? ['personality', 'career', 'love', 'direction'] : requestedFocus;
  return {
    summary: `你的四柱裡${strongest}最多、${weakest}最少；${input.zodiac.animal}、太陽${input.astrology.sunSign}${moonDescription}${ziweiDescription}和生命靈數 ${input.numerology.lifePathNumber} 各算各的，但都指向同一件事：「${input.zodiac.positiveTraits[0]}」和「${input.astrology.strengths[0]}」在你身上會一起出現。這是看自己的一個角度，不是命定的結論。`,
    sharedPatterns,
    differences,
    sections: {
      // voice.md R3：段落至多 3 句。胎元、命宮、身宮、節氣等結構資料改由八字分頁的
      // 欄位呈現，這裡只留解讀；但計分規則與各流派差異屬透明度聲明，必須保留。
      bazi: `你的日主是${input.bazi.dayMaster}${ELEMENT_LABELS[input.bazi.dayMasterElement]}，四柱為${input.bazi.pillars.map((pillar) => pillar.value).join('、')}。${baziSeasonDescription}，${baziRelationDescription}。日主強弱與喜用神的完整判讀在八字分頁，用的是公開計分規則，和各流派手工論命的結論不一定一樣。`,
      zodiac: `${input.zodiac.animal}對應${input.zodiac.branch}支，傳統上說的是「${input.zodiac.symbol}」。你的強項在${input.zodiac.positiveTraits.join('、')}；要留意的是${input.zodiac.blindSpots.join('、')}。`,
      astrology: `太陽在${input.astrology.sunSign}，講的是你想成為什麼樣的人${input.astrology.moonSign ? `；月亮在${input.astrology.moonSign}，講的是你不舒服的時候會怎麼安撫自己` : ''}${input.astrology.risingSign ? `；上升${input.astrology.risingSign}，是別人第一眼看到的你` : ''}。${input.astrology.planets?.length ? `這張盤算了 ${input.astrology.planets.length} 顆星和 ${input.astrology.aspects?.length ?? 0} 組主要角度，${astrologyDistributionDescription}；${astrologyHouseDescription}${input.astrology.houseComparisons?.length ? '。宮位有等宮制和整宮制兩種常見算法，報告兩種都留著，不挑一種當標準答案' : ''}。` : ''}`,
      ...(input.ziwei ? { ziwei: `紫微把你的盤排成${input.ziwei.fiveElementsClass}，命宮落在${input.ziwei.soulPalaceBranch}、身宮在${input.ziwei.bodyPalaceBranch}——命宮是你本來的樣子，身宮是後天長成的樣子。${soulPalaceSentence}${ziweiHoroscopeDescription}。單看一顆星講不準，要連著對面那一宮和三方一起看；不同流派的排法也不一樣，這裡只呈現結構，不由單星預言事件。` } : {}),
      numerology: `${input.numerology.description} 你的生命靈數是 ${input.numerology.lifePathNumber}${input.numerology.isMasterNumber ? '（大師數）' : ''}，擅長${input.numerology.strengths.join('、')}，要練的是${input.numerology.challenges.join('、')}。`,
      ...(input.nameAnalysis ? { name: `${input.nameAnalysis.overallImpression}${input.nameAnalysis.elementComparison}${input.nameAnalysis.characters.some((item) => item.strokeSource === 'insufficient') ? '部分文字尚無正式字典資料，因此不延伸筆畫吉凶。' : ''}` } : {}),
    },
    focusAnalysis: focus.map((topic) => ({
      topic: TOPIC_LABELS[topic] ?? topic,
      analysis: focusNarrative(topic, input, strongest, weakest),
      suggestions: buildFocusSuggestions(topic, input),
    })),
    cautions: ['本報告僅供文化探索、娛樂與自我反思。', '重大醫療、法律、投資或人生決策，請依實際證據並諮詢合格專業人士。'],
  };
}
