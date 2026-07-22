import { AlertCircle, CheckCircle2, Cpu, Database, Download, HardDrive, LoaderCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LOCAL_MODELS } from '../ai/model-options';
import { useFateStore } from '../store/useFateStore';
import { clearLocalData, defaultPreferences, loadPreferences, savePreferences, type LocalPreferences } from '../utils/storage';

const formatBytes = (value: number): string => value >= 1024 ** 3 ? `${(value / 1024 ** 3).toFixed(1)} GB` : `${Math.max(0.1, value / 1024 ** 2).toFixed(1)} MB`;

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<LocalPreferences>(defaultPreferences);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [storageSummary, setStorageSummary] = useState('正在估算瀏覽器儲存空間…');
  const [runtimeMode, setRuntimeMode] = useState('正在判斷裝置策略…');
  const [modelOption] = useState(LOCAL_MODELS[0]);
  const model = useFateStore((state) => state.model);
  const setModel = useFateStore((state) => state.setModel);
  const clearSession = useFateStore((state) => state.clearSession);
  const setUiTheme = useFateStore((state) => state.setUiTheme);

  useEffect(() => {
    void loadPreferences().then((value) => { setPreferences(value); setUiTheme(value.theme); }).catch(() => setError('無法讀取 IndexedDB 偏好設定；本次仍可使用，但設定可能不會保存。'));
    void import('../ai/webllm').then(async ({ detectWebGPU, getGenerationProfile }) => {
      const support = await detectWebGPU();
      setModel({ supported: support.supported, message: support.reason });
      const profile = getGenerationProfile();
      setRuntimeMode(profile.id === 'mobile-fast'
        ? `iPhone／iPad 快速模式：最多 ${profile.maxTokens} token，${profile.totalTimeoutMs / 1000} 秒強制停止`
        : `標準模式：最多 ${profile.maxTokens} token，${profile.totalTimeoutMs / 1000} 秒強制停止`);
    }).catch(() => setModel({ supported: false, status: 'error', message: 'WebLLM 模組載入失敗。' }));
    if (navigator.storage?.estimate) void navigator.storage.estimate().then(({ usage = 0, quota = 0 }) => setStorageSummary(quota ? `已使用約 ${formatBytes(usage)}／可用上限約 ${formatBytes(quota)}` : `已使用約 ${formatBytes(usage)}`)).catch(() => setStorageSummary('瀏覽器未提供儲存空間估算。'));
  }, [setModel, setUiTheme]);

  const persist = async (next: LocalPreferences) => {
    setPreferences(next); setUiTheme(next.theme); setError('');
    try { await savePreferences(next); setNotice('設定已保存在此裝置。'); }
    catch { setError('無法寫入 IndexedDB。請檢查瀏覽器隱私模式或儲存空間。'); }
  };

  const enableModel = async () => {
    if (!modelOption || model.status === 'loading') return;
    setError(''); setNotice(''); setModel({ status: 'loading', progress: 0, error: undefined, message: '準備下載模型…' });
    try {
      const { loadLocalModel } = await import('../ai/webllm');
      await loadLocalModel(modelOption.id, (progress, message) => setModel({ progress, message }));
      setModel({ status: 'ready', progress: 100, message: '本地模型已就緒。回到報告頁即可產生智慧報告。' });
      await persist({ ...preferences, modelNoticeSeen: true, modelId: modelOption.id });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '本地模型載入失敗，已切回輕量模式。';
      setModel({ status: 'error', progress: 0, message, error: message }); setError(message);
    }
  };

  const cancel = async () => { const { cancelModelLoad } = await import('../ai/webllm'); cancelModelLoad(); setModel({ message: '正在取消模型載入…' }); };
  const clearModel = async () => {
    if (!modelOption) return;
    try { const { clearModelCache } = await import('../ai/webllm'); await clearModelCache(modelOption.id); setModel({ status: 'idle', progress: 0, message: '模型快取已清除。' }); setNotice('模型快取已從此裝置清除。'); }
    catch { setError('無法清除模型快取。請關閉其他 FateVerse 分頁後再試。'); }
  };
  const clearEverything = async () => {
    if (!window.confirm('確定清除 FateVerse 的偏好、最近分析、模型與網站快取嗎？此動作無法復原。')) return;
    try {
      const { clearModelCache } = await import('../ai/webllm');
      const clearing = await Promise.allSettled([clearModelCache(modelOption.id), clearLocalData()]);
      if (clearing.some((result) => result.status === 'rejected')) throw new Error('PARTIAL_CLEAR');
      clearSession(); setPreferences(defaultPreferences); setStorageSummary('本地資料已清除；瀏覽器稍後會重新計算用量。'); setNotice('所有 FateVerse 本地資料、模型與網站快取已清除。');
    }
    catch { setError('無法完整清除本地資料。請使用瀏覽器的網站資料設定再試。'); }
  };

  return (
    <section className="page-container page-section max-w-5xl">
      <p className="eyebrow">Settings</p>
      <h1 className="display-title mt-3">資料與 AI 設定</h1>
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
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="glass-card p-6">
          <div className="flex items-center gap-3"><Database className="text-gold" /><h2 className="section-title">本地資料</h2></div>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4">
            <input className="mt-1" type="checkbox" checked={preferences.retainAnalysis} onChange={(event) => void persist({ ...preferences, retainAnalysis: event.target.checked })} />
            <span><strong className="text-cream">分析完成後保留在此裝置</strong><span className="mt-1 block text-sm leading-6 text-mist">預設關閉。啟用後最近一次的結構化分析會寫入 IndexedDB；圖片與 OCR 原圖不會保存。</span></span>
          </label>
          <label className="mt-4 block"><span className="label">OCR 語言</span><select className="input-field" value={preferences.ocrLanguage} onChange={(event) => void persist({ ...preferences, ocrLanguage: event.target.value })}><option value="chi_tra">繁體中文 chi_tra</option></select></label>
          <label className="mt-4 block"><span className="label">主題模式</span><select className="input-field" value={preferences.theme} onChange={(event) => void persist({ ...preferences, theme: event.target.value as LocalPreferences['theme'] })}><option value="dark">深色靛藍</option><option value="system">跟隨系統（目前沿用深色視覺）</option></select></label>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm text-mist"><HardDrive className="mt-0.5 shrink-0 text-gold" size={18} /><div><strong className="text-cream">本站儲存空間</strong><p className="mt-1 leading-6">{storageSummary}</p><p className="mt-1 text-xs">模型快取通常佔最大比例；實際上限由瀏覽器與裝置決定。</p></div></div>
          <button className="btn-secondary mt-6 w-full" type="button" onClick={() => void clearEverything()}><Trash2 size={17} />清除我的所有本地資料</button>
        </article>
        <article className="glass-card p-6">
          <div className="flex items-center gap-3"><Cpu className="text-gold" /><h2 className="section-title">智慧模式</h2></div>
          <div className="mt-5 rounded-xl bg-white/5 p-4 text-sm leading-6 text-mist">
            <strong className="text-cream">{modelOption?.name ?? '正在讀取模型設定'}</strong>
            <p className="mt-2">{modelOption?.description}</p><p className="mt-2">下載：{modelOption?.approximateSize}</p><p>{modelOption?.recommendedMemory}</p>
          </div>
          <div className="mt-3 rounded-xl border border-gold/20 bg-gold/[0.06] p-3 text-sm text-gold">{runtimeMode}</div>
          <div className={`mt-4 rounded-xl border p-3 text-sm ${model.supported ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/20 bg-amber-300/10 text-amber-100'}`}>{model.message}</div>
          {model.status === 'loading' && (
            <div className="mt-4"><div className="flex justify-between text-xs text-mist"><span>模型載入進度</span><span>{model.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gold" style={{ width: `${model.progress}%` }} /></div></div>
          )}
          <p className="mt-4 text-xs leading-5 text-mist">模型只在你按下啟用後下載至瀏覽器快取，不會加入網站 repository。手機模式只生成短摘要，再與完整規則報告合併；若 Worker 無回應，時間到會直接重設，不再無限等待。</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {model.status === 'loading' ? (
              <button className="btn-secondary" type="button" onClick={() => void cancel()}><LoaderCircle className="animate-spin" size={17} />取消載入</button>
            ) : (
              <button className="btn-primary" type="button" disabled={!model.supported || model.status === 'ready'} onClick={() => void enableModel()}><Download size={17} />{model.status === 'ready' ? '模型已就緒' : '同意並啟用本地 AI'}</button>
            )}
            <button className="btn-secondary" type="button" onClick={() => void clearModel()}><Trash2 size={17} />清除模型快取</button>
          </div>
        </article>
      </div>
    </section>
  );
}
