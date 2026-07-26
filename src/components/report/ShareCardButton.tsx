import { ImageDown } from 'lucide-react';
import { useState } from 'react';
import { renderShareCard, shareCardToBlob, type ShareCardData } from '../../utils/share-card';

/** 是否能用系統分享送出檔案。不支援時走下載，不報錯。 */
function canShareFile(file: File): boolean {
  return typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * 產生命盤分享圖。
 * 個資保護：暱稱預設空白，留空時圖上不會出現任何稱謂；出生資料一律不畫。
 */
export default function ShareCardButton({ data }: { data: Omit<ShareCardData, 'nickname'> }) {
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const canvas = document.createElement('canvas');
      renderShareCard({ ...data, nickname }, canvas);
      const blob = await shareCardToBlob(canvas);
      const file = new File([blob], 'fateverse.png', { type: 'image/png' });

      if (canShareFile(file)) {
        try {
          await navigator.share({ files: [file], title: '萬象命書 FateVerse' });
          return;
        } catch {
          // 使用者取消或系統分享失敗時，退回下載。
        }
      }
      downloadBlob(blob, 'fateverse.png');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '產生分享圖失敗，請再試一次。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-4">
      <label className="block">
        <span className="text-xs text-mist">暱稱（可留空，留空的圖上不會有任何稱謂）</span>
        <input
          className="input-field mt-1.5"
          value={nickname}
          maxLength={12}
          placeholder="不填也可以"
          onChange={(event) => setNickname(event.target.value)}
        />
      </label>
      <button className="btn-secondary mt-3 w-full" type="button" disabled={busy} onClick={() => void generate()}>
        <ImageDown size={17} />{busy ? '產生中…' : '產生分享圖'}
      </button>
      {error && <p className="mt-2 text-xs text-rose-200" role="alert">{error}</p>}
      <p className="mt-2 text-[11px] leading-5 text-mist/70">
        圖上只有五行雷達、速寫標語與命盤標籤，不含生日與出生時間。圖片在你的裝置上繪製，不會上傳。
      </p>
    </div>
  );
}
