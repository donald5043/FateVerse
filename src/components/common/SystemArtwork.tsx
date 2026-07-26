export type SystemArtworkKind =
  | 'bazi'
  | 'ziwei'
  | 'western'
  | 'numerology'
  | 'name'
  | 'tarot'
  | 'fortune'
  | 'palm'
  | 'daily'
  | 'fusion'
  | 'profile'
  | 'ritual'
  | 'imprint'
  | 'shared'
  | 'narrative'
  | 'capsule'
  | 'synastry'
  | 'mirror'
  | 'about'
  | 'privacy'
  | 'settings';

const ARTWORK_META: Record<SystemArtworkKind, { label: string; alt: string }> = {
  bazi: { label: '八字四柱', alt: '四柱、藏干層次與五行循環交織的八字意象' },
  ziwei: { label: '紫微斗數', alt: '十二宮位、星曜與四化軌跡構成的紫微斗數意象' },
  western: { label: '西洋星盤', alt: '黃道十二宮、行星與相位線構成的本命星盤意象' },
  numerology: { label: '生命靈數', alt: '數字節點匯聚成生命路徑曼陀羅的靈數意象' },
  name: { label: '姓名學', alt: '抽象筆勢、五格結構與五行節點構成的姓名學意象' },
  tarot: { label: '塔羅', alt: '以月亮、道路與朝陽象徵過去現在未來的三張塔羅牌' },
  fortune: { label: '籤詩', alt: '籤筒、竹籤與留白籤紙構成的傳統抽籤意象' },
  palm: { label: '手相', alt: '三大掌紋與五行節點相互連結的手相版畫' },
  daily: { label: '今日指引', alt: '從月夜走向晨光、象徵每日方向的一張指引卡' },
  fusion: { label: '萬象合參', alt: '八字、紫微、星盤、靈數、塔羅與手相匯聚的綜合命理圖' },
  profile: { label: '探索命盤', alt: '出生紀錄、時間、地點與四柱座標匯聚成個人命盤的起點' },
  ritual: { label: '決策儀式', alt: '命運骰子在兩條選擇路徑之間落下、映照第一反應的決策儀式意象' },
  imprint: { label: '宇宙印記', alt: '木火土金水五種元素環繞獨特指紋、交織成個人命之圖騰' },
  shared: { label: '分享命盤', alt: '受保護的命盤透過一道光傳遞至另一份星圖、象徵自主分享' },
  narrative: { label: '人生劇本', alt: '一本展開的書延伸出多條人生章節與仍可選擇的道路' },
  capsule: { label: '時間膠囊', alt: '星光、信件與新芽封存在時間容器中、等待未來的自己開啟' },
  synastry: { label: '兩人合盤', alt: '兩張不同星圖相互交疊、形成共享空間又保留各自軌道' },
  mirror: { label: '巴納姆鏡子', alt: '不同面具在鏡中看見相似星圖、揭示巴納姆效應與冷讀機制' },
  about: { label: '關於萬象命書', alt: '命理資料、計算、符號與詮釋分層展開、呈現透明的方法框架' },
  privacy: { label: '隱私設計', alt: '個人星圖被完整收納在本機邊界與鎖具之內、沒有向外傳送' },
  settings: { label: '資料設定', alt: '可調節的星圖儀器、動態控制與本機收納象徵個人資料掌控' },
};

const ROUTE_ARTWORK: Record<string, SystemArtworkKind> = {
  '/profile': 'profile',
  '/daily': 'daily',
  '/tarot': 'tarot',
  '/palm': 'palm',
  '/fortune': 'fortune',
  '/mirror': 'mirror',
  '/ritual': 'ritual',
  '/imprint': 'imprint',
  '/shared': 'shared',
  '/narrative': 'narrative',
  '/capsule': 'capsule',
  '/synastry': 'synastry',
  '/about': 'about',
  '/privacy': 'privacy',
  '/settings': 'settings',
};

interface SystemArtworkProps {
  kind: SystemArtworkKind;
  className?: string;
  compact?: boolean;
  priority?: boolean;
}

export default function SystemArtwork({
  kind,
  className = '',
  compact = false,
  priority = false,
}: SystemArtworkProps) {
  const meta = ARTWORK_META[kind];
  return (
    <figure className={`system-artwork ${compact ? 'system-artwork-compact' : ''} ${className}`.trim()}>
      <img
        src={`${import.meta.env.BASE_URL}art/system-${kind}.webp`}
        alt={meta.alt}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
      />
      <span className="system-artwork-glow" aria-hidden="true" />
      <figcaption><span>萬象命書</span>{meta.label}</figcaption>
    </figure>
  );
}

export function RouteSystemArtwork({ pathname }: { pathname: string }) {
  const kind = ROUTE_ARTWORK[pathname];
  if (!kind) return null;
  return (
    <div className="page-container route-system-artwork print:hidden">
      <SystemArtwork kind={kind} compact priority />
    </div>
  );
}
