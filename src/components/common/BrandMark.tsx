import { Compass } from 'lucide-react';

export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="brand-orbit grid size-[34px] place-items-center rounded-[10px] bg-gradient-to-br from-gold to-[#8b6f3a] text-ink">
        <Compass size={19} aria-hidden="true" strokeWidth={2.2} />
      </span>
      <span className={compact ? 'hidden sm:block' : ''}>
        <span className="block font-serif text-[17px] font-bold leading-tight tracking-[0.02em] text-cream">萬象命書</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">FateVerse</span>
      </span>
    </div>
  );
}
