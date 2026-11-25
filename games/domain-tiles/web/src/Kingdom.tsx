import { useMemo, useState } from 'react';
import type { Domino, Half, Kingdom, Placement } from '@bg/domain-tiles-engine';
import { Castle, TerrainCell } from './theme';

const key = (x: number, y: number) => `${x},${y}`;

/** 보여 줄 범위: 지금 왕국을 감싸고, 크기 제한 안에서 더 뻗을 수 있는 만큼만 (꽉 차면 size×size) */
export function windowOf(k: Kingdom, size: number) {
  const cells = Object.keys(k).map((s) => s.split(',').map(Number));
  const minX = Math.min(...cells.map((c) => c[0]));
  const maxX = Math.max(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  const maxY = Math.max(...cells.map((c) => c[1]));
  const sx = size - (maxX - minX + 1);
  const sy = size - (maxY - minY + 1);
  return { x0: minX - sx, x1: maxX + sx, y0: minY - sy, y1: maxY + sy };
}

/**
 * 왕국 판. 내 놓기 차례면: 첫 칸 누르기(도미노 앞 칸) → 이어 놓을 옆 칸 누르기 → 놓임. 「반대로」면 뒤 칸부터.
 * 놓을 수 있는 칸만 밝고, 고른 칸에는 땅이 흐리게 미리 보여요.
 */
export function KingdomBoard({ kingdom, size, domino, legal, onPlace, cell = 40, small }: { kingdom: Kingdom; size: number; domino?: Domino | null; legal?: Placement[]; onPlace?: (p: Placement) => void; cell?: number; small?: boolean }) {
  const [first, setFirst] = useState<[number, number] | null>(null);
  const [swap, setSwap] = useState(false);
  const w = windowOf(kingdom, size);
  const cols = w.x1 - w.x0 + 1;
  const rows = w.y1 - w.y0 + 1;
  const active = !!(domino && legal && legal.length && onPlace);
  // 앞 칸(=첫 누름에 놓일 땅)과 뒤 칸
  const firstHalf: Half | undefined = domino ? (swap ? domino.b : domino.a) : undefined;
  const secondHalf: Half | undefined = domino ? (swap ? domino.a : domino.b) : undefined;
  const firstCells = useMemo(() => new Set((legal ?? []).map((p) => (swap ? key(p.x2, p.y2) : key(p.x1, p.y1)))), [legal, swap]);
  const secondCells = useMemo(() => {
    if (!first) return new Set<string>();
    return new Set((legal ?? []).filter((p) => (swap ? p.x2 === first[0] && p.y2 === first[1] : p.x1 === first[0] && p.y1 === first[1])).map((p) => (swap ? key(p.x1, p.y1) : key(p.x2, p.y2))));
  }, [legal, first, swap]);
  const tap = (x: number, y: number) => {
    if (!active) return;
    const k = key(x, y);
    if (first && secondCells.has(k)) {
      const p = swap ? { x1: x, y1: y, x2: first[0], y2: first[1] } : { x1: first[0], y1: first[1], x2: x, y2: y };
      setFirst(null);
      onPlace!(p);
      return;
    }
    if (firstCells.has(k)) setFirst([x, y]);
    else setFirst(null);
  };
  return (
    <div className={`dt-kingdom ${small ? 'small' : ''}`}>
      {active && (
        <div className="dt-place-help small">
          <span>{first ? '이어 놓을 옆 칸을 누르세요' : '먼저 놓을 칸을 누르세요'}</span>
          <button type="button" className="btn tiny ghost" onClick={() => (setSwap((s) => !s), setFirst(null))}>
            반대로 ({swap ? '뒤 칸부터' : '앞 칸부터'})
          </button>
        </div>
      )}
      <div className="dt-grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridTemplateRows: `repeat(${rows}, ${cell}px)` }} role="grid" aria-label={`왕국 (${size}×${size})`}>
        {Array.from({ length: rows }, (_, ry) =>
          Array.from({ length: cols }, (_, rx) => {
            const x = w.x0 + rx;
            const y = w.y0 + ry;
            const c = kingdom[key(x, y)];
            const k = key(x, y);
            const isFirst = first && first[0] === x && first[1] === y;
            const canFirst = active && !first && firstCells.has(k);
            const canSecond = active && !!first && secondCells.has(k);
            return (
              <button
                key={k}
                type="button"
                className={`dt-slot ${c ? 'filled' : ''} ${canFirst || canSecond ? 'can' : ''} ${isFirst ? 'armed' : ''}`}
                disabled={!!c || !(canFirst || canSecond || isFirst)}
                onClick={() => tap(x, y)}
                aria-label={c ? undefined : `${x},${y} 빈칸`}
              >
                {c ? 'castle' in c ? <Castle size={cell} /> : <TerrainCell half={c} size={cell} /> : isFirst && firstHalf ? <TerrainCell half={firstHalf} size={cell} ghost /> : canSecond && secondHalf ? <TerrainCell half={secondHalf} size={cell} ghost /> : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
