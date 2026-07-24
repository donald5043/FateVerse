import { CalendarDays, Check, Copy, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import BackToReportLink from '../components/common/BackToReportLink';
import Disclaimer from '../components/common/Disclaimer';
import type { DailyGuidanceCard } from '../types/fate';
import { dailyIndex } from '../utils/daily-guidance';

export default function DailyPage() {
  const [cards, setCards] = useState<DailyGuidanceCard[]>([]);
  const [card, setCard] = useState<DailyGuidanceCard>();
  const [drawMode, setDrawMode] = useState<'daily' | 'redraw'>('daily');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(new Date()),
    [],
  );

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/daily-guidance.json`)
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<DailyGuidanceCard[]>;
      })
      .then((items) => {
        if (items.length < 30) throw new Error();
        setCards(items);
        setCard(items[dailyIndex(items.length)]);
      })
      .catch(() => setError('今日指引資料載入失敗。若是首次使用離線模式，請連線後重新整理一次。'));
  }, []);

  const redraw = () => {
    if (!cards.length) return;
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    let index = values[0] % cards.length;
    if (cards[index].id === card?.id) index = (index + 1) % cards.length;
    setCard(cards[index]);
    setDrawMode('redraw');
    setCopied(false);
  };

  const resetDaily = () => {
    if (!cards.length) return;
    setCard(cards[dailyIndex(cards.length)]);
    setDrawMode('daily');
    setCopied(false);
  };

  const copyCard = async () => {
    if (!card) return;
    try {
      await navigator.clipboard.writeText(
        `今日指引｜${card.title}\n${card.message}\n\n反思：${card.reflectionQuestion}\n小行動：${card.suggestedAction}\n\n萬象命書 FateVerse｜僅供自我反思`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('瀏覽器無法複製文字，請長按卡片內容手動選取。');
    }
  };

  return (
    <section className="page-container page-section">
      <BackToReportLink />
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow text-violet-400">Daily Reflection</p>
        <h1 className="display-title mt-3">今日指引</h1>
        <p className="mx-auto mt-5 max-w-xl muted">
          每天有一張固定的卡片，也可以自由重抽，給自己一個小小的反思問題。它不是真實預言。
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-mist">
          <CalendarDays size={16} className="text-violet-400" />
          {todayLabel}
        </div>
      </div>
      {error && (
        <div className="notice mx-auto mt-8 max-w-2xl" role="alert">
          {error}
        </div>
      )}
      {card && (
        <article key={card.id} className="card-reveal-glow relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-[2rem] border border-violet-400/[0.28] bg-gradient-to-br from-[#1c1a3d] via-[#11182f] to-[#0b1020] p-1">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-violet-400/10" />
          <div className="pointer-events-none absolute -left-20 -bottom-24 size-64 rounded-full border border-violet-400/10" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] px-6 py-9 text-center sm:px-12 sm:py-12">
            <span className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 select-none font-serif text-[13rem] font-black leading-none text-violet-400/[0.05]" aria-hidden="true">{[...card.keyword][0]}</span>
            <div className="pulse-glow-fast relative mx-auto grid size-14 place-items-center rounded-full border border-violet-400/[0.35] bg-violet-400/10 text-violet-300">
              <Sparkles size={25} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="eyebrow text-violet-300">今日主題 · {card.keyword}</span>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-mist">
                {drawMode === 'daily' ? '日期固定卡' : '自由重抽卡'}
              </span>
            </div>
            <h2 className="mt-4 font-serif text-3xl font-semibold sm:text-5xl">{card.title}</h2>
            <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
            <p className="mx-auto mt-7 max-w-xl font-serif text-xl leading-9 text-cream sm:text-2xl sm:leading-10">
              {card.message}
            </p>
            <div className="mt-9 grid gap-4 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                <span className="text-xs font-semibold tracking-wider text-violet-300">
                  REFLECTION · 反思問題
                </span>
                <p className="mt-3 leading-7 text-mist">{card.reflectionQuestion}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                <span className="text-xs font-semibold tracking-wider text-violet-300">
                  ACTION · 今日小行動
                </span>
                <p className="mt-3 leading-7 text-mist">{card.suggestedAction}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-400 px-5 py-3 font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-violet-300 hover:shadow-[0_12px_30px_rgba(167,139,250,0.4)] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-ink active:scale-[0.98]" type="button" onClick={redraw}>
                <RefreshCw size={17} />
                重新抽取
              </button>
              {drawMode === 'redraw' && (
                <button className="btn-secondary" type="button" onClick={resetDaily}>
                  <RotateCcw size={17} />
                  回到今日固定卡
                </button>
              )}
              <button className="btn-secondary" type="button" onClick={() => void copyCard()}>
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? '已複製' : '複製卡片'}
              </button>
            </div>
          </div>
        </article>
      )}
      <div className="mx-auto mt-8 max-w-3xl">
        <Disclaimer />
      </div>
    </section>
  );
}
