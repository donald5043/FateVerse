import Disclaimer from '../components/common/Disclaimer';

export default function AboutPage() {
  return <section className="page-container page-section max-w-4xl"><p className="eyebrow">About FateVerse</p><h1 className="display-title mt-3">不同系統，不同觀看角度</h1><div className="mt-8 space-y-5 text-base leading-8 text-mist"><p>萬象命書把可驗證的日期與規則計算，和文字解讀清楚分開。八字、生肖、太陽星座與生命靈數先由程式產生結構化結果，再交由可預測的模板或使用者主動啟用的本地 AI 整理。</p><p>我們不比較哪一套文化模型「更準」，也不把差異視為錯誤。這些內容適合作為認識文化、梳理想法與展開對話的素材。</p></div><div className="mt-10"><Disclaimer health /></div></section>;
}
