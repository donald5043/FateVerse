import { RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import Disclaimer from '../components/common/Disclaimer';
import type { DailyGuidanceCard } from '../types/fate';

function dailyIndex(length: number): number {
  const date = new Date();
  const key = Number(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`);
  return ((key * 2654435761) >>> 0) % length;
}

export default function DailyPage() {
  const [cards, setCards] = useState<DailyGuidanceCard[]>([]);
  const [card, setCard] = useState<DailyGuidanceCard>();
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/daily-guidance.json`).then((response) => {
      if (!response.ok) throw new Error();
      return response.json() as Promise<DailyGuidanceCard[]>;
    }).then((items) => { if (items.length < 30) throw new Error(); setCards(items); setCard(items[dailyIndex(items.length)]); }).catch(() => setError('今日指引資料載入失敗。若是首次使用離線模式，請連線後重新整理一次。'));
  }, []);

  const redraw = () => {
    if (!cards.length) return;
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    let index = values[0] % cards.length;
    if (cards[index].id === card?.id) index = (index + 1) % cards.length;
    setCard(cards[index]);
  };

  return (
    <section className="page-container page-section">
      <div className="mx-auto max-w-3xl text-center"><p className="eyebrow">Daily Reflection</p><h1 className="display-title mt-3">今日指引</h1><p className="mx-auto mt-5 max-w-xl muted">每天依日期得到一張固定指引卡，也可以重新抽取。它是一個自我反思問題，不是真實預言。</p></div>
      {error && <div className="notice mx-auto mt-8 max-w-2xl" role="alert">{error}</div>}
      {card && <article className="glass-card relative mx-auto mt-10 max-w-2xl overflow-hidden p-7 text-center sm:p-12"><div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" /><Sparkles className="mx-auto text-gold" size={30} /><span className="eyebrow mt-6 block">今日主題 · {card.keyword}</span><h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">{card.title}</h2><p className="mx-auto mt-6 max-w-lg font-serif text-xl leading-9 text-cream">{card.message}</p><div className="mt-8 grid gap-4 text-left sm:grid-cols-2"><div className="rounded-2xl bg-white/5 p-4"><span className="text-xs font-semibold text-gold">反思問題</span><p className="mt-2 leading-7 text-mist">{card.reflectionQuestion}</p></div><div className="rounded-2xl bg-white/5 p-4"><span className="text-xs font-semibold text-gold">今日小行動</span><p className="mt-2 leading-7 text-mist">{card.suggestedAction}</p></div></div><button className="btn-secondary mt-7" type="button" onClick={redraw}><RefreshCw size={17} />重新抽取</button></article>}
      <div className="mx-auto mt-8 max-w-3xl"><Disclaimer /></div>
    </section>
  );
}
