import type { AspectResult, AstrologyResult, PlanetPosition } from '../types/fate';
import { matchAspect } from './astrology-engine';
import { calculatePlanetPositions } from './astronomy-adapter';

/**
 * 今日星座運勢：拿今天天上的行星，去對你出生那一刻的行星。
 *
 * 這是西洋占星真正在做的事（行運對本命），不是把太陽星座查表。
 * 同一個星座的人，今天讀到的東西會因為本命盤不同而不同。
 *
 * 寫作原則跟每日卡一致：講今天可以做什麼，不講今天會發生什麼。
 */

/** 行運只留緊角度。本命盤用 6–7 度是因為那是一輩子的配置，今天的事沒那麼寬。 */
const TRANSIT_ORB_LIMIT = 3;

/** 走得快的行星才有「今天」的意義；土星以外的慢速行星幾個月都同一個角度。 */
const TRANSIT_PLANETS = ['月亮', '太陽', '水星', '金星', '火星'];
/** 本命這邊也只看個人行星，對上外行星的解讀會變成在講世代。 */
const NATAL_PLANETS = ['太陽', '月亮', '水星', '金星', '火星'];

/** 每顆行星在日常裡管什麼。用白話，不用占星術語。 */
const PLANET_TOPIC: Record<string, string> = {
  太陽: '你想被看見的樣子',
  月亮: '你的情緒',
  水星: '你講話和想事情的方式',
  金星: '你喜歡什麼、跟誰親近',
  火星: '你的衝勁和火氣',
};

export interface DailyTransit {
  /** 今天走到這個位置的行星。 */
  transitPlanet: string;
  /** 被對到的本命行星。 */
  natalPlanet: string;
  type: string;
  quality: AspectResult['quality'];
  orb: number;
  /** 這組行運今天怎麼運作，以及可以拿它做什麼。 */
  reading: string;
}

export interface DailyHoroscope {
  /** YYYY-MM-DD */
  date: string;
  sunSign: string;
  /** 今天月亮走到哪個星座——最貼近「今天的氣氛」的一件事。 */
  moonSign: string;
  /** 開場白，一句話講今天的調子。 */
  headline: string;
  transits: DailyTransit[];
  /** 沒有成相時的說明。有成相時為空字串。 */
  quietNote: string;
}

/**
 * 相位的四種形狀，各自對應一種今天可以做的事。
 *
 * 這裡刻意寫成祈使句而不是預測句：「今天適合把話講開」而不是
 * 「今天你會跟人吵架」。前者你可以照做，後者只能等它發生。
 */
const SHAPES: Record<AspectResult['quality'], (transit: string, natal: string, topic: string) => string> = {
  fusion: (transit, natal, topic) => `今天的${transit}正好疊在你本命的${natal}上，${topic}整天都會比較有存在感。想推進跟它有關的事，今天推得動。`,
  flow: (transit, natal, topic) => `今天的${transit}和你本命的${natal}角度很順，${topic}這一塊會比平常少卡一下。拖著沒做的那件事，挑今天做完。`,
  tension: (transit, natal, topic) => `今天的${transit}和你本命的${natal}互相卡著，${topic}最容易在今天冒火。要講的重話晚半天再講，通常就沒事了。`,
  polarity: (transit, natal, topic) => `今天的${transit}站在你本命${natal}的正對面，${topic}會在「配合別人」和「顧自己」之間拉扯。做決定前先問一句：這是誰的期待？`,
};

function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 開場白。有最緊的行運就講它，沒有就講月亮走到哪。 */
function buildHeadline(moonSign: string, tightest: DailyTransit | undefined): string {
  if (!tightest) return `今天月亮走在${moonSign}，天上沒有特別對到你本命盤的角度。`;
  const topic = PLANET_TOPIC[tightest.natalPlanet] ?? tightest.natalPlanet;
  if (tightest.quality === 'tension' || tightest.quality === 'polarity') {
    return `今天有點卡的地方會落在「${topic}」上。`;
  }
  return `今天比較順的地方會落在「${topic}」上。`;
}

/**
 * 算出今天的行運。
 *
 * @param astrology 本命星盤。需要 planets（行星位置），只有太陽星座時算不出行運。
 * @param today     以哪一天為今天
 * @param limit     最多回傳幾組行運
 */
export function computeDailyHoroscope(
  astrology: AstrologyResult,
  today = new Date(),
  limit = 3,
): DailyHoroscope {
  const transitPositions = calculatePlanetPositions(today);
  const moon = transitPositions.find((planet) => planet.name === '月亮');
  const moonSign = moon?.sign ?? '未知';
  const natal = astrology.planets ?? [];

  const pick = (planets: PlanetPosition[], names: string[]) => planets.filter((planet) => names.includes(planet.name));

  const transits: DailyTransit[] = [];
  pick(transitPositions, TRANSIT_PLANETS).forEach((transit) => {
    pick(natal, NATAL_PLANETS).forEach((birth) => {
      const match = matchAspect(transit.longitude, birth.longitude);
      if (!match) return;
      transits.push({
        transitPlanet: transit.name,
        natalPlanet: birth.name,
        type: match.type,
        quality: match.quality,
        orb: match.orb,
        reading: SHAPES[match.quality](transit.name, birth.name, PLANET_TOPIC[birth.name] ?? birth.name),
      });
    });
  });

  // 行運的容許度要比本命盤緊。5 度外的角度天天都在，講不出「今天」。
  const tight = transits.filter((item) => item.orb <= TRANSIT_ORB_LIMIT);

  // 同一種相位形狀只留最緊的一組。留兩組四分相會印出一模一樣的句子，
  // 讀起來像複製貼上，再準也沒說服力。
  const seen = new Set<AspectResult['quality']>();
  const top = tight
    .sort((left, right) => left.orb - right.orb)
    .filter((item) => {
      if (seen.has(item.quality)) return false;
      seen.add(item.quality);
      return true;
    })
    .slice(0, limit);

  return {
    date: toDateKey(today),
    sunSign: astrology.sunSign,
    moonSign,
    headline: buildHeadline(moonSign, top[0]),
    transits: top,
    quietNote: natal.length === 0
      ? '這一段需要完整的出生時間才算得出來，目前的資料只夠推太陽星座。'
      : top.length === 0
        ? '今天天上的行星沒有緊貼到你本命盤的角度。占星上這就是很平常的一天——沒事發生本身也是一種答案。'
        : '',
  };
}
