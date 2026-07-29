import { describe, expect, it } from 'vitest';
import { calculateAstrology, calculateMajorAspects, matchAspect } from '../src/engines/astrology-engine';
import { computeCrossAspects, generateSynastry } from '../src/engines/synastry-engine';
import { buildReportFromProfile } from '../src/engines/build-report';
import type { PlanetPosition, ProfileInput } from '../src/types/fate';
import {
  buildSynastryShareUrl, decodeSynastryInput, encodeProfileToShareCode,
} from '../src/utils/share-link';

function planet(name: string, longitude: number): PlanetPosition {
  return { name, longitude, sign: '牡羊座', degreeInSign: 0, latitude: 0, retrograde: false };
}

function profile(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    name: '', birthDate: '1990-01-02', birthTime: '10:30', gender: 'other',
    region: '未提供', timezone: 'Asia/Taipei', focus: ['all'], ...overrides,
  };
}

describe('相位判定共用', () => {
  it('本命盤與合盤用的是同一組角度與容許度', () => {
    // calculateMajorAspects 內部就是 matchAspect，兩者對同一對經度必須一致。
    const planets = [planet('太陽', 10), planet('金星', 130)];
    const viaChart = calculateMajorAspects(planets)[0];
    const viaMatch = matchAspect(10, 130);
    expect(viaChart.type).toBe(viaMatch?.type);
    expect(viaChart.orb).toBe(viaMatch?.orb);
    expect(viaChart.quality).toBe(viaMatch?.quality);
  });

  it('落在容許度內才算成相', () => {
    expect(matchAspect(0, 120)?.type).toBe('三分相'); // 正三分相
    expect(matchAspect(0, 125)?.type).toBe('三分相'); // 容許度 6 度內
    expect(matchAspect(0, 133)).toBeUndefined(); // 超出所有容許度
  });

  it('角度差為零時是最緊的合相', () => {
    const exact = matchAspect(200, 200);
    expect(exact?.type).toBe('合相');
    expect(exact?.orb).toBe(0);
    expect(exact?.closeness).toBe('tight');
  });
});

describe('跨盤相位', () => {
  it('比對的是兩張盤之間，不是同一張盤內部', () => {
    const aspects = computeCrossAspects(
      [planet('太陽', 0)],
      [planet('月亮', 180)],
      '小明', '小華',
    );
    expect(aspects).toHaveLength(1);
    expect(aspects[0]).toMatchObject({ planetA: '太陽', planetB: '月亮', type: '對分相' });
  });

  it('同一顆行星在兩張盤上也會配對（A 的太陽 × B 的太陽）', () => {
    const aspects = computeCrossAspects([planet('太陽', 10)], [planet('太陽', 12)], 'A', 'B');
    expect(aspects[0]).toMatchObject({ planetA: '太陽', planetB: '太陽', type: '合相' });
  });

  it('行星在關係裡代表的那幾個詞不含頓號，接進句型才不會斷錯句', () => {
    // 「小明的喜歡什麼、怎麼表達喜歡和小華的行動節奏…」讀起來會斷在錯的地方。
    const different = computeCrossAspects([planet('金星', 0)], [planet('火星', 90)], '小明', '小華');
    expect(different[0].reading.split('。')[0]).not.toContain('、');
  });

  it('同一顆行星換句型，不會把同一個詞講兩遍', () => {
    // 通用句會寫成「A 的行動節奏和 B 的行動節奏會互相卡住」，讀起來像沒寫完。
    const same = computeCrossAspects([planet('火星', 0)], [planet('火星', 90)], '小明', '小華');
    expect(same[0].reading).not.toMatch(/行動節奏與生氣的方式.*行動節奏與生氣的方式/);
    expect(same[0].reading).toContain('你們');

    // 不同行星仍然要指名是誰的哪一塊，否則就分不出方向。
    const different = computeCrossAspects([planet('火星', 0)], [planet('月亮', 90)], '小明', '小華');
    expect(different[0].reading).toContain('小明');
    expect(different[0].reading).toContain('小華');
  });

  it('只比對個人行星，外行星不列入', () => {
    const aspects = computeCrossAspects(
      [planet('冥王星', 0), planet('海王星', 0), planet('太陽', 0)],
      [planet('冥王星', 0), planet('金星', 0)],
      'A', 'B',
    );
    aspects.forEach((aspect) => {
      expect(['太陽', '月亮', '水星', '金星', '火星']).toContain(aspect.planetA);
      expect(['太陽', '月亮', '水星', '金星', '火星']).toContain(aspect.planetB);
    });
    expect(aspects).toHaveLength(1);
  });

  it('依容許度由緊到鬆排序，並限制筆數', () => {
    const a = [planet('太陽', 0), planet('月亮', 0), planet('金星', 0), planet('火星', 0), planet('水星', 0)];
    const b = [planet('太陽', 0), planet('月亮', 1), planet('金星', 2), planet('火星', 3), planet('水星', 4)];
    const aspects = computeCrossAspects(a, b, 'A', 'B');
    expect(aspects).toHaveLength(6);
    const orbs = aspects.map((aspect) => aspect.orb);
    expect([...orbs].sort((left, right) => left - right)).toEqual(orbs);
  });

  it('任一方沒有行星資料時回空陣列，不丟例外', () => {
    expect(computeCrossAspects(undefined, [planet('太陽', 0)], 'A', 'B')).toEqual([]);
    expect(computeCrossAspects([planet('太陽', 0)], [], 'A', 'B')).toEqual([]);
  });

  it('解讀文字帶入雙方名字，且不宣稱未來', () => {
    const aspects = computeCrossAspects([planet('金星', 0)], [planet('火星', 90)], '小明', '小華');
    expect(aspects[0].reading).toContain('小明');
    expect(aspects[0].reading).toContain('小華');
    ['一定會', '必然', '注定', '將會分手', '不適合'].forEach((banned) => {
      expect(aspects[0].reading).not.toContain(banned);
    });
  });

  it('接上真實命盤：有行星資料時算得出相位並寫進合盤', () => {
    const inputA = buildReportFromProfile(profile({ birthDate: '1990-01-02' })).reportInput;
    const inputB = buildReportFromProfile(profile({ birthDate: '1988-06-15' })).reportInput;
    expect(inputA.astrology.planets?.length).toBeGreaterThan(0);

    const reading = generateSynastry(inputA, inputB, '小明', '小華');
    expect(reading.aspects.length).toBeGreaterThan(0);
    // 這段刻意不用「容許度」這個術語了，但資訊要在：只比對個人行星、依角度差排序。
    expect(reading.aspectNote).toContain('太陽、月亮、水星、金星、火星');
    expect(reading.aspectNote).toContain('角度差');
    reading.aspects.forEach((aspect) => {
      expect(aspect.reading.length).toBeGreaterThan(10);
      expect(aspect.orb).toBeGreaterThanOrEqual(0);
    });
  });

  it('只有太陽星座資料時，說明為什麼這段是空的', () => {
    const sunOnly = { ...calculateAstrology({ birthDate: '1990-01-02', birthTime: '10:30', timezone: 'Asia/Taipei' }), planets: undefined };
    const inputA = buildReportFromProfile(profile()).reportInput;
    const reading = generateSynastry({ ...inputA, astrology: sunOnly }, inputA, 'A', 'B');
    expect(reading.aspects).toEqual([]);
    expect(reading.aspectNote).toContain('只夠推太陽星座');
  });

  it('合盤不給分數', () => {
    const inputA = buildReportFromProfile(profile({ birthDate: '1990-01-02' })).reportInput;
    const inputB = buildReportFromProfile(profile({ birthDate: '1988-06-15' })).reportInput;
    const reading = generateSynastry(inputA, inputB, '小明', '小華');
    const text = JSON.stringify(reading);
    // 「不是給你們一個合不合的分數」這種否定句是要留的，所以查的是實際的計分痕跡。
    expect(text).not.toMatch(/\d+\s*分(?!鐘)/); // 例如「85 分」
    // 百分比本身不是禁忌——禁的是「幫這一對打分數」。實測出現率講的是
    // 「隨機兩個人有多少對也這樣」，那是拿來降溫的，不是拿來評價他們的。
    // 所以規則是：出現 % 的地方，必須是在講配對的出現頻率。
    const percentSentences = JSON.stringify(reading)
      .split(/[。，\\n]/)
      .filter((part) => /\d+\s*%/.test(part));
    percentSentences.forEach((part) => {
      expect(part, `百分比只能用來講出現率：${part}`).toMatch(/配對|對出現/);
    });
    ['評分', '滿分', '星等', '契合指數'].forEach((banned) => {
      expect(text, `不應出現「${banned}」`).not.toContain(banned);
    });
    // 型別上也不該有任何分數欄位
    const keys = new Set<string>();
    JSON.parse(text, function collect(key: string) { keys.add(key); return (this as Record<string, unknown>)[key]; });
    ['score', 'rating', 'points', 'percentage'].forEach((banned) => expect(keys).not.toContain(banned));
  });
});

describe('合盤分享連結', () => {
  const alice = profile({ name: '小明', birthDate: '1990-01-02', birthTime: '10:30' });
  const bob = profile({ name: '小華', birthDate: '1988-06-15', birthTime: '07:45' });

  it('往返後兩份出生資料都還原得回來', () => {
    const url = buildSynastryShareUrl(alice, bob);
    const decoded = decodeSynastryInput(url);
    expect(decoded).toBeDefined();
    expect(decoded![0].birthDate).toBe('1990-01-02');
    expect(decoded![0].birthTime).toBe('10:30');
    expect(decoded![1].birthDate).toBe('1988-06-15');
    expect(decoded![1].birthTime).toBe('07:45');
  });

  it('資料編在 hash 裡，不會進到伺服器看得到的路徑或 query', () => {
    const url = buildSynastryShareUrl(alice, bob);
    const hashIndex = url.indexOf('#');
    expect(hashIndex).toBeGreaterThanOrEqual(0);
    expect(url.slice(0, hashIndex)).not.toContain('p=');
    expect(url.slice(hashIndex)).toContain('#/synastry?p=');
  });

  it('預設不帶姓名', () => {
    const url = buildSynastryShareUrl(alice, bob);
    const decoded = decodeSynastryInput(url)!;
    expect(decoded[0].name).toBe('');
    expect(decoded[1].name).toBe('');
  });

  it('明確要求時才帶姓名', () => {
    const decoded = decodeSynastryInput(buildSynastryShareUrl(alice, bob, { includeName: true }))!;
    expect(decoded[0].name).toBe('小明');
    expect(decoded[1].name).toBe('小華');
  });

  it('只給 p= 參數字串也讀得懂（使用者只複製了片段）', () => {
    const url = buildSynastryShareUrl(alice, bob);
    const code = url.slice(url.indexOf('p=') + 2);
    expect(decodeSynastryInput(code)).toBeDefined();
  });

  it('缺一份、多一份或內容壞掉都整體拒絕', () => {
    const single = encodeProfileToShareCode(alice);
    expect(decodeSynastryInput(single)).toBeUndefined();
    expect(decodeSynastryInput(`${single}~${single}~${single}`)).toBeUndefined();
    expect(decodeSynastryInput(`${single}~壞掉的代碼`)).toBeUndefined();
    expect(decodeSynastryInput('')).toBeUndefined();
  });
});
