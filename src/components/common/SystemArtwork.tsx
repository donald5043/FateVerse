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
  | 'fusion';

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
};

const ROUTE_ARTWORK: Record<string, SystemArtworkKind> = {
  '/profile': 'bazi',
  '/daily': 'daily',
  '/tarot': 'tarot',
  '/palm': 'palm',
  '/fortune': 'fortune',
  '/mirror': 'name',
  '/ritual': 'tarot',
  '/imprint': 'western',
  '/shared': 'fusion',
  '/narrative': 'name',
  '/capsule': 'daily',
  '/synastry': 'fusion',
  '/about': 'fusion',
  '/privacy': 'daily',
  '/settings': 'numerology',
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
      <figcaption><span>命理章節</span>{meta.label}</figcaption>
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
