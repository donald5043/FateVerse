import { useEffect, useState } from 'react';
import {
  computeFeedbackStats, describeStats, findFeedback, toDateKey, VERDICT_LABELS,
  type FeedbackVerdict,
} from '../../engines/fortune-feedback-engine';
import {
  clearFeedback, grantFeedbackConsent, loadFeedback, saveFeedback, type FeedbackStore,
} from '../../utils/storage';

const VERDICTS: FeedbackVerdict[] = ['accurate', 'neutral', 'off'];

/**
 * 今日回饋：標記今天的內容準不準，並累積成自己的統計。
 *
 * 三件刻意的事：
 * 1. 沒有明確同意之前，不寫入任何資料。
 * 2. 回饋不會影響隔天算出來的內容——這是給使用者看的紀錄，不是模型調參。
 * 3. 樣本不足時不顯示百分比，也不用連續天數施加壓力。
 */
export default function DailyFeedback({ today = new Date() }: { today?: Date }) {
  const [store, setStore] = useState<FeedbackStore>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dateKey = toDateKey(today);

  useEffect(() => {
    let alive = true;
    void loadFeedback().then((loaded) => { if (alive) setStore(loaded); });
    return () => { alive = false; };
  }, []);

  if (!store) return null;

  /** 寫入失敗（例如隱私模式沒有 IndexedDB）時說清楚，不靜默吞掉。 */
  const run = async (action: () => Promise<FeedbackStore>) => {
    setBusy(true);
    setError('');
    try { setStore(await action()); }
    catch { setError('這台裝置無法保存紀錄（可能是瀏覽器的隱私模式）。'); }
    finally { setBusy(false); }
  };

  const consent = () => run(grantFeedbackConsent);
  const mark = (verdict: FeedbackVerdict) => run(() => saveFeedback({ date: dateKey, verdict }));
  const forget = () => run(async () => {
    await clearFeedback();
    return { consented: false, records: [] };
  });

  if (!store.consented) {
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-ink/40 p-4">
        <p className="text-sm leading-7 text-cream">想知道這些描述對你到底準不準嗎？</p>
        <p className="mt-1.5 text-xs leading-6 text-mist">
          開啟之後，每天可以標記「準／普通／不準」，累積成你自己的紀錄。
          資料只存在這台裝置，不會上傳，也不會影響隔天算出來的內容。隨時可以刪掉。
        </p>
        <button className="btn-secondary mt-3" type="button" disabled={busy} onClick={() => void consent()}>
          好，開始記錄
        </button>
        {error && <p className="mt-2 text-xs text-rose-200" role="alert">{error}</p>}
      </div>
    );
  }

  const marked = findFeedback(store.records, dateKey);
  const stats = computeFeedbackStats(store.records, today);

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-ink/40 p-4" data-testid="daily-feedback">
      <p className="text-xs font-semibold tracking-wider text-gold">今天這段，對得上嗎？</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {VERDICTS.map((verdict) => {
          const active = marked?.verdict === verdict;
          return (
            <button
              key={verdict}
              type="button"
              disabled={busy}
              aria-pressed={active}
              onClick={() => void mark(verdict)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? 'border-gold/60 bg-gold/15 text-cream'
                  : 'border-white/15 bg-white/[0.04] text-mist hover:border-gold/35 hover:text-cream'
              }`}
            >
              {VERDICT_LABELS[verdict]}
            </button>
          );
        })}
      </div>
      {marked && <p className="mt-2 text-[11px] text-mist/70">已記下今天的回答，改選就會覆蓋。</p>}
      {error && <p className="mt-2 text-xs text-rose-200" role="alert">{error}</p>}

      <p className="mt-3 text-xs leading-6 text-mist">{describeStats(stats)}</p>
      {stats.total > 0 && (
        <p className="mt-1.5 text-[11px] text-mist/60">
          累積 {stats.total} 天，最近連續 {stats.streak} 天。
        </p>
      )}

      <button className="mt-3 text-[11px] text-mist/60 underline underline-offset-2" type="button" disabled={busy} onClick={() => void forget()}>
        刪除全部回饋紀錄
      </button>
    </div>
  );
}
