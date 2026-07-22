import { CloudOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function NetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); setRestored(true); window.setTimeout(() => setRestored(false), 2500); };
    const handleOffline = () => { setOnline(false); setRestored(false); };
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  if (online && !restored) return null;
  return <div className={`relative z-[60] flex items-center justify-center gap-2 px-4 py-2 text-center text-xs ${online ? 'bg-emerald-800 text-emerald-50' : 'bg-amber-900 text-amber-50'}`} role="status">{online ? <Wifi size={15} /> : <CloudOff size={15} />}{online ? '網路已恢復。' : '目前離線：已快取的排盤、籤詩與今日指引仍可使用；首次 OCR 語言包與 AI 模型下載需連線。'}</div>;
}
