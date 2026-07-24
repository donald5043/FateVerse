import type { FateReportInput } from '../types/fate';
import { analyzeDayMaster } from './bazi-analysis-engine';
import { generateTimelineReading } from './fusion-engine';
import { ELEMENT_LABELS } from '../utils/constants';

export interface NarrativeAxis {
  agency: number;
  communion: number;
  quadrant: 'leader' | 'pioneer' | 'nurturer' | 'seeker';
  quadrantLabel: string;
  summary: string;
}

export interface NarrativeChapter {
  id: 'origin' | 'present' | 'becoming';
  title: string;
  paragraphs: string[];
}

export interface LifeNarrative {
  title: string;
  opening: string;
  axis: NarrativeAxis;
  chapters: NarrativeChapter[];
  redemption: string;
  closing: string;
  caveat: string;
}

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

// McAdams 敘事認同的兩大軸線：能動性（agency，主導與掌控）與共融（communion，連結與關懷）。
const HIGH_AGENCY_ANIMALS = new Set(['虎', '馬', '龍', '猴', '雞']);
const LOW_AGENCY_ANIMALS = new Set(['兔', '羊', '豬', '牛']);
const HIGH_COMMUNION_ANIMALS = new Set(['兔', '羊', '豬', '狗']);
const LOW_COMMUNION_ANIMALS = new Set(['虎', '龍', '蛇']);

function computeAxis(input: FateReportInput): NarrativeAxis {
  const strength = analyzeDayMaster(input.bazi);
  const animal = input.zodiac.animal;
  const life = input.numerology.lifePathNumber;
  const modality = input.astrology.modality;
  const element = input.astrology.element;

  let agency = 50;
  agency += ({ 強: 15, 偏強: 8, 中和: 0, 偏弱: -8, 弱: -15 } as const)[strength.level];
  agency += modality === '開創' ? 12 : modality === '變動' ? 4 : -4;
  if (HIGH_AGENCY_ANIMALS.has(animal)) agency += 8;
  else if (LOW_AGENCY_ANIMALS.has(animal)) agency -= 8;
  if ([1, 3, 5, 8, 22].includes(life)) agency += 8;
  else if ([2, 6, 9, 33].includes(life)) agency -= 6;

  let communion = 50;
  const waterEarth = (input.fiveElements.percentages.water ?? 0) + (input.fiveElements.percentages.earth ?? 0);
  communion += (waterEarth - 40) * 0.4;
  communion += element === '水' ? 12 : element === '土' ? 6 : element === '火' ? -8 : 0;
  if (HIGH_COMMUNION_ANIMALS.has(animal)) communion += 8;
  else if (LOW_COMMUNION_ANIMALS.has(animal)) communion -= 6;
  if ([2, 6, 9, 33].includes(life)) communion += 10;
  else if ([1, 8].includes(life)) communion -= 8;

  agency = clamp(agency);
  communion = clamp(communion);

  const highA = agency >= 50;
  const highC = communion >= 50;
  const quadrant: NarrativeAxis['quadrant'] = highA && highC ? 'leader' : highA && !highC ? 'pioneer' : !highA && highC ? 'nurturer' : 'seeker';
  const quadrantLabel = { leader: '帶著人一起走的推動者', pioneer: '靠成果說話的開創者', nurturer: '在關係裡發光的成全者', seeker: '在自己世界深耕的探索者' }[quadrant];
  const summary = {
    leader: '你身上同時有「想主導」和「在乎連結」兩股力量——你不只想把事情做成，還想帶著在乎的人一起抵達。',
    pioneer: '你的力量偏向「自己扛、用成果證明」。你習慣獨立開路，成就感來自把想法變成真的東西。',
    nurturer: '你的力量藏在關係裡。比起站在最前面，你更擅長成全別人、把一群人穩穩接住。',
    seeker: '你的力量向內收斂。你在自己的節奏和世界裡深耕，不急著證明什麼，答案往往在安靜裡浮現。',
  }[quadrant];

  return { agency, communion, quadrant, quadrantLabel, summary };
}

function originChapter(input: FateReportInput): NarrativeChapter {
  const dayLabel = ELEMENT_LABELS[input.bazi.dayMasterElement];
  const strongest = ELEMENT_LABELS[input.fiveElements.strongest[0]];
  const trait = input.zodiac.positiveTraits[0];
  const season = input.bazi.seasonStrength.season;
  return {
    id: 'origin',
    title: '第一章 · 我從哪裡開始',
    paragraphs: [
      `我的故事，從一個${dayLabel}的核心開始。命盤說我出生在${season}的能量裡，四柱中${strongest}最鮮明——那大概解釋了為什麼，我做事時最自然的方式，總是帶著${strongest}的味道。`,
      `生肖給了我「${trait}」這個底色，它從很早就跟著我。這不是別人貼上的標籤，而是我回頭看，會認得出來的自己——那個在還沒學會任何道理之前，就已經這樣反應的我。`,
    ],
  };
}

function presentChapter(input: FateReportInput): NarrativeChapter {
  const timeline = generateTimelineReading(input);
  const present = timeline.find((phase) => phase.id === 'present');
  const strength = analyzeDayMaster(input.bazi);
  const challenge = input.numerology.challenges[0];
  const paragraphs = [
    `現在，我正站在故事的中段。${present ? present.reading.replace(/^講白話：?/, '') : '這一段，是我把過去累積的東西拿出來用的時候。'}`,
    `我的日主目前屬「${strength.level}」，這代表我此刻的功課很具體：${strength.level === '強' || strength.level === '偏強' ? '能量夠了，重點是把它往外用，而不是一直往內補。' : strength.level === '中和' ? '難得的平衡，重點是維持這份流通，別打破它。' : '輸出的管道多、補給少，我得學會把休息和求援當成正事。'}生命靈數也在提醒我，這陣子要練習的是「${challenge}」。`,
  ];
  return { id: 'present', title: '第二章 · 我正在面對的關卡', paragraphs };
}

function becomingChapter(input: FateReportInput): NarrativeChapter {
  const strength = analyzeDayMaster(input.bazi);
  const timeline = generateTimelineReading(input);
  const future = timeline.find((phase) => phase.id === 'future');
  const favored = strength.favorable[0];
  const numberTitle = input.numerology.title;
  return {
    id: 'becoming',
    title: '第三章 · 我正在成為的樣子',
    paragraphs: [
      `往前看，我正在成為一個更完整的${numberTitle}。${favored ? `命盤說，讓「${ELEMENT_LABELS[favored.element]}」的能量多進來，會讓我更順——${favored.reason}。` : '我的盤面接近平衡，接下來重點不是補什麼，而是把現在的流通維持住。'}`,
      `${future ? future.reading.replace(/^講白話：?/, '') : '下一段路還沒完全展開，但我知道方向：把此刻學到的，帶進下一個階段。'}這一章還沒寫完——而握著筆的，一直都是我自己。`,
    ],
  };
}

/** 把命盤資料用 McAdams 的敘事結構（能動性／共融＋救贖弧線）重組成第一人稱人生故事。 */
export function generateLifeNarrative(input: FateReportInput): LifeNarrative {
  const axis = computeAxis(input);
  const weakest = ELEMENT_LABELS[input.fiveElements.weakest[0]];
  const strongest = ELEMENT_LABELS[input.fiveElements.strongest[0]];

  return {
    title: `一個${axis.quadrantLabel}的故事`,
    opening: `如果把命盤當成一部劇本的素材，那這一章是我的——用第一人稱寫的，因為主角一直都是我，不是命運。`,
    axis,
    chapters: [originChapter(input), presentChapter(input), becomingChapter(input)],
    // 救贖弧線（McAdams redemption sequence）：把「較弱／較不熟悉」誠實地框定為成長，而非缺陷。
    redemption: `每個故事都需要一個還沒被馴服的地方。我的是「${weakest}」——它在我的盤裡最淡，也最不是我的預設值。但故事的張力就在這裡：不是要我變成${weakest}的人，而是當我願意在${strongest}的熟練之外，多練一點${weakest}的功課，我的故事就會從「重複熟悉的模式」，轉向「長出新的能力」。這一段，才是把我從主角變成成長中的主角的地方。`,
    closing: '這不是預言，是一種重新看見自己的方式。同一份命盤可以寫成很多種故事——我選擇寫成一個還在往前、而且握著筆的故事。',
    caveat: '這段敘事是把你的命盤資料用心理學的敘事結構重新組織，不是預測，也沒有任何系統能決定你的人生走向。覺得不像的部分，請相信你比任何劇本都更了解自己。',
  };
}
