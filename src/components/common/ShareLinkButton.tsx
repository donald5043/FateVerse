import { Check, Copy, Link2, Share2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ProfileInput } from '../../types/fate';
import { buildShareUrl } from '../../utils/share-link';

/** 產生零後端的分享連結（把出生資料壓進 URL）。明確提醒連結含出生資料，姓名預設不含。 */
export default function ShareLinkButton({ profile }: { profile: ProfileInput }) {
  const [open, setOpen] = useState(false);
  const [includeName, setIncludeName] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const urlRef = useRef<HTMLInputElement>(null);

  const url = buildShareUrl(profile, { includeName });
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    setCopyError('');
    // 優先用非同步 Clipboard API；失敗時退回選取輸入框內容再 execCommand。
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
        return;
      }
    } catch {
      // 落到下方 fallback
    }
    const input = urlRef.current;
    if (input) {
      input.focus();
      input.select();
      input.setSelectionRange(0, url.length);
      try {
        if (document.execCommand('copy')) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
          return;
        }
      } catch {
        // ignore
      }
    }
    setCopyError('無法自動複製，請長按上方連結手動複製。');
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: '萬象命書 FateVerse 命盤', url });
    } catch {
      // 使用者取消或不支援時，不視為錯誤。
    }
  };

  return (
    <>
      <button className="btn-secondary min-h-10 px-4 py-2 text-sm" type="button" onClick={() => setOpen(true)}><Link2 size={16} />分享連結</button>
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="分享連結" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-indigo p-6 shadow-glow" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-cream">分享這份命盤</h2>
              <button type="button" aria-label="關閉" className="rounded-lg p-1.5 text-mist hover:bg-white/10 hover:text-cream" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <p className="mt-3 text-sm leading-6 text-mist">連結會把出生資料壓縮在網址裡，對方打開就能在自己的裝置上重新計算——完全不經過伺服器。</p>
            <div className="mt-4 rounded-xl border border-amber-200/25 bg-amber-200/[0.07] p-3.5 text-xs leading-6 text-amber-100">
              提醒：這個連結<strong>包含出生日期、時間與地區</strong>。只分享給你信任的人；任何拿到連結的人都能看到這份命盤。
            </div>
            <label className="mt-4 flex items-center gap-2.5 text-sm text-cream">
              <input type="checkbox" className="size-4 accent-gold" checked={includeName} onChange={(event) => setIncludeName(event.target.checked)} />
              連結也包含姓名（預設不含，較不敏感）
            </label>
            {/* 唯讀輸入框：手機上可長按選取，也作為 execCommand 複製的來源。 */}
            <input ref={urlRef} readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="mt-4 w-full break-all rounded-xl border border-white/10 bg-ink/60 p-3 text-xs text-mist" aria-label="分享連結" />
            {copyError && <p className="mt-2 text-xs text-rose-200">{copyError}</p>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {canNativeShare && <button className="btn-primary flex-1" type="button" onClick={() => void nativeShare()}><Share2 size={17} />分享…</button>}
              <button className={canNativeShare ? 'btn-secondary flex-1' : 'btn-primary w-full'} type="button" onClick={() => void copy()}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? '已複製連結' : '複製連結'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
