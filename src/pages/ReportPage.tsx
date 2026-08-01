import {
  ChevronRight, Fingerprint, ListTree, RefreshCw, ShieldCheck, Sparkles, Waypoints,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Collapsible from '../components/common/Collapsible';
import { generateFallbackReport } from '../engines/fallback-report';
import FiveElementChart from '../components/charts/FiveElementChart';
import Disclaimer from '../components/common/Disclaimer';
import SystemArtwork, { type SystemArtworkKind } from '../components/common/SystemArtwork';
import BaziPillars from '../components/report/BaziPillars';
import BaziRelations from '../components/report/BaziRelations';
import BaziStrengthPanel from '../components/report/BaziStrengthPanel';
import AstrologyStructurePanel from '../components/report/AstrologyStructurePanel';
import { AstrologyPositionInsights, BaziTenGodInsights, ZiweiKeyPalaceInsights } from '../components/report/CulturalInsights';
import FateSnapshotCard from '../components/report/FateSnapshotCard';
import RareFeaturesCard from '../components/report/RareFeaturesCard';
import FusionInsights from '../components/report/FusionInsights';
import UnifiedIntegrationPanel from '../components/report/UnifiedIntegrationPanel';
import NatalChart from '../components/report/NatalChart';
import HouseSystemComparison from '../components/report/HouseSystemComparison';
import ReportActions from '../components/report/ReportActions';
import ShareCardButton from '../components/report/ShareCardButton';
import ZiweiChart from '../components/report/ZiweiChart';
import { buildSystemMatrix, generateFusionReading, generateSystemConclusions, generateTimelineReading } from '../engines/fusion-engine';
import { computeFateSnapshot } from '../engines/fate-snapshot-engine';
import { buildUnifiedElementProfile } from '../engines/integration-engine';
import { buildReportOpener } from '../engines/report-opener-engine';
import { leadSentences } from '../utils/lead-sentence';
import SystemMatrixRadar from '../components/report/SystemMatrixRadar';
import { useFateStore } from '../store/useFateStore';
import { ELEMENT_LABELS } from '../utils/constants';
import { preferredScrollBehavior } from '../utils/scroll';
import type { ZiweiCalculationSettings } from '../types/fate';

const REPORT_TABS = [
  ['overview', '總覽'],
  ['fusion', '融合洞察'],
  ['bazi', '八字'],
  ['ziwei', '紫微斗數'],
  ['western', '西洋星盤'],
  ['numerology', '生命靈數'],
  ['name', '姓名學'],
] as const;

type ReportTab = (typeof REPORT_TABS)[number][0];

const REPORT_ARTWORK: Record<ReportTab, SystemArtworkKind> = {
  overview: 'fusion',
  fusion: 'fusion',
  bazi: 'bazi',
  ziwei: 'ziwei',
  western: 'western',
  numerology: 'numerology',
  name: 'name',
};

/** 全站固定頁首高度，對應分頁列的 `sticky top-16`（4rem）。 */
const APP_HEADER_HEIGHT = 64;

function toDateInputValue(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const [year, month, day] = value.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export default function ReportPage() {
  const report = useFateStore((state) => state.report);
  const input = useFateStore((state) => state.reportInput);
  const profile = useFateStore((state) => state.profileInput);
  const setReportData = useFateStore((state) => state.setReportData);
  const palmElement = useFateStore((state) => state.palmElement);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<ReportTab>(() => {
    const requested = searchParams.get('tab');
    return REPORT_TABS.some(([id]) => id === requested) ? (requested as ReportTab) : 'overview';
  });
  const [ziweiNotice, setZiweiNotice] = useState('');
  const [ziweiTargetDate, setZiweiTargetDate] = useState(() => toDateInputValue(input?.ziwei?.currentHoroscope?.targetDate));
  const [ziweiSettings, setZiweiSettings] = useState<ZiweiCalculationSettings>(() => input?.ziwei?.settings ?? {
    algorithm: 'default', yearDivide: 'normal', horoscopeDivide: 'normal', ageDivide: 'normal', dayDivide: 'current',
  });
  const [ziweiBusy, setZiweiBusy] = useState(false);
  const [ziweiError, setZiweiError] = useState('');
  const tabsAnchorRef = useRef<HTMLDivElement>(null);

  /**
   * 切換分頁時跳到該分頁內容的最頂端。
   *
   * 錨點刻意放在分頁列「之前」且不套 sticky：分頁列本身是 `sticky top-16`，
   * 一旦捲動超過它，getBoundingClientRect().top 會固定回傳黏住後的 64，
   * 而不是它在文件中的真實位置，導致算出來的目標幾乎等於當前位置、畫面不動。
   */
  const selectTab = (id: ReportTab) => {
    setTab(id);
    const anchor = tabsAnchorRef.current;
    if (!anchor || typeof window === 'undefined') return;
    // 等 React 換完內容再量測，避免用到舊版面的高度。
    window.requestAnimationFrame(() => {
      const top = Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - APP_HEADER_HEIGHT);
      window.scrollTo({ top, left: 0, behavior: preferredScrollBehavior() });
    });
  };

  if (!report || !input) return (
    <section className="page-container page-section text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold"><Waypoints size={34} /></div>
      <p className="eyebrow mt-7">Report</p><h1 className="display-title mt-3">尚未建立報告</h1>
      <p className="mx-auto mt-5 max-w-xl muted">完成命盤輸入後，這裡會整合八字、生肖、星座、生命靈數與姓名觀點。</p>
      <Link className="btn-primary mt-8" to="/profile">前往探索命盤</Link>
    </section>
  );

  const updateZiweiTarget = async () => {
    if (!profile || !input.ziwei || ziweiBusy) return;
    setZiweiBusy(true); setZiweiError('');
    try {
      const { calculateZiwei } = await import('../engines/ziwei-engine');
      const ziwei = calculateZiwei(profile, ziweiTargetDate, ziweiSettings);
      if (!ziwei) throw new Error('目前排盤資料未包含可用的命理排盤性別。');
      const nextInput = { ...input, ziwei };
      setReportData(nextInput, generateFallbackReport(nextInput));
      setZiweiNotice('紫微運限已依新日期重算。');
    } catch (reason) {
      setZiweiError(reason instanceof Error ? reason.message : '紫微運限日期更新失敗。');
    } finally {
      setZiweiBusy(false);
    }
  };

  const fusion = generateFusionReading(input, { palmElement });
  const unifiedProfile = buildUnifiedElementProfile(input, { palmElement });
  const systemMatrix = buildSystemMatrix(input, { palmElement });
  const conclusions = generateSystemConclusions(input);
  // 首屏那兩句話。上限與內容規則見 report-opener-engine.ts。
  const opener = buildReportOpener(input);
  const timeline = generateTimelineReading(input);
  const snapshot = computeFateSnapshot(fusion, systemMatrix);


  const availableTabs = REPORT_TABS.filter(([id]) => {
    if (id === 'ziwei') return Boolean(input.ziwei);
    if (id === 'name') return Boolean(input.nameAnalysis);
    return true;
  });
  const statCards = [
    { label: '日主', value: `${input.bazi.dayMaster}${ELEMENT_LABELS[input.bazi.dayMasterElement]}`, tone: 'text-gold' },
    { label: '生肖', value: `屬${input.zodiac.animal}`, tone: 'text-violet-400' },
    { label: '太陽星座', value: input.astrology.sunSign, tone: 'text-teal-300' },
    { label: '生命靈數', value: `${input.numerology.lifePathNumber}`, tone: 'text-rose-400' },
  ];

  return (
    <section className="page-container page-section report-print">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="fv-seal mt-1 hidden shrink-0 px-2.5 py-3 text-base sm:inline-flex vtext" aria-hidden="true">命書</span>
          <div><p className="eyebrow">萬象報告</p><h1 className="display-title mt-3">{profile?.name ? `${profile.name}的萬象命書` : '你的萬象命書'}</h1><p className="mt-3 text-sm text-mist">在你的裝置上產生{profile ? ` · ${profile.birthDate} ${profile.birthTime} 出生 · ${profile.region}` : ''}</p></div>
        </div>
        {/* 複製／分享／列印是工具，不是內容。手機直式縮成圖示排成一列，
            才不會擠成兩排把首屏的結論推出螢幕（見 ReportActions）。 */}
        <ReportActions summary={report.summary} profile={profile} />
      </header>

      <div ref={tabsAnchorRef} data-testid="tab-scroll-anchor" aria-hidden="true" />
      <nav className="sticky top-16 z-30 -mx-4 mt-7 overflow-x-auto border-y border-white/10 bg-ink/90 px-4 backdrop-blur-xl print:hidden sm:mx-0 sm:rounded-2xl sm:border" aria-label="報告分頁">
        <div className="flex min-w-max gap-2 py-2.5">
          {availableTabs.map(([id, label]) => (
            <button
              className={`tab-pill ${tab === id ? 'tab-pill-active' : ''}`}
              type="button"
              aria-pressed={tab === id}
              onClick={() => selectTab(id)}
              key={id}
            >{label}</button>
          ))}
        </div>
      </nav>

      {/* 主視覺約 180px，在手機上剛好把首屏那兩句話推到螢幕外。桌機留著。 */}
      <SystemArtwork className="mt-6 hidden print:hidden sm:block" kind={REPORT_ARTWORK[tab]} priority />

      {tab === 'overview' && <div key="overview" className="reveal">
        {/*
          第一屏只有兩句話，總共不到 80 字（上限由 tests/reading-budget.test.ts 守住）。
          原本這裡是四張數字卡加一段 74 字的核心摘要，數字卡（日主、五行總數……）
          在讀者還不知道自己是什麼樣的人之前，就是四個看不懂的專有名詞。
          完整摘要與那些數字沒有消失，收在下面的摺疊區裡。
        */}
        {/* revelation：這是使用者輸入生日想看到的那一刻，讓兩句話依序降落。 */}
        <article id="summary" data-glow className="revelation relative mt-7 overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-[#182143] via-[#11182f] to-[#0b1020] p-6 shadow-glow sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-gold/10" />
          <p className="revelation-line relative font-serif text-2xl leading-10 text-cream sm:text-3xl sm:leading-[1.5]">{opener.line}</p>
          <p className="revelation-evidence relative mt-5 flex items-start gap-2.5 text-[15px] leading-8 text-gold">
            <Sparkles className="mt-1.5 shrink-0" size={17} />
            <span>{opener.evidence}</span>
          </p>
        </article>

        {/*
          宇宙印記的入口放在結論下面：剛讀完自己那一句的當下，
          最想要的是「把它變成一張圖」。放進實驗室目錄裡沒有人會找到。
        */}
        <Link
          to="/imprint"
          className="group mt-4 flex items-center gap-3 rounded-[20px] border border-gold/25 bg-gold/[0.05] px-5 py-4 transition hover:border-gold/50"
        >
          <Fingerprint className="shrink-0 text-gold" size={20} />
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-base font-semibold text-cream">把這張盤變成一張圖</span>
            <span className="mt-0.5 block text-[13px] leading-6 text-mist">命之圖騰與出生那天的天空，可以分享出去</span>
          </span>
          <ChevronRight className="shrink-0 text-mist transition group-hover:translate-x-0.5 group-hover:text-gold" size={18} />
        </Link>

        <Collapsible className="mt-4" title="完整摘要與盤面數字" hint="日主、五行總數、四柱與那段較長的總結都在這裡">
          <p className="leading-8 text-mist">{report.summary}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statCards.map(({ label, value, tone }) => (
              <div className="rounded-[18px] border border-white/10 bg-white/[0.045] p-[18px]" key={label}>
                <span className="text-[11px] text-mist">{label}</span>
                <div className={`mt-2 font-serif text-[22px] font-semibold ${tone}`}>{value}</div>
              </div>
            ))}
          </div>
        </Collapsible>

        <section className="mt-10">
          {/* 標題已經說了「直接說結論」，卡片下方也就寫著「查看詳細」——
              再加一句「每套系統先給你一句最重要的話；想看完整脈絡，點卡片下方的查看詳細」
              是在跟讀者解釋畫面怎麼用（voice.md R8）。刪掉。 */}
          <p className="eyebrow">At a glance</p><h2 className="section-title mt-2">各大系統直接說結論</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {conclusions.map(({ id, system, headline, conclusion }) => {
              const tone = ({ bazi: 'text-gold', zodiac: 'text-emerald-300', ziwei: 'text-violet-400', western: 'text-teal-300', numerology: 'text-rose-400', tarot: 'text-fuchsia-300', name: 'text-amber-200' } as Record<string, string>)[id] ?? 'text-gold';
              const detailTab = ({ bazi: 'bazi', ziwei: 'ziwei', western: 'western', numerology: 'numerology', name: 'name' } as Record<string, ReportTab>)[id];
              return (
                <article data-glow className="flex flex-col rounded-[20px] border border-white/10 bg-white/[0.045] p-5" key={id}>
                  <span className={`text-[11px] font-bold tracking-[0.12em] ${tone}`}>{system}</span>
                  <h3 className="mt-1.5 font-serif text-lg font-semibold text-cream">{headline}</h3>
                  {/* 這一段的標題寫著「先給你一句最重要的話」，那就真的只給一句。
                      剩下的在「查看詳細」裡，七套系統的完整結論加起來有五百多字。 */}
                  <p className="mt-3 flex-1 text-sm leading-7 text-mist">{leadSentences(conclusion)}</p>
                  <div className="mt-4 border-t border-white/10 pt-3">
                    {id === 'tarot' ? (
                      <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-cream transition hover:text-gold" to="/tarot">查看詳細 <ChevronRight size={15} /></Link>
                    ) : detailTab ? (
                      <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-cream transition hover:text-gold" type="button" onClick={() => selectTab(detailTab)}>查看詳細 <ChevronRight size={15} /></button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <Collapsible className="mt-6" title="過去、現在、未來" hint="用大運與紫微運限把人生分三段，各給一段解讀和一個建議">
          <p className="text-sm leading-6 text-mist">這是文化模型的敘事，不是預言。</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {timeline.map(({ id, title, rangeLabel, reading, advice }, index) => (
              <article className={`flex flex-col rounded-[20px] border p-5 ${id === 'present' ? 'border-gold/40 bg-gold/[0.06]' : 'border-white/10 bg-white/[0.045]'}`} key={id}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-serif text-xl font-semibold ${id === 'present' ? 'text-gold' : 'text-cream'}`}>{title}</h3>
                  <span className="grid size-7 place-items-center rounded-full bg-white/[0.07] text-xs font-semibold text-mist">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <p className="mt-1 text-xs text-mist">{rangeLabel}</p>
                <p className="mt-4 flex-1 text-sm leading-7 text-mist">{reading}</p>
                <div className="mt-4 rounded-xl border border-white/10 bg-ink/40 p-3.5">
                  <span className="text-[11px] font-bold tracking-wider text-gold">給你的建議</span>
                  <p className="mt-1.5 text-sm leading-6 text-cream">{advice}</p>
                </div>
              </article>
            ))}
          </div>
        </Collapsible>

        {/*
          原本這裡有「綜合解讀摘要」，內容是 sharedPatterns 的前三條——
          而下面「多系統共同點」就是同一份資料的完整版。同一頁把同一件事講兩次，
          讀者不會覺得豐富，只會覺得長。留完整版，刪摘要版。
        */}
        <Collapsible className="mt-6" title="五行分布" hint={`四柱共 ${input.fiveElements.total} 個位置的統計圖`}>
          <FiveElementChart result={input.fiveElements} />
          <p className="mt-4 text-xs leading-5 text-mist">僅統計四柱主干支；元素較少不代表必須補足，也不作簡化吉凶斷言。</p>
        </Collapsible>

        <Collapsible className="mt-4" id="patterns" title="共同點與不同視角" hint="哪些系統講到同一件事，哪些各說各話">
          <div className="grid gap-6 md:grid-cols-2"><article className="rounded-3xl border border-emerald-200/15 bg-emerald-300/[0.055] p-5 sm:p-6"><h3 className="font-serif text-xl font-semibold text-cream">多系統共同點</h3><ul className="mt-5 space-y-4">{report.sharedPatterns.map((item) => <li className="flex gap-3 leading-7 text-mist" key={item}><ChevronRight className="mt-1 shrink-0 text-emerald-200" size={17} /><span>{item}</span></li>)}</ul></article><article className="rounded-3xl border border-blue-200/15 bg-blue-300/[0.055] p-5 sm:p-6"><h3 className="font-serif text-xl font-semibold text-cream">不同系統的差異</h3><ul className="mt-5 space-y-4">{report.differences.map((item) => <li className="flex gap-3 leading-7 text-mist" key={item}><ListTree className="mt-1 shrink-0 text-blue-200" size={17} /><span>{item}</span></li>)}</ul></article></div>
        </Collapsible>

        <Collapsible className="mt-4" id="focus" title="關注主題與行動建議" hint="依你選的關注領域，各給一段分析和幾個做法">
          <div className="grid gap-5 md:grid-cols-2">{report.focusAnalysis.map((focus, index) => <article key={`${focus.topic}-${index}`} className="glass-card overflow-hidden"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><span className="font-serif text-lg font-semibold text-cream">{focus.topic}</span><span className="grid size-7 place-items-center rounded-full bg-gold/10 text-xs font-semibold text-gold">{String(index + 1).padStart(2, '0')}</span></div><div className="p-5"><p className="leading-7 text-mist">{focus.analysis}</p><ul className="mt-5 space-y-3 text-sm text-cream">{focus.suggestions.map((suggestion) => <li className="flex gap-2.5" key={suggestion}><ShieldCheck className="mt-0.5 shrink-0 text-gold" size={16} /><span>{suggestion}</span></li>)}</ul></div></article>)}</div>
        </Collapsible>
      </div>}

      {tab === 'fusion' && <div key="fusion" className="reveal mt-7">
        <FateSnapshotCard snapshot={snapshot} />
        <div className="mt-5"><RareFeaturesCard input={input} /></div>
        <div className="mt-5">
          <ShareCardButton data={{
            percentages: unifiedProfile.percentages,
            headline: snapshot.consensusLine,
            labels: [
              `日主 ${input.bazi.dayMaster}${ELEMENT_LABELS[input.bazi.dayMasterElement]}`,
              `太陽 ${input.astrology.sunSign}`,
              `生肖 ${input.zodiac.animal}`,
              `靈數 ${input.numerology.lifePathNumber}`,
            ],
          }} />
        </div>
        <div className="mb-6 mt-14"><p className="eyebrow">Unified profile</p><h2 className="section-title mt-2">全面整合：所有系統的加權剖面</h2><p className="mt-2 text-sm leading-6 text-mist">把每套系統換算到同一套五行座標後加權平均，得到一張最完整的整體剖面；下方再逐一比對共識與差異。</p></div>
        <UnifiedIntegrationPanel profile={unifiedProfile} />
        <div className="mt-6"><SystemMatrixRadar matrix={systemMatrix} /></div>
        <div className="mb-6 mt-14"><p className="eyebrow">Fusion reading</p><h2 className="section-title mt-2">融合解讀：所有系統一起說</h2><p className="mt-2 text-sm leading-6 text-mist">把每套系統的結果翻譯成同一種語言後交叉比對，全程用白話說明哪裡有共識、哪裡各說各話。</p></div>
        <FusionInsights reading={fusion} />
      </div>}

      {tab === 'bazi' && <div key="bazi" className="reveal mt-7">
        <div className="mb-6"><p className="eyebrow">Eastern foundation</p><h2 className="section-title mt-2">八字與五行結構</h2><p className="mt-2 text-sm leading-6 text-mist">依你的出生時間換算農曆與節氣排出四柱；五行圖只統計八個主要元素，看趨勢就好，不用當成吉凶判決。</p></div>
        <article className="glass-card p-5 sm:p-7"><BaziPillars result={input.bazi} /><BaziTenGodInsights result={input.bazi} /></article>
        {input.bazi.luckCycles && input.bazi.luckCycles.length > 0 && (
          <article className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.045] p-6">
            <h3 className="font-serif text-lg font-semibold text-cream">大運</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {input.bazi.luckCycles.map((cycle) => (
                <div className="rounded-[14px] border border-white/[0.08] bg-ink/40 p-3.5 text-center" key={`${cycle.ganZhi}-${cycle.startYear}`}>
                  <div className="text-[11px] text-mist">{cycle.startAge}-{cycle.endAge} 歲</div>
                  <div className="mt-2 font-serif text-lg text-cream">{cycle.ganZhi}</div>
                  <div className="mt-1 text-[11px] text-mist">{cycle.startYear}–{cycle.endYear}</div>
                </div>
              ))}
            </div>
          </article>
        )}
        <BaziRelations result={input.bazi} />
        <BaziStrengthPanel result={input.bazi} />
      </div>}

      {tab === 'ziwei' && input.ziwei && <div key="ziwei" className="reveal mt-7">
        <div className="mb-6"><p className="eyebrow">Twelve palaces</p><h2 className="section-title mt-2">紫微斗數十二宮</h2><p className="mt-2 text-sm leading-6 text-mist">呈現你的命身主、五行局、十二宮、主輔星、亮度、四化與大限範圍；也可以切換不同流派的排法，比較差異。</p></div>
        <div className="mb-4 rounded-2xl border border-violet-400/20 bg-violet-400/[0.055] p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label><span className="label">安星版本</span><select className="input-field" value={ziweiSettings.algorithm} onChange={(event) => setZiweiSettings((current) => ({ ...current, algorithm: event.target.value as ZiweiCalculationSettings['algorithm'] }))}><option value="default">通行版本</option><option value="zhongzhou">中州派版本</option></select></label><label><span className="label">本命年分界</span><select className="input-field" value={ziweiSettings.yearDivide} onChange={(event) => setZiweiSettings((current) => ({ ...current, yearDivide: event.target.value as ZiweiCalculationSettings['yearDivide'] }))}><option value="normal">農曆正月初一</option><option value="exact">立春</option></select></label><label><span className="label">晚子時歸日</span><select className="input-field" value={ziweiSettings.dayDivide} onChange={(event) => setZiweiSettings((current) => ({ ...current, dayDivide: event.target.value as ZiweiCalculationSettings['dayDivide'] }))}><option value="current">歸當日</option><option value="forward">歸次日</option></select></label><label><span className="label">運限目標日期</span><input className="input-field" type="date" min="1900-01-01" max="2100-12-31" value={ziweiTargetDate} onChange={(event) => setZiweiTargetDate(event.target.value)} /></label></div><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-mist">修改設定後需重新排盤；流派設定是演算法比較入口，不代表某一版本較準。</p><button className="btn-secondary shrink-0" type="button" disabled={ziweiBusy || !ziweiTargetDate} onClick={() => void updateZiweiTarget()}>{ziweiBusy ? '正在重算…' : '套用設定並更新運限'}</button></div></div>
        {ziweiError && <div className="mb-4 rounded-xl border border-rose-200/20 bg-rose-200/[0.08] p-3 text-sm text-rose-100" role="alert">{ziweiError}</div>}
        {ziweiNotice && <div className="mb-4 rounded-xl border border-emerald-200/20 bg-emerald-200/[0.08] p-3 text-sm text-emerald-100" role="status">{ziweiNotice}</div>}
        <article className="glass-card overflow-hidden p-3 sm:p-6"><ZiweiChart result={input.ziwei} /><ZiweiKeyPalaceInsights result={input.ziwei} /></article>
      </div>}

      {tab === 'name' && input.nameAnalysis && <div key="name" className="reveal mt-7">
        <div className="mb-6"><p className="eyebrow">Name analysis</p><h2 className="section-title mt-2">姓名學</h2><p className="mt-2 text-sm leading-6 text-mist">以字義、簡化五行對照與五格剖象呈現；筆畫優先採精選字庫，其餘由 Unicode Unihan 資料庫補齊，皆可手動修正。</p></div>
        <article className="rounded-[20px] border border-white/10 bg-white/[0.045] p-6">
          <h3 className="font-serif text-lg font-semibold text-cream">姓名分析</h3>
          <p className="mt-3 leading-7 text-mist">{report.sections.name}</p>
          <div className="mt-4 space-y-2">{input.nameAnalysis.characters.map((item, index) => <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm" key={`${item.character}-${index}`}><span className="font-serif text-lg text-cream">{item.character}{item.meaning ? <span className="ml-2 text-xs text-mist">{item.meaning}</span> : null}</span><span className="text-right text-mist">{item.strokes ? `${item.strokes} 畫 · ` : ''}{({ formal: '正式資料', insufficient: '資料不足', modern: '現代筆畫', manual: '手動輸入' } as const)[item.strokeSource]}</span></div>)}</div>
          {input.nameAnalysis.fiveGrid && (
            <div className="mt-5 rounded-2xl border border-amber-200/20 bg-amber-200/[0.05] p-4">
              <h4 className="text-sm font-semibold text-amber-100">五格剖象</h4>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                {input.nameAnalysis.fiveGrid.grids.map((grid) => (
                  <div className="rounded-xl border border-white/10 bg-ink/40 p-3 text-center" key={grid.name}>
                    <span className="text-[11px] text-mist">{grid.name}</span>
                    <div className="mt-1 font-serif text-xl font-semibold text-cream">{grid.value}</div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${grid.category === '吉' ? 'bg-emerald-300/10 text-emerald-200' : grid.category === '半吉' ? 'bg-amber-200/10 text-amber-200' : 'bg-rose-300/10 text-rose-200'}`}>{grid.category} · {ELEMENT_LABELS[grid.element]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-mist">{input.nameAnalysis.fiveGrid.sanCai.relation}</p>
              <p className="mt-2 text-xs leading-5 text-mist">{input.nameAnalysis.fiveGrid.basis}</p>
            </div>
          )}
          <p className="mt-3 text-xs leading-5 text-mist">{input.nameAnalysis.strokeNotice}</p>
        </article>
      </div>}

      {tab === 'western' && <div key="western" className="reveal mt-7">
        <div className="mb-6"><p className="eyebrow">Astronomical positions</p><h2 className="section-title mt-2">西洋出生星盤</h2><p className="mt-2 text-sm leading-6 text-mist">依你的出生時間與地點，計算行星的實際天文位置、月亮星座、逆行與主要相位。{input.astrology.risingSign ? `已依出生地座標算出上升 ${input.astrology.risingSign}，並比較兩種宮位制的差異。` : '沒有提供出生地座標，所以上升與十二宮不用猜的補上。'}</p></div>
        <article className="glass-card p-4 sm:p-7"><NatalChart result={input.astrology} /><AstrologyStructurePanel result={input.astrology} /><HouseSystemComparison result={input.astrology} /><AstrologyPositionInsights result={input.astrology} /></article>
        {input.astrology.planets && input.astrology.planets.length > 0 && (
          <article className="mt-5 overflow-x-auto rounded-[20px] border border-white/10 bg-white/[0.045] p-6">
            <h3 className="font-serif text-lg font-semibold text-cream">十大行星</h3>
            <div className="mt-4 grid min-w-[480px] grid-cols-[1fr_1fr_1fr_0.7fr] gap-x-3 text-[13.5px]">
              <div className="text-[11px] font-semibold text-mist">星體</div>
              <div className="text-[11px] font-semibold text-mist">星座</div>
              <div className="text-[11px] font-semibold text-mist">度數</div>
              <div className="text-[11px] font-semibold text-mist">逆行</div>
              {input.astrology.planets.map((planet) => {
                const degrees = Math.floor(planet.degreeInSign);
                const minutes = String(Math.round((planet.degreeInSign - degrees) * 60)).padStart(2, '0');
                return (
                  <div className="contents" key={planet.name}>
                    <div className="border-t border-white/[0.07] py-2.5 text-cream">{planet.name}</div>
                    <div className="border-t border-white/[0.07] py-2.5 text-teal-300">{planet.sign}</div>
                    <div className="border-t border-white/[0.07] py-2.5 text-mist">{degrees}°{minutes}′</div>
                    <div className="border-t border-white/[0.07] py-2.5 text-mist">{planet.retrograde ? '逆行' : '順行'}</div>
                  </div>
                );
              })}
            </div>
          </article>
        )}
      </div>}

      {tab === 'numerology' && <div key="numerology" className="reveal mt-7">
        <div className="mb-6"><p className="eyebrow">Life path number</p><h2 className="section-title mt-2">生命靈數</h2><p className="mt-2 text-sm leading-6 text-mist">以出生日期所有數字相加歸納；11、22、33 為大師數，保留不再相加。</p></div>
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-[20px] border border-rose-400/25 bg-rose-400/[0.06] p-7 text-center">
            <span className="font-display text-sm italic tracking-wider text-rose-400">生命靈數</span>
            <div className="my-2 font-display text-[88px] font-medium italic leading-none text-rose-400">{input.numerology.lifePathNumber}</div>
            <p className="text-sm text-mist">{input.numerology.title}{input.numerology.isMasterNumber ? ' · 大師數，保留不再相加' : ''}</p>
          </article>
          <article className="rounded-[20px] border border-white/10 bg-white/[0.045] p-6">
            <h3 className="font-serif text-lg font-semibold text-cream">計算過程</h3>
            <div className="mt-4 space-y-2.5">
              <div className="rounded-xl border border-white/[0.08] bg-ink/40 px-3.5 py-3 font-mono text-sm text-cream">{input.numerology.birthDateDigits.join(' + ')} = {input.numerology.calculationSteps[0]}</div>
              {input.numerology.calculationSteps.slice(1).map((step, index) => (
                <div className="rounded-xl border border-white/[0.08] bg-ink/40 px-3.5 py-3 font-mono text-sm text-cream" key={`${step}-${index}`}>→ {step}{index === input.numerology.calculationSteps.length - 2 && input.numerology.isMasterNumber ? '（大師數，保留不再相加）' : ''}</div>
              ))}
            </div>
            <p className="mt-4 leading-7 text-mist">{input.numerology.description} 可發揮{input.numerology.strengths.join('、')}，並練習{input.numerology.challenges.join('、')}。</p>
          </article>
        </div>
      </div>}

      {/* 原本這裡有「閱讀時請保留的界線」，逐條列 report.cautions——
          而下面的 <Disclaimer /> 講的是同一件事，連用詞都幾乎一樣
          （「僅供文化探索、娛樂與自我反思」兩邊都有）。免責要講清楚，但不用講兩次。 */}
      <div className="mt-7"><Disclaimer health /></div>
      <div className="mt-7 flex flex-wrap gap-3 print:hidden"><Link className="btn-secondary" to="/profile"><RefreshCw size={17} />重新建立</Link></div>
    </section>
  );
}
