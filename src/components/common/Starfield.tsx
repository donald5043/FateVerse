export const STARS = [
  { top: 8, left: 14, size: 2, delay: 0 },
  { top: 15, left: 78, size: 3, delay: 0.6 },
  { top: 22, left: 45, size: 2, delay: 1.4 },
  { top: 30, left: 92, size: 2, delay: 0.3 },
  { top: 38, left: 6, size: 3, delay: 2.1 },
  { top: 46, left: 60, size: 2, delay: 1.1 },
  { top: 55, left: 25, size: 2, delay: 1.8 },
  { top: 62, left: 85, size: 3, delay: 0.8 },
  { top: 70, left: 10, size: 2, delay: 2.6 },
  { top: 78, left: 52, size: 2, delay: 0.2 },
  { top: 85, left: 30, size: 3, delay: 1.6 },
  { top: 90, left: 75, size: 2, delay: 2.2 },
  { top: 12, left: 60, size: 2, delay: 1.9 },
  { top: 50, left: 40, size: 2, delay: 0.5 },
  { top: 65, left: 95, size: 2, delay: 2.4 },
  { top: 25, left: 20, size: 3, delay: 1.2 },
  { top: 5, left: 90, size: 2, delay: 2.8 },
  { top: 95, left: 15, size: 2, delay: 0.9 },
] as const;

/**
 * 星座連線：載入時把幾顆星連起來，線條像被描出來一樣浮現。
 *
 * 為什麼是這個效果：使用者要的是「神祕感」，而星圖被一筆一筆描出來
 * 正是這個站在做的事——把散落的資料連成一個說法。
 *
 * 成本上它幾乎是免費的：**只在載入時播一次**，播完就是一張靜態的線稿，
 * 之後不再佔用任何一幀。所以它不受「無限動畫只能動 transform／opacity」
 * 那條預算限制（見 tests/motion-budget.test.ts）——描線用的 stroke-dashoffset
 * 確實需要重繪，但一輩子只重繪那兩秒，換到的視覺份量遠超過代價。
 *
 * 連線挑的是彼此距離適中的星：太近看不出是線，太遠會橫跨整個畫面變成雜訊。
 *
 * 「太遠」要以**手機直式**去量，不能看百分比。viewBox 是 0–100 的方形，
 * 但 preserveAspectRatio="none" 會把它拉成螢幕的形狀——在 390×844 上
 * 縱向被拉長 2.16 倍，於是看起來只差 25% 的一段垂直位移，實際上是
 * 兩百多像素、從標題頂端劃到副標下方的一道刮痕。第一版就是這樣，
 * 截圖上像是有人在畫面上刮了幾刀。
 *
 * 所以每一對星都用 390×844 投影後的實際長度篩過（見
 * tests/constellation.test.ts）：不超過 180px，也不短於 40px。
 * 剩下的就是幾個小星團，是背景紋理而不是穿過內容的線。
 */
export const CONSTELLATION_LINES: readonly (readonly [number, number])[] = [
  [0, 15], [15, 2], [2, 12], [12, 1], [1, 16], [1, 3],
  [4, 6], [6, 13], [13, 5], [5, 7], [7, 14],
  [6, 8], [8, 10], [10, 9], [9, 11], [10, 17],
] as const;

export default function Starfield() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/*
        用百分比座標系統對齊上面那些星的位置。preserveAspectRatio="none"
        讓 viewBox 直接對應 0–100% 的畫面，線的端點才會剛好落在星星上。
      */}
      <svg
        className="fv-constellation absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {CONSTELLATION_LINES.map(([from, to], index) => (
          <line
            key={`${from}-${to}`}
            x1={STARS[from].left}
            y1={STARS[from].top}
            x2={STARS[to].left}
            y2={STARS[to].top}
            /* pathLength=1 讓每條線不論實際長短都用同一組 dash 值，
               不必替每條線各算一次長度。 */
            pathLength={1}
            style={{ animationDelay: `${0.5 + index * 0.13}s` }}
          />
        ))}
      </svg>

      {STARS.map((star, index) => (
        <span
          className="fv-star"
          key={index}
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            '--twinkle-duration': `${3 + star.delay}s`,
            '--twinkle-delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
