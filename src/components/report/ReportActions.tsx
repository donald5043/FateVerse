import { Check, Copy, Printer } from 'lucide-react';
import { useState } from 'react';

export default function ReportActions({ summary }: { summary: string }) {
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

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button className="btn-secondary min-h-10 px-4 py-2 text-sm" type="button" onClick={() => void copy()}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? '已複製' : '複製摘要'}</button>
      <button className="btn-secondary min-h-10 px-4 py-2 text-sm" type="button" onClick={() => window.print()}><Printer size={16} />列印／存成 PDF</button>
    </div>
  );
}
