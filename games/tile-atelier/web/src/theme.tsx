import { CSSProperties } from 'react';
import { Board, GameConfig, wallColor } from '@bg/tile-atelier-engine';

export const TILE = [
  { name: '하늘', fill: '#4a90d9', mark: '◆' },
  { name: '노을', fill: '#e8a33a', mark: '●' },
  { name: '먹', fill: '#2f3340', mark: '▲' },
  { name: '산호', fill: '#e0614f', mark: '■' },
  { name: '옥', fill: '#4fae8a', mark: '✚' },
  { name: '자두', fill: '#8a5cd0', mark: '★' },
];

export function TileView({ color, size = 28, selected, onClick, ghost, first, style }: { color: number; size?: number; selected?: boolean; onClick?: () => void; ghost?: boolean; first?: boolean; style?: CSSProperties }) {
  const Tag = onClick ? 'button' : 'span';
  if (first)
    return (
      <Tag className="tile first" style={{ width: size, height: size, ...style }} onClick={onClick} aria-label="첫 플레이어 표시">
        1
      </Tag>
    );
  const t = TILE[color];
  return (
    <Tag className={`tile ${selected ? 'selected' : ''} ${ghost ? 'ghost' : ''}`} style={{ width: size, height: size, ['--tile' as string]: t.fill, ...style }} onClick={onClick} aria-label={`${t.name} 타일`}>
      <i aria-hidden>{t.mark}</i>
    </Tag>
  );
}

/** 벽 + 패턴 줄 + 바닥 */
export function BoardView({
  c,
  b,
  size = 26,
  onLine,
  onFloor,
  onWall,
  highlightLines,
  pendingRow,
}: {
  c: GameConfig;
  b: Board;
  size?: number;
  onLine?: (i: number) => void;
  onFloor?: () => void;
  onWall?: (row: number, col: number) => void;
  highlightLines?: Set<number>;
  pendingRow?: number | null;
}) {
  const n = c.colors;
  return (
    <div className="ta-board" style={{ ['--ts' as string]: `${size}px` }}>
      <div className="ta-lines">
        {b.lines.map((l, i) => (
          <div key={i} className={`ta-line ${highlightLines?.has(i) ? 'can' : ''} ${pendingRow === i ? 'pending' : ''}`} onClick={onLine && highlightLines?.has(i) ? () => onLine(i) : undefined} role={onLine ? 'button' : undefined} aria-label={`${i + 1}번째 줄`}>
            {Array.from({ length: i + 1 }, (_, k) => (k < l.count && l.color !== null ? <TileView key={k} color={l.color} size={size} /> : <span key={k} className="ta-slot" style={{ width: size, height: size }} />))}
          </div>
        ))}
      </div>
      <div className="ta-wall" style={{ gridTemplateColumns: `repeat(${n}, ${size}px)` }}>
        {b.wall.map((row, r) =>
          row.map((cell, col) => {
            const can = onWall && pendingRow === r && cell === null;
            return cell !== null ? (
              <TileView key={`${r}-${col}`} color={cell} size={size} />
            ) : (
              <span
                key={`${r}-${col}`}
                className={`ta-cell ${can ? 'can' : ''}`}
                style={{ width: size, height: size, ['--tile' as string]: c.freeWall ? 'transparent' : TILE[wallColor(n, r, col)].fill }}
                onClick={can ? () => onWall!(r, col) : undefined}
              >
                {!c.freeWall && <i>{TILE[wallColor(n, r, col)].mark}</i>}
              </span>
            );
          }),
        )}
      </div>
      <div className={`ta-floor ${onFloor ? 'can' : ''}`} onClick={onFloor} role={onFloor ? 'button' : undefined} aria-label="바닥">
        {c.floor.map((pen, i) => (
          <span key={i} className="ta-floor-slot" style={{ width: size, height: size }}>
            {b.floor[i] !== undefined ? <TileView color={b.floor[i]} first={b.floor[i] === -1} size={size - 4} /> : null}
            <small>{pen}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#f3ead8" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={10 + c * 15} y={10 + r * 15} width="13" height="13" rx="3" fill={TILE[(c - r + 5) % 5].fill} />),
      )}
    </svg>
  );
}
