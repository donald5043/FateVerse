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
      {/*
        字標在手機上也要看得到。
        原本 compact 模式是 `hidden sm:block`，390px 的手機只剩一顆圖示——
        但那個寬度的 header 只有圖示和漢堡鈕，實測還空著兩百多 px，
        沒有理由把品牌藏起來。窄螢幕只是把字級縮一點。
      */}
      <span>
        <span className={`block font-serif font-black leading-tight tracking-[0.02em] text-cream ${compact ? 'text-[15px] sm:text-[17px]' : 'text-[17px]'}`}>萬象命書</span>
        <span className={`block font-display italic tracking-[0.18em] text-mist ${compact ? 'text-[10px] sm:text-[11px]' : 'text-[11px]'}`}>FATEVERSE</span>
      </span>
    </div>
  );
}
