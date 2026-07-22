import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () => {
      // PWA 更新失敗不影響主要功能。
    },
  });

  if (!needRefresh) return null;

  return (
    <aside className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-lg rounded-2xl border border-gold/30 bg-ink/95 p-4 shadow-2xl backdrop-blur lg:bottom-5" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <RefreshCw className="mt-0.5 shrink-0 text-gold" size={18} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-cream">FateVerse 有新版本</p>
          <p className="mt-1 text-sm leading-6 text-mist">重新載入後才會套用最新功能與籤詩資料。</p>
          <button className="btn-primary mt-3" type="button" onClick={() => void updateServiceWorker(true)}>立即更新</button>
        </div>
        <button className="rounded-lg p-1 text-mist hover:text-cream" type="button" aria-label="稍後更新" onClick={() => setNeedRefresh(false)}><X size={18} /></button>
      </div>
    </aside>
  );
}
