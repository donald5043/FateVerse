import { describe, expect, it } from 'vitest';
import { buildReportFromProfile } from '../src/engines/build-report';
import {
  describeRate, detectFeatures, detectRareFeatures, RARE_THRESHOLD,
} from '../src/engines/rare-features-engine';
import { RARE_FEATURE_RATES } from '../src/data/rare-feature-rates';
import type { ProfileInput } from '../src/types/fate';

function inputFor(birthDate: string, birthTime = '10:30') {
  const profile: ProfileInput = {
    name: '示範', birthDate, birthTime, gender: 'female',
    region: '未提供', timezone: 'Asia/Taipei', focus: ['all'],
  };
  return buildReportFromProfile(profile).reportInput;
}

const SAMPLES = [
  '1990-01-02', '1985-07-19', '2001-11-30', '1977-04-05',
  '1968-09-23', '1995-12-11', '1920-05-06', '1923-08-28', '2010-08-08',
];

describe('罕見特徵', () => {
  it('只列出出現率在門檻以內的項目', () => {
    SAMPLES.forEach((date) => {
      detectRareFeatures(inputFor(date)).forEach((feature) => {
        expect(feature.rate).toBeLessThanOrEqual(RARE_THRESHOLD);
        expect(feature.rate).toBeGreaterThan(0);
      });
    });
  });

  it('稀有的排前面', () => {
    SAMPLES.forEach((date) => {
      const rates = detectRareFeatures(inputFor(date)).map((feature) => feature.rate);
      expect([...rates].sort((left, right) => left - right)).toEqual(rates);
    });
  });

  it('常見的配置不會被當成罕見講出來', () => {
    // 這幾項實測都超過門檻，是「多數人都有」的東西，講出來就是話術。
    const common = ['missing-element', 'stellium', 'same-birth-cards', 'day-master-extreme', 'stem-combination'] as const;
    common.forEach((id) => expect(RARE_FEATURE_RATES[id]).toBeGreaterThan(RARE_THRESHOLD));

    SAMPLES.forEach((date) => {
      const ids = detectRareFeatures(inputFor(date)).map((feature) => feature.id);
      common.forEach((id) => expect(ids, `${date} 不該列出 ${id}`).not.toContain(id));
    });
  });

  it('偵測器抓得到，只是被門檻擋下——不是壞掉', () => {
    // 五行缺一實測 69.6%，所以樣本裡一定有人被偵測到，但都不會出現在罕見清單。
    const detectedIds = SAMPLES.flatMap((date) => detectFeatures(inputFor(date)).map((feature) => feature.id));
    expect(detectedIds).toContain('missing-element');
  });

  it('最多列 4 項，不變成另一種流水帳', () => {
    SAMPLES.forEach((date) => {
      expect(detectRareFeatures(inputFor(date)).length).toBeLessThanOrEqual(4);
      expect(detectRareFeatures(inputFor(date), 2).length).toBeLessThanOrEqual(2);
    });
  });

  it('同一項不會重複出現', () => {
    SAMPLES.forEach((date) => {
      const ids = detectRareFeatures(inputFor(date)).map((feature) => feature.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('每一項都有實際內容，不是只有標籤', () => {
    SAMPLES.forEach((date) => {
      detectRareFeatures(inputFor(date)).forEach((feature) => {
        expect(feature.detail.length).toBeGreaterThan(2);
        expect(feature.meaning.length).toBeGreaterThan(20);
      });
    });
  });

  it('已知的盤抓得到已知的特徵', () => {
    // 時柱會改變地支組合，所以這些案例的出生時間必須一起指定，不能只給日期。
    const harmony = detectRareFeatures(inputFor('1920-05-06', '04:00'));
    expect(harmony.map((feature) => feature.id)).toContain('three-harmony');
    expect(harmony.find((feature) => feature.id === 'three-harmony')?.detail).toContain('三合');

    const meeting = detectRareFeatures(inputFor('1923-08-28', '19:00'));
    expect(meeting.map((feature) => feature.id)).toContain('three-meeting');

    expect(detectFeatures(inputFor('1920-04-18', '03:30')).map((feature) => feature.id)).toContain('all-yang');
    expect(detectFeatures(inputFor('1925-03-22', '02:59')).map((feature) => feature.id)).toContain('all-yin');
  });

  it('純陽與純陰互斥', () => {
    SAMPLES.forEach((date) => {
      const ids = detectFeatures(inputFor(date)).map((feature) => feature.id);
      expect(ids.includes('all-yang') && ids.includes('all-yin')).toBe(false);
    });
  });

  it('文案不宣稱吉凶，也不預測', () => {
    SAMPLES.forEach((date) => {
      const text = detectRareFeatures(inputFor(date)).map((feature) => feature.meaning).join('');
      ['大吉', '大凶', '注定', '必然', '一定會', '將會', '貴人相助'].forEach((banned) => {
        expect(text, `${date} 不應出現「${banned}」`).not.toContain(banned);
      });
    });
  });

  it('出現率講成人話，而且對得上數字', () => {
    expect(describeRate(0.032)).toBe('大約每 31 個人有 1 個');
    expect(describeRate(0.5)).toBe('大約 50% 的人有');
    expect(describeRate(0)).toContain('沒有出現過');
  });

  it('稀有度表涵蓋所有偵測得到的特徵，沒有漏鍵', () => {
    const detected = new Set(SAMPLES.flatMap((date) => detectFeatures(inputFor(date)).map((feature) => feature.id)));
    detected.forEach((id) => {
      expect(RARE_FEATURE_RATES[id], `${id} 缺少實測出現率`).toBeGreaterThan(0);
    });
  });
});

describe('紫微與大運的罕見特徵', () => {
  it('紫微命宮結構抓得到已知案例', () => {
    // 1920-04-18 03:30 男：命宮雙主星且帶生年四化。
    const ids = detectFeatures(inputFor('1920-04-18', '03:30')).map((feature) => feature.id);
    expect(ids).toContain('twin-major-stars');
  });

  it('起運極早與極晚互斥，而且都講得出實際歲數', () => {
    SAMPLES.forEach((date) => {
      const features = detectFeatures(inputFor(date));
      const ids = features.map((feature) => feature.id);
      expect(ids.includes('early-luck-start') && ids.includes('late-luck-start')).toBe(false);
      features
        .filter((feature) => feature.id === 'early-luck-start' || feature.id === 'late-luck-start')
        .forEach((feature) => expect(feature.detail).toMatch(/\d+ 歲/));
    });
  });

  it('掃整輩子大運的兩項太常見，一律不顯示', () => {
    // 沖日支 44.2%、補齊三合 41.2%——「你這步大運沖日支」聽起來像在講你，
    // 其實接近丟銅板。這條測試守住它們不會偷偷跑到使用者面前。
    (['luck-clashes-day', 'luck-completes-harmony'] as const).forEach((id) => {
      expect(RARE_FEATURE_RATES[id]).toBeGreaterThan(RARE_THRESHOLD);
    });
    SAMPLES.forEach((date) => {
      const ids = detectRareFeatures(inputFor(date)).map((feature) => feature.id);
      expect(ids).not.toContain('luck-clashes-day');
      expect(ids).not.toContain('luck-completes-harmony');
    });
  });

  it('性別未指定時排不出大運，該段安靜略過而不是報錯', () => {
    const noGender = buildReportFromProfile({
      name: '示範', birthDate: '1990-01-02', birthTime: '10:30', gender: 'other',
      region: '未提供', timezone: 'Asia/Taipei', focus: ['all'],
    }).reportInput;
    expect(() => detectFeatures(noGender)).not.toThrow();
    const ids = detectFeatures(noGender).map((feature) => feature.id);
    ['early-luck-start', 'late-luck-start', 'luck-clashes-day'].forEach((id) => {
      expect(ids).not.toContain(id);
    });
  });

  it('大運相關的敘述不預告未來事件', () => {
    SAMPLES.forEach((date) => {
      const text = detectFeatures(inputFor(date))
        .filter((feature) => feature.id.startsWith('luck') || feature.id.endsWith('luck-start'))
        .map((feature) => feature.meaning).join('');
      ['你會', '將會', '注定', '必然', '一定會', '要小心'].forEach((banned) => {
        expect(text, `${date} 不應出現「${banned}」`).not.toContain(banned);
      });
    });
  });
});

describe('星盤相位圖形', () => {
  it('大十字抓到的是真的兩組對分加四組四分', () => {
    // 1931-08-31 07:00 實測有大十字：火星對天王星、土星對冥王星。
    const input = inputFor('1931-08-31', '07:00');
    const cross = detectFeatures(input).find((feature) => feature.id === 'grand-cross');
    expect(cross).toBeDefined();

    const members = cross!.detail.split('構成')[0].split('、');
    expect(members).toHaveLength(4);
    const between = (input.astrology.aspects ?? []).filter(
      (aspect) => members.includes(aspect.first) && members.includes(aspect.second),
    );
    expect(between.filter((aspect) => aspect.type === '對分相')).toHaveLength(2);
    expect(between.filter((aspect) => aspect.type === '四分相')).toHaveLength(4);
  });

  it('全由外行星構成的圖形，必須說明那是一整代人共有的', () => {
    const cross = detectFeatures(inputFor('1931-08-31', '07:00'))
      .find((feature) => feature.id === 'grand-cross');
    // 火星不是外行星，所以這一組不該加世代註記。
    expect(cross!.detail).toContain('火星');
    expect(cross!.meaning).not.toContain('一整代');
  });

  it('太常見的圖形不會顯示', () => {
    // T 三角 31.2%、無相位行星 37.6%——都被講得像很戲劇性，其實三成以上的人有。
    (['t-square', 'unaspected-planet'] as const).forEach((id) => {
      expect(RARE_FEATURE_RATES[id]).toBeGreaterThan(RARE_THRESHOLD);
    });
    SAMPLES.forEach((date) => {
      const ids = detectRareFeatures(inputFor(date)).map((feature) => feature.id);
      expect(ids).not.toContain('t-square');
      expect(ids).not.toContain('unaspected-planet');
    });
  });

  it('沒有行星資料時安靜略過', () => {
    const sunOnly = buildReportFromProfile({
      name: '示範', birthDate: '1990-01-02', birthTime: '10:30', gender: 'female',
      region: '未提供', timezone: 'Asia/Taipei', focus: ['all'],
    }).reportInput;
    const stripped = { ...sunOnly, astrology: { ...sunOnly.astrology, planets: undefined, aspects: undefined } };
    expect(() => detectFeatures(stripped)).not.toThrow();
    const ids = detectFeatures(stripped).map((feature) => feature.id);
    ['grand-trine', 't-square', 'grand-cross', 'unaspected-planet'].forEach((id) => {
      expect(ids).not.toContain(id);
    });
  });

  it('同一張盤重算結果一致，不會因為搜尋順序而跳動', () => {
    const input = inputFor('1931-08-31', '07:00');
    expect(detectFeatures(input)).toEqual(detectFeatures(input));
  });
});

describe('逆行：分開個人行星與世代行星', () => {
  const PERSONAL = ['水星', '金星', '火星'];
  const SLOW = ['木星', '土星', '天王星', '海王星', '冥王星'];

  it('多顆逆行時，說清楚哪幾顆是一整代共有的', () => {
    // 1946-11-23 10:00 實測：水星、金星、土星、天王星、冥王星逆行。
    const many = detectFeatures(inputFor('1946-11-23', '10:00'))
      .find((feature) => feature.id === 'many-retrograde');
    expect(many).toBeDefined();
    expect(many!.meaning).toContain('走得慢');
    expect(many!.meaning).toContain('同一段時期出生的人多半也是逆行');
    // 有個人行星時要點名它們才是屬於這個人的部分
    expect(many!.meaning).toContain('真正屬於你的是');
  });

  it('全是外行星逆行時，不會謊稱那是你的特色', () => {
    SAMPLES.concat(['1946-11-23', '1948-02-23']).forEach((date) => {
      const many = detectFeatures(inputFor(date)).find((feature) => feature.id === 'many-retrograde');
      if (!many) return;
      const listed = many.detail.replace('都逆行', '').split('、');
      if (listed.every((name) => SLOW.includes(name))) {
        expect(many.meaning).toContain('一整代');
        expect(many.meaning).not.toContain('真正屬於你的是');
      }
    });
  });

  it('個人行星逆行比多顆逆行罕見得多', () => {
    expect(RARE_FEATURE_RATES['personal-retrograde'])
      .toBeLessThan(RARE_FEATURE_RATES['many-retrograde']);
  });

  it('每顆個人行星有自己的說法，不共用同一句結尾', () => {
    const readings = new Map<string, string>();
    for (const date of ['1946-11-23', '1948-02-23', '1990-01-02', '1985-07-19', '1968-09-23', '1977-04-05']) {
      const feature = detectFeatures(inputFor(date)).find((item) => item.id === 'personal-retrograde');
      if (feature) readings.set(feature.detail, feature.meaning);
    }
    expect(readings.size).toBeGreaterThan(0);
    readings.forEach((meaning, detail) => {
      const listed = detail.replace('同時逆行', '').split('、');
      listed.forEach((name) => expect(PERSONAL).toContain(name));
      // 沒被列到的行星，它的說法不該出現在文字裡
      if (!listed.includes('金星')) expect(meaning).not.toContain('喜歡一個人不太表現在外面');
      if (!listed.includes('火星')) expect(meaning).not.toContain('要動手之前會先反覆演練');
      if (!listed.includes('水星')) expect(meaning).not.toContain('想講的話要先在腦子裡繞一圈');
    });
  });
});
