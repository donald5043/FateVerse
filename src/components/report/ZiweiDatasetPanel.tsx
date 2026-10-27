import { useEffect, useRef, useState } from 'react';
import type { ProfileInput } from '../../types/fate';
import { lookupZiweiDataset, type ZiweiDatasetReading } from '../../engines/ziwei-dataset';
import ZiweiDatasetAttribution from './ZiweiDatasetAttribution';

type BirthInput = Pick<ProfileInput, 'birthDate' | 'birthTime' | 'gender'>;

/** Keyed by birth input so a different profile never retains somebody else's reading. */
export default function ZiweiDatasetPanel({ profile }: { profile: BirthInput }) {
  return <DatasetReading key={`${profile.birthDate}|${profile.birthTime}|${profile.gender}`} profile={profile} />;
}

function DatasetReading({ profile }: { profile: BirthInput }) {
  const [reading, setReading] = useState<ZiweiDatasetReading>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | undefined>(undefined);
  useEffect(() => () => controller.current?.abort(), []);

  const load = async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError('');
    try {
      const result = await lookupZiweiDataset(profile, request.signal);
      if (!request.signal.aborted) setReading(result);
    } catch (reason) {
      if (!request.signal.aborted) setError(reason instanceof Error ? reason.message : '解讀資料讀取失敗。');
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  };

  return (
    <section className="glass-card mt-6 p-5 sm:p-6" aria-label="開源紫微查表解讀">
      <h3 className="font-serif text-xl font-semibold text-cream">13 類開源解讀摘要</h3>
      <div className="my-5"><ZiweiDatasetAttribution /></div>
      <p className="mt-2 text-sm leading-7 text-mist">依出生日期、時辰與排盤性別，直接查閱王多鱼AI 的紫微斗數 v4.0 資料集。674,976 張命盤的摘要已收錄，無需 LLM；原文保留簡體中文。</p>
      <p className="mt-2 text-xs leading-6 text-mist">來源採倪海廈體系、晚子時歸次日，未校正真太陽時，亮度採發布時的「現代修正 v2」。這份解讀使用來源固定口徑，不隨上方 iztro 流派設定或運限日期變動；查表一致不代表人生預測經過驗證。</p>
      {!reading && <button type="button" className="btn-secondary mt-4" disabled={busy} onClick={() => void load()}>{busy ? '正在查閱…' : '查閱我的 13 類摘要'}</button>}
      {busy && <p className="mt-3 text-sm text-mist" role="status">正在讀取出生年份的本地查表資料…</p>}
      {error && <p className="mt-3 text-sm text-rose-100" role="alert">{error}</p>}
      {reading && <>
        <p className="mt-4 text-xs leading-6 text-gold" role="status">已查到 {reading.lookup.date}・{['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][reading.lookup.hourIndex]}時・{reading.lookup.gender === 'male' ? '男命' : '女命'}{reading.lookup.rolledForward ? '（23 時依來源規則換至次日）' : ''}</p>
        <div className="mt-4 space-y-3">{reading.summaries.map(({ topic, label, text }) => <details className="rounded-xl border border-white/10 bg-white/[0.025] p-4" key={topic}>
          <summary className="cursor-pointer font-semibold text-gold">{label}</summary>
          <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-mist">{text || '此項未收錄可公開的摘要段落；可至來源專案查閱。'}</p>
        </details>)}</div>
      </>}
      <p className="mt-5 text-sm leading-6 text-mist">完整論述請參閱上方來源連結。出生資料在裝置上比對。</p>
    </section>
  );
}
