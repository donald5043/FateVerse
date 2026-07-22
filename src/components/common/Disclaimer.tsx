import { ShieldCheck } from 'lucide-react';
import { DISCLAIMER, HEALTH_NOTICE } from '../../utils/constants';

export default function Disclaimer({ health = false }: { health?: boolean }) {
  return (
    <aside className="notice" aria-label="使用聲明">
      <div className="mb-2 flex items-center gap-2 font-semibold text-gold">
        <ShieldCheck size={18} aria-hidden="true" />
        文化探索與自我反思
      </div>
      <p>{DISCLAIMER}</p>
      {health && <p className="mt-2">{HEALTH_NOTICE}</p>}
    </aside>
  );
}
