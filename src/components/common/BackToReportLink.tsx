import { ArrowRight, ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFateStore } from '../../store/useFateStore';

/** 有報告時顯示的返回條；讓使用者從其他功能一鍵回到完整報告，不必重算。 */
export default function BackToReportLink({ note }: { note?: string }) {
  const hasReport = useFateStore((state) => Boolean(state.reportInput));
  const name = useFateStore((state) => state.profileInput?.name);
  if (!hasReport) return null;
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/25 bg-gold/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <ScrollText className="mt-0.5 shrink-0 text-gold" size={19} />
        <p className="text-sm leading-6 text-[#e8ddc5]">{note ?? `${name ? `${name}的` : '你的'}萬象報告已經建立好，隨時可以回去看，不用重算。`}</p>
      </div>
      <Link to="/report" className="btn-secondary shrink-0 self-start sm:self-auto">回到完整報告 <ArrowRight size={16} /></Link>
    </div>
  );
}
