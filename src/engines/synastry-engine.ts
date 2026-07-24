import type { ElementName, FateReportInput } from '../types/fate';
import { numerologyElement } from './fusion-engine';
import { buildUnifiedElementProfile } from './integration-engine';
import { ELEMENT_LABELS } from '../utils/constants';

const GENERATES: Record<ElementName, ElementName> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const CONTROLS: Record<ElementName, ElementName> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

const SIX_HARMONY: Record<string, string> = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
const SIX_CLASH: Record<string, string> = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
const THREE_HARMONY: string[][] = [['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑']];
const SIX_HARM: Record<string, string> = { 子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅', 卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉' };

export interface SynastrySection {
  id: string;
  title: string;
  verdict: string;
  reading: string;
}

export interface SynastryHighlight {
  kind: 'harmony' | 'friction';
  title: string;
  text: string;
}

export interface SynastryReading {
  nameA: string;
  nameB: string;
  intro: string;
  sections: SynastrySection[];
  highlights: SynastryHighlight[];
  cautions: string[];
}

function dayMasterRelation(a: ElementName, b: ElementName, nameA: string, nameB: string): SynastrySection {
  const la = ELEMENT_LABELS[a];
  const lb = ELEMENT_LABELS[b];
  let verdict: string;
  let reading: string;
  if (a === b) {
    verdict = '同氣相求';
    reading = `你們的日主都屬${la}，本質相近。好處是容易懂彼此、頻率對得上；要留意的是兩個人可能有一樣的盲點，遇到同類型的難題時都不擅長，記得刻意找互補的做法。`;
  } else if (GENERATES[a] === b) {
    verdict = `${nameA} 生 ${nameB}`;
    reading = `${nameA}的${la}生${nameB}的${lb}：${nameA}天生會想付出、滋養對方，${nameB}則從這段關係裡得到支持。這是很溫暖的組合，但${nameA}要留意別過度付出到累，${nameB}也記得回饋。`;
  } else if (GENERATES[b] === a) {
    verdict = `${nameB} 生 ${nameA}`;
    reading = `${nameB}的${lb}生${nameA}的${la}：${nameB}是那個在背後撐著、給養分的人，${nameA}接收到支持。角色會自然分工，只要別讓付出的一方長期單向輸出就好。`;
  } else if (CONTROLS[a] === b) {
    verdict = `${nameA} 剋 ${nameB}`;
    reading = `${nameA}的${la}剋${nameB}的${lb}：這不是壞事，傳統上「剋」帶有推動與塑形的意思——${nameA}容易成為推${nameB}一把的人。張力用得好是助力，用不好會變壓力，關鍵在於${nameA}的方式夠不夠溫柔。`;
  } else {
    verdict = `${nameB} 剋 ${nameA}`;
    reading = `${nameB}的${lb}剋${nameA}的${la}：${nameB}容易在關係裡扮演推動、要求的角色。適度的鞭策能讓${nameA}成長，但要小心別變成單方面的控制或壓力。`;
  }
  return { id: 'day-master', title: '日主關係（八字核心）', verdict, reading };
}

function zodiacRelation(branchA: string, branchB: string, animalA: string, animalB: string): SynastrySection {
  let verdict = '無特殊刑合';
  let reading = `${animalA}與${animalB}之間沒有傳統上特別強的合或沖，這其實很常見——代表你們的相處比較「中性」，關係品質更取決於實際互動，而不是生肖。`;
  if (SIX_HARMONY[branchA] === branchB) {
    verdict = '生肖六合';
    reading = `${animalA}與${animalB}是傳統的「六合」，被視為相當契合的一對，容易看對眼、也容易長久相處。當成好的起點，但仍要靠經營。`;
  } else if (THREE_HARMONY.some((group) => group.includes(branchA) && group.includes(branchB))) {
    verdict = '生肖三合';
    reading = `${animalA}與${animalB}同屬一個「三合」局，傳統上是互相成就、志同道合的組合，做事、生活容易同一個方向。`;
  } else if (SIX_CLASH[branchA] === branchB) {
    verdict = '生肖六沖';
    reading = `${animalA}與${animalB}是「六沖」。別緊張——沖不是不能在一起，而是你們的節奏與偏好差異大，容易一個往東一個往西。差異其實能互補，關鍵是願不願意多溝通。`;
  } else if (SIX_HARM[branchA] === branchB) {
    verdict = '生肖相害';
    reading = `${animalA}與${animalB}傳統上是「相害」，意思是容易在小地方彼此消耗。這多半是相處細節的摩擦，講開了、給彼此空間，就能大幅改善。`;
  }
  return { id: 'zodiac', title: '生肖關係', verdict, reading };
}

const WESTERN_ELEMENT_GROUP: Record<string, 'fire' | 'earth' | 'air' | 'water'> = { 火: 'fire', 土: 'earth', 風: 'air', 水: 'water' };

function sunSignRelation(elementA: string, elementB: string, signA: string, signB: string): SynastrySection {
  const ga = WESTERN_ELEMENT_GROUP[elementA];
  const gb = WESTERN_ELEMENT_GROUP[elementB];
  let verdict: string;
  let reading: string;
  const supportivePairs = new Set(['fire-air', 'air-fire', 'earth-water', 'water-earth']);
  const frictionPairs = new Set(['fire-water', 'water-fire', 'earth-air', 'air-earth']);
  const key = `${ga}-${gb}`;
  if (ga === gb) {
    verdict = '同元素';
    reading = `${signA}與${signB}同屬${elementA}元素，價值觀與相處步調天生接近，很容易一拍即合；要留意的是可能一起偏向同一個極端，缺少互補。`;
  } else if (supportivePairs.has(key)) {
    verdict = '互相加分';
    reading = `${signA}的${elementA}與${signB}的${elementB}是占星上互相助長的元素（火風相煽、水土相潤），你們容易彼此帶動、把對方變得更好。`;
  } else if (frictionPairs.has(key)) {
    verdict = '需要磨合';
    reading = `${signA}的${elementA}與${signB}的${elementB}是比較有張力的元素組合（火水、風土），你們看世界的方式差很多。這種差異最能互補，也最需要耐心翻譯彼此的語言。`;
  } else {
    verdict = '中性';
    reading = `${signA}與${signB}的元素既不特別助長也不特別衝突，相處的調性中庸，更多取決於你們實際的溝通方式。`;
  }
  return { id: 'sun-sign', title: '太陽星座相性（西洋）', verdict, reading };
}

export function generateSynastry(inputA: FateReportInput, inputB: FateReportInput, nameA = '甲方', nameB = '乙方'): SynastryReading {
  const profileA = buildUnifiedElementProfile(inputA);
  const profileB = buildUnifiedElementProfile(inputB);

  // 五行互補：一方高、另一方低的元素，能互相補位。
  const ELEMENT_ORDER: ElementName[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  const complements: string[] = [];
  const shared: string[] = [];
  ELEMENT_ORDER.forEach((element) => {
    const pa = profileA.percentages[element];
    const pb = profileB.percentages[element];
    if (Math.abs(pa - pb) >= 12) {
      const giver = pa > pb ? nameA : nameB;
      const taker = pa > pb ? nameB : nameA;
      complements.push(`${ELEMENT_LABELS[element]}：${giver} 較足，能補 ${taker} 較缺的部分`);
    } else if (pa >= 24 && pb >= 24) {
      shared.push(`${ELEMENT_LABELS[element]}`);
    }
  });
  const elementReading = `把兩個人的命盤都換算成五行來看：${complements.length ? `你們在「${complements.join('；')}」——這些是天然的互補點，一個人的長處剛好接住另一個人的短板。` : '你們的五行分布相當接近，沒有明顯互補，代表你們更像「同類」而非「互補」。'}${shared.length ? `而在${shared.join('、')}上你們都很強，這是你們共同的底色與默契，也可能是共同的執著。` : ''}`;

  const dm = dayMasterRelation(inputA.bazi.dayMasterElement, inputB.bazi.dayMasterElement, nameA, nameB);
  const zodiac = zodiacRelation(inputA.zodiac.branch, inputB.zodiac.branch, inputA.zodiac.animal, inputB.zodiac.animal);
  const sun = sunSignRelation(inputA.astrology.element, inputB.astrology.element, inputA.astrology.sunSign, inputB.astrology.sunSign);

  const numA = numerologyElement(inputA.numerology.lifePathNumber);
  const numB = numerologyElement(inputB.numerology.lifePathNumber);
  const numeroReading = inputA.numerology.lifePathNumber === inputB.numerology.lifePathNumber
    ? `你們的生命靈數都是 ${inputA.numerology.lifePathNumber}（${inputA.numerology.title}），人生課題高度相似——很懂彼此，但也可能一起卡在同一種功課上。`
    : `${nameA} 是生命靈數 ${inputA.numerology.lifePathNumber}「${inputA.numerology.title}」，${nameB} 是 ${inputB.numerology.lifePathNumber}「${inputB.numerology.title}」。${numA === numB ? '換算五行後其實同屬一類，內在動力接近。' : '兩種課題不同，正好可以互相帶對方看見自己忽略的面向。'}`;

  const highlights: SynastryHighlight[] = [];
  if (complements.length >= 2) highlights.push({ kind: 'harmony', title: '天生互補', text: `你們在多個五行上一高一低，${nameA}與${nameB}很能補位彼此，是「1＋1＞2」型的組合。` });
  if (zodiac.verdict === '生肖六合' || zodiac.verdict === '生肖三合') highlights.push({ kind: 'harmony', title: zodiac.verdict, text: zodiac.reading });
  if (zodiac.verdict === '生肖六沖' || zodiac.verdict === '生肖相害') highlights.push({ kind: 'friction', title: zodiac.verdict, text: '生肖上有張力：差異大不代表不合，而是更需要溝通與空間。' });
  if (sun.verdict === '需要磨合') highlights.push({ kind: 'friction', title: '星座元素張力', text: sun.reading });
  if (dm.verdict.includes('剋')) highlights.push({ kind: 'friction', title: '日主有推力', text: '八字日主之間有「剋」的推動關係，用得溫柔是助力，用不好會變壓力。' });
  if (highlights.length === 0) highlights.push({ kind: 'harmony', title: '溫和平順', text: '你們之間沒有特別強烈的合或沖，關係調性溫和——品質更取決於你們怎麼相處，而不是命盤。' });

  return {
    nameA,
    nameB,
    intro: `這份合盤把 ${nameA} 與 ${nameB} 的命盤，從五行、八字日主、生肖、西洋星座與生命靈數五個角度並排比較。重點不是給你們一個「合不合」的分數，而是看見你們天然的互補與張力在哪裡——關係好不好，最終還是你們一起經營出來的。`,
    sections: [
      { id: 'element', title: '五行互補與共鳴', verdict: complements.length ? '有互補' : '偏同類', reading: elementReading },
      dm,
      zodiac,
      sun,
      { id: 'numerology', title: '生命靈數配對', verdict: inputA.numerology.lifePathNumber === inputB.numerology.lifePathNumber ? '同號' : '不同號', reading: numeroReading },
    ],
    highlights,
    cautions: [
      '合盤是把兩份文化模型並排觀察，不是關係的判決書，也不能預測結果。',
      '任何一段關係的好壞，都取決於實際的溝通、尊重與經營，遠勝過命盤上的合或沖。',
      '看到「沖」「剋」不用擔心——差異往往是互補的來源；看到「合」也別鬆懈，關係仍要用心。',
    ],
  };
}
