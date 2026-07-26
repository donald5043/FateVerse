import { ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * 巴納姆鏡子的首頁入口。
 *
 * 這是全站唯一沒有競品有的差異點：教使用者辨識冷讀術話術。
 * 刻意放在第一屏、與「開始探索命盤」並列，並用挑戰式提問開場——
 * 因為它不需要任何個人資料就能玩，是門檻最低的第一次體驗。
 */
export default function BarnumChallengeEntry() {
  return (
    <Link
      to="/mirror"
      data-testid="barnum-entry"
      className="lift group relative block overflow-hidden rounded-[22px] border border-vermilion/35 bg-gradient-to-br from-vermilion/[0.12] to-transparent p-4 sm:p-6"
    >
      <span
        className="pointer-events-none absolute -right-3 -top-7 select-none font-serif text-[7rem] font-black leading-none text-vermilion opacity-[0.08]"
        aria-hidden="true"
      >鏡</span>

      <div className="relative flex items-center gap-2.5 text-[#e8927f]">
        <Eye size={17} />
        <span className="eyebrow text-[#e8927f]">Can you tell?</span>
      </div>

      <p className="relative mt-2 font-serif text-xl font-bold leading-8 text-cream sm:text-[1.4rem]">
        你分得出來，哪一句是真的算出來的嗎？
      </p>
      <p className="relative mt-1.5 text-sm leading-6 text-mist">
        一組來自真實命盤，一組誰都適用。猜完告訴你每句用了哪種冷讀術。
      </p>

      <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
          玩玩看 <ArrowRight className="transition group-hover:translate-x-0.5" size={15} />
        </span>
        <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-2.5 py-1 text-xs text-gold">
          不用輸入任何資料也能玩
        </span>
      </div>
    </Link>
  );
}
