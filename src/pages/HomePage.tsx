import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import DailyFortuneCard from '../components/common/DailyFortuneCard';
import DailyFusionStrip from '../components/common/DailyFusionStrip';
import DailyHoroscopeCard from '../components/common/DailyHoroscopeCard';
import DailyTarotCard from '../components/common/DailyTarotCard';
import Disclaimer from '../components/common/Disclaimer';
import StarChartWheel from '../components/common/StarChartWheel';
import { useFateStore } from '../store/useFateStore';
import { preferredScrollBehavior } from '../utils/scroll';

/**
 * 首頁只回答三個問題，照這個順序：
 *   1. 今天有什麼？（每天回來的理由）
 *   2. 我是誰？（完整命盤，這站的主體）
 *   3. 還有什麼可以玩？（其餘功能收成一列）
 *
 * 之前是五個區塊、十四個入口，照「系統索引／自我覺察／更多玩法」分類——
 * 那是我們的分類法，不是使用者進站想做的事，掃過去只覺得雜。
 */

// 其餘功能收成文字列。每個都給一張大卡的結果，就是每個都不重要。
const moreLinks = [
  { to: '/mirror', title: '巴納姆鏡子', text: '分得出哪句是真的算出來的嗎' },
  { to: '/ritual', title: '決策儀式', text: '卡關時擲一下，看自己的第一反應' },
  { to: '/narrative', title: '人生劇本', text: '把命盤寫成一段第一人稱的故事' },
  { to: '/synastry', title: '兩人合盤', text: '兩張盤並排，看互補與張力' },
  { to: '/timeline', title: '回顧日誌', text: '過去每一年，和當年的流年並排' },
  { to: '/imprint', title: '宇宙印記', text: '你的命之圖騰與出生那天的天空' },
  { to: '/capsule', title: '時間膠囊', text: '寫給未來的自己，到期再回來看' },
  { to: '/palm', title: '拍手相', text: '拍下手掌，分析手型與掌紋' },
  { to: '/fortune', title: '拍籤解籤', text: '拍下籤詩，辨識文字並找出解讀' },
  { to: '/tarot', title: '塔羅三牌陣', text: '過去、現在、未來各抽一張' },
] as const;

const CHART_TABS = [
  { numeral: 'Ⅰ', title: '八字四柱', text: '天干地支與五行分布', to: '/report?tab=bazi' },
  { numeral: 'Ⅱ', title: '紫微斗數', text: '十二宮位與流年四化', to: '/report?tab=ziwei' },
  { numeral: 'Ⅲ', title: '西洋星盤', text: '十大行星、宮位與相位', to: '/report?tab=western' },
  { numeral: 'Ⅳ', title: '生命靈數', text: '生日數字與人生課題', to: '/report?tab=numerology' },
] as const;

const todayLabel = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

/**
 * 捲到「今天」那一段。
 *
 * 不能用 <a href="#today">：這站是 HashRouter，網址本來就是 `/#/`，
 * 再設一次 hash 會把路由整個換成 `today`，比對不到就被導回首頁。
 */
function scrollToToday(): void {
  document.getElementById('today')?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
}

export default function HomePage() {
  const hasChart = useFateStore((state) => Boolean(state.reportInput));

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
      <section className="page-container relative grid items-center gap-10 overflow-hidden py-8 lg:grid-cols-[1.02fr_0.98fr] lg:py-14">
        <div className="hero-art pointer-events-none absolute inset-0 -z-10 opacity-45 [mask-image:linear-gradient(90deg,transparent_0%,black_35%,black_100%)]" aria-hidden="true" />
        <span className="vtext pointer-events-none absolute -left-1 top-1/2 hidden -translate-y-1/2 font-serif text-sm tracking-[0.3em] text-mist/40 xl:block" aria-hidden="true">觀星知命</span>
        <div className="reveal">
          <p className="font-display text-base italic tracking-[0.12em] text-vermilion">A mirror, not a prophecy</p>
          <h1 className="mt-4 font-serif text-[clamp(2.4rem,7vw,4rem)] font-black leading-[1.12] text-cream">
            同一個你<br />
            <span className="shimmer-gold">換一種星象</span><br />
            換一個故事
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-8 text-mist/90">一面鏡子，不是一本預言書。</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={hasChart ? '/report' : '/profile'} className="btn-primary whitespace-nowrap" style={{ flex: 'none' }}>
              {hasChart ? '回到我的命盤' : '開始探索命盤'} <ArrowRight size={18} />
            </Link>
            <button type="button" onClick={scrollToToday} className="btn-secondary whitespace-nowrap" style={{ flex: 'none' }}>先看今天</button>
          </div>
          <div className="mt-6"><DailyFusionStrip /></div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist">
            {['全程瀏覽器運算', '不用登入', '免費看完整報告'].map((tag) => (
              <span className="flex items-center gap-2" key={tag}><span className="text-gold">◦</span>{tag}</span>
            ))}
          </div>
        </div>
        <StarChartWheel />
      </section>

      {/* 一、今天 */}
      <section className="page-container scroll-mt-20 py-6" id="today">
        <div className="flex items-baseline gap-4">
          <div>
            <p className="font-display text-base italic tracking-[0.12em] text-gold">Today</p>
            <h2 className="mt-1.5 font-serif text-2xl font-bold text-cream sm:text-3xl">今天</h2>
          </div>
          <span className="h-px flex-1 hairline border-t" />
        </div>
        <p className="mt-3 max-w-xl text-[15px] leading-8 text-mist">
          東方看日干支，西方看行運，再翻一張牌。三種說法講的是同一天，不一定會同意彼此——不同意的地方最好玩。
        </p>

        <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-3">
          <DailyFortuneCard />
          {hasChart && <DailyHoroscopeCard />}
          <DailyTarotCard />
        </div>
      </section>

      {/* 二、完整命盤 */}
      <section className="page-container py-8">
        <div className="rounded-[26px] border border-gold/25 bg-gradient-to-br from-gold/[0.07] via-white/[0.02] to-transparent p-7 sm:p-9">
          <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="font-display text-base italic tracking-[0.12em] text-vermilion">Your full chart</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-cream sm:text-3xl">
                {hasChart ? '你的完整命盤' : '一次算完，四套系統'}
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-8 text-mist">
                八字、紫微斗數、西洋星盤與生命靈數，各自用不同的語言描述同一個人。
                我們把這些說法並排放著，讓你自己看它們在哪裡對得上、哪裡各說各話。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={hasChart ? '/report' : '/profile'} className="btn-primary whitespace-nowrap" style={{ flex: 'none' }}>
                  {hasChart ? '看完整報告' : '輸入生日開始'} <ArrowRight size={17} />
                </Link>
                {hasChart && <Link to="/profile" className="btn-secondary whitespace-nowrap" style={{ flex: 'none' }}>換一組資料</Link>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              {CHART_TABS.map((item) => (
                <Link key={item.title} to={hasChart ? item.to : '/profile'} className="group border-l border-gold/[0.18] pl-4 transition hover:border-gold/60">
                  <span className="font-display text-xl italic text-gold/70">{item.numeral}</span>
                  <h3 className="mt-0.5 font-serif text-base font-bold text-cream transition group-hover:text-gold">{item.title}</h3>
                  <p className="mt-1 text-[13px] leading-6 text-mist">{item.text}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 三、其他玩法 */}
      <section className="page-container py-8">
        <div className="flex items-baseline gap-4">
          <div>
            <p className="font-display text-base italic tracking-[0.12em] text-gold">More</p>
            <h2 className="mt-1.5 font-serif text-2xl font-bold text-cream sm:text-3xl">其他玩法</h2>
          </div>
          <span className="h-px flex-1 hairline border-t" />
        </div>
        <div className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          {moreLinks.map((item) => (
            <Link key={item.to} to={item.to} className="group flex items-baseline gap-3 border-b border-white/[0.06] py-3 transition hover:border-gold/40">
              <span className="shrink-0 font-serif text-base font-bold text-cream transition group-hover:text-gold">{item.title}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-mist">{item.text}</span>
              <ArrowRight className="shrink-0 text-mist/40 transition group-hover:text-gold" size={14} />
            </Link>
          ))}
        </div>
      </section>

      <section className="page-container pb-16 pt-4"><Disclaimer /></section>
    </>
  );
}
