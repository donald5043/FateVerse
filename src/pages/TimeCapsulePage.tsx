import { Lock, LockOpen, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import BackToReportLink from '../components/common/BackToReportLink';
import Disclaimer from '../components/common/Disclaimer';
import {
  CAPSULE_PRESETS, OUTCOME_LABELS, capsuleStatus, computeOpenDate, daysSince, daysUntil, sortCapsules,
  type CapsuleOutcome, type CapsuleRecord,
} from '../engines/time-capsule-engine';
import { clearCapsules, deleteCapsule, loadCapsules, saveCapsule, updateCapsule } from '../utils/storage';

const MOODS = ['😔', '😐', '🙂', '😊', '🤩'];
const OUTCOMES: CapsuleOutcome[] = ['yes', 'partly', 'no', 'na'];
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('zh-TW');

export default function TimeCapsulePage() {
  const [capsules, setCapsules] = useState<CapsuleRecord[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mood, setMood] = useState<number>();
  const [presetDays, setPresetDays] = useState(90);
  const [opening, setOpening] = useState<string>();
  const [reflection, setReflection] = useState('');
  const [outcome, setOutcome] = useState<CapsuleOutcome>();

  useEffect(() => { void loadCapsules().then(setCapsules); }, []);

  const sorted = useMemo(() => sortCapsules(capsules), [capsules]);
  const canSeal = message.trim().length >= 4;

  const seal = async () => {
    if (!canSeal) return;
    const now = new Date();
    const record: CapsuleRecord = {
      id: `${now.getTime()}`,
      title: title.trim() || '給未來的自己',
      message: message.trim(),
      mood,
      createdAt: now.toISOString(),
      openAt: computeOpenDate(presetDays, now),
    };
    setCapsules(await saveCapsule(record));
    setTitle(''); setMessage(''); setMood(undefined);
  };

  const beginOpen = (id: string) => { setOpening(id); setReflection(''); setOutcome(undefined); };
  const confirmOpen = async (id: string) => {
    setCapsules(await updateCapsule(id, { openedAt: new Date().toISOString(), reflection: reflection.trim() || undefined, outcome }));
    setOpening(undefined);
  };
  const remove = async (id: string) => setCapsules(await deleteCapsule(id));
  const clearAll = async () => { await clearCapsules(); setCapsules([]); };

  return (
    <section className="page-container page-section">
      <BackToReportLink />
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-celeste">Time Capsule</p>
        <h1 className="display-title mt-3">時間膠囊</h1>
        <p className="mx-auto mt-5 max-w-xl muted">寫下此刻的心境，或你對未來的一個猜測，封存起來。到了約定的日子，回來打開看看——這不是預言，而是收集你自己的軌跡。長期下來，你會更認識你自己。</p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <article className="glass-card p-6 sm:p-8">
          <label className="block">
            <span className="label">給這個膠囊一個標題（選填）</span>
            <input className="input-field" value={title} maxLength={30} placeholder="例如：關於那份工作的決定" onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className="label">寫給未來的自己</span>
            <textarea className="input-field min-h-32 resize-none" value={message} maxLength={500} placeholder="此刻在想什麼？擔心什麼、期待什麼？也可以寫下一個對未來的猜測，之後回來驗證。" onChange={(event) => setMessage(event.target.value)} />
            <span className="mt-1.5 block text-right text-xs text-mist">{message.length}/500</span>
          </label>
          <div className="mt-4">
            <span className="label">現在的心情（選填）</span>
            <div className="flex gap-2">
              {MOODS.map((emoji, index) => (
                <button key={emoji} type="button" onClick={() => setMood(mood === index ? undefined : index)} className={`grid size-11 place-items-center rounded-full border text-xl transition ${mood === index ? 'border-gold/60 bg-gold/10' : 'border-gold/15 hover:border-gold/40'}`} aria-pressed={mood === index}>{emoji}</button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <span className="label">多久後打開</span>
            <div className="flex flex-wrap gap-2">
              {CAPSULE_PRESETS.map((preset) => (
                <button key={preset.days} type="button" onClick={() => setPresetDays(preset.days)} className={`chip ${presetDays === preset.days ? 'chip-active' : ''}`} aria-pressed={presetDays === preset.days}>{preset.label}</button>
              ))}
            </div>
            <p className="mt-2 text-xs text-mist">預計開啟日：{dateLabel(computeOpenDate(presetDays))}</p>
          </div>
          <button className="btn-primary mt-6 w-full" type="button" disabled={!canSeal} onClick={() => void seal()}><Lock size={17} />封存這個膠囊</button>
        </article>
      </div>

      {sorted.length > 0 && (
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-cream">你的膠囊</h2>
            <button className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-vermilion" type="button" onClick={() => void clearAll()}><Trash2 size={15} />清除全部</button>
          </div>
          <div className="mt-4 space-y-4">
            {sorted.map((capsule) => {
              const status = capsuleStatus(capsule);
              if (status === 'sealed') {
                return (
                  <article className="flex items-center justify-between gap-3 rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-5" key={capsule.id}>
                    <div className="flex items-center gap-3">
                      <Lock className="shrink-0 text-mist" size={20} />
                      <div>
                        <p className="font-semibold text-cream">{capsule.title}</p>
                        <p className="mt-0.5 text-xs text-mist">封存於 {dateLabel(capsule.createdAt)} · 還有 {daysUntil(capsule.openAt)} 天可開啟（{dateLabel(capsule.openAt)}）</p>
                      </div>
                    </div>
                    <button className="shrink-0 text-mist hover:text-vermilion" type="button" aria-label="刪除" onClick={() => void remove(capsule.id)}><Trash2 size={16} /></button>
                  </article>
                );
              }
              if (status === 'ready') {
                const isOpening = opening === capsule.id;
                return (
                  <article className="rounded-2xl border border-gold/40 bg-gold/[0.06] p-5" key={capsule.id}>
                    <div className="flex items-center gap-3"><LockOpen className="shrink-0 text-gold" size={20} /><div><p className="font-semibold text-cream">{capsule.title}</p><p className="mt-0.5 text-xs text-mist">封存於 {daysSince(capsule.createdAt)} 天前 · 現在可以打開了</p></div></div>
                    {!isOpening ? (
                      <button className="btn-primary mt-4" type="button" onClick={() => beginOpen(capsule.id)}><LockOpen size={16} />打開膠囊</button>
                    ) : (
                      <div className="mt-4">
                        <div className="rounded-xl border border-white/10 bg-ink/40 p-4">
                          {capsule.mood !== undefined && <p className="mb-2 text-2xl">{MOODS[capsule.mood]}</p>}
                          <p className="font-serif leading-8 text-cream">{capsule.message}</p>
                        </div>
                        <p className="mt-4 label">現在回頭看，當初寫的成真了嗎？</p>
                        <div className="flex flex-wrap gap-2">
                          {OUTCOMES.map((value) => (
                            <button key={value} type="button" onClick={() => setOutcome(value)} className={`chip ${outcome === value ? 'chip-active' : ''}`} aria-pressed={outcome === value}>{OUTCOME_LABELS[value]}</button>
                          ))}
                        </div>
                        <textarea className="input-field mt-3 min-h-24 resize-none" value={reflection} maxLength={500} placeholder="現在的你，想對當初的自己說什麼？（選填）" onChange={(event) => setReflection(event.target.value)} />
                        <button className="btn-primary mt-3" type="button" onClick={() => void confirmOpen(capsule.id)}><Sparkles size={16} />封存這次回看</button>
                      </div>
                    )}
                  </article>
                );
              }
              return (
                <article className="rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-5" key={capsule.id}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-cream">{capsule.title}</p>
                    <div className="flex items-center gap-2">
                      {capsule.outcome && <span className="rounded-full bg-gold/10 px-2.5 py-1 text-[11px] text-gold">{OUTCOME_LABELS[capsule.outcome]}</span>}
                      <button className="text-mist hover:text-vermilion" type="button" aria-label="刪除" onClick={() => void remove(capsule.id)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-mist">封存 {dateLabel(capsule.createdAt)} · 開啟 {capsule.openedAt ? dateLabel(capsule.openedAt) : ''}</p>
                  <div className="mt-3 rounded-xl border border-white/10 bg-ink/30 p-4">
                    {capsule.mood !== undefined && <p className="mb-1.5 text-xl">{MOODS[capsule.mood]}</p>}
                    <p className="text-sm leading-7 text-mist"><span className="text-[11px] text-mist/70">當初寫下：</span><br />{capsule.message}</p>
                  </div>
                  {capsule.reflection && <div className="mt-2 rounded-xl border border-gold/[0.14] bg-gold/[0.04] p-4"><p className="text-sm leading-7 text-cream"><span className="text-[11px] text-gold">開啟時回看：</span><br />{capsule.reflection}</p></div>}
                </article>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-mist">所有膠囊只存在你的裝置上，不會上傳。到期時記得回來看看——這裡收集的是你自己的軌跡，不是預測。</p>
        </div>
      )}
      <div className="mx-auto mt-10 max-w-2xl"><Disclaimer /></div>
    </section>
  );
}
