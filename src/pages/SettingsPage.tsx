import { AlertCircle, CheckCircle2, Database, HardDrive, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFateStore } from '../store/useFateStore';
import { clearLocalData, defaultPreferences, loadPreferences, savePreferences, type LocalPreferences } from '../utils/storage';

const formatBytes = (value: number): string => value >= 1024 ** 3 ? `${(value / 1024 ** 3).toFixed(1)} GB` : `${Math.max(0.1, value / 1024 ** 2).toFixed(1)} MB`;

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<LocalPreferences>(defaultPreferences);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [storageSummary, setStorageSummary] = useState('正在估算瀏覽器儲存空間…');
  const clearSession = useFateStore((state) => state.clearSession);
  const setUiTheme = useFateStore((state) => state.setUiTheme);

  useEffect(() => {
    void loadPreferences().then((value) => { setPreferences(value); setUiTheme(value.theme); }).catch(() => setError('無法讀取 IndexedDB 偏好設定；本次仍可使用，但設定可能不會保存。'));
    if (navigator.storage?.estimate) void navigator.storage.estimate().then(({ usage = 0, quota = 0 }) => setStorageSummary(quota ? `已使用約 ${formatBytes(usage)}／可用上限約 ${formatBytes(quota)}` : `已使用約 ${formatBytes(usage)}`)).catch(() => setStorageSummary('瀏覽器未提供儲存空間估算。'));
  }, [setUiTheme]);

  const persist = async (next: LocalPreferences) => {
    setPreferences(next); setUiTheme(next.theme); setError('');
    try { await savePreferences(next); setNotice('設定已保存在此裝置。'); }
    catch { setError('無法寫入 IndexedDB。請檢查瀏覽器隱私模式或儲存空間。'); }
  };

  const clearEverything = async () => {
    if (!window.confirm('確定清除 FateVerse 的偏好、最近分析、決策紀錄、時間膠囊、今日回饋、回顧日誌與網站快取嗎？此動作無法復原。')) return;
    try {
      await clearLocalData();
      clearSession(); setPreferences(defaultPreferences); setStorageSummary('本地資料已清除；瀏覽器稍後會重新計算用量。'); setNotice('所有 FateVerse 本地資料與網站快取已清除。');
    }
    catch { setError('無法完整清除本地資料。請使用瀏覽器的網站資料設定再試。'); }
  };

  return (
    <section className="page-container page-section max-w-3xl">
      <p className="eyebrow">Settings</p>
      <h1 className="display-title mt-3">資料設定</h1>
      {notice && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100" role="status">
          <CheckCircle2 size={17} />{notice}
        </div>
      )}
      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100" role="alert">
          <AlertCircle className="mt-0.5 shrink-0" size={17} />{error}
        </div>
      )}
      <div className="mt-8">
        <article className="glass-card p-6">
          <div className="flex items-center gap-3"><Database className="text-gold" /><h2 className="section-title">本地資料</h2></div>
          <p className="mt-4 text-sm leading-6 text-mist">萬象命書所有計算都在你的瀏覽器內完成，不會把出生資料或圖片上傳到任何伺服器。以下設定只影響這台裝置。</p>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4">
            <input className="mt-1" type="checkbox" checked={preferences.retainAnalysis} onChange={(event) => void persist({ ...preferences, retainAnalysis: event.target.checked })} />
            <span><strong className="text-cream">分析完成後保留在此裝置</strong><span className="mt-1 block text-sm leading-6 text-mist">預設關閉。啟用後最近一次的結構化分析會寫入 IndexedDB；圖片與 OCR 原圖不會保存。</span></span>
          </label>
          <label className="mt-4 block"><span className="label">OCR 語言</span><select className="input-field" value={preferences.ocrLanguage} onChange={(event) => void persist({ ...preferences, ocrLanguage: event.target.value })}><option value="chi_tra">繁體中文 chi_tra</option></select></label>
          <label className="mt-4 block"><span className="label">主題模式</span><select className="input-field" value={preferences.theme} onChange={(event) => void persist({ ...preferences, theme: event.target.value as LocalPreferences['theme'] })}><option value="dark">深色靛藍</option><option value="system">跟隨系統（目前沿用深色視覺）</option></select></label>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm text-mist"><HardDrive className="mt-0.5 shrink-0 text-gold" size={18} /><div><strong className="text-cream">本站儲存空間</strong><p className="mt-1 leading-6">{storageSummary}</p><p className="mt-1 text-xs">實際上限由瀏覽器與裝置決定。</p></div></div>
          <button className="btn-secondary mt-6 w-full" type="button" onClick={() => void clearEverything()}><Trash2 size={17} />清除我的所有本地資料</button>
        </article>
      </div>
    </section>
  );
}
