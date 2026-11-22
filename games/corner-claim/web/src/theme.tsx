import { Cell, pieceById } from '@bg/corner-claim-engine';

export const COLORS = [
  { name: '파랑', fill: '#3a7bd5' },
  { name: '노랑', fill: '#e0a526' },
  { name: '빨강', fill: '#d0453a' },
  { name: '초록', fill: '#2f9e6a' },
];

const norm = (cells: Cell[]): Cell[] => {
  const mx = Math.min(...cells.map((c) => c[0]));
  const my = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my] as Cell).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
};
const key = (cells: Cell[]) => norm(cells).map((c) => c.join(',')).join(';');
export const rotate = (cells: Cell[]) => norm(cells.map(([x, y]) => [-y, x] as Cell));
export const flip = (cells: Cell[]) => norm(cells.map(([x, y]) => [-x, y] as Cell));
export const orientIndex = (piece: string, cells: Cell[]) => pieceById(piece)!.orients.findIndex((o) => key(o) === key(cells));

/** 조각 미리보기 (작은 칸 그림) */
export function PieceIcon({
  cells,
  color,
  size = 10,
  selected,
  onClick,
  onPointerDown,
  dragging,
  disabled,
  title,
}: {
  cells: Cell[];
  color: number;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  dragging?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const w = Math.max(...cells.map((c) => c[0])) + 1;
  const h = Math.max(...cells.map((c) => c[1])) + 1;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag className={`piece ${selected ? 'selected' : ''} ${dragging ? 'dragging' : ''} ${onPointerDown ? 'grabbable' : ''}`} onClick={onClick} onPointerDown={onPointerDown} disabled={onClick ? disabled : undefined} title={title} aria-label={title}>
      <svg width={w * size} height={h * size} viewBox={`0 0 ${w} ${h}`} aria-hidden>
        {cells.map(([x, y], i) => (
          <g key={i}>
            <rect x={x + 0.06} y={y + 0.06} width="0.88" height="0.88" rx="0.15" fill={COLORS[color].fill} />
            {/* 블록 광택·그림자 */}
            <rect x={x + 0.06} y={y + 0.06} width="0.88" height="0.36" rx="0.15" fill="#fff" opacity="0.28" />
            <rect x={x + 0.06} y={y + 0.8} width="0.88" height="0.14" rx="0.07" fill="#000" opacity="0.18" />
          </g>
        ))}
      </svg>
    </Tag>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#eef0f4" />
      <rect x="8" y="8" width="10" height="10" rx="2" fill="#3a7bd5" />
      <rect x="18" y="18" width="10" height="10" rx="2" fill="#3a7bd5" />
      <rect x="18" y="28" width="10" height="10" rx="2" fill="#3a7bd5" />
      <rect x="46" y="8" width="10" height="10" rx="2" fill="#e0a526" />
      <rect x="36" y="18" width="10" height="10" rx="2" fill="#e0a526" />
      <rect x="46" y="46" width="10" height="10" rx="2" fill="#d0453a" />
      <rect x="36" y="36" width="10" height="10" rx="2" fill="#d0453a" />
      <rect x="8" y="46" width="10" height="10" rx="2" fill="#2f9e6a" />
    </svg>
  );
}
