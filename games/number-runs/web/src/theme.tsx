import type { Tile } from '@bg/number-runs-engine';

export const INK = ['#c23a2f', '#2563c4', '#a95f00', '#2b2b33', '#7a48c4'];
export const INK_NAME = ['빨강', '파랑', '주황', '검정', '보라'];

export function TileFace({
  t,
  size = 'md',
  selected,
  fresh,
  onClick,
  onPointerDown,
  flip,
  lifted,
}: {
  t: Tile;
  size?: 'sm' | 'md';
  selected?: boolean;
  fresh?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  flip?: string;
  lifted?: boolean;
}) {
  const Tag = onClick ? 'button' : 'span';
  const joker = t.n === 0;
  return (
    <Tag
      data-flip={flip}
      className={`rtile ${size} ${selected ? 'selected' : ''} ${fresh ? 'fresh' : ''} ${onPointerDown ? 'grabbable' : ''} ${lifted ? 'lifted' : ''}`}
      onClick={onClick}
      onPointerDown={onPointerDown} data-cbl={joker ? undefined : INK_NAME[t.color]?.[0]} aria-label={joker ? '조커' : `${INK_NAME[t.color]} ${t.n}`} style={{ ['--ink' as string]: joker ? '#c0392b' : INK[t.color] }}>
      {joker ? <span className="rtile-joker">☺</span> : <span className="rtile-n">{t.n}</span>}
      <span className="rtile-dot" aria-hidden />
    </Tag>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2b4a3e" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${9 + i * 16} 18)`}>
          <rect width="14" height="20" rx="3" fill="#fbf6ea" />
          <text x="7" y="14.5" textAnchor="middle" fontSize="11" fontWeight="900" fill={INK[i]} fontFamily="system-ui">
            {7 + i}
          </text>
        </g>
      ))}
      <rect x="9" y="42" width="46" height="4" rx="2" fill="#fbf6ea" opacity=".35" />
    </svg>
  );
}
