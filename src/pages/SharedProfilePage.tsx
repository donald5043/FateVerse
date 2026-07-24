import { AlertCircle, LockKeyhole, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { buildReportFromProfile } from '../engines/build-report';
import { useFateStore } from '../store/useFateStore';
import { decodeShareCodeToProfile } from '../utils/share-link';

export default function SharedProfilePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setProfile = useFateStore((state) => state.setProfile);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const profile = useMemo(() => {
    const code = params.get('d');
    return code ? decodeShareCodeToProfile(code) : undefined;
  }, [params]);

  useEffect(() => {
    if (!profile) setError('這個分享連結無法解讀，可能格式已過期或連結不完整。');
  }, [profile]);

  const openReport = () => {
    if (!profile || busy) return;
    setBusy(true);
    try {
      const { reportInput, report } = buildReportFromProfile(profile);
      setProfile(profile, reportInput, report);
      navigate('/report');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '這份出生資料無法計算，請確認連結來源。');
      setBusy(false);
    }
  };

  if (!profile) {
    return (
      <section className="page-container page-section text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-rose-200/25 bg-rose-200/10 text-rose-200"><AlertCircle size={34} /></div>
        <p className="eyebrow mt-7">Shared chart</p>
        <h1 className="display-title mt-3">分享連結無法開啟</h1>
        <p className="mx-auto mt-5 max-w-xl muted">{error || '缺少分享資料。'}</p>
        <Link className="btn-primary mt-8" to="/profile">改用自己的資料探索</Link>
      </section>
    );
  }

  const [year, month, day] = profile.birthDate.split('-');
  return (
    <section className="page-container page-section">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-gold">Shared chart</p>
        <h1 className="display-title mt-3">有人分享了一份命盤給你</h1>
        <p className="mx-auto mt-5 max-w-xl muted">這個連結裡包含一份出生資料。確認後，我們會在你的裝置上重新計算完整命盤——所有運算都在本機，不會上傳。</p>
      </div>

      <div className="mx-auto mt-9 max-w-lg">
        <article className="glass-card p-6 sm:p-8">
          <div className="grid gap-3">
            {[
              ['姓名', profile.name.trim() || '（分享時未包含）'],
              ['出生日期', `${year} 年 ${month} 月 ${day} 日`],
              ['出生時間', profile.birthTime],
              ['出生地區', profile.region],
              ['時區', profile.timezone],
            ].map(([label, value]) => (
              <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0" key={label}>
                <span className="text-sm text-mist">{label}</span>
                <span className="text-right font-semibold text-cream">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/[0.06] p-3.5">
            <LockKeyhole className="mt-0.5 shrink-0 text-gold" size={17} />
            <p className="text-xs leading-6 text-[#e8ddc5]">命盤會在你的瀏覽器重新計算，不會傳到任何伺服器；除非你在設定頁開啟保存，否則離開頁面後這份資料就會消失。</p>
          </div>
          {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100" role="alert"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}</div>}
          <button className="btn-primary mt-6 w-full" type="button" disabled={busy} onClick={openReport}><Sparkles size={17} />{busy ? '計算中…' : '查看這份命盤報告'}</button>
          <Link className="btn-secondary mt-3 w-full" to="/profile">改用自己的資料探索</Link>
        </article>
      </div>
    </section>
  );
}
