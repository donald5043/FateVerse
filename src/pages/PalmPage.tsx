import { Camera, Hand, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Disclaimer from '../components/common/Disclaimer';
import { PALM_FEATURES, buildPalmReading, type PalmSelections } from '../engines/palm-engine';

export default function PalmPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [selections, setSelections] = useState<PalmSelections>({});
  const [imageError, setImageError] = useState('');
  const reading = buildPalmReading(selections);
  const answered = Object.keys(selections).length;

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const chooseImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setImageError('請選擇 JPG、PNG 或 WebP 圖片。'); return; }
    if (file.size > 15 * 1024 * 1024) { setImageError('圖片超過 15 MB，請改用較小的檔案。'); return; }
    setImageError('');
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
  };

  const select = (featureId: keyof PalmSelections, optionId: string) => {
    setSelections((current) => ({ ...current, [featureId]: current[featureId] === optionId ? undefined : optionId }));
  };

  return (
    <section className="page-container page-section">
      <div className="max-w-3xl">
        <p className="eyebrow text-teal-300">Palmistry</p>
        <h1 className="display-title mt-3">拍手相</h1>
        <p className="mt-5 muted">拍一張自己的手掌照片當對照，然後照著提示逐項指認你的手型與掌紋，我們用傳統手相的說法白話解讀。照片只在你的瀏覽器顯示，不會上傳。</p>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-24">
          <article className="glass-card p-5">
            <h2 className="flex items-center gap-2.5 font-serif text-lg font-semibold text-cream"><Camera className="text-teal-300" size={19} />手掌照片（選拍）</h2>
            {imageUrl ? (
              <div className="relative mt-4">
                <img src={imageUrl} alt="你的手掌照片" className="max-h-[420px] w-full rounded-2xl border border-white/10 object-contain" />
                <button className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-ink/80 text-mist transition hover:text-cream" type="button" aria-label="移除照片" onClick={() => { URL.revokeObjectURL(imageUrl); setImageUrl(''); }}><X size={16} /></button>
              </div>
            ) : (
              <label className="mt-4 flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-center transition hover:border-teal-300/50">
                <Hand className="text-teal-300" size={32} />
                <span className="font-semibold text-cream">點擊上傳或拍攝手掌照片</span>
                <span className="text-xs leading-5 text-mist">慣用手掌心朝上、光線充足最清楚；支援 JPG／PNG／WebP，上限 15 MB。</span>
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={chooseImage} />
              </label>
            )}
            {imageError && <p className="mt-3 rounded-xl border border-rose-200/20 bg-rose-200/[0.08] p-3 text-sm text-rose-100" role="alert">{imageError}</p>}
            <p className="mt-4 text-xs leading-5 text-mist">沒有照片也可以直接看著自己的手回答右邊的問題。傳統上右撇子以左手看先天、右手看後天，可以兩隻都試。</p>
          </article>
        </div>

        <div className="space-y-5">
          {PALM_FEATURES.map((feature, index) => (
            <article className="glass-card p-5 sm:p-6" key={feature.id}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-cream">{String(index + 1).padStart(2, '0')} · {feature.title}</h2>
                {selections[feature.id] && <span className="rounded-full bg-teal-300/10 px-2.5 py-1 text-[11px] text-teal-200">已選擇</span>}
              </div>
              <p className="mt-2 text-sm leading-6 text-cream">{feature.question}</p>
              <p className="mt-1 text-xs leading-5 text-mist">{feature.howTo}</p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {feature.options.map((option) => {
                  const active = selections[feature.id] === option.id;
                  return (
                    <button
                      className={`rounded-xl border p-3.5 text-left transition ${active ? 'border-teal-300/60 bg-teal-300/[0.09]' : 'border-white/10 bg-white/[0.03] hover:border-teal-300/35'}`}
                      type="button"
                      aria-pressed={active}
                      onClick={() => select(feature.id, option.id)}
                      key={option.id}
                    >
                      <span className={`block text-sm font-semibold ${active ? 'text-teal-100' : 'text-cream'}`}>{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-mist">{option.hint}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>

      {reading ? (
        <div key={JSON.stringify(selections)} className="reveal mx-auto mt-10 max-w-4xl">
          <article className="overflow-hidden rounded-[24px] border border-teal-300/25 bg-gradient-to-b from-teal-300/[0.07] via-[#12203a] to-[#0b1020] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-teal-200"><Sparkles size={20} /><span className="eyebrow text-teal-300">你的手相解讀</span></div>
            <p className="mt-4 font-serif text-xl leading-9 text-cream">{reading.headline}</p>
            <div className="mt-6 space-y-4">
              {reading.sections.map((section) => (
                <div className="rounded-2xl border border-white/10 bg-ink/35 p-4" key={section.featureId}>
                  <div className="flex flex-wrap items-center gap-2"><span className="font-serif text-base font-semibold text-cream">{section.featureTitle}</span><span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-mist">{section.optionLabel}</span></div>
                  <p className="mt-2.5 text-sm leading-7 text-mist">{section.reading}</p>
                  <p className="mt-2 text-sm leading-6 text-teal-100">給你的小提醒：{section.tip}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 leading-7 text-mist">{reading.synthesis}</p>
            <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
              {reading.cautions.map((item) => <li className="flex gap-2 text-xs leading-5 text-mist" key={item}><ShieldCheck className="mt-0.5 shrink-0 text-teal-300" size={14} />{item}</li>)}
            </ul>
          </article>
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-mist">
          {answered === 0 ? '從上面的手型開始，至少指認三項特徵，就會產生你的手相解讀。' : `已選擇 ${answered} 項，再選 ${Math.max(0, 3 - answered)} 項就能產生解讀。`}
        </div>
      )}
      <div className="mx-auto mt-8 max-w-4xl"><Disclaimer health /></div>
    </section>
  );
}
