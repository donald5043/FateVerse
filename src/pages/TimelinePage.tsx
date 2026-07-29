import { ArrowRight, CalendarRange, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BackToReportLink from '../components/common/BackToReportLink';
import Disclaimer from '../components/common/Disclaimer';
import {
  buildLifeTimeline, summarizeTimeline, TIMELINE_BASELINE_NOTE, TONE_LABELS,
  type TimelineNote, type TimelineYear,
} from '../engines/life-timeline-engine';
import { useFateStore } from '../store/useFateStore';
import {
  clearTimelineNotes, grantTimelineConsent, loadTimelineNotes, saveTimelineNote,
  type TimelineStore,
} from '../utils/storage';

const TONES: NonNullable<TimelineNote['tone']>[] = ['good', 'mixed', 'hard'];

function YearCard({
  entry, note, onSave, disabled,
}: {
  entry: TimelineYear;
  note?: TimelineNote;
  onSave: (note: TimelineNote) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(note?.text ?? '');
  const [tone, setTone] = useState(note?.tone);

  return (
    <article className="glass-card p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-serif text-xl font-bold text-cream">{entry.year}</h3>
        <span className="text-xs text-mist/70">虛歲 {entry.nominalAge}</span>
        <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-2.5 py-0.5 text-xs text-gold">
          {entry.yearGanZhi}年 · {entry.tenGod}
        </span>
        {entry.yearlyPalace && <span className="text-xs text-mist/70">流年命宮 {entry.yearlyPalace}</span>}
      </div>
      <p className="mt-2.5 text-sm leading-7 text-mist">{entry.framing}</p>

      {note?.text && (
        <blockquote className="mt-3 rounded-2xl border border-white/10 bg-ink/40 p-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-cream">{note.text}</p>
          {note.tone && <p className="mt-1.5 text-[11px] text-mist/60">你標記為：{TONE_LABELS[note.tone]}</p>}
        </blockquote>
      )}

      {!open ? (
        <button className="mt-3 flex items-center gap-1.5 text-xs text-mist hover:text-cream" type="button" disabled={disabled} onClick={() => setOpen(true)}>
          <Pencil size={13} />{note?.text ? '修改這一年' : '寫下這一年發生的事'}
        </button>
      ) : (
        <div className="mt-3">
          <textarea
            className="input-field min-h-24"
            value={text}
            maxLength={600}
            placeholder="那一年對你來說發生了什麼？寫給自己看的，只存在這台裝置。"
            onChange={(event) => setText(event.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {TONES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={tone === option}
                onClick={() => setTone(tone === option ? undefined : option)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  tone === option ? 'border-gold/60 bg-gold/15 text-cream' : 'border-white/15 text-mist hover:border-gold/35'
                }`}
              >
                {TONE_LABELS[option]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-secondary" type="button" disabled={disabled} onClick={() => { onSave({ year: entry.year, text, tone }); setOpen(false); }}>儲存</button>
            <button className="text-xs text-mist hover:text-cream" type="button" onClick={() => { setText(note?.text ?? ''); setTone(note?.tone); setOpen(false); }}>取消</button>
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * 命運回顧日誌。
 *
 * 只列出已經過完的年份——這頁的前提是你已經知道結果，命理只是回頭看的角度。
 * 筆記需要明確同意才會寫入，而且只存在這台裝置。
 */
export default function TimelinePage() {
  const input = useFateStore((state) => state.reportInput);
  const profile = useFateStore((state) => state.profileInput);
  const [store, setStore] = useState<TimelineStore>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    void loadTimelineNotes().then((loaded) => { if (alive) setStore(loaded); });
    return () => { alive = false; };
  }, []);

  const years = useMemo(
    () => (input && profile ? buildLifeTimeline(input.bazi, profile) : []),
    [input, profile],
  );
  const notes = useMemo(() => store?.notes ?? [], [store]);
  const summary = useMemo(() => summarizeTimeline(years, notes), [years, notes]);

  const run = async (action: () => Promise<TimelineStore>) => {
    setBusy(true);
    setError('');
    try { setStore(await action()); }
    catch { setError('這台裝置無法保存紀錄（可能是瀏覽器的隱私模式）。'); }
    finally { setBusy(false); }
  };

  if (!input || !profile) {
    return (
      <section className="page-container page-section max-w-2xl text-center">
        <p className="eyebrow">Timeline</p>
        <h1 className="display-title mt-3">命運回顧日誌</h1>
        <p className="mt-5 muted">這頁需要你的命盤才能排出逐年的大運與流年。建立之後就能回頭看每一年。</p>
        <Link className="btn-primary mt-6" to="/profile">先建立命盤 <ArrowRight size={16} /></Link>
      </section>
    );
  }

  return (
    <section className="page-container page-section">
      <BackToReportLink />
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Timeline</p>
        <h1 className="display-title mt-3">命運回顧日誌</h1>
        <p className="mx-auto mt-5 max-w-xl muted">
          把你過去的每一年，和傳統命理當年給的框並排。這裡只列已經過完的年份——你已經知道發生了什麼，命理只是提供一個回頭看的角度。
        </p>
      </div>

      {store && !store.consented && (
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-5">
          <p className="text-sm leading-7 text-cream">想在每一年旁邊寫下當時發生的事嗎？</p>
          <p className="mt-1.5 text-xs leading-6 text-mist">
            筆記只存在這台裝置，不會上傳，也不會影響任何一年的排盤結果。隨時可以整份刪掉。
            下面的年份表不需要開啟也看得到。
          </p>
          <button className="btn-secondary mt-3" type="button" disabled={busy} onClick={() => void run(grantTimelineConsent)}>
            好，開始記錄
          </button>
          {error && <p className="mt-2 text-xs text-rose-200" role="alert">{error}</p>}
        </div>
      )}

      {store?.consented && (
        <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-5" data-testid="timeline-summary">
          <div className="flex items-center gap-2 text-gold"><CalendarRange size={17} /><h2 className="font-serif text-base font-bold">回頭看</h2></div>
          <div className="mt-2.5 space-y-2">
            {summary.lines.map((line) => <p className="text-sm leading-7 text-mist" key={line}>{line}</p>)}
          </div>
          <button className="mt-3 text-[11px] text-mist/60 underline underline-offset-2" type="button" disabled={busy} onClick={() => void run(async () => { await clearTimelineNotes(); return { consented: false, notes: [] }; })}>
            刪除全部回顧紀錄
          </button>
          {error && <p className="mt-2 text-xs text-rose-200" role="alert">{error}</p>}
        </section>
      )}

      <div className="mx-auto mt-8 max-w-3xl space-y-4">
        {years.length > 0 && (
          <p className="rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-5 text-sm leading-7 text-mist">
            {TIMELINE_BASELINE_NOTE}
          </p>
        )}
        {years.length === 0 && <p className="muted text-center">還沒有可以回顧的完整年份。</p>}
        {years.map((entry) => (
          <YearCard
            key={entry.year}
            entry={entry}
            note={notes.find((item) => item.year === entry.year)}
            disabled={busy || !store?.consented}
            onSave={(note) => void run(() => saveTimelineNote(note))}
          />
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-mist">
          這份日誌不解釋因果。命盤沒有讓任何事發生，它只是一套事後可以套上去的說法——
          你會在裡面找到多少對應，很大一部分取決於你怎麼回想。健康方面的事更是如此：
          原因請找醫療專業，這裡不做任何醫學上的歸因。
        </p>
        <Disclaimer />
      </div>
    </section>
  );
}
