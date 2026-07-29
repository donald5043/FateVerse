import type { AspectResult, ElementName, FateReportInput, PlanetPosition } from '../types/fate';
import { matchAspect } from './astrology-engine';
import { numerologyElement } from './fusion-engine';
import { buildUnifiedElementProfile } from './integration-engine';
import { PAIR_FEATURE_RATES } from '../data/pair-feature-rates';
import { ELEMENT_LABELS } from '../utils/constants';
import { joinChinese } from '../utils/join-chinese';

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
  /**
   * 這個結論的穩定代號，不含雙方姓名。
   *
   * 出現率是用它來查的。日主那一段的 verdict 長成「小明 剋 小華」，
   * 直接拿 verdict 當鍵，換個名字就查不到——所以顯示用 verdict，查表用這個。
   */
  featureKey: string;
  reading: string;
  /** 這個結論在隨機配對裡有多常見。沒量到的分支為 undefined。 */
  occurrence?: string;
}

/**
 * 低於這個出現率才值得說「你們這組比較少見」。
 *
 * 門檻不是憑感覺挑的：實測顯示「五行有互補」出現在 90% 的配對上、
 * 「生肖三合」有 23%，這些寫成亮點等於什麼都沒說。0.15 大約是十二分之二，
 * 剛好把真的只有少數配對會遇到的結果篩出來。
 */
const UNCOMMON_PAIR_RATE = 0.15;

/** 高於這個出現率就該老實講「這很常見」，不要包裝成特色。 */
const COMMON_PAIR_RATE = 0.4;

/**
 * 把實測出現率講成人話。合盤的單位是「對」不是「人」。
 * 出現率來自 src/data/pair-feature-rates.ts，由 `npm run measure:pairs` 量出來。
 */
export function describePairRate(rate: number): string {
  if (rate <= 0) return '在我們的樣本裡沒有出現過';
  const oneIn = Math.round(1 / rate);
  if (oneIn >= 3) return `隨機兩個人大約每 ${oneIn} 對出現 1 對`;
  return `隨機兩個人裡大約 ${Math.round(rate * 100)}% 的配對都這樣`;
}

/** 查一個結論的實測出現率，並組成可直接顯示的一句話。 */
function occurrenceOf(sectionId: string, featureKey: string): string | undefined {
  const rate = PAIR_FEATURE_RATES[`${sectionId}:${featureKey}`];
  if (rate === undefined) return undefined;
  const measured = describePairRate(rate);
  if (rate >= COMMON_PAIR_RATE) return `${measured}——這是常態，不是你們的特色。`;
  if (rate <= UNCOMMON_PAIR_RATE) return `${measured}，在合盤裡算少見的一種。`;
  return `${measured}。`;
}

export interface SynastryHighlight {
  kind: 'harmony' | 'friction';
  title: string;
  text: string;
  /**
   * 為什麼這一項算少見。
   *
   * 刻意獨立成一個欄位，不接在 text 後面：接上去會讓段落變成四句，
   * 違反 voice.md R3，而且那句話的性質是佐證而不是解讀，本來就該分開排。
   */
  occurrence?: string;
}

/** 跨盤相位：A 的某顆行星，對上 B 的某顆行星。 */
export interface SynastryAspect {
  /** 甲方的行星名。 */
  planetA: string;
  /** 乙方的行星名。 */
  planetB: string;
  type: string;
  quality: AspectResult['quality'];
  closeness: AspectResult['closeness'];
  orb: number;
  /** 這組相位在關係裡通常怎麼運作。 */
  reading: string;
}

export interface SynastryReading {
  nameA: string;
  nameB: string;
  intro: string;
  sections: SynastrySection[];
  aspects: SynastryAspect[];
  /** 沒有可用的行星資料或沒有成相時，說明為什麼這一段是空的。 */
  aspectNote: string;
  highlights: SynastryHighlight[];
  cautions: string[];
}

function dayMasterRelation(a: ElementName, b: ElementName, nameA: string, nameB: string): SynastrySection {
  const la = ELEMENT_LABELS[a];
  const lb = ELEMENT_LABELS[b];
  let verdict: string;
  let reading: string;
  let featureKey: string;
  if (a === b) {
    featureKey = 'same';
    verdict = '同氣相求';
    reading = `你們的日主都屬${la}，本質相近。好處是容易懂彼此、頻率對得上；代價是盲點也同一個，遇到你不擅長的那類難題，對方多半也不擅長。這種時候別互相取暖，去找第三個人問。`;
  } else if (GENERATES[a] === b) {
    featureKey = 'a-generates-b';
    verdict = `${nameA} 生 ${nameB}`;
    reading = `${nameA}的${la}生${nameB}的${lb}：${nameA}天生會想付出、滋養對方，${nameB}則從這段關係裡得到支持。這是很溫暖的組合，但${nameA}要留意別過度付出到累，${nameB}也記得回饋。`;
  } else if (GENERATES[b] === a) {
    featureKey = 'b-generates-a';
    verdict = `${nameB} 生 ${nameA}`;
    reading = `${nameB}的${lb}生${nameA}的${la}：${nameB}是那個在背後撐著、給養分的人，${nameA}接收到支持。角色會自然分工，只要別讓付出的一方長期單向輸出就好。`;
  } else if (CONTROLS[a] === b) {
    featureKey = 'a-controls-b';
    verdict = `${nameA} 剋 ${nameB}`;
    reading = `${nameA}的${la}剋${nameB}的${lb}：這不是壞事，傳統上「剋」帶的是推動與塑形的意思——${nameA}是那個推${nameB}一把的人。同樣的力道，講法對了是助力，講法不對就是壓力，差別在${nameA}怎麼開口。`;
  } else {
    featureKey = 'b-controls-a';
    verdict = `${nameB} 剋 ${nameA}`;
    reading = `${nameB}的${lb}剋${nameA}的${la}：${nameB}在關係裡是推動、要求的那一方。適度的鞭策讓${nameA}長得快，但這條線很細，過了就變成單方面的控制。`;
  }
  return { id: 'day-master', title: '日主關係（八字核心）', verdict, featureKey, reading, occurrence: occurrenceOf('day-master', featureKey) };
}

function zodiacRelation(branchA: string, branchB: string, animalA: string, animalB: string): SynastrySection {
  let verdict = '無特殊刑合';
  let featureKey = 'none';
  let reading = `${animalA}與${animalB}之間沒有傳統上特別強的合或沖，生肖這一套對你們沒什麼話要說。你們處得好不好，得看下面幾段和實際相處。`;
  if (SIX_HARMONY[branchA] === branchB) {
    verdict = '生肖六合';
    featureKey = '生肖六合';
    reading = `${animalA}與${animalB}是傳統的「六合」，被當成相當契合的一對：看對眼快，磨合期短。這是個好起點，不是保證書。`;
  } else if (THREE_HARMONY.some((group) => group.includes(branchA) && group.includes(branchB))) {
    verdict = '生肖三合';
    featureKey = '生肖三合';
    reading = `${animalA}與${animalB}同屬一個「三合」局，傳統上說是互相成就、做事方向一致。不過三合一組有三個生肖，配到的機會比六合大得多，別把它當成特別的緣分。`;
  } else if (SIX_CLASH[branchA] === branchB) {
    verdict = '生肖六沖';
    featureKey = '生肖六沖';
    reading = `${animalA}與${animalB}是「六沖」。別緊張——沖不是不能在一起，而是節奏和偏好差得遠，一個想快一個想穩。這種差異最能互補，代價是每件事都得多講兩句。`;
  } else if (SIX_HARM[branchA] === branchB) {
    verdict = '生肖相害';
    featureKey = '生肖相害';
    reading = `${animalA}與${animalB}傳統上是「相害」，講的是在小地方彼此消耗——不是大衝突，是那種講不出口的煩。這類摩擦講開了、各自留點空間就會好很多。`;
  }
  return { id: 'zodiac', title: '生肖關係', verdict, featureKey, reading, occurrence: occurrenceOf('zodiac', featureKey) };
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
    reading = `${signA}與${signB}同屬${elementA}元素，看重的東西和做事的步調天生接近，一拍即合。代價是兩個人會一起往同一個極端跑，沒有人踩煞車。`;
  } else if (supportivePairs.has(key)) {
    verdict = '互相加分';
    reading = `${signA}的${elementA}與${signB}的${elementB}在占星裡是互相助長的元素（火風相煽、水土相潤）。實際上就是對方一提議你就想接話，兩個人會把彼此愈帶愈起勁。`;
  } else if (frictionPairs.has(key)) {
    verdict = '需要磨合';
    reading = `${signA}的${elementA}與${signB}的${elementB}是有張力的組合（火水、風土），你們看同一件事的角度差很遠。這種差異最能互補，但每次都要先把話翻譯成對方聽得懂的版本。`;
  } else {
    verdict = '中性';
    reading = `${signA}與${signB}的元素既不特別助長也不特別衝突。太陽星座這一項在你們身上沒有話要說，看下面的跨盤相位會實際得多。`;
  }
  return { id: 'sun-sign', title: '太陽星座相性（西洋）', verdict, featureKey: verdict, reading, occurrence: occurrenceOf('sun-sign', verdict) };
}

/**
 * 只比對個人行星。木星以外的外行星走得慢，同齡人幾乎人人都成相，
 * 放進來會讓每一份合盤看起來都一樣。
 */
const PERSONAL_PLANETS = ['太陽', '月亮', '水星', '金星', '火星'];

/** 每顆行星在關係裡代表什麼。用來組出相位的解讀。 */
const PLANET_DOMAIN: Record<string, string> = {
  太陽: '想成為的樣子',
  月亮: '情緒反應與安全感',
  水星: '講話與思考的方式',
  // 這幾個詞會被接進「A 的{X}和 B 的{Y}」的句型裡，所以本身不能含頓號——
  // 「小明的喜歡什麼、怎麼表達喜歡和小華的…」會讓人斷錯句。
  金星: '怎麼表達喜歡',
  火星: '行動節奏與生氣的方式',
};

type ShapeArgs = { nameA: string; nameB: string; domainA: string; domainB: string };

const QUALITY_SHAPE: Record<AspectResult['quality'], (args: ShapeArgs) => string> = {
  fusion: ({ nameA, nameB, domainA, domainB }) => `${nameA}的${domainA}和${nameB}的${domainB}疊在同一個位置。這一塊你們幾乎不用解釋就懂，但也因為太靠近，很難退開來看對方。`,
  flow: ({ nameA, nameB, domainA, domainB }) => `${nameA}的${domainA}和${nameB}的${domainB}走得順。這是相處裡不太費力的部分，順到你們自己都沒注意到它存在。`,
  tension: ({ nameA, nameB, domainA, domainB }) => `${nameA}的${domainA}和${nameB}的${domainB}會互相卡住。摩擦多半出現在這裡，也是這段關係最會長出東西的地方。`,
  polarity: ({ nameA, nameB, domainA, domainB }) => `${nameA}的${domainA}和${nameB}的${domainB}站在正對面。你們在這一塊的做法幾乎相反，看得見對方，也最容易在這裡拉扯。`,
};

/**
 * 同一顆行星對上同一顆行星，要換句型。
 *
 * 通用句會寫成「小明的行動節奏和小華的行動節奏會互相卡住」——同一個詞講兩遍，
 * 讀起來像沒寫完。而且這個情況的意思本來就不一樣：兩個人在意的是同一件事，
 * 差別在強度和方向，不是「你的 A 對上他的 B」。
 */
const SAME_PLANET_SHAPE: Record<AspectResult['quality'], (domain: string) => string> = {
  fusion: (domain) => `你們的${domain}幾乎重疊。同一件事你們會在同一個點上有反應，好處是不用解釋，代價是沒有人能站遠一點看。`,
  flow: (domain) => `你們的${domain}方向一致。這一塊不太需要協調，各做各的也不會撞在一起。`,
  tension: (domain) => `你們在${domain}上是同一種在意，但用力的方向不同。所以吵起來多半不是為了誰對，而是為了誰的做法算數。`,
  polarity: (domain) => `你們的${domain}正好相反。同一件事你想快他想慢、你想講他想收，看得見對方，也最容易卡在這裡。`,
};

/**
 * 兩張盤之間的相位。用的是本命盤那組角度與容許度（`matchAspect`），
 * 差別只在於配對的是兩個人的行星而不是同一張盤裡的。
 */
export function computeCrossAspects(
  planetsA: PlanetPosition[] | undefined,
  planetsB: PlanetPosition[] | undefined,
  nameA: string,
  nameB: string,
  limit = 6,
): SynastryAspect[] {
  if (!planetsA?.length || !planetsB?.length) return [];
  const pick = (planets: PlanetPosition[]) => planets.filter((planet) => PERSONAL_PLANETS.includes(planet.name));

  const found: SynastryAspect[] = [];
  pick(planetsA).forEach((first) => {
    pick(planetsB).forEach((second) => {
      const match = matchAspect(first.longitude, second.longitude);
      if (!match) return;
      found.push({
        planetA: first.name,
        planetB: second.name,
        type: match.type,
        quality: match.quality,
        closeness: match.closeness,
        orb: match.orb,
        reading: first.name === second.name
          ? SAME_PLANET_SHAPE[match.quality](PLANET_DOMAIN[first.name] ?? first.name)
          : QUALITY_SHAPE[match.quality]({
            nameA,
            nameB,
            domainA: PLANET_DOMAIN[first.name] ?? first.name,
            domainB: PLANET_DOMAIN[second.name] ?? second.name,
          }),
      });
    });
  });

  // 容許度越小，這組相位越明確。只留最緊的幾組，其餘是雜訊。
  return found.sort((left, right) => left.orb - right.orb).slice(0, limit);
}

export function generateSynastry(inputA: FateReportInput, inputB: FateReportInput, nameA = '甲方', nameB = '乙方'): SynastryReading {
  const profileA = buildUnifiedElementProfile(inputA);
  const profileB = buildUnifiedElementProfile(inputB);

  // 五行互補：一方高、另一方低的元素，能互相補位。
  const ELEMENT_ORDER: ElementName[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  const gaps = ELEMENT_ORDER
    .map((element) => {
      const pa = profileA.percentages[element];
      const pb = profileB.percentages[element];
      return { element, gap: Math.abs(pa - pb), giver: pa > pb ? nameA : nameB, taker: pa > pb ? nameB : nameA, both: Math.min(pa, pb) };
    })
    .sort((left, right) => right.gap - left.gap);
  const complements = gaps.filter((item) => item.gap >= 12);
  const shared = gaps.filter((item) => item.gap < 12 && item.both >= 24).map((item) => ELEMENT_LABELS[item.element]);

  // 實測：九成的配對至少有一項五行落差達標，所以「你們有互補」本身不是結論。
  // 有意義的是差最多的是哪一項、差多少，那才是這一對特有的。
  const widest = complements[0];
  const elementReading = widest
    ? `把兩個人的命盤都換算成五行來看，差最多的是${ELEMENT_LABELS[widest.element]}：${widest.giver}的比重高出${widest.taker}約 ${Math.round(widest.gap)} 個百分點。實際的意思是，需要用到${ELEMENT_LABELS[widest.element]}那類做法的場合，交給${widest.giver}起頭會省力得多。${shared.length ? `在${joinChinese(shared)}上你們則旗鼓相當，那是共同的底色，也是共同的執著。` : ''}`
    : `把兩個人的命盤都換算成五行來看，五項的比重都很接近，沒有一項差到會互相補位。你們是同類型的人——順的地方一起順，卡的地方也會一起卡。${shared.length ? `尤其${joinChinese(shared)}兩邊都重。` : ''}`;

  const dm = dayMasterRelation(inputA.bazi.dayMasterElement, inputB.bazi.dayMasterElement, nameA, nameB);
  const zodiac = zodiacRelation(inputA.zodiac.branch, inputB.zodiac.branch, inputA.zodiac.animal, inputB.zodiac.animal);
  const sun = sunSignRelation(inputA.astrology.element, inputB.astrology.element, inputA.astrology.sunSign, inputB.astrology.sunSign);

  const numA = numerologyElement(inputA.numerology.lifePathNumber);
  const numB = numerologyElement(inputB.numerology.lifePathNumber);
  const sameLifePath = inputA.numerology.lifePathNumber === inputB.numerology.lifePathNumber;
  const numeroReading = sameLifePath
    ? `你們的生命靈數都是 ${inputA.numerology.lifePathNumber}（${inputA.numerology.title}），要練的功課是同一門——很懂彼此，也會在同一個地方一起卡住。`
    : `${nameA} 是生命靈數 ${inputA.numerology.lifePathNumber}「${inputA.numerology.title}」，${nameB} 是 ${inputB.numerology.lifePathNumber}「${inputB.numerology.title}」。${numA === numB ? '換算成五行之後其實同一類，骨子裡的動力接近，只是表現方式不同。' : '兩門功課不同，意思是對方在意的事你多半沒在意，反過來也一樣。'}`;

  const aspects = computeCrossAspects(inputA.astrology.planets, inputB.astrology.planets, nameA, nameB);
  const aspectNote = !inputA.astrology.planets?.length || !inputB.astrology.planets?.length
    ? '這一段需要兩邊的行星位置才算得出來，目前其中一方的資料只夠推太陽星座。'
    : aspects.length === 0
      ? `${nameA}與${nameB}的個人行星之間沒有落在容許度內的主要相位。這在合盤裡很少見（五百對裡大概只有一對），代表西洋占星對你們沒有特別強的話要說，不是關係有問題。`
      : `這裡只比對走得快的五顆：太陽、月亮、水星、金星、火星——外行星要好幾年才換一次星座，你們如果年紀相近，那幾顆本來就會成相，那是同齡不是緣分。`
        + `五顆對五顆有二十五種配對，實測下來幾乎每一對都湊得出好幾組，四種型態多半也都會出現，所以重點不是有沒有成相，而是哪一組貼得最近。以下依角度差由緊到鬆排列。`;

  /*
   * 亮點只收「量出來真的少見」的結論。
   *
   * 舊版把「五行有互補」當成第一個亮點，但實測有 90.2% 的配對都會觸發它；
   * 「生肖三合」有 23.2%、「最緊的相位落在 tight」有 88.8%。這些全部列成亮點，
   * 等於告訴每一對「你們很特別」——那就沒有人特別了。
   *
   * 改成用實測出現率過濾：低於 UNCOMMON_PAIR_RATE 才進來。過不了門檻的結論
   * 仍然完整寫在上面的段落裡，只是不再被抬到「亮點」的位置。
   */
  const highlights: SynastryHighlight[] = [];
  const pushIfUncommon = (
    sectionId: string, featureKey: string, kind: SynastryHighlight['kind'], title: string, text: string,
  ) => {
    const rate = PAIR_FEATURE_RATES[`${sectionId}:${featureKey}`];
    if (rate === undefined || rate > UNCOMMON_PAIR_RATE) return;
    highlights.push({ kind, title, text, occurrence: `${describePairRate(rate)}。` });
  };

  if (zodiac.featureKey === '生肖六合') pushIfUncommon('zodiac', zodiac.featureKey, 'harmony', zodiac.verdict, zodiac.reading);
  if (zodiac.featureKey === '生肖六沖' || zodiac.featureKey === '生肖相害') {
    pushIfUncommon('zodiac', zodiac.featureKey, 'friction', zodiac.verdict, '生肖上有張力：差異大不代表不合，而是每件事都得多講兩句。');
  }
  if (inputA.numerology.lifePathNumber === inputB.numerology.lifePathNumber) {
    pushIfUncommon('numerology', 'same', 'harmony', '同一個生命靈數', `你們的生命靈數都是 ${inputA.numerology.lifePathNumber}。同號的配對不多，好處是不用解釋就懂彼此，代價是會卡在同一種功課上。`);
  }

  // 相位不查出現率表：四種型態每一對幾乎都會出現，有意義的是「最緊的那一組是哪一組」。
  // 用絕對角度差當門檻，1 度以內才算真的緊。
  const tightest = aspects[0];
  if (tightest && tightest.orb <= 1) {
    highlights.push({
      kind: tightest.quality === 'tension' || tightest.quality === 'polarity' ? 'friction' : 'harmony',
      title: `${tightest.planetA} ${tightest.type} ${tightest.planetB}`,
      text: tightest.reading,
      occurrence: `角度差只有 ${tightest.orb}°，是你們兩張盤之間貼得最近的一組。`,
    });
  }
  if (highlights.length === 0) {
    highlights.push({
      kind: 'harmony',
      title: '沒有特別少見的組合',
      text: '把你們的結果和隨機兩個人比對之後，沒有哪一項落在少數。這不是壞消息——大部分關係本來就不靠命盤上的奇特組合撐著，上面每一段講的東西都還是成立的。',
    });
  }

  return {
    nameA,
    nameB,
    intro: `這份合盤把 ${nameA} 與 ${nameB} 的命盤，從五行、八字日主、生肖、西洋星座、跨盤相位與生命靈數並排比較。重點不是給你們一個「合不合」的分數，而是看見你們天然的互補與張力在哪裡——關係好不好，最終還是你們一起經營出來的。`,
    sections: [
      {
        id: 'element',
        title: '五行互補與共鳴',
        verdict: complements.length ? '有互補' : '偏同類',
        featureKey: complements.length ? '有互補' : '偏同類',
        reading: elementReading,
        occurrence: occurrenceOf('element', complements.length ? '有互補' : '偏同類'),
      },
      dm,
      zodiac,
      sun,
      {
        id: 'numerology',
        title: '生命靈數配對',
        verdict: sameLifePath ? '同號' : '不同號',
        featureKey: sameLifePath ? 'same' : 'different',
        reading: numeroReading,
        occurrence: occurrenceOf('numerology', sameLifePath ? 'same' : 'different'),
      },
    ],
    aspects,
    aspectNote,
    highlights,
    cautions: [
      '合盤是把兩份文化模型並排觀察，不是關係的判決書，也不能預測結果。',
      '任何一段關係的好壞，都取決於實際的溝通、尊重與經營，遠勝過命盤上的合或沖。',
      '看到「沖」「剋」不用擔心——差異就是互補的來源；看到「合」也別鬆懈，關係仍要用心。',
    ],
  };
}
