import { ArrowRight, Compass, Eye, Grid2x2, Hand, Layers, Orbit, ScanLine, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Disclaimer from '../components/common/Disclaimer';

const features = [
  { to: '/profile', icon: Compass, accent: '四大命理系統', title: '探索命盤', text: '輸入生日與時辰，一次看八字、紫微、星盤與靈數。', tone: 'text-gold', bg: 'bg-gold/[0.12]', hover: 'hover:border-gold/40' },
  { to: '/report?tab=bazi', icon: Grid2x2, accent: '四柱 · 十神 · 大運', title: '八字命盤', text: '看懂你的天干地支與五行分布。', tone: 'text-gold', bg: 'bg-gold/[0.12]', hover: 'hover:border-gold/40' },
  { to: '/report?tab=western', icon: Orbit, accent: '十大行星 · 星座', title: '西洋星盤', text: '太陽、月亮與行星落在哪個星座。', tone: 'text-teal-300', bg: 'bg-teal-300/[0.12]', hover: 'hover:border-teal-300/40' },
  { to: '/fortune', icon: ScanLine, accent: '拍照 · OCR · 比對', title: '拍籤解籤', text: '拍下籤詩，辨識文字並找出解讀。', tone: 'text-rose-400', bg: 'bg-rose-400/[0.12]', hover: 'hover:border-rose-400/40' },
  { to: '/palm', icon: Hand, accent: '手型 · 掌紋', title: '拍手相', text: '拍下手掌，逐項指認掌紋看解讀。', tone: 'text-teal-300', bg: 'bg-teal-300/[0.12]', hover: 'hover:border-teal-300/40' },
  { to: '/tarot', icon: Layers, accent: '三牌陣 · 生日塔羅', title: '塔羅牌', text: '抽三張牌，看看過去、現在與未來。', tone: 'text-fuchsia-300', bg: 'bg-fuchsia-300/[0.12]', hover: 'hover:border-fuchsia-300/40' },
  { to: '/daily', icon: Sparkles, accent: '每日一問', title: '今日指引', text: '給今天一個小小的反思與行動。', tone: 'text-violet-400', bg: 'bg-violet-400/[0.14]', hover: 'hover:border-violet-400/40' },
  { to: '/mirror', icon: Eye, accent: '拆解算命話術', title: '巴納姆鏡', text: '猜猜哪句是真命盤、哪句是通用話術。', tone: 'text-amber-200', bg: 'bg-amber-200/[0.12]', hover: 'hover:border-amber-200/40' },
] as const;

const orbitChips = [
  { label: '東方', className: 'left-1/2 top-[6%] -translate-x-1/2' },
  { label: '西方', className: 'right-[6%] top-1/2 -translate-y-1/2' },
  { label: '數字', className: 'bottom-[6%] left-1/2 -translate-x-1/2' },
  { label: '籤詩', className: 'left-[6%] top-1/2 -translate-y-1/2' },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="page-container grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal">
          <p className="eyebrow mb-4">一次看懂東西方命理</p>
          <h1 className="display-title max-w-xl">同一個你，換一種文化來看，故事會不一樣</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-mist">從八字、紫微斗數、西洋星盤到生命靈數，把不同文化怎麼解讀「你」放在同一個畫面，用聊天般輕鬆的方式，陪你想一想接下來怎麼走。</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['全程瀏覽器運算', '不用登入', '免費看完整報告'].map((tag) => <span className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-xs text-mist" key={tag}>{tag}</span>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/profile" className="btn-primary transition-transform hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(216,184,117,0.35)]">開始探索命盤 <ArrowRight size={18} /></Link>
            <Link to="/daily" className="btn-secondary transition-transform hover:-translate-y-0.5">抽一張今日指引</Link>
          </div>
        </div>
        <div className="reveal relative mx-auto aspect-square w-full max-w-[400px]" aria-hidden="true">
          <div className="spin-reverse absolute inset-0 rounded-full border border-gold/10" />
          <div className="absolute inset-[6%] rounded-full border border-gold/[0.22]" />
          <div className="spin-slow absolute inset-[18%] rounded-full border border-dashed border-mist/[0.28]" />
          <div className="pulse-glow absolute inset-[32%] grid place-items-center rounded-full border border-gold/40 bg-gold/[0.07] shadow-glow">
            <span className="brand-orbit grid place-items-center text-gold"><Orbit className="size-14" strokeWidth={1.2} /></span>
          </div>
          {orbitChips.map(({ label, className }) => (
            <span className={`absolute grid size-[52px] place-items-center rounded-full border border-white/[0.12] bg-indigo text-sm font-bold text-cream ${className}`} key={label}>{label}</span>
          ))}
        </div>
      </section>

      <section className="page-container pb-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ to, icon: Icon, accent, title, text, tone, bg, hover }, index) => (
            <Link
              key={title}
              to={to}
              className={`reveal flex min-h-[200px] flex-col rounded-[20px] border border-white/10 bg-white/[0.045] p-[22px] transition duration-[250ms] hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(62,74,158,0.22)] ${hover}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className={`mb-[18px] grid size-11 place-items-center rounded-[14px] ${bg} ${tone}`}><Icon size={20} /></span>
              <span className={`text-[11px] font-bold tracking-[0.12em] ${tone}`}>{accent}</span>
              <h3 className="mt-2 font-serif text-[19px] font-semibold text-cream">{title}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-mist">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-container pb-[72px]">
        <div className="grid items-center gap-8 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 sm:p-9 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 font-serif text-[26px] font-bold text-cream">計算歸計算，解讀歸解讀</h2>
            <p className="mt-4 text-[14.5px] leading-8 text-mist">四柱、紫微宮位、行星位置與靈數都是精確算出來的；文字只負責解釋，不會幫你亂猜。</p>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-3">
            {[
              { step: '01', title: '精確計算', text: '八字、紫微、星盤與靈數' },
              { step: '02', title: '結構化資料', text: '來源、數值分層清楚' },
              { step: '03', title: '溫和整理', text: '規則式報告，AI 只是加分' },
            ].map(({ step, title, text }) => (
              <article className="rounded-2xl border border-white/10 bg-[#0e152a]/70 p-[18px]" key={step}>
                <span className="text-[11px] font-bold text-gold/70">{step}</span>
                <h3 className="mt-3.5 font-serif text-base font-semibold text-cream">{title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-mist">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="page-container pb-16"><Disclaimer /></section>
    </>
  );
}
