import { ArrowRight, CloudOff, Coins, Compass, ScanLine, Sparkles, UserRoundX } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandMark from '../components/common/BrandMark';
import Disclaimer from '../components/common/Disclaimer';

const entries = [
  { to: '/fortune', icon: ScanLine, title: '拍籤解籤', text: '拍下籤詩，辨識籤文並查看不同面向的解讀。', accent: '從影像到籤意' },
  { to: '/profile', icon: Compass, title: '探索命盤', text: '輸入生日、出生時間與姓名，整合東西方命理結果。', accent: '一次看懂多種視角' },
  { to: '/daily', icon: Sparkles, title: '今日指引', text: '抽取一張今日指引卡，作為生活中的自我反思。', accent: '給今天一個問題' },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="page-container grid min-h-[72vh] items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="reveal">
          <div className="mb-8"><BrandMark /></div>
          <p className="eyebrow mb-4">一次看懂東西方命理</p>
          <h1 className="display-title max-w-3xl">同一個你，在不同文化中會被如何解讀？</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">從八字、星座、生命靈數到籤詩，以不同文化視角探索性格、方向與人生課題。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/profile" className="btn-primary">開始探索 <ArrowRight size={18} /></Link>
            <Link to="/about" className="btn-secondary">了解方法</Link>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden="true">
          <div className="absolute inset-[8%] rounded-full border border-gold/20" />
          <div className="absolute inset-[20%] animate-[spin_50s_linear_infinite] rounded-full border border-dashed border-mist/25" />
          <div className="absolute inset-[32%] grid place-items-center rounded-full border border-gold/40 bg-gold/[0.06] shadow-glow"><Compass className="size-16 text-gold/80" strokeWidth={1} /></div>
          {['東', '西', '數', '籤'].map((label, index) => <span key={label} className="absolute grid size-12 place-items-center rounded-full border border-white/10 bg-indigo text-sm font-semibold text-cream" style={{ left: `${45 + 37 * Math.cos(index * Math.PI / 2)}%`, top: `${45 + 37 * Math.sin(index * Math.PI / 2)}%` }}>{label}</span>)}
        </div>
      </section>

      <section className="page-container page-section">
        <div className="grid gap-5 lg:grid-cols-3">
          {entries.map(({ to, icon: Icon, title, text, accent }, index) => (
            <Link key={to} to={to} className="glass-card group flex min-h-64 flex-col p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/30" style={{ animationDelay: `${index * 80}ms` }}>
              <span className="mb-8 grid size-12 place-items-center rounded-2xl bg-gold/10 text-gold"><Icon /></span>
              <span className="text-xs font-semibold tracking-widest text-gold">{accent}</span>
              <h2 className="mt-2 font-serif text-2xl font-semibold">{title}</h2>
              <p className="mt-3 flex-1 leading-7 text-mist">{text}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-semibold text-cream">進入探索 <ArrowRight className="transition group-hover:translate-x-1" size={17} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-container page-section">
        <div className="glass-card grid gap-8 p-6 sm:p-8 lg:grid-cols-3">
          {[{ icon: CloudOff, title: '資料留在裝置', text: '生日、姓名與圖片皆在目前瀏覽器處理。' }, { icon: UserRoundX, title: '免註冊', text: '不需帳號，不建立跨裝置的個人檔案。' }, { icon: Coins, title: '免付費', text: '規則式分析完整可用，本地 AI 由你決定是否下載。' }].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-4"><Icon className="mt-1 shrink-0 text-gold" /><div><h3 className="font-semibold text-cream">{title}</h3><p className="mt-1 text-sm leading-6 text-mist">{text}</p></div></div>)}
        </div>
      </section>
      <section className="page-container pb-16"><Disclaimer /></section>
    </>
  );
}
