import { BrainCircuit, ChevronRight, ListTree, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Disclaimer from '../components/common/Disclaimer';
import FiveElementChart from '../components/charts/FiveElementChart';
import { useFateStore } from '../store/useFateStore';
import { ELEMENT_LABELS } from '../utils/constants';
import { generateFallbackReport } from '../ai/fallback-report';

export default function ReportPage() {
  const report = useFateStore((state) => state.report);
  const input = useFateStore((state) => state.reportInput);
  const model = useFateStore((state) => state.model);
  const setReport = useFateStore((state) => state.setReport);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  if (!report) return <section className="page-container page-section text-center"><p className="eyebrow">Report</p><h1 className="display-title mt-3">尚未建立報告</h1><p className="mx-auto mt-5 max-w-xl muted">完成命盤輸入後，這裡會整合八字、生肖、星座、生命靈數與姓名觀點。</p><Link className="btn-primary mt-8" to="/profile">前往探索命盤</Link></section>;
  if (!input) return null;
  const generateWithAi = async () => {
    if (aiBusy || model.status !== 'ready') return;
    setAiBusy(true); setAiError('');
    try { const { generateAiReport } = await import('../ai/webllm'); setReport(await generateAiReport(input)); }
    catch (reason) { setReport(generateFallbackReport(input)); setAiError(reason instanceof Error ? reason.message : '本地 AI 報告產生失敗，已切回模板報告。'); }
    finally { setAiBusy(false); }
  };
  const views = [
    ['八字觀點', report.sections.bazi], ['生肖觀點', report.sections.zodiac], ['星座觀點', report.sections.astrology], ['生命靈數觀點', report.sections.numerology], ...(report.sections.name ? [['姓名觀點', report.sections.name]] : []),
  ];
  return (
    <section className="page-container page-section">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Your FateVerse report</p><h1 className="display-title mt-3">你的萬象報告</h1></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-sm text-gold"><BrainCircuit size={16} />{report.mode === 'ai' ? '本地 AI 解讀' : '規則模板解讀'}</span></div>
      <article className="glass-card mt-9 overflow-hidden p-6 sm:p-9"><div className="mb-5 flex items-center gap-3 text-gold"><Sparkles /><span className="eyebrow">核心摘要</span></div><p className="max-w-4xl font-serif text-xl leading-9 text-cream sm:text-2xl sm:leading-10">{report.summary}</p></article>

      <div className="mt-7 grid gap-7 lg:grid-cols-[0.72fr_1fr]">
        <article className="glass-card p-6"><h2 className="section-title">五行分布</h2><p className="mt-2 text-sm text-mist">僅統計四柱的天干與地支主五行，共八個位置。</p><div className="mt-7"><FiveElementChart result={input.fiveElements} /></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/5 p-3"><span className="text-xs text-mist">相對最強</span><p className="mt-1 font-semibold text-cream">{input.fiveElements.strongest.map((key) => ELEMENT_LABELS[key]).join('、')}</p></div><div className="rounded-xl bg-white/5 p-3"><span className="text-xs text-mist">相對最弱</span><p className="mt-1 font-semibold text-cream">{input.fiveElements.weakest.map((key) => ELEMENT_LABELS[key]).join('、')}</p></div></div><p className="mt-4 text-xs leading-5 text-mist">元素相對較少不代表必須直接補足；完整判讀還涉及季節、藏干與互動，本版不作簡化吉凶斷言。</p></article>
        <div className="space-y-4"><h2 className="section-title">各系統如何看你</h2>{views.map(([title, text]) => <article key={title} className="glass-card p-5"><h3 className="font-serif text-lg font-semibold text-gold">{title}</h3><p className="mt-2 leading-7 text-mist">{text}</p></article>)}</div>
      </div>

      <div className="mt-10 grid gap-7 md:grid-cols-2"><article><h2 className="section-title">多系統共同點</h2><ul className="mt-5 space-y-3">{report.sharedPatterns.map((item) => <li className="glass-card flex gap-3 p-4 text-mist" key={item}><ChevronRight className="mt-1 shrink-0 text-gold" size={17} /><span>{item}</span></li>)}</ul></article><article><h2 className="section-title">不同系統的差異</h2><ul className="mt-5 space-y-3">{report.differences.map((item) => <li className="glass-card flex gap-3 p-4 text-mist" key={item}><ListTree className="mt-1 shrink-0 text-gold" size={17} /><span>{item}</span></li>)}</ul></article></div>

      <div className="mt-10"><h2 className="section-title">關注主題與行動建議</h2><div className="mt-5 grid gap-5 md:grid-cols-2">{report.focusAnalysis.map((focus) => <article key={focus.topic} className="glass-card p-5"><span className="eyebrow">{focus.topic}</span><p className="mt-3 leading-7 text-mist">{focus.analysis}</p><ul className="mt-4 space-y-2 text-sm text-cream">{focus.suggestions.map((suggestion) => <li className="flex gap-2" key={suggestion}><ShieldCheck className="mt-0.5 shrink-0 text-gold" size={16} />{suggestion}</li>)}</ul></article>)}</div></div>

      <details className="glass-card mt-10 p-5"><summary className="cursor-pointer font-semibold text-cream">展開原始計算資料</summary><div className="mt-6 grid gap-6 md:grid-cols-2"><div><h3 className="font-semibold text-gold">四柱</h3><div className="mt-3 grid grid-cols-4 gap-2">{input.bazi.pillars.map((pillar) => <div key={pillar.label} className="rounded-xl bg-white/5 p-3 text-center"><span className="text-xs text-mist">{pillar.label}</span><p className="mt-1 font-serif text-xl">{pillar.value}</p><p className="mt-1 text-xs text-mist">{pillar.naYin} · {pillar.tenGod}</p></div>)}</div><p className="mt-3 text-sm text-mist">農曆：{input.bazi.lunarDate}｜節氣參考：{input.bazi.seasonalNode}｜真太陽時：未套用</p></div><div className="space-y-3 text-sm text-mist"><p><strong className="text-cream">生肖：</strong>{input.zodiac.animal}（{input.zodiac.branch}）</p><p><strong className="text-cream">太陽星座：</strong>{input.astrology.sunSign}；月亮、上升與相位未計算</p><p><strong className="text-cream">生命靈數：</strong>{input.numerology.birthDateDigits.join(' + ')} → {input.numerology.calculationSteps.join(' → ')} = {input.numerology.lifePathNumber}</p><p><strong className="text-cream">姓名筆畫來源：</strong>{input.nameAnalysis?.strokeNotice ?? '未提供姓名分析'}</p></div></div></details>
      <div className="mt-7"><Disclaimer health /></div>
      {aiError && <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100" role="alert">{aiError}</div>}
      <div className="mt-7 flex flex-wrap gap-3"><Link className="btn-secondary" to="/profile"><RefreshCw size={17} />重新建立</Link>{model.status === 'ready' ? <button className="btn-primary" type="button" disabled={aiBusy} onClick={() => void generateWithAi()}><BrainCircuit size={17} />{aiBusy ? '本地 AI 整理中…' : '用本地 AI 重新整理'}</button> : <Link className="btn-primary" to="/settings">啟用本地 AI 增強</Link>}</div>
    </section>
  );
}
