import {
  BrainCircuit, ChevronRight, CircleUserRound, Compass, Hash, ListTree,
  Orbit, RefreshCw, ShieldCheck, Sparkles, Square, Waypoints,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { generateFallbackReport } from '../ai/fallback-report';
import FiveElementChart from '../components/charts/FiveElementChart';
import Disclaimer from '../components/common/Disclaimer';
import BaziPillars from '../components/report/BaziPillars';
import BaziRelations from '../components/report/BaziRelations';
import { AstrologyPositionInsights, BaziTenGodInsights, ZiweiKeyPalaceInsights } from '../components/report/CulturalInsights';
import NatalChart from '../components/report/NatalChart';
import HouseSystemComparison from '../components/report/HouseSystemComparison';
import ReportActions from '../components/report/ReportActions';
import ZiweiChart from '../components/report/ZiweiChart';
import { useFateStore } from '../store/useFateStore';
import { ELEMENT_LABELS } from '../utils/constants';
import type { ZiweiCalculationSettings } from '../types/fate';

function toDateInputValue(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const [year, month, day] = value.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export default function ReportPage() {
  const report = useFateStore((state) => state.report);
  const input = useFateStore((state) => state.reportInput);
  const profile = useFateStore((state) => state.profileInput);
  const model = useFateStore((state) => state.model);
  const setReport = useFateStore((state) => state.setReport);
  const setReportData = useFateStore((state) => state.setReportData);
  const setModel = useFateStore((state) => state.setModel);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiNotice, setAiNotice] = useState('');
  const [aiStatus, setAiStatus] = useState('');
  const [aiElapsed, setAiElapsed] = useState(0);
  const [ziweiTargetDate, setZiweiTargetDate] = useState(() => toDateInputValue(input?.ziwei?.currentHoroscope?.targetDate));
  const [ziweiSettings, setZiweiSettings] = useState<ZiweiCalculationSettings>(() => input?.ziwei?.settings ?? {
    algorithm: 'default', yearDivide: 'normal', horoscopeDivide: 'normal', ageDivide: 'normal', dayDivide: 'current',
  });
  const [ziweiBusy, setZiweiBusy] = useState(false);
  const [ziweiError, setZiweiError] = useState('');

  if (!report || !input) return (
    <section className="page-container page-section text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold"><Waypoints size={34} /></div>
      <p className="eyebrow mt-7">Report</p><h1 className="display-title mt-3">尚未建立報告</h1>
      <p className="mx-auto mt-5 max-w-xl muted">完成命盤輸入後，這裡會整合八字、生肖、星座、生命靈數與姓名觀點。</p>
      <Link className="btn-primary mt-8" to="/profile">前往探索命盤</Link>
    </section>
  );

  const generateWithAi = async () => {
    if (aiBusy || model.status !== 'ready') return;
    setAiBusy(true); setAiError(''); setAiNotice(''); setAiStatus('正在準備本地 AI…'); setAiElapsed(0);
    const startedAt = Date.now();
    const elapsedTimer = window.setInterval(() => setAiElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    try {
      const { generateAiReport } = await import('../ai/webllm');
      const nextReport = await generateAiReport(input, (progress) => setAiStatus(progress.message));
      setReport(nextReport);
      setAiNotice('本地 AI 已成功產生新摘要與行動建議，完整計算資料仍維持原值。');
      window.setTimeout(() => document.getElementById('ai-insight')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (reason) {
      setReport(generateFallbackReport(input));
      const { isModelReady } = await import('../ai/webllm');
      if (!isModelReady()) setModel({ status: 'idle', progress: 0, message: '模型 Worker 已重設，請回設定重新啟用。' });
      setAiError(reason instanceof Error ? reason.message : '本地 AI 報告產生失敗，已切回模板報告。');
    } finally {
      window.clearInterval(elapsedTimer);
      setAiBusy(false);
    }
  };

  const cancelAi = async () => {
    const { cancelAiGeneration } = await import('../ai/webllm');
    setAiStatus('正在停止生成…');
    await cancelAiGeneration();
  };

  const updateZiweiTarget = async () => {
    if (!profile || !input.ziwei || ziweiBusy) return;
    setZiweiBusy(true); setZiweiError('');
    try {
      const { calculateZiwei } = await import('../engines/ziwei-engine');
      const ziwei = calculateZiwei(profile, ziweiTargetDate, ziweiSettings);
      if (!ziwei) throw new Error('目前排盤資料未包含可用的命理排盤性別。');
      const nextInput = { ...input, ziwei };
      setReportData(nextInput, generateFallbackReport(nextInput));
      setAiError('');
      setAiNotice('紫微運限已依新日期重算；原 AI 文字已清除，避免和新盤面混用。');
    } catch (reason) {
      setZiweiError(reason instanceof Error ? reason.message : '紫微運限日期更新失敗。');
    } finally {
      setZiweiBusy(false);
    }
  };

  const systems = [
    {
      id: 'system-bazi', icon: Orbit, title: '八字觀點', caption: `日主 ${input.bazi.dayMaster} · ${ELEMENT_LABELS[input.bazi.dayMasterElement]}`,
      text: report.sections.bazi,
      strengths: [`${ELEMENT_LABELS[input.bazi.dayMasterElement]}日主`, `${ELEMENT_LABELS[input.fiveElements.strongest[0]]}相對突出`],
      blindSpots: [`${ELEMENT_LABELS[input.fiveElements.weakest[0]]}比例較少`, '不以單一元素判吉凶'],
    },
    {
      id: 'system-zodiac', icon: CircleUserRound, title: '生肖觀點', caption: `${input.zodiac.animal} · ${input.zodiac.branch}支 · ${input.zodiac.symbol}`,
      text: report.sections.zodiac, strengths: input.zodiac.positiveTraits, blindSpots: input.zodiac.blindSpots,
    },
    {
      id: 'system-astrology', icon: Compass, title: '星座觀點', caption: `${input.astrology.sunSign} · ${input.astrology.element}元素 · ${input.astrology.modality}模式`,
      text: report.sections.astrology, strengths: input.astrology.strengths, blindSpots: input.astrology.blindSpots,
    },
    ...(report.sections.ziwei && input.ziwei ? [{
      id: 'system-ziwei', icon: Waypoints, title: '紫微斗數觀點', caption: `${input.ziwei.fiveElementsClass} · 命主 ${input.ziwei.soul} · 身主 ${input.ziwei.body}`,
      text: report.sections.ziwei,
      strengths: input.ziwei.palaces.find((palace) => palace.name === '命宮')?.majorStars.map((star) => star.name) ?? ['命宮需借對宮主星'],
      blindSpots: ['不同流派設定可能不同', '不以單星直接斷吉凶'],
    }] : []),
    {
      id: 'system-numerology', icon: Hash, title: '生命靈數觀點', caption: `${input.numerology.lifePathNumber} · ${input.numerology.title}`,
      text: report.sections.numerology, strengths: input.numerology.strengths, blindSpots: input.numerology.challenges,
    },
    ...(report.sections.name && input.nameAnalysis ? [{
      id: 'system-name', icon: Sparkles, title: '姓名觀點', caption: `${input.nameAnalysis.characterCount} 字 · 五格 Beta`,
      text: report.sections.name,
      strengths: input.nameAnalysis.characters.flatMap((item) => item.meaning ? [item.meaning] : []).slice(0, 3),
      blindSpots: input.nameAnalysis.characters.some((item) => item.strokeSource === 'insufficient') ? ['部分字典資料不足', '未使用正式康熙筆畫'] : ['僅作簡化五行對照'],
    }] : []),
  ];
  const sectionLinks = [
    ['summary', '總覽'], ...(report.aiEnhancement ? [['ai-insight', '本地 AI 原文']] : []), ['bazi', '八字五行'], ['astrology', '西洋星盤'],
    ...(input.ziwei ? [['ziwei', '紫微十二宮']] : []),
    ['systems', '多系統觀點'], ['patterns', '共同與差異'], ['focus', '行動建議'], ['raw', '原始資料'],
  ];

  return (
    <section className="page-container page-section report-print">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Your FateVerse report</p><h1 className="display-title mt-3">{profile?.name ? `${profile.name}的萬象命書` : '你的萬象命書'}</h1><p className="mt-3 text-sm text-mist">建立於目前瀏覽器 · {report.mode === 'ai' ? '本地 AI 整理' : '可預測規則模板'}</p></div>
        <ReportActions summary={report.summary} />
      </header>

      <nav className="sticky top-16 z-30 -mx-4 mt-7 overflow-x-auto border-y border-white/10 bg-ink/90 px-4 backdrop-blur-xl print:hidden sm:mx-0 sm:rounded-2xl sm:border" aria-label="報告章節">
        <div className="flex min-w-max gap-1 py-2">{sectionLinks.map(([id, label]) => <a className="rounded-xl px-3.5 py-2 text-sm text-mist transition hover:bg-white/10 hover:text-cream" href={`#${id}`} key={id}>{label}</a>)}</div>
      </nav>

      <article id="summary" className="relative mt-8 scroll-mt-36 overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-[#182143] via-[#11182f] to-[#0b1020] p-6 shadow-glow sm:p-9">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-gold/10" />
        <div className="pointer-events-none absolute -right-8 -top-10 size-44 rounded-full border border-dashed border-gold/20" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><div className="mb-5 flex items-center gap-3 text-gold"><Sparkles /><span className="eyebrow">核心摘要</span></div><p className="max-w-4xl font-serif text-xl leading-9 text-cream sm:text-2xl sm:leading-10">{report.summary}</p></div>
          <div className="mx-auto grid size-40 shrink-0 place-items-center rounded-full border border-gold/30 bg-gold/[0.08] text-center shadow-[inset_0_0_45px_rgba(216,184,117,0.08)]">
            <div><span className="text-xs tracking-[0.22em] text-mist">日主</span><p className="mt-1 font-serif text-5xl font-semibold text-gold">{input.bazi.dayMaster}</p><span className="text-sm text-cream">{ELEMENT_LABELS[input.bazi.dayMasterElement]}</span></div>
          </div>
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-2 border-t border-white/10 pt-5 sm:grid-cols-4">
          {[['生肖', `${input.zodiac.animal} · ${input.zodiac.branch}`], ['太陽星座', input.astrology.sunSign], ['生命靈數', `${input.numerology.lifePathNumber} · ${input.numerology.title}`], ['相對最強', input.fiveElements.strongest.map((key) => ELEMENT_LABELS[key]).join('、')]].map(([label, value]) => <div className="rounded-2xl bg-white/[0.045] p-3" key={label}><span className="text-[11px] tracking-wider text-mist">{label}</span><p className="mt-1 font-semibold text-cream">{value}</p></div>)}
        </div>
      </article>

      {report.aiEnhancement && <section id="ai-insight" data-testid="ai-enhancement" className="mt-8 scroll-mt-36 overflow-hidden rounded-3xl border border-emerald-200/25 bg-gradient-to-br from-emerald-300/[0.09] to-cyan-300/[0.04] p-5 sm:p-7" aria-labelledby="ai-insight-title"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-200/10 text-emerald-100"><BrainCircuit size={22} /></span><div><p className="eyebrow text-emerald-100">Generated locally</p><h2 id="ai-insight-title" className="mt-1 font-serif text-2xl font-semibold text-cream">本地 AI 生成內容</h2></div></div><span className="rounded-full border border-emerald-200/20 px-3 py-1 text-[11px] text-emerald-100">AI 原文 · 已通過 JSON 驗證</span></div><div className="mt-6 rounded-2xl border border-white/10 bg-ink/35 p-4 sm:p-5"><h3 className="text-xs font-semibold tracking-wider text-emerald-100">AI 摘要</h3><p className="mt-3 font-serif text-lg leading-8 text-cream">{report.aiEnhancement.summary}</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{report.aiEnhancement.suggestions.map((suggestion, index) => <article data-testid="ai-suggestion" className="rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={`${suggestion}-${index}`}><span className="text-[10px] font-semibold tracking-wider text-emerald-100">AI 建議 {index + 1}</span><p className="mt-2 leading-7 text-mist">{suggestion}</p></article>)}</div><p className="mt-4 text-xs leading-5 text-mist">只有此卡文字由 {report.aiEnhancement.modelId} 在目前裝置生成；八字、星盤、紫微、靈數與其他規則報告沒有交給模型重算。生成時間：{new Date(report.aiEnhancement.generatedAt).toLocaleString('zh-TW')}。</p></section>}

      <section id="bazi" className="mt-14 scroll-mt-36">
        <div className="mb-6"><p className="eyebrow">Eastern foundation</p><h2 className="section-title mt-2">八字與五行結構</h2><p className="mt-2 text-sm leading-6 text-mist">排盤資料由 lunar-javascript 計算；五行圖僅統計四柱八個主元素，不等同完整旺衰論命。</p></div>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="glass-card p-5 sm:p-7"><BaziPillars result={input.bazi} /><BaziTenGodInsights result={input.bazi} /></article>
          <article className="glass-card p-5 sm:p-7"><div className="flex items-center justify-between"><h3 className="font-serif text-xl font-semibold">五行分布</h3><span className="text-xs text-mist">共 {input.fiveElements.total} 個位置</span></div><div className="mt-6"><FiveElementChart result={input.fiveElements} /></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><span className="text-xs text-mist">相對最強</span><p className="mt-1 font-semibold text-cream">{input.fiveElements.strongest.map((key) => ELEMENT_LABELS[key]).join('、')}</p></div><div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><span className="text-xs text-mist">相對最弱</span><p className="mt-1 font-semibold text-cream">{input.fiveElements.weakest.map((key) => ELEMENT_LABELS[key]).join('、')}</p></div></div><p className="mt-4 text-xs leading-5 text-mist">元素較少不代表必須直接補足；本區只統計主干支，季節旺衰與藏干權重仍未納入，不作簡化吉凶斷言。</p></article>
        </div>
        <BaziRelations result={input.bazi} />
      </section>

      <section id="astrology" className="mt-14 scroll-mt-36">
        <div className="mb-6"><p className="eyebrow">Astronomical positions</p><h2 className="section-title mt-2">西洋出生星盤</h2><p className="mt-2 text-sm leading-6 text-mist">Astronomy Engine 依出生地標準時間換算 UTC，計算地心黃道位置、月亮星座、逆行與主要相位。{input.astrology.risingSign ? `已依經緯度計算上升 ${input.astrology.risingSign}，並比較等宮制與整宮制。` : '未提供完整經緯度，因此上升與十二宮不補猜。'}</p></div>
        <article className="glass-card p-4 sm:p-7"><NatalChart result={input.astrology} /><HouseSystemComparison result={input.astrology} /><AstrologyPositionInsights result={input.astrology} /></article>
      </section>

      {input.ziwei && <section id="ziwei" className="mt-14 scroll-mt-36">
        <div className="mb-6"><p className="eyebrow">Twelve palaces</p><h2 className="section-title mt-2">紫微斗數十二宮</h2><p className="mt-2 text-sm leading-6 text-mist">以 iztro 2.5.8 產生盤面，呈現命身主、五行局、十二宮、主輔星、亮度、四化與大限範圍；可切換安星版本與時間分界比較差異。</p></div>
        <div className="mb-4 rounded-2xl border border-gold/20 bg-gold/[0.055] p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label><span className="label">安星版本</span><select className="input-field" value={ziweiSettings.algorithm} onChange={(event) => setZiweiSettings((current) => ({ ...current, algorithm: event.target.value as ZiweiCalculationSettings['algorithm'] }))}><option value="default">通行版本</option><option value="zhongzhou">中州派版本</option></select></label><label><span className="label">本命年分界</span><select className="input-field" value={ziweiSettings.yearDivide} onChange={(event) => setZiweiSettings((current) => ({ ...current, yearDivide: event.target.value as ZiweiCalculationSettings['yearDivide'] }))}><option value="normal">農曆正月初一</option><option value="exact">立春</option></select></label><label><span className="label">晚子時歸日</span><select className="input-field" value={ziweiSettings.dayDivide} onChange={(event) => setZiweiSettings((current) => ({ ...current, dayDivide: event.target.value as ZiweiCalculationSettings['dayDivide'] }))}><option value="current">歸當日</option><option value="forward">歸次日</option></select></label><label><span className="label">運限目標日期</span><input className="input-field" type="date" min="1900-01-01" max="2100-12-31" value={ziweiTargetDate} onChange={(event) => setZiweiTargetDate(event.target.value)} /></label></div><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-mist">修改設定後需重新排盤；流派設定是演算法比較入口，不代表某一版本較準。</p><button className="btn-secondary shrink-0" type="button" disabled={ziweiBusy || !ziweiTargetDate} onClick={() => void updateZiweiTarget()}>{ziweiBusy ? '正在重算…' : '套用設定並更新運限'}</button></div></div>
        {ziweiError && <div className="mb-4 rounded-xl border border-rose-200/20 bg-rose-200/[0.08] p-3 text-sm text-rose-100" role="alert">{ziweiError}</div>}
        <article className="glass-card overflow-hidden p-3 sm:p-6"><ZiweiChart result={input.ziwei} /><ZiweiKeyPalaceInsights result={input.ziwei} /></article>
      </section>}

      <section id="systems" className="mt-14 scroll-mt-36">
        <p className="eyebrow">Multiple lenses</p><h2 className="section-title mt-2">各系統如何看你</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">{systems.map(({ id, icon: Icon, title, caption, text, strengths, blindSpots }) => <article className="glass-card p-5 sm:p-6" key={id}><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/10 text-gold"><Icon size={21} /></span><div><h3 className="font-serif text-xl font-semibold text-cream">{title}</h3><p className="mt-1 text-xs text-gold">{caption}</p></div></div><p className="mt-5 leading-7 text-mist">{text}</p><div className="mt-5 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2"><div><span className="text-[11px] font-semibold tracking-wider text-emerald-200">可運用的特質</span><div className="mt-2 flex flex-wrap gap-1.5">{strengths.map((item) => <span className="rounded-full bg-emerald-300/[0.08] px-2.5 py-1 text-xs text-emerald-100" key={item}>{item}</span>)}</div></div><div><span className="text-[11px] font-semibold tracking-wider text-amber-100">可留意的面向</span><div className="mt-2 flex flex-wrap gap-1.5">{blindSpots.map((item) => <span className="rounded-full bg-amber-200/[0.08] px-2.5 py-1 text-xs text-amber-100" key={item}>{item}</span>)}</div></div></div></article>)}</div>
      </section>

      <section id="patterns" className="mt-14 scroll-mt-36">
        <p className="eyebrow">Cross-system reading</p><h2 className="section-title mt-2">共同點與不同視角</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2"><article className="rounded-3xl border border-emerald-200/15 bg-emerald-300/[0.055] p-5 sm:p-6"><h3 className="font-serif text-xl font-semibold text-cream">多系統共同點</h3><ul className="mt-5 space-y-4">{report.sharedPatterns.map((item) => <li className="flex gap-3 leading-7 text-mist" key={item}><ChevronRight className="mt-1 shrink-0 text-emerald-200" size={17} /><span>{item}</span></li>)}</ul></article><article className="rounded-3xl border border-blue-200/15 bg-blue-300/[0.055] p-5 sm:p-6"><h3 className="font-serif text-xl font-semibold text-cream">不同系統的差異</h3><ul className="mt-5 space-y-4">{report.differences.map((item) => <li className="flex gap-3 leading-7 text-mist" key={item}><ListTree className="mt-1 shrink-0 text-blue-200" size={17} /><span>{item}</span></li>)}</ul></article></div>
      </section>

      <section id="focus" className="mt-14 scroll-mt-36">
        <p className="eyebrow">Practical reflection</p><h2 className="section-title mt-2">關注主題與行動建議</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">{report.focusAnalysis.map((focus, index) => <article key={`${focus.topic}-${index}`} className="glass-card overflow-hidden"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><span className="font-serif text-lg font-semibold text-cream">{focus.topic}</span><span className="grid size-7 place-items-center rounded-full bg-gold/10 text-xs font-semibold text-gold">{String(index + 1).padStart(2, '0')}</span></div><div className="p-5"><p className="leading-7 text-mist">{focus.analysis}</p><ul className="mt-5 space-y-3 text-sm text-cream">{focus.suggestions.map((suggestion) => <li className="flex gap-2.5" key={suggestion}><ShieldCheck className="mt-0.5 shrink-0 text-gold" size={16} /><span>{suggestion}</span></li>)}</ul></div></article>)}</div>
      </section>

      <details id="raw" className="glass-card mt-14 scroll-mt-36 p-5 sm:p-6"><summary className="cursor-pointer font-semibold text-cream">展開完整原始計算資料</summary><div className="mt-6 grid gap-7 border-t border-white/10 pt-6 md:grid-cols-2"><div><h3 className="font-semibold text-gold">生命靈數計算</h3><p className="mt-3 text-sm leading-7 text-mist">生日數字：{input.numerology.birthDateDigits.join(' + ')}<br />歸納過程：{input.numerology.calculationSteps.join(' → ')}<br />結果：{input.numerology.lifePathNumber}{input.numerology.isMasterNumber ? '（大師數）' : ''}</p><h3 className="mt-6 font-semibold text-gold">西方占星範圍</h3><p className="mt-3 text-sm leading-7 text-mist">太陽／月亮：{input.astrology.sunSign}／{input.astrology.moonSign ?? '未計算'}<br />行星／相位：{input.astrology.planets?.length ?? 0}／{input.astrology.aspects?.length ?? 0}<br />UTC：{input.astrology.calculatedAtUtc ?? '未換算'}<br />上升與宮位：{input.astrology.risingSign ? `${input.astrology.risingSign}／等宮制` : '未提供經緯度，未計算'}</p>{input.ziwei && <><h3 className="mt-6 font-semibold text-gold">紫微排盤來源</h3><p className="mt-3 text-sm leading-7 text-mist">{input.ziwei.source.sourceName} · {input.ziwei.source.license}<br />{input.ziwei.solarDate} · {input.ziwei.lunarDate} · {input.ziwei.timeRange}</p></>}</div><div><h3 className="font-semibold text-gold">姓名資料來源</h3>{input.nameAnalysis ? <div className="mt-3 space-y-2">{input.nameAnalysis.characters.map((item, index) => <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm" key={`${item.character}-${index}`}><span className="font-serif text-lg text-cream">{item.character}</span><span className="text-right text-mist">{item.strokes ? `${item.strokes} 畫 · ` : ''}{({ formal: '正式資料', insufficient: '資料不足', modern: '現代筆畫', manual: '手動輸入' } as const)[item.strokeSource]}</span></div>)}<p className="pt-2 text-xs leading-5 text-mist">{input.nameAnalysis.strokeNotice}</p></div> : <p className="mt-3 text-sm text-mist">本次未提供姓名分析。</p>}</div></div></details>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-5"><h2 className="text-sm font-semibold text-cream">閱讀時請保留的界線</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-mist">{report.cautions.map((item) => <li className="flex gap-2" key={item}><ShieldCheck className="mt-1 shrink-0 text-gold" size={15} />{item}</li>)}</ul></section>
      <div className="mt-7"><Disclaimer health /></div>
      {aiBusy && <div className="mt-5 rounded-2xl border border-gold/25 bg-gold/[0.07] p-4 print:hidden" role="status" aria-live="polite"><div className="flex items-start gap-3"><BrainCircuit className="mt-0.5 shrink-0 text-gold" size={19} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-cream">{aiStatus}</p><span className="text-xs tabular-nums text-mist">已執行 {aiElapsed} 秒</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/5 animate-pulse rounded-full bg-gold" /></div><p className="mt-2 text-xs leading-5 text-mist">手機只生成短篇摘要並合併完整規則報告；iPhone 最長 60 秒，其他裝置最長 90 秒，逾時會顯示診斷碼並強制重設 Worker。</p></div></div></div>}
      {aiNotice && <div className="mt-5 rounded-xl border border-emerald-200/20 bg-emerald-200/[0.08] p-3 text-sm text-emerald-100" role="status">{aiNotice}</div>}
      {aiError && <div className="mt-5 rounded-xl border border-amber-200/20 bg-amber-200/[0.08] p-3 text-sm text-amber-100" role="alert">{aiError}</div>}
      <div className="mt-7 flex flex-wrap gap-3 print:hidden"><Link className="btn-secondary" to="/profile"><RefreshCw size={17} />重新建立</Link>{model.status === 'ready' ? <><button className="btn-primary" type="button" disabled={aiBusy} onClick={() => void generateWithAi()}><BrainCircuit size={17} />{aiBusy ? '本地 AI 整理中…' : report.mode === 'ai' ? '重新產生 AI 摘要' : '用本地 AI 重新整理'}</button>{aiBusy && <button className="btn-secondary" type="button" onClick={() => void cancelAi()}><Square size={15} />停止生成</button>}</> : <Link className="btn-primary" to="/settings">啟用本地 AI 增強</Link>}</div>
    </section>
  );
}
