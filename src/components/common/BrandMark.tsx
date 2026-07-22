import { Orbit } from 'lucide-react';

export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="brand-orbit grid size-10 place-items-center rounded-full border border-gold/50 bg-gold/10 text-gold">
        <Orbit size={22} aria-hidden="true" />
      </span>
      <span className={compact ? 'hidden sm:block' : ''}>
        <span className="block font-serif text-lg font-bold leading-tight text-cream">萬象命書</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">FateVerse</span>
      </span>
    </div>
  );
}
