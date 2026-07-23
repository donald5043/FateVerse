import type {
  ElementName,
  FateReportInput,
  FusionAxis,
  FusionConsensus,
  FusionDomain,
  FusionElementVote,
  FusionEvidence,
  FusionHighlight,
  FusionReading,
  FusionTiming,
  SystemConclusion,
  TimelinePhase,
} from '../types/fate';
import { branchToElement, stemToElement } from './five-elements-engine';
import { getBirthCards } from './tarot-engine';
import { ELEMENT_LABELS } from '../utils/constants';

const ELEMENT_ORDER: ElementName[] = ['wood', 'fire', 'earth', 'metal', 'water'];

// 西洋四元素與五行沒有正式對應；風元素以「木」近似（流動、成長、訊息），僅作跨文化比較。
const WESTERN_TO_FIVE: Record<string, ElementName> = { 火: 'fire', 土: 'earth', 水: 'water', 風: 'wood' };

// 洛書九宮的常見數字五行對照；大師數依 11→2、22→4、33→6 併入比較。
const NUMEROLOGY_TO_FIVE: Record<number, ElementName> = {
  1: 'water', 2: 'earth', 3: 'wood', 4: 'wood', 5: 'earth', 6: 'metal', 7: 'metal', 8: 'earth', 9: 'fire',
};

const ELEMENT_PLAIN: Record<ElementName, { vibe: string; work: string; love: string; rest: string }> = {
  wood: {
    vibe: '喜歡成長、往前展開，像植物一樣需要空間和方向',
    work: '需要看得到成長性的環境，例如規劃、教育、內容或把小東西養大的專案',
    love: '在關係裡重視一起進步的感覺，最怕原地踏步',
    rest: '悶在室內太久會蔫掉，散步、綠意和換個環境最能回血',
  },
  fire: {
    vibe: '自帶熱度、要發光，情緒和行動都來得快',
    work: '適合能被看見的位置，例如簡報、推廣、帶氣氛、開新局',
    love: '表達直接、熱得快，需要對方接得住你的熱情',
    rest: '燒過頭容易斷電，安排固定的冷卻時間比硬撐重要',
  },
  earth: {
    vibe: '求穩、講信用，喜歡把事情放在可靠的基礎上',
    work: '適合營運、管理、後勤這類把事情穩穩接住的角色',
    love: '用行動和陪伴表達在乎，勝過甜言蜜語',
    rest: '規律作息就是你的充電器，生活一亂整個人就卡',
  },
  metal: {
    vibe: '重視品質和原則，喜歡把事情切得清楚俐落',
    work: '適合講究精準的專業，例如品管、法務、財務、工藝',
    love: '愛得認真但標準也高，練習把要求說成需求會更順',
    rest: '整理環境、把待辦收乾淨，本身就是一種放鬆',
  },
  water: {
    vibe: '像水一樣會繞路、會滲透，觀察力和適應力強',
    work: '適合流通與連結的工作，例如溝通、研究、貿易、資訊',
    love: '感受細膩、記得很多小事，但需要安全感才會交心',
    rest: '獨處、泡水、聽音樂這種「安靜流動」的方式最能恢復',
  },
};

const AXIS_ZODIAC_PACE: Record<string, number> = { 虎: 1, 馬: 1, 龍: 1, 猴: 1, 牛: -1, 蛇: -1, 羊: -1, 豬: -1 };
const AXIS_ZODIAC_EXPRESS: Record<string, number> = { 馬: 1, 猴: 1, 雞: 1, 龍: 1, 鼠: -1, 蛇: -1, 牛: -1, 兔: -1 };
const AXIS_ZODIAC_DECIDE: Record<string, number> = { 兔: 1, 羊: 1, 豬: 1, 雞: -1, 牛: -1, 蛇: -1 };
const AXIS_ZODIAC_ENERGY: Record<string, number> = { 馬: 1, 猴: 1, 龍: 1, 豬: 1, 鼠: -1, 蛇: -1, 牛: -1, 狗: -1 };

const AXIS_ELEMENT_PACE: Record<ElementName, number> = { fire: 1, wood: 0.5, water: 0, metal: -0.5, earth: -1 };
const AXIS_ELEMENT_EXPRESS: Record<ElementName, number> = { fire: 1, wood: 0.5, metal: 0, water: -0.5, earth: -0.5 };
const AXIS_ELEMENT_DECIDE: Record<ElementName, number> = { water: 0.5, fire: 0.5, wood: 0, earth: -0.5, metal: -1 };

const AXIS_NUMBER_PACE: Record<number, number> = { 1: 1, 3: 1, 5: 1, 8: 1, 2: -1, 4: -1, 6: -1, 7: -1, 22: -1 };
const AXIS_NUMBER_EXPRESS: Record<number, number> = { 1: 1, 3: 1, 5: 1, 2: -1, 4: -1, 7: -1 };
const AXIS_NUMBER_DECIDE: Record<number, number> = { 2: 1, 3: 1, 11: 1, 33: 1, 4: -1, 7: -1, 8: -1, 22: -1 };
const AXIS_NUMBER_ENERGY: Record<number, number> = { 3: 1, 5: 1, 6: 1, 4: -1, 7: -1 };

function reduceMasterNumber(value: number): number {
  if (value === 11) return 2;
  if (value === 22) return 4;
  if (value === 33) return 6;
  return value;
}

export function numerologyElement(lifePathNumber: number): ElementName {
  const reduced = reduceMasterNumber(lifePathNumber);
  return NUMEROLOGY_TO_FIVE[reduced] ?? 'earth';
}

export function parseZiweiClassElement(fiveElementsClass: string): ElementName | undefined {
  const map: Record<string, ElementName> = { 木: 'wood', 火: 'fire', 土: 'earth', 金: 'metal', 水: 'water' };
  for (const char of fiveElementsClass) {
    const element = map[char];
    if (element) return element;
  }
  return undefined;
}

interface ElementVoteInput {
  system: string;
  element: ElementName;
}

function tallyVotes(entries: ElementVoteInput[]): FusionElementVote[] {
  const byElement = new Map<ElementName, string[]>();
  entries.forEach(({ system, element }) => {
    byElement.set(element, [...(byElement.get(element) ?? []), system]);
  });
  return ELEMENT_ORDER.filter((element) => byElement.has(element))
    .map((element) => ({ element, votes: byElement.get(element)!.length, systems: byElement.get(element)! }))
    .sort((a, b) => b.votes - a.votes);
}

function buildConsensus(input: FateReportInput): { consensus: FusionConsensus; voteEntries: ElementVoteInput[] } {
  const voteEntries: ElementVoteInput[] = [
    { system: '八字日主', element: input.bazi.dayMasterElement },
    { system: '四柱五行分布', element: input.fiveElements.strongest[0] },
    { system: '生肖年支', element: branchToElement(input.zodiac.branch) },
  ];
  const westernElement = WESTERN_TO_FIVE[input.astrology.element];
  if (westernElement) voteEntries.push({ system: '西洋太陽星座', element: westernElement });
  voteEntries.push({ system: '生命靈數', element: numerologyElement(input.numerology.lifePathNumber) });
  if (input.ziwei) {
    const ziweiElement = parseZiweiClassElement(input.ziwei.fiveElementsClass);
    if (ziweiElement) voteEntries.push({ system: '紫微五行局', element: ziweiElement });
  }
  if (input.nameAnalysis) {
    const named = input.nameAnalysis.characters.find((item) => item.element);
    if (named?.element) voteEntries.push({ system: '姓名用字', element: named.element });
  }

  const votes = tallyVotes(voteEntries);
  const top = votes[0];
  const leading = votes.filter((vote) => vote.votes === top.votes).map((vote) => vote.element);
  const ratio = top.votes / voteEntries.length;
  const agreementLevel = ratio >= 0.5 ? 'high' : top.votes >= 2 ? 'medium' : 'low';
  const leadingLabels = leading.map((element) => ELEMENT_LABELS[element]).join('、');
  const plainByLevel: Record<FusionConsensus['agreementLevel'], string> = {
    high: `講白話：把 ${voteEntries.length} 套系統各自換算成五行後，有 ${top.votes} 套不約而同指向「${leadingLabels}」。這麼多套不同文化的模型講到同一件事，代表「${ELEMENT_PLAIN[leading[0]].vibe}」很可能是你自己也認得出來的主旋律。`,
    medium: `講白話：${voteEntries.length} 套系統換算成五行後，「${leadingLabels}」被點名 ${top.votes} 次，算是相對明顯的主題，但沒有一面倒。你可以把它當成「最常出現的底色」，其他元素則是不同場合會冒出來的配色。`,
    low: `講白話：這 ${voteEntries.length} 套系統換算成五行後意見相當分歧，沒有哪個元素特別突出。這不是系統壞掉，而是說你的組合比較多面向——不同場合會切換不同模式，別急著用單一標籤定義自己。`,
  };
  return {
    consensus: {
      votes,
      leading,
      agreementLevel,
      plainSummary: plainByLevel[agreementLevel],
      mappingNotes: [
        '西洋四元素與五行沒有正式對應，此處把「風」近似為「木」（流動、訊息、成長），僅作跨文化比較。',
        '生命靈數採洛書九宮常見對照（1水、2土、3木、4木、5土、6金、7金、8土、9火）；大師數 11、22、33 依 2、4、6 併入。',
        '把不同系統換算到同一座標是為了「並列觀察」，不是說它們真的在講同一套理論。',
      ],
    },
    voteEntries,
  };
}

interface AxisContribution {
  system: string;
  point: string;
  value: number;
}

function buildAxis(
  id: string,
  label: string,
  leftLabel: string,
  rightLabel: string,
  contributions: AxisContribution[],
  verdictTexts: { strongLeft: string; leanLeft: string; balanced: string; leanRight: string; strongRight: string },
): FusionAxis {
  const active = contributions.filter((item) => item.value !== 0);
  const total = active.reduce((sum, item) => sum + item.value, 0);
  const maxAbs = active.reduce((sum, item) => sum + Math.abs(item.value), 0) || 1;
  const score = Math.round((total / maxAbs) * 100);
  let verdict: string;
  if (score >= 45) verdict = verdictTexts.strongLeft;
  else if (score >= 15) verdict = verdictTexts.leanLeft;
  else if (score > -15) verdict = verdictTexts.balanced;
  else if (score > -45) verdict = verdictTexts.leanRight;
  else verdict = verdictTexts.strongRight;
  const evidence: FusionEvidence[] = active.map(({ system, point, value }) => ({
    system,
    point: `${point}（偏向「${value > 0 ? leftLabel : rightLabel}」）`,
  }));
  return { id, label, leftLabel, rightLabel, score, verdict, evidence };
}

function buildAxes(input: FateReportInput): FusionAxis[] {
  const dayElement = input.bazi.dayMasterElement;
  const dayLabel = `日主${input.bazi.dayMaster}（${ELEMENT_LABELS[dayElement]}）`;
  const animal = input.zodiac.animal;
  const life = input.numerology.lifePathNumber;
  const sun = input.astrology.sunSign;
  const modality = input.astrology.modality;
  const westernElement = input.astrology.element;
  const modalityPace = modality === '開創' ? 1 : modality === '固定' ? -1 : 0;
  const westernSocial = westernElement === '火' || westernElement === '風' ? 1 : -1;
  const westernIntuition = westernElement === '水' || westernElement === '火' ? 1 : -1;

  const pace = buildAxis('pace', '行動節奏', '先衝再說', '想好再動', [
    { system: '八字', point: dayLabel, value: AXIS_ELEMENT_PACE[dayElement] },
    { system: '西洋星座', point: `${sun}屬${modality}模式`, value: modalityPace },
    { system: '生肖', point: `${animal}年出生`, value: AXIS_ZODIAC_PACE[animal] ?? 0 },
    { system: '生命靈數', point: `生命靈數 ${life}`, value: AXIS_NUMBER_PACE[life] ?? 0 },
  ], {
    strongLeft: '幾套系統一起看，你多半是「先做了再修」的類型：起步快是優勢，記得留一點回頭檢查的餘裕就好。',
    leanLeft: '整體偏向行動派：想到就想動，但還保有踩煞車的能力，算是不錯的平衡。',
    balanced: '快慢兩邊的訊號差不多：你大概是「看場合切換」的人，熟悉的事衝很快，沒把握的事會先觀望。',
    leanRight: '整體偏向謀定而後動：你習慣先把路想清楚，好處是穩，只要別把「再想一下」變成拖延就行。',
    strongRight: '幾套系統都指向沉穩慢熬型：你適合把時間當隊友，用累積換成果；偶爾也給自己一個「限時決定」的練習。',
  });

  const express = buildAxis('express', '表達方式', '有話直說', '放在心裡', [
    { system: '八字', point: dayLabel, value: AXIS_ELEMENT_EXPRESS[dayElement] },
    { system: '西洋星座', point: `${sun}屬${westernElement}元素`, value: westernSocial },
    { system: '生肖', point: `${animal}年出生`, value: AXIS_ZODIAC_EXPRESS[animal] ?? 0 },
    { system: '生命靈數', point: `生命靈數 ${life}`, value: AXIS_NUMBER_EXPRESS[life] ?? 0 },
  ], {
    strongLeft: '你八成是「想法藏不住」的人：直說是你的魅力，只要在重要場合先想三秒再開口，就幾乎沒有缺點。',
    leanLeft: '整體偏外放：大部分時候願意把話說出來，但也懂得看場合，這是很好用的組合。',
    balanced: '外放和內斂的訊號各半：你可能對熟人暢所欲言、對生人先觀察，這很正常，不用勉強自己統一。',
    leanRight: '整體偏內斂：你習慣先在心裡整理好再說。記得，別人不會通靈——重要的需求還是要說出口。',
    strongRight: '幾套系統都說你把話放心裡：深思是優點，但憋久了容易累積誤會，可以練習每天說出一件真實感受。',
  });

  const decide = buildAxis('decide', '決策風格', '跟著感覺走', '按部就班算', [
    { system: '八字', point: dayLabel, value: AXIS_ELEMENT_DECIDE[dayElement] },
    { system: '西洋星座', point: `${sun}屬${westernElement}元素`, value: westernIntuition },
    { system: '生肖', point: `${animal}年出生`, value: AXIS_ZODIAC_DECIDE[animal] ?? 0 },
    { system: '生命靈數', point: `生命靈數 ${life}`, value: AXIS_NUMBER_DECIDE[life] ?? 0 },
  ], {
    strongLeft: '你的直覺雷達相當強：第一感覺常常是對的，但金額大或影響久的決定，還是幫直覺配一張檢查清單。',
    leanLeft: '整體偏直覺派：先有感覺、再找理由。可以善用這個天線，同時養成把理由補齊的小習慣。',
    balanced: '感覺與分析勢均力敵：你大概是「先感覺、再驗算」的混合型，這其實是決策裡很健康的配置。',
    leanRight: '整體偏分析派：你喜歡把選項攤開來比。效率提示：小事給自己五分鐘上限，把火力留給大事。',
    strongRight: '幾套系統都說你是步驟派：規劃是你的強項，但世界不會永遠照計畫走，留一格「計畫外」的彈性會更輕鬆。',
  });

  const energy = buildAxis('energy', '能量來源', '人多熱鬧充電', '安靜獨處回血', [
    { system: '西洋星座', point: `${sun}屬${westernElement}元素`, value: westernSocial },
    { system: '生肖', point: `${animal}年出生`, value: AXIS_ZODIAC_ENERGY[animal] ?? 0 },
    { system: '生命靈數', point: `生命靈數 ${life}`, value: AXIS_NUMBER_ENERGY[life] ?? 0 },
    { system: '八字', point: `五行以${ELEMENT_LABELS[input.fiveElements.strongest[0]]}相對突出`, value: AXIS_ELEMENT_EXPRESS[input.fiveElements.strongest[0]] },
  ], {
    strongLeft: '你多半是人群充電型：跟人互動會讓你更有勁，行程太空反而悶。安排社交沒問題，睡眠別跟著犧牲就好。',
    leanLeft: '整體偏群體型：喜歡有人一起，但也撐得住獨處，恢復方式算有彈性。',
    balanced: '兩種充電方式訊號各半：你可能是「熱鬧完需要靜一下」的節奏型，安排行程時記得留白。',
    leanRight: '整體偏獨處型：安靜時刻是你的行動電源。社交不是不行，但結束後給自己緩衝時間，別連趕兩攤。',
    strongRight: '幾套系統都指向獨處回血：留白對你不是奢侈是剛需，把獨處時間當正式行程排進去，狀態會穩很多。',
  });

  return [pace, express, decide, energy];
}

function buildDomains(input: FateReportInput, leading: ElementName): FusionDomain[] {
  const dayLabel = ELEMENT_LABELS[input.bazi.dayMasterElement];
  const strongestLabel = ELEMENT_LABELS[input.fiveElements.strongest[0]];
  const weakestLabel = ELEMENT_LABELS[input.fiveElements.weakest[0]];
  const plain = ELEMENT_PLAIN[leading];
  const zodiacTrait = input.zodiac.positiveTraits[0];
  const zodiacBlind = input.zodiac.blindSpots[0];
  const starTrait = input.astrology.strengths[0];
  const starBlind = input.astrology.blindSpots[0];
  const numberTitle = input.numerology.title;
  const numberChallenge = input.numerology.challenges[0];
  const soulPalace = input.ziwei?.palaces.find((palace) => palace.name === '命宮');
  const soulStars = soulPalace?.majorStars.map((star) => star.name).join('、');

  const personality: FusionDomain = {
    id: 'personality',
    title: '個性：合起來是什麼樣的人',
    plainReading: `講白話：八字說你的核心是${input.bazi.dayMaster}（${dayLabel}）日主，生肖${input.zodiac.animal}補了一筆「${zodiacTrait}」，${input.astrology.sunSign}又加上「${starTrait}」，生命靈數 ${input.numerology.lifePathNumber} 給你「${numberTitle}」的課題${soulStars ? `，紫微命宮還坐著${soulStars}` : ''}。全部疊起來，比較像在說：你${plain.vibe}。這幾套系統各自用不同語言，卻在描述同一個人不同角度的側臉。`,
    evidence: [
      { system: '八字', point: `日主${input.bazi.dayMaster}屬${dayLabel}` },
      { system: '生肖', point: `${input.zodiac.animal}：${zodiacTrait}` },
      { system: '西洋星座', point: `${input.astrology.sunSign}：${starTrait}` },
      { system: '生命靈數', point: `${input.numerology.lifePathNumber}・${numberTitle}` },
      ...(soulStars ? [{ system: '紫微斗數', point: `命宮主星：${soulStars}` }] : []),
    ],
    reminder: '每套系統都只照到一個角度；覺得「不像我」的部分，直接略過就好，不用硬套。',
  };

  const career: FusionDomain = {
    id: 'career',
    title: '工作：幾套系統一起給的方向感',
    plainReading: `講白話：綜合起來，你${plain.work}。四柱裡${strongestLabel}最多，代表你自然而然就會用${strongestLabel}的方式做事；${weakestLabel}比例少，不是缺陷，而是提醒你這類任務要嘛刻意練、要嘛找隊友補位。生肖的「${zodiacTrait}」和星座的「${starTrait}」是你在職場上最容易被看見的招牌，可以大方拿出來用。`,
    evidence: [
      { system: '四柱五行', point: `${strongestLabel}相對突出、${weakestLabel}較少` },
      { system: '生肖', point: `職場招牌：${zodiacTrait}` },
      { system: '西洋星座', point: `職場招牌：${starTrait}` },
      { system: '生命靈數', point: `${numberTitle}：適合把長處變成可交付的成果` },
    ],
    reminder: '「適合」是文化模型的參考語言，不是限制；實際的職涯決定請以能力、市場和你的意願為主。',
  };

  const love: FusionDomain = {
    id: 'love',
    title: '感情：不同系統對你相處模式的觀察',
    plainReading: `講白話：在關係裡，你${plain.love}。不過生肖也提醒「${zodiacBlind}」，星座則點名「${starBlind}」——這兩個盲點在感情裡最容易同時出現，通常長這樣：狀態好的時候是體貼，壓力大的時候就變內耗。生命靈數的功課「${numberChallenge}」剛好可以拿來當感情裡的練習題。`,
    evidence: [
      { system: '五行共識', point: plain.love },
      { system: '生肖', point: `留意：${zodiacBlind}` },
      { system: '西洋星座', point: `留意：${starBlind}` },
      { system: '生命靈數', point: `練習：${numberChallenge}` },
    ],
    reminder: '相處模式是兩個人共同創造的；這裡描述的是你可以觀察的傾向，不是對關係的判決。',
  };

  const wellbeing: FusionDomain = {
    id: 'wellbeing',
    title: '身心節奏：怎麼休息最有效',
    plainReading: `講白話：照這幾套系統的共識，你${plain.rest}。四柱${weakestLabel}偏少這件事，傳統上會被解讀成「${weakestLabel}類的節奏比較不是你的預設值」，換成現代語言就是：與其模仿別人的作息，不如觀察自己什麼時候最有電、什麼事最耗電，照著自己的電量表過日子。`,
    evidence: [
      { system: '五行共識', point: plain.rest },
      { system: '四柱五行', point: `${weakestLabel}比例較少，休息方式可多實驗` },
      { system: '西洋星座', point: `${input.astrology.sunSign}的「${starBlind}」在疲累時最容易放大` },
    ],
    reminder: '這裡談的是生活節奏的自我觀察，不是健康建議；身體不舒服請找合格的醫療專業人員。',
  };

  return [personality, career, love, wellbeing];
}

function buildHighlights(input: FateReportInput, votes: FusionElementVote[]): FusionHighlight[] {
  const highlights: FusionHighlight[] = [];
  votes.filter((vote) => vote.votes >= 3).forEach((vote) => {
    const label = ELEMENT_LABELS[vote.element];
    highlights.push({
      kind: 'agreement',
      title: `${vote.systems.length} 套系統同時指向「${label}」`,
      plainExplanation: `${vote.systems.join('、')}換算後都落在${label}。白話說：這幾套來自不同文化、彼此沒有抄襲關係的系統，居然講到同一種能量，那「${ELEMENT_PLAIN[vote.element].vibe}」大概就是你身上最不需要懷疑的部分。`,
      systems: vote.systems,
    });
  });

  const westernElement = WESTERN_TO_FIVE[input.astrology.element];
  if (westernElement && input.fiveElements.weakest.includes(westernElement)) {
    highlights.push({
      kind: 'tension',
      title: '星座強調的能量，恰好是八字裡最少的五行',
      plainExplanation: `${input.astrology.sunSign}偏${input.astrology.element}元素（近似${ELEMENT_LABELS[westernElement]}），但你的四柱裡${ELEMENT_LABELS[westernElement]}比例最少。白話說：太陽星座描述的是你「想活出來的樣子」，八字結構比較像「出廠預設值」——兩者打架時你可能會覺得自己內外不一致，這不是矛盾，是兩套系統本來就在量不同的東西。`,
      systems: ['西洋星座', '四柱五行'],
    });
  }

  const zodiacElement = branchToElement(input.zodiac.branch);
  if (zodiacElement === input.bazi.dayMasterElement) {
    highlights.push({
      kind: 'agreement',
      title: '生肖年支與八字日主同屬一行',
      plainExplanation: `你的生肖${input.zodiac.animal}（${input.zodiac.branch}支）和日主${input.bazi.dayMaster}同屬${ELEMENT_LABELS[zodiacElement]}。白話說：連最粗略的生肖和最精細的日主都對上了，這種內外一致的人通常「給人的第一印象」和「實際相處起來」落差不大。`,
      systems: ['生肖', '八字'],
    });
  }

  if (votes.length >= 4 && votes[0].votes <= 2) {
    highlights.push({
      kind: 'tension',
      title: '各系統看到的你相當不同',
      plainExplanation: '五行票數分散在四種以上元素，白話說：你是「多聲道」的人——家人、同事、老朋友對你的形容可能差很多，而且他們都沒說錯。與其煩惱哪個才是真的你，不如把這當成場合切換的彈性。',
      systems: votes.map((vote) => vote.systems).flat(),
    });
  }

  if (highlights.length === 0) {
    highlights.push({
      kind: 'agreement',
      title: '各系統交集溫和',
      plainExplanation: '這次的組合沒有出現特別強烈的共識或衝突，白話說：你的盤比較「均衡配置」，不極端，也就比較不容易被單一標籤描述——把每個系統當成不同朋友的觀察就好。',
      systems: ['整體'],
    });
  }

  return highlights;
}

function buildTiming(input: FateReportInput): FusionTiming | undefined {
  const horoscope = input.ziwei?.currentHoroscope;
  if (!horoscope) return undefined;
  const targetYear = Number(horoscope.targetDate.slice(0, 4));
  const luckCycle = input.bazi.luckCycles?.find((cycle) => targetYear >= cycle.startYear && targetYear <= cycle.endYear);
  const evidence: FusionEvidence[] = [
    { system: '紫微斗數', point: `大限命宮走到${horoscope.decadal.palaceName}、流年命宮在${horoscope.yearly.palaceName}` },
    ...(luckCycle ? [{ system: '八字', point: `目前行${luckCycle.ganZhi}大運（${luckCycle.startYear}–${luckCycle.endYear}）` }] : []),
  ];
  const baziPart = luckCycle
    ? `八字這邊，你目前走的是${luckCycle.ganZhi}大運，範圍大約是 ${luckCycle.startYear} 到 ${luckCycle.endYear} 年；`
    : '八字這次沒有對應的大運資料；';
  return {
    plainReading: `講白話：兩套系統都有「十年一個大階段」的概念。${baziPart}紫微那邊，同一段時間的大限命宮落在${horoscope.decadal.palaceName}，流年命宮在${horoscope.yearly.palaceName}。把它們並排看，意思是：傳統命理認為這幾年你的人生重心會偏向「${horoscope.decadal.palaceName.replace('宮', '')}」相關的題目。這是文化模型的敘事框架，適合當年度回顧的提問清單，不是預言。`,
    evidence,
  };
}

export function generateSystemConclusions(input: FateReportInput): SystemConclusion[] {
  const dayLabel = ELEMENT_LABELS[input.bazi.dayMasterElement];
  const strongestLabel = ELEMENT_LABELS[input.fiveElements.strongest[0]];
  const weakestLabel = ELEMENT_LABELS[input.fiveElements.weakest[0]];
  const soulPalace = input.ziwei?.palaces.find((palace) => palace.name === '命宮');
  const soulStars = soulPalace?.majorStars.map((star) => star.name).join('、');
  const conclusions: SystemConclusion[] = [
    {
      id: 'bazi',
      system: '八字',
      headline: `日主 ${input.bazi.dayMaster} · ${dayLabel}`,
      conclusion: `你的核心是${dayLabel}——${ELEMENT_PLAIN[input.bazi.dayMasterElement].vibe}。四柱裡${strongestLabel}最多、${weakestLabel}最少，用${strongestLabel}的方式做事對你來說最順手。`,
    },
    {
      id: 'zodiac',
      system: '生肖',
      headline: `屬${input.zodiac.animal} · ${input.zodiac.symbol}`,
      conclusion: `「${input.zodiac.positiveTraits[0]}」和「${input.zodiac.positiveTraits[1]}」是你的招牌；要留意的是${input.zodiac.blindSpots[0]}。`,
    },
    ...(input.ziwei
      ? [{
          id: 'ziwei',
          system: '紫微斗數',
          headline: `${input.ziwei.fiveElementsClass} · 命主${input.ziwei.soul}`,
          conclusion: `命宮${soulStars ? `坐${soulStars}` : '沒有主星，要借對面的宮位一起看'}。內在主軸偏「${input.ziwei.soul}」象徵的特質，穩穩發揮比衝快更適合你。`,
        }]
      : []),
    {
      id: 'western',
      system: '西洋星盤',
      headline: `太陽${input.astrology.sunSign} · ${input.astrology.element}元素`,
      conclusion: `${input.astrology.strengths.join('、')}是你給人的第一印象${input.astrology.moonSign ? `；月亮在${input.astrology.moonSign}，那是你私底下的情緒面` : ''}。${input.astrology.blindSpots[0]}是要練習的地方。`,
    },
    {
      id: 'numerology',
      system: '生命靈數',
      headline: `${input.numerology.lifePathNumber} · ${input.numerology.title}`,
      conclusion: `${input.numerology.description} 你的功課是${input.numerology.challenges[0]}。`,
    },
    (() => {
      const birthCards = getBirthCards(input.numerology.birthDateDigits);
      return {
        id: 'tarot',
        system: '生日塔羅',
        headline: birthCards.samePersonalityAndSoul ? birthCards.personality.name : `${birthCards.personality.name} · ${birthCards.soul.name}`,
        conclusion: `你的人格牌是「${birthCards.personality.name}」（${birthCards.personality.keywords.join('、')}）：${birthCards.personality.upright}${birthCards.samePersonalityAndSoul ? ' 人格與靈魂同一張牌，代表內外一致。' : `靈魂牌「${birthCards.soul.name}」則是你內在深層的動力。`}`,
      };
    })(),
    ...(input.nameAnalysis
      ? [{
          id: 'name',
          system: '姓名',
          headline: `${input.nameAnalysis.fullName} · ${input.nameAnalysis.characterCount} 字`,
          conclusion: `${input.nameAnalysis.overallImpression}${input.nameAnalysis.elementComparison}`,
        }]
      : []),
  ];
  return conclusions;
}

const CYCLE_RELATION: Record<string, (cycleLabel: string) => string> = {
  same: (label) => `和你的本質同屬${label}，同類相挺，適合放大你原本就擅長的事`,
  resource: (label) => `${label}正好滋養你的日主，像有人在背後補給，底氣比較足`,
  output: (label) => `你的日主在生${label}，屬於往外輸出、表現的時期，做得多也要記得補回來`,
  wealth: (label) => `你的日主剋${label}，傳統上叫「財」，代表你有機會主導資源，但要親力親為`,
  pressure: (label) => `${label}剋你的日主，傳統上叫「官殺」，像有規範和壓力在推著你，扛得住就是升級`,
};

const GENERATES: Record<ElementName, ElementName> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const CONTROLS: Record<ElementName, ElementName> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

function cycleRelationText(dayElement: ElementName, cycleElement: ElementName): string {
  const label = ELEMENT_LABELS[cycleElement];
  if (dayElement === cycleElement) return CYCLE_RELATION.same(label);
  if (GENERATES[cycleElement] === dayElement) return CYCLE_RELATION.resource(label);
  if (GENERATES[dayElement] === cycleElement) return CYCLE_RELATION.output(label);
  if (CONTROLS[dayElement] === cycleElement) return CYCLE_RELATION.wealth(label);
  return CYCLE_RELATION.pressure(label);
}

const PHASE_ADVICE: Record<ElementName, { present: string; future: string }> = {
  wood: {
    present: '把重心放在「養大一件事」：挑一個值得長期投入的方向，定期回頭看它有沒有長高。',
    future: '可以先播種：現在多學、多建立關係，到時候剛好收成。',
  },
  fire: {
    present: '這段時間適合被看見：主動爭取上台、發表、帶頭的機會，但幫自己排好休息時間。',
    future: '先把作品和實力準備好，等能見度變高的時候，你拿得出手的東西越多越好。',
  },
  earth: {
    present: '適合打地基：把生活作息、財務和手上的專案整理穩，慢就是快。',
    future: '接下來會更需要穩定感，現在開始建立固定的習慣和儲備，會很有幫助。',
  },
  metal: {
    present: '適合做減法：把不重要的承諾收掉，讓規則和品質說話，成果會更俐落。',
    future: '之後是講究精準的階段，現在可以開始磨專業深度，讓自己有明確的代表作。',
  },
  water: {
    present: '適合流動與連結：多交流、多打聽、多學習，答案常常在別人的一句話裡。',
    future: '接下來變化會比較多，現在把心態調得彈性一點，到時候就不會慌。',
  },
};

export function generateTimelineReading(input: FateReportInput, targetYear?: number): TimelinePhase[] {
  const year = targetYear ?? new Date().getFullYear();
  const dayElement = input.bazi.dayMasterElement;
  const cycles = input.bazi.luckCycles ?? [];
  const current = cycles.find((cycle) => year >= cycle.startYear && year <= cycle.endYear);
  const past = [...cycles].reverse().find((cycle) => cycle.endYear < year);
  const future = cycles.find((cycle) => cycle.startYear > year);
  const zodiacTrait = input.zodiac.positiveTraits[0];
  const numberChallenge = input.numerology.challenges[0];
  const decadalPalace = input.ziwei?.currentHoroscope?.decadal.palaceName;
  const yearlyPalace = input.ziwei?.currentHoroscope?.yearly.palaceName;

  const pastPhase: TimelinePhase = past
    ? {
        id: 'past',
        title: '過去',
        rangeLabel: `${past.startYear}–${past.endYear} 年（${past.startAge}–${past.endAge} 歲）`,
        reading: `你上一段走的是${past.ganZhi}大運：${cycleRelationText(dayElement, stemToElement(past.ganZhi[0]))}。加上生肖給你的「${zodiacTrait}」，那段時間累積下來的做事方式，就是你現在最自然的預設值。`,
        advice: '回頭挑出那段時間真正有效的一兩個習慣，帶著走；證明沒用的模式，也趁換階段放下。',
      }
    : {
        id: 'past',
        title: '過去',
        rangeLabel: '成長階段',
        reading: `你還在第一段大運之前或剛起步的階段。八字上，出生在${input.bazi.seasonStrength.season}令讓${ELEMENT_LABELS[input.fiveElements.strongest[0]]}的特質從小就明顯，生肖的「${zodiacTrait}」也是早早就看得出來的底色。`,
        advice: '這個階段重點不是定型，而是多試：把各種有興趣的事都碰一碰，記下哪些讓你特別有電。',
      };

  const presentPhase: TimelinePhase = current
    ? {
        id: 'present',
        title: '現在',
        rangeLabel: `${current.startYear}–${current.endYear} 年（${current.startAge}–${current.endAge} 歲）`,
        reading: `你目前走${current.ganZhi}大運：${cycleRelationText(dayElement, stemToElement(current.ganZhi[0]))}。${decadalPalace ? `紫微這邊，同一段時間的大限落在${decadalPalace}${yearlyPalace ? `、今年流年在${yearlyPalace}` : ''}，兩套系統都在說：這幾年的人生重心和「${decadalPalace.replace('宮', '')}」有關。` : ''}`,
        advice: PHASE_ADVICE[stemToElement(current.ganZhi[0])].present,
      }
    : {
        id: 'present',
        title: '現在',
        rangeLabel: '目前階段',
        reading: `${decadalPalace ? `紫微的大限目前落在${decadalPalace}${yearlyPalace ? `、流年在${yearlyPalace}` : ''}，這幾年的重心偏向「${decadalPalace.replace('宮', '')}」相關的題目。` : `以你${dayLabelText(dayElement)}的本質來看，現在最重要的是照自己的節奏走，不用跟別人比進度。`}生命靈數也提醒你，這陣子的功課是${numberChallenge}。`,
        advice: PHASE_ADVICE[dayElement].present,
      };

  const futurePhase: TimelinePhase = future
    ? {
        id: 'future',
        title: '未來',
        rangeLabel: `${future.startYear}–${future.endYear} 年（${future.startAge}–${future.endAge} 歲）`,
        reading: `下一段是${future.ganZhi}大運：${cycleRelationText(dayElement, stemToElement(future.ganZhi[0]))}。傳統的講法是氣氛會換季——不是變好或變壞，而是換一種規則玩。`,
        advice: PHASE_ADVICE[stemToElement(future.ganZhi[0])].future,
      }
    : {
        id: 'future',
        title: '未來',
        rangeLabel: '接下來',
        reading: `這次的資料沒有排到更後面的大運。可以確定的是：四柱裡${ELEMENT_LABELS[input.fiveElements.weakest[0]]}偏少，未來刻意補上這類經驗（或找這類隊友），你的選擇會變多。`,
        advice: `把「${numberChallenge}」當成長期練習題，每季回頭檢查一次就好，不用天天想。`,
      };

  return [pastPhase, presentPhase, futurePhase];
}

function dayLabelText(element: ElementName): string {
  return ELEMENT_LABELS[element];
}

export function generateFusionReading(input: FateReportInput): FusionReading {
  const { consensus, voteEntries } = buildConsensus(input);
  const systemsUsed = voteEntries.map((entry) => entry.system);
  const leading = consensus.leading[0];
  const leadingLabels = consensus.leading.map((element) => ELEMENT_LABELS[element]).join('、');
  const axes = buildAxes(input);
  const domains = buildDomains(input, leading);
  const highlights = buildHighlights(input, consensus.votes);
  const timing = buildTiming(input);

  return {
    headline: `把 ${systemsUsed.length} 套系統疊起來看，你的主旋律偏「${leadingLabels}」：${ELEMENT_PLAIN[leading].vibe}。`,
    plainIntro:
      '這個單元做一件事：把八字、五行、生肖、西洋星座、生命靈數' +
      (input.ziwei ? '、紫微斗數' : '') +
      (input.nameAnalysis ? '、姓名用字' : '') +
      '各自的結果翻譯成同一種語言，再看它們哪裡口徑一致、哪裡各說各話。一致的地方值得你留意，分歧的地方也不是誰算錯——它們本來就是不同文化用不同工具在量同一個人。以下全部用白話說明。',
    systemsUsed,
    consensus,
    axes,
    domains,
    highlights,
    timing,
    cautions: [
      '融合解讀是把不同文化模型「並列翻譯」後的觀察，不是科學結論，也沒有任何系統能決定你的未來。',
      '覺得準的部分可以當自我反思的起點；覺得不準的部分，請相信你對自己的了解勝過任何命盤。',
      '重大醫療、法律、投資或人生決策，請依實際證據並諮詢合格專業人士。',
    ],
  };
}
