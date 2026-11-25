import { useRef, useState } from 'react';
import type { Stone } from '@bg/five-stones-engine';
import { StoneView } from './theme';

const STARS: Record<number, number[]> = { 13: [3, 6, 9], 15: [3, 7, 11], 19: [3, 9, 15] };

/**
 * 나무 판 + 줄 + 화점. 교차점마다 누를 수 있는 칸.
 * 마우스: 올리면 놓일 돌이 흐리게 보이고 누르면 바로 놓임. 터치: 한 번 누르면 미리 보기, 같은 곳을 한 번 더 누르면 놓임.
 */
export function Board({ size, board, myStone, canPlay, lastMove, winLine, onPlace }: { size: number; board: number[]; myStone: Stone | null; canPlay: boolean; lastMove: [number, number] | null; winLine: [number, number][] | null; onPlace: (x: number, y: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  // 사파리는 click 이 PointerEvent 가 아니라서, 직전 pointerdown 의 종류로 터치를 가림
  const touchRef = useRef(false);
  const win = new Set((winLine ?? []).map(([x, y]) => y * size + x));
  const pct = (i: number) => `${((i + 0.5) / size) * 100}%`;
  const tap = (i: number, touch: boolean) => {
    if (!canPlay || board[i] !== -1) return;
    if (touch && armed !== i) return setArmed(i);
    setArmed(null);
    onPlace(i % size, Math.floor(i / size));
  };
  const preview = canPlay ? (armed ?? hover) : null;
  return (
    <div className="fs-board" style={{ ['--n' as string]: size }} role="grid" aria-label={`${size}줄 오목판`}>
      <svg className="fs-lines" viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: size }, (_, i) => (
          <g key={i}>
            <line x1={0.5} y1={i + 0.5} x2={size - 0.5} y2={i + 0.5} />
            <line x1={i + 0.5} y1={0.5} x2={i + 0.5} y2={size - 0.5} />
          </g>
        ))}
        {(STARS[size] ?? []).flatMap((a) => (STARS[size] ?? []).map((b) => <circle key={`${a}-${b}`} cx={a + 0.5} cy={b + 0.5} r={0.12} className="fs-star" />))}
      </svg>
      <div className="fs-cells">
        {board.map((v, i) => {
          const x = i % size;
          const y = Math.floor(i / size);
          const isLast = lastMove?.[0] === x && lastMove?.[1] === y;
          return (
            <button
              key={i}
              type="button"
              className={`fs-cell ${v === -1 && canPlay ? 'open' : ''} ${armed === i ? 'armed' : ''}`}
              style={{ left: pct(x), top: pct(y) }}
              aria-label={`${String.fromCharCode(65 + x)}${size - y}${v === 0 ? ' 흑' : v === 1 ? ' 백' : ''}`}
              disabled={v !== -1 || !canPlay}
              onPointerDown={(e) => (touchRef.current = e.pointerType !== 'mouse')}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(i)}
              onPointerLeave={() => setHover((h) => (h === i ? null : h))}
              onClick={() => tap(i, touchRef.current)}
            >
              {v !== -1 ? (
                <span key={`s${v}`} className={`fs-drop ${isLast ? 'last' : ''}`}>
                  <StoneView stone={v as Stone} size={100} last={isLast} win={win.has(i)} />
                </span>
              ) : preview === i && myStone !== null ? (
                <StoneView stone={myStone} size={100} ghost />
              ) : null}
            </button>
          );
        })}
      </div>
      {winLine && winLine.length >= 2 && (
        <svg className="fs-winline" viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <line x1={winLine[0][0] + 0.5} y1={winLine[0][1] + 0.5} x2={winLine[winLine.length - 1][0] + 0.5} y2={winLine[winLine.length - 1][1] + 0.5} />
        </svg>
      )}
    </div>
  );
}
