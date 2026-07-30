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
 * 首頁只有三件事，照這個順序：
 *   1. 今天（每天回來的理由）
 *   2. 完整命盤（這站的主體）
 *   3. 兩人合盤（唯一需要第二個人的功能，也是最會被分享出去的）
 *
 * 其餘十個功能收進 /lab。前一版把它們列成十條文字連結，看起來很節制，
 * 但使用者要掃十三個入口才知道該點哪個——那還是一份目錄，不是一個首頁。
 * 收起來不等於砍掉，網址一個都沒動。
 */

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
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={hasChart ? '/report' : '/profile'} className="btn-primary whitespace-nowrap" style={{ flex: 'none' }}>
              {hasChart ? '回到我的命盤' : '開始探索命盤'} <ArrowRight size={18} />
            </Link>
            <button type="button" onClick={scrollToToday} className="btn-secondary whitespace-nowrap" style={{ flex: 'none' }}>先看今天</button>
          </div>
          {/* 沒有命盤時這條只會說「建立命盤之後這裡會有五套系統」，
              和下面「今天」那一段講的是同一件事，重複一次就變成催促。 */}
          {hasChart && <div className="mt-6"><DailyFusionStrip /></div>}
          <p className="mt-5 text-sm text-mist">全程在你的瀏覽器運算，不用登入，報告免費看完。</p>
        </div>
        {/* 星盤轉盤在手機直式吃掉約 390px，而它是純裝飾——
            手機的第一屏應該留給「今天」，不是留給一張圖。 */}
        <div className="hidden lg:block"><StarChartWheel /></div>
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
          {hasChart
            ? '東方看日干支，西方看行運，再翻一張牌。三種說法講的是同一天，不一定會同意彼此——不同意的地方最好玩。'
            : '先翻一張牌，什麼都不用填。'}
        </p>

        {/*
          還沒建命盤時只給塔羅。
          八字和行運都需要出生資料，硬要放上來只會變成兩張寫著「先建立命盤」的空卡——
          第一次來的人在同一頁被要求建命盤四次，那是勸退，不是引導。
          塔羅不需要任何輸入就有結果，先讓人拿到東西，再談要不要留生日。
        */}
        {/*
          手機直式改成水平滑動，桌機維持並排。
          三張卡直向堆疊在手機上超過 1,600px（約兩個螢幕），要滑很久才知道
          下面還有「完整命盤」。它們是同一天的三種說法，本來就該並列比較，
          用滑動比用捲動更貼近這層語意，也是手機的原生手勢。

          -mx-4 px-4 讓卡片邊緣對齊頁面留白，而不是被容器切掉；
          捲動發生在這個容器裡，不會讓整頁產生橫向捲動。
        */}
        <div
          className={hasChart
            ? 'mt-6 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:snap-none lg:grid-cols-3 lg:items-stretch lg:overflow-visible lg:px-0'
            : 'mt-6 max-w-md'}
        >
          {hasChart && <div className="w-[86%] shrink-0 snap-center [&>*]:h-full lg:w-auto"><DailyFortuneCard /></div>}
          {hasChart && <div className="w-[86%] shrink-0 snap-center [&>*]:h-full lg:w-auto"><DailyHoroscopeCard /></div>}
          <div className={hasChart ? 'w-[86%] shrink-0 snap-center [&>*]:h-full lg:w-auto' : ''}><DailyTarotCard /></div>
        </div>
        {hasChart && <p className="mt-1 text-xs text-mist/60 lg:hidden">← 左右滑動看三種說法</p>}
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

      {/* 三、兩人合盤 */}
      <section className="page-container py-8">
        <div className="flex items-baseline gap-4">
          <div>
            <p className="font-display text-base italic tracking-[0.12em] text-gold">Two charts</p>
            <h2 className="mt-1.5 font-serif text-2xl font-bold text-cream sm:text-3xl">兩人合盤</h2>
          </div>
          <span className="h-px flex-1 hairline border-t" />
        </div>
        <p className="mt-3 max-w-xl text-[15px] leading-8 text-mist">
          把兩張盤並排，看你們天然的互補和張力在哪裡。不給「合不合」的分數——
          少見的組合我們會標出來，常見的也會直說很常見。
        </p>
        <Link to="/synastry" className="btn-secondary mt-5" style={{ flex: 'none' }}>
          開始合盤 <ArrowRight size={16} />
        </Link>
      </section>

      <section className="page-container py-4">
        <Link to="/lab" className="group inline-flex items-baseline gap-2 text-sm text-mist transition hover:text-cream">
          <span>還有十個實驗性的玩法在實驗室</span>
          <ArrowRight className="text-mist/40 transition group-hover:text-gold" size={14} />
        </Link>
      </section>

      <section className="page-container pb-16 pt-4"><Disclaimer /></section>
    </>
  );
}
