import { BrainCircuit, Calculator, Database, ScanLine, ShieldCheck } from 'lucide-react';
import Disclaimer from '../components/common/Disclaimer';

const principles = [
  { icon: Calculator, title: '可計算的，不交給 AI 猜', text: '四柱、五行、生肖、星座、靈數與籤詩比對，都先由程式或正式套件產生結構化結果。' },
  { icon: BrainCircuit, title: 'AI 是可選的文字整理', text: '本地模型只重新組織已提供資料；不支援 WebGPU 時，規則式報告仍是完整可用路徑。' },
  { icon: Database, title: '來源與內容分層', text: '原始籤文、資料來源、傳統說明與 FateVerse 現代化整理分開呈現，不用模糊文案掩蓋缺漏。' },
  { icon: ShieldCheck, title: '保留決策界線', text: '所有結果都是文化觀察與反思素材，不作醫療診斷、法律結論、投資保證或災難預言。' },
] as const;

export default function AboutPage() {
  return (
    <section className="page-container page-section">
      <div className="grid gap-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end"><div><p className="eyebrow">About FateVerse</p><h1 className="display-title mt-3">不同系統，<br />不同觀看角度</h1></div><p className="max-w-2xl text-lg leading-8 text-mist">萬象命書不比較哪一套文化模型「更準」，也不把差異視為錯誤。我們把規則計算、原始資料與文字解讀拆開，讓每個結論都知道自己從哪裡來。</p></div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">{principles.map(({ icon: Icon, title, text }, index) => <article className="glass-card p-6" key={title}><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-gold/10 text-gold"><Icon size={21} /></span><span className="text-xs font-semibold text-gold/60">0{index + 1}</span></div><h2 className="mt-5 font-serif text-xl font-semibold text-cream">{title}</h2><p className="mt-3 leading-7 text-mist">{text}</p></article>)}</div>

      <section className="mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8"><div className="flex items-center gap-3"><ScanLine className="text-gold" /><h2 className="section-title">資料如何流動</h2></div><div className="mt-7 grid gap-3 sm:grid-cols-4">{['使用者輸入', '程式精確計算', '結構化 JSON', '模板／本地 AI 整理'].map((item, index) => <div className="relative rounded-2xl border border-white/10 bg-[#0e152a] p-4 text-center" key={item}><span className="text-xs text-gold">STEP {index + 1}</span><p className="mt-2 text-sm font-semibold text-cream">{item}</p>{index < 3 && <span className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-gold sm:block">→</span>}</div>)}</div></section>

      <div className="mt-10"><Disclaimer health /></div>
    </section>
  );
}
