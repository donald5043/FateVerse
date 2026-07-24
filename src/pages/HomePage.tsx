import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Disclaimer from '../components/common/Disclaimer';
import StarChartWheel from '../components/common/StarChartWheel';

const systemIndex = [
  { to: '/profile', numeral: 'Ⅰ', category: '四大命理系統', title: '探索命盤', text: '輸入生日與時辰，一次看八字、紫微、星盤與靈數。' },
  { to: '/report?tab=bazi', numeral: 'Ⅱ', category: '四柱 · 十神 · 大運', title: '八字命盤', text: '看懂你的天干地支與五行分布。' },
  { to: '/report?tab=western', numeral: 'Ⅲ', category: '十大行星 · 星座', title: '西洋星盤', text: '太陽、月亮與行星落在哪個星座。' },
  { to: '/fortune', numeral: 'Ⅳ', category: '拍照 · OCR · 比對', title: '拍籤解籤', text: '拍下籤詩，辨識文字並找出解讀。' },
  { to: '/tarot', numeral: 'Ⅴ', category: '三牌陣 · 生日塔羅', title: '塔羅牌', text: '抽三張牌，看看過去、現在與未來。' },
] as const;

const playful = [
  { to: '/ritual', watermark: '擲', title: '決策儀式', text: '卡關時擲一下，聽見心裡已有的答案。', tone: 'text-gold' },
  { to: '/imprint', watermark: '印', title: '宇宙印記', text: '一張只屬於你的命之圖騰與出生那天的天空。', tone: 'text-celeste' },
  { to: '/narrative', watermark: '章', title: '人生劇本', text: '把命盤寫成一段你自己的故事，你握著筆。', tone: 'text-gold' },
  { to: '/mirror', watermark: '鏡', title: '巴納姆鏡子', text: '猜猜哪句是真命盤、哪句是通用話術。', tone: 'text-vermilion' },
  { to: '/palm', watermark: '掌', title: '拍手相', text: '拍下手掌，自動分析手型與掌紋。', tone: 'text-celeste' },
  { to: '/capsule', watermark: '封', title: '時間膠囊', text: '寫給未來的自己，到期再回來驗證。', tone: 'text-celeste' },
  { to: '/synastry', watermark: '合', title: '兩人合盤', text: '兩個人的命盤並排，看互補與張力。', tone: 'text-vermilion' },
  { to: '/daily', watermark: '日', title: '今日指引', text: '給今天一個小小的反思與行動。', tone: 'text-violet-400' },
] as const;

const todayLabel = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

export default function HomePage() {
  return (
    <>
      {/* 曆書眉標 */}
      <div className="page-container pt-6">
        <div className="flex items-center gap-4 text-mist">
          <span className="font-display text-sm italic tracking-[0.14em] text-gold">Vol.001 — 東西方命理曆</span>
          <span className="h-px flex-1 hairline border-t" />
          <span className="font-display text-sm italic">{todayLabel}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="page-container relative grid items-center gap-12 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
        <span className="vtext pointer-events-none absolute -left-1 top-1/2 hidden -translate-y-1/2 font-serif text-sm tracking-[0.3em] text-mist/40 xl:block" aria-hidden="true">觀星知命</span>
        <div className="reveal">
          <p className="font-display text-base italic tracking-[0.12em] text-vermilion">Same you, another sky</p>
          <h1 className="mt-4 font-serif text-[clamp(2.4rem,7vw,4rem)] font-black leading-[1.12] text-cream">
            同一個你<br />
            <span className="shimmer-gold">換一種星象</span><br />
            換一個故事
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-mist">從八字、紫微斗數、西洋星盤到生命靈數，把不同文化怎麼解讀「你」放在同一個畫面，用聊天般輕鬆的方式，陪你想一想接下來怎麼走。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/profile" className="btn-primary whitespace-nowrap" style={{ flex: 'none' }}>開始探索命盤 <ArrowRight size={18} /></Link>
            <Link to="/daily" className="btn-secondary whitespace-nowrap" style={{ flex: 'none' }}>抽一張今日指引</Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist">
            {['全程瀏覽器運算', '不用登入', '免費看完整報告'].map((tag) => (
              <span className="flex items-center gap-2" key={tag}><span className="text-gold">◦</span>{tag}</span>
            ))}
          </div>
        </div>
        <StarChartWheel />
      </section>

      {/* 系統索引：羅馬數字無卡片列 */}
      <section className="page-container py-6">
        <div className="grid gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
          {systemIndex.map((item) => (
            <Link key={item.title} to={item.to} className="group border-l border-gold/[0.18] px-5 transition hover:border-gold/60">
              <span className="font-display text-2xl italic text-gold/70">{item.numeral}</span>
              <p className="mt-1 font-display text-xs italic tracking-[0.1em] text-mist">{item.category}</p>
              <h3 className="mt-2 font-serif text-xl font-bold text-cream transition group-hover:text-gold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mist">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works 深色帶：透明底、上下金色髮絲線 */}
      <section className="page-container py-10">
        <div className="border-y border-gold/[0.18] py-10">
          <div className="grid items-start gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="relative">
              <span className="fv-seal vtext absolute right-0 top-0 hidden px-2.5 py-3 text-lg sm:inline-flex">命理</span>
              <p className="font-display text-base italic tracking-[0.12em] text-vermilion">How it works</p>
              <h2 className="mt-3 font-serif text-[26px] font-bold leading-tight text-cream">計算歸計算<br />解讀歸解讀</h2>
              <p className="mt-4 max-w-sm text-[14.5px] leading-8 text-mist">四柱、紫微宮位、行星位置與靈數都是精確算出來的；文字只負責解釋，不會幫你亂猜。</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { step: '01', title: '精確計算', text: '八字、紫微、星盤與靈數' },
                { step: '02', title: '結構化資料', text: '來源、數值分層清楚' },
                { step: '03', title: '溫和整理', text: '規則式報告，AI 只是加分' },
              ].map(({ step, title, text }) => (
                <div className="border-l border-vermilion/40 pl-4" key={step}>
                  <span className="font-display text-3xl italic text-vermilion">{step}</span>
                  <h3 className="mt-2 font-serif text-base font-bold text-cream">{title}</h3>
                  <p className="mt-1.5 text-[13px] leading-6 text-mist">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 更多玩法：大字水印卡 */}
      <section className="page-container py-8">
        <p className="font-display text-base italic tracking-[0.12em] text-gold">More ways to play</p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-cream sm:text-3xl">更多玩法</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playful.map((item) => (
            <Link key={item.title} to={item.to} className="lift relative overflow-hidden rounded-[22px] border border-gold/[0.16] bg-white/[0.03] p-6">
              <span className={`pointer-events-none absolute -right-2 -top-6 select-none font-serif text-[7rem] font-black leading-none opacity-[0.06] ${item.tone}`} aria-hidden="true">{item.watermark}</span>
              <h3 className="relative font-serif text-xl font-bold text-cream">{item.title}</h3>
              <p className="relative mt-2 max-w-[16rem] text-sm leading-6 text-mist">{item.text}</p>
              <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold">開始 <ArrowRight size={15} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-container pb-16 pt-4"><Disclaimer /></section>
    </>
  );
}
