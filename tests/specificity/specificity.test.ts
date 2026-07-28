import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze, OVER_GENERIC_THRESHOLD, STATIC_PLACEHOLDER_MAX } from './analyze';
import { buildSyntheticCharts } from './synthetic-charts';
import { normalizeSentence } from './extract-sentences';
import { writeBaseline } from './write-baseline';
import { collectStaticCorpus, scanStaticCorpus, summariseByCorpus } from './static-corpus';

/**
 * 是否因發現 OVER_GENERIC 文案而讓測試失敗。
 *
 * 已啟用，但採「棘輪」方式：門檻設在目前已改寫完成的水準，而非 0。
 * 剩餘的項目多是結構性句框（每張命盤都有最強／最弱五行，該句框必然出現），
 * 要再降低得改報告結構而非文字。把門檻釘在現況可以擋下新增的泛用文案，
 * 又不會被既有結構句卡住。改善後請同步調低門檻。
 */
const FAIL_ON_OVER_GENERIC = true;

/*
 * 2026-07-28 把預算從 36 調高到 37，理由要寫清楚：
 *
 * 使用者回報紫微與西洋的內容「不夠好懂」，原因是文案只報座標不解釋術語
 * （「以『建立結構』的方式處理『核心認同與主動表達』」）。改成白話之後，
 * 「太陽在{星座}，講的是你想成為什麼樣的人」這種定義句會出現在每一份報告裡。
 *
 * 定義對每個人都成立，那是定義的本質，不是巴納姆句——它沒有宣稱這個人如何，
 * 只說明那個位置在講什麼。真正的解讀在後面「行星落在哪裡」那幾張卡。
 *
 * 這是可讀性與出現率之間的真實張力：要讓術語看得懂，就得重複定義。
 * 調高預算是有意識的取捨，不是為了讓測試變綠。
 */
const OVER_GENERIC_BUDGET = 37;

/** 靜態語料（塔羅、籤詩解讀、今日指引等）的 voice 規則違規上限。 */
const STATIC_VIOLATION_BUDGET = 0;

/**
 * 口語度（R7–R9）有問題的解讀模板數上限。
 *
 * 現況為 0，所以直接釘在 0。這一軸的標記表刻意只收高信心的詞
 * （見 plainness.ts 末段「刻意不列入的詞」），誤報低才守得住 0；
 * 真的有正當理由要用，請加進 EXEMPTIONS 並寫明原因，不要調高這個數字。
 */
const PLAINNESS_BUDGET = 0;

const BASELINE_PATH = resolve(__dirname, '../../docs/specificity-baseline.md');

/**
 * 500 組完整報告約需 30 秒，不適合掛在每次 `npm run test` 上，
 * 因此只有 `npm run test:specificity`（會設定此環境變數）才執行完整量測與寫檔。
 * 同檔案內的其他單元測試不受影響，一般測試回合仍會驗證正規化與樣本多樣性。
 */
const RUN_FULL = Boolean(process.env.SPECIFICITY);

describe('具體性量測', () => {
  // 500 組完整報告需約 30 秒（瓶頸為紫微 iztro 排盤），故放寬逾時。
  it.skipIf(!RUN_FULL)('產生基線並輸出終端摘要', { timeout: 120_000 }, () => {
    const result = analyze(buildSyntheticCharts());

    const over = result.stats.filter((s) => s.verdict === 'OVER_GENERIC');
    const overStatic = over.filter((s) => s.placeholderRatio < STATIC_PLACEHOLDER_MAX);
    const interpretationTotal = result.counts.OVER_GENERIC + result.counts.WATCH + result.counts.OK;
    const overRate = interpretationTotal ? over.length / interpretationTotal : 0;

    // ── 終端摘要 ────────────────────────────────────────────
    const lines = [
      '',
      '─── 具體性量測摘要 ─────────────────────────────',
      `  命盤樣本      ${result.chartCount} 組（種子 ${result.seed}）`,
      `  抽取句子      ${result.totalSentences.toLocaleString()} 句 → ${result.totalTemplates} 個模板`,
      `  OVER_GENERIC  ${over.length} 條（佔解讀類 ${(overRate * 100).toFixed(1)}%）`,
      `   └ 靜態泛用句 ${overStatic.length} 條 ← 優先改寫目標`,
      `  WATCH         ${result.counts.WATCH} 條`,
      `  OK            ${result.counts.OK} 條`,
      `  FRAMING       ${result.counts.FRAMING} 條（方法說明／免責／標籤，不計分）`,
      `  每份報告平均模糊限定詞 ${result.averageHedgesPerReport.toFixed(1)} 個（上限 1）`,
      `  R3 過長段落   ${result.voiceRuleTotals['R3-paragraph-length']} 個模板`,
      `  口語度問題    ${result.plainnessTemplates} 個模板`
        + `（對沖語 ${result.plainnessRuleTotals['R7-hedged-assertion']}`
        + `／自我說明 ${result.plainnessRuleTotals['R8-meta-commentary']}`
        + `／書面語 ${result.plainnessRuleTotals['R9-bookish']}）`,
      '',
      '  最常出現的口語度問題：',
      ...result.plainnessMarkers.slice(0, 8).map((m, i) => `   ${String(i + 1).padStart(2)}. ${String(m.templates).padStart(3)} 個模板  「${m.marker}」→ ${m.suggestion}`),
      '',
      '  靜態泛用句中出現率最高的 10 條：',
      ...overStatic.slice(0, 10).map((s, i) => `   ${String(i + 1).padStart(2)}. ${(s.rate * 100).toFixed(1).padStart(5)}%  ${s.template.slice(0, 52)}`),
      `  耗時 ${(result.elapsedMs / 1000).toFixed(1)} 秒`,
      '────────────────────────────────────────────────',
      '',
    ];
    console.log(lines.join('\n'));

    writeBaseline(result, BASELINE_PATH);

    // 量測本身必須有效：有跑到樣本、有抽到句子。
    expect(result.chartCount).toBe(500);
    expect(result.totalSentences).toBeGreaterThan(1000);
    expect(result.totalTemplates).toBeGreaterThan(0);

    if (FAIL_ON_OVER_GENERIC) {
      expect(
        over.length,
        `OVER_GENERIC 為 ${over.length} 條，超過目前預算 ${OVER_GENERIC_BUDGET}（門檻 ${OVER_GENERIC_THRESHOLD * 100}%）。`
        + '新增文案請依 docs/voice.md 撰寫；若確為結構性句框，請一併調整預算並說明理由。',
      ).toBeLessThanOrEqual(OVER_GENERIC_BUDGET);
    }

    expect(
      result.plainnessTemplates,
      `口語度有問題的模板為 ${result.plainnessTemplates} 個，超過目前預算 ${PLAINNESS_BUDGET}。`
      + '請見上方「最常出現的口語度問題」，或 docs/voice.md 的 R7–R9。',
    ).toBeLessThanOrEqual(PLAINNESS_BUDGET);
  });

  it('報告以外的靜態文案符合 voice 規則', () => {
    const entries = collectStaticCorpus();
    const violations = scanStaticCorpus(entries);

    if (violations.length) {
      console.log('\n─── 靜態文案違規 ─────────────────────────────');
      summariseByCorpus(violations, entries).filter((r) => r.violations > 0)
        .forEach((r) => console.log(`  ${String(r.violations).padStart(3)}/${String(r.entries).padEnd(5)} ${r.corpus}（${r.source}）`));
      violations.slice(0, 15).forEach((v) => console.log(`  [${v.rules.join(',')}] ${v.path}\n     ${v.text.slice(0, 70)}`));
      console.log('────────────────────────────────────────────────\n');
    }

    expect(entries.length).toBeGreaterThan(1000);
    expect(
      violations.length,
      `${violations.length} 條靜態文案違反 voice.md（塔羅牌義、籤詩解讀、今日指引等）`,
    ).toBeLessThanOrEqual(STATIC_VIOLATION_BUDGET);
  });

  it('模板正規化把插值變數歸一，讓同一模板可被合併', () => {
    const a = normalizeSentence('你的日主為甲（木），四柱為甲子、丙寅、庚午、壬申。');
    const b = normalizeSentence('你的日主為辛（金），四柱為乙丑、丁卯、辛未、癸酉。');
    expect(a).toBe(b);

    const withDate = normalizeSentence('2027-03-05 的大限命宮落在財帛宮。');
    expect(withDate).toContain('{日期}');
    expect(withDate).not.toMatch(/\d/);
  });

  it('合成命盤具備多樣性與可重現性', () => {
    const first = buildSyntheticCharts();
    const second = buildSyntheticCharts();
    expect(first.map((c) => c.profile.birthDate)).toEqual(second.map((c) => c.profile.birthDate));

    const tags = new Set(first.flatMap((c) => c.tags));
    ['spring', 'summer', 'autumn', 'winter', 'late-zi', 'no-name', 'no-coords'].forEach((tag) => {
      expect(tags.has(tag), `樣本缺少 ${tag} 覆蓋`).toBe(true);
    });

    const years = new Set(first.map((c) => Number(c.profile.birthDate.slice(0, 4))));
    expect(years.size).toBeGreaterThan(50);
    const hours = new Set(first.map((c) => c.profile.birthTime.slice(0, 2)));
    expect(hours.size).toBe(24);
  });
});
