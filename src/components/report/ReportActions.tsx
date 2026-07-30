import { Check, Copy, Printer } from 'lucide-react';
import { useState } from 'react';
import type { ProfileInput } from '../../types/fate';
import ShareLinkButton from '../common/ShareLinkButton';

export default function ReportActions({ summary, profile }: { summary: string; profile?: ProfileInput }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`萬象命書 FateVerse｜核心摘要\n\n${summary}\n\n僅供文化探索、娛樂與自我反思。`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  /*
   * 手機直式只顯示圖示。
   *
   * 三顆帶文字的按鈕在 390px 寬會擠成兩排（約 110px 高），把報告首屏那兩句
   * 結論推到螢幕外——而它們是工具，不是內容。圖示版一排放得下（約 44px）。
   *
   * 文字不是刪掉而是移到 aria-label 與 title：螢幕閱讀器和滑鼠停留都還讀得到，
   * 只有視覺上收起來。
   */
  const label = (text: string) => ({ 'aria-label': text, title: text });

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button className="btn-secondary min-h-10 px-3 py-2 text-sm sm:px-4" type="button" onClick={() => void copy()} {...label(copied ? '已複製' : '複製摘要')}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
        <span className="hidden sm:inline">{copied ? '已複製' : '複製摘要'}</span>
      </button>
      {profile && <ShareLinkButton profile={profile} />}
      <button className="btn-secondary min-h-10 px-3 py-2 text-sm sm:px-4" type="button" onClick={() => window.print()} {...label('列印／存成 PDF')}>
        <Printer size={16} />
        <span className="hidden sm:inline">列印／存成 PDF</span>
      </button>
    </div>
  );
}
