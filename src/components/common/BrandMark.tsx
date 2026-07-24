export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center">
        <svg viewBox="0 0 40 40" fill="none" className="size-10" aria-hidden="true">
          <circle cx="20" cy="20" r="18.5" stroke="rgba(216,184,117,.45)" strokeWidth="1" />
          <circle cx="20" cy="20" r="15" stroke="rgba(216,184,117,.2)" strokeWidth=".7" strokeDasharray="1.5 3" />
          <path d="M20 7.5 A12.5 12.5 0 1 0 20 32.5 A9.6 9.6 0 1 1 20 7.5 Z" fill="#d8b875" />
          <path d="M25.4 12.6 l1.25 3.35 3.35 1.25 -3.35 1.25 -1.25 3.35 -1.25 -3.35 -3.35 -1.25 3.35 -1.25 Z" fill="#ecd39a" />
        </svg>
      </span>
      <span className={compact ? 'hidden sm:block' : ''}>
        <span className="block font-serif text-[17px] font-black leading-tight tracking-[0.02em] text-cream">萬象命書</span>
        <span className="block font-display text-[11px] italic tracking-[0.18em] text-mist">FATEVERSE</span>
      </span>
    </div>
  );
}
