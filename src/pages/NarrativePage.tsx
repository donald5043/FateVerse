import { BookOpen, Check, Copy, ScrollText, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BackToReportLink from '../components/common/BackToReportLink';
import Disclaimer from '../components/common/Disclaimer';
import { generateLifeNarrative } from '../engines/narrative-engine';
import { useFateStore } from '../store/useFateStore';

export default function NarrativePage() {
  const input = useFateStore((state) => state.reportInput);
  const profile = useFateStore((state) => state.profileInput);
  const [copied, setCopied] = useState(false);

  const narrative = useMemo(() => (input ? generateLifeNarrative(input) : undefined), [input]);

  if (!input || !narrative) {
    return (
      <section className="page-container page-section text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold"><BookOpen size={34} /></div>
        <p className="eyebrow mt-7">Life narrative</p>
        <h1 className="display-title mt-3">你的人生劇本・本章</h1>
        <p className="mx-auto mt-5 max-w-xl muted">完成命盤輸入後，這裡會用你的命盤，寫成一段第一人稱的人生故事——不是預言，而是重新看見自己的一種方式。</p>
        <Link className="btn-primary mt-8" to="/profile">前往探索命盤</Link>
      </section>
    );
  }

  const copyText = async () => {
    const text = [
      narrative.title,
      '',
      narrative.opening,
      '',
      ...narrative.chapters.flatMap((chapter) => [chapter.title, ...chapter.paragraphs, '']),
      narrative.redemption,
      '',
      narrative.closing,
      '',
      '— 萬象命書 FateVerse・本章',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="page-container page-section">
      <BackToReportLink />
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-gold">Life narrative · 本章</p>
        <h1 className="display-title mt-3">{profile?.name ? `${profile.name}的人生劇本` : '你的人生劇本'}</h1>
        <p className="mx-auto mt-5 max-w-xl muted">{narrative.opening}</p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-6">
        <article className="glass-card p-6 sm:p-8">
          <h2 className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream"><Sparkles className="text-gold" size={20} />{narrative.title}</h2>
          <p className="mt-4 leading-8 text-mist">{narrative.axis.summary}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: '能動性 · 主導與掌控', value: narrative.axis.agency, tone: 'from-gold/70 to-gold' },
              { label: '共融 · 連結與關懷', value: narrative.axis.communion, tone: 'from-teal-300/70 to-teal-300' },
            ].map((axis) => (
              <div key={axis.label}>
                <div className="flex items-center justify-between text-sm"><span className="text-cream">{axis.label}</span><span className="tabular-nums text-mist">{axis.value}</span></div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10"><div className={`meter-fill h-full rounded-full bg-gradient-to-r ${axis.tone}`} style={{ '--meter-width': `${axis.value}%` } as React.CSSProperties} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-mist">這兩條軸線來自心理學家 McAdams 的敘事認同理論：一個人的人生故事，常圍繞著「我能主導多少」與「我和人連結多深」兩股力量展開。</p>
        </article>

        {narrative.chapters.map((chapter) => (
          <article className="glass-card p-6 sm:p-8" key={chapter.id}>
            <h2 className="font-serif text-xl font-semibold text-gold">{chapter.title}</h2>
            <div className="mt-4 space-y-4">
              {chapter.paragraphs.map((paragraph, index) => (
                <p className="font-serif text-lg leading-9 text-cream" key={index}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}

        <article className="overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-[#1a2140] via-[#12183044] to-[#0b1020] p-6 sm:p-8">
          <div className="flex items-center gap-3 text-gold"><ScrollText size={20} /><span className="eyebrow">轉折 · 救贖弧線</span></div>
          <p className="mt-4 font-serif text-lg leading-9 text-cream">{narrative.redemption}</p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="leading-8 text-mist">{narrative.closing}</p>
          <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-mist">{narrative.caveat}</p>
        </article>

        <div className="flex flex-wrap justify-center gap-3">
          <button className="btn-primary" type="button" onClick={() => void copyText()}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? '已複製' : '複製這段故事'}</button>
          <Link className="btn-secondary" to="/report"><Sparkles size={17} />回到完整報告</Link>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-3xl"><Disclaimer /></div>
    </section>
  );
}
