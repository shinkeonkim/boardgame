import { CSSProperties } from 'react';
import { seatColor } from '@bg/ui';

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
  7: [[28, 24], [72, 24], [28, 50], [50, 50], [72, 50], [28, 76], [72, 76]],
  8: [[28, 22], [72, 22], [28, 41], [72, 41], [28, 59], [72, 59], [28, 78], [72, 78]],
};

/** 주사위 하나 (face가 null이면 가려진 주사위) */
export function Die({ face, seat = 0, size = 34, hit, wild, className = '', style }: { face: number | null; seat?: number; size?: number; hit?: boolean; wild?: boolean; className?: string; style?: CSSProperties }) {
  const col = seatColor(seat);
  return (
    <svg className={`die ${hit ? 'hit' : ''} ${wild ? 'wild' : ''} ${face === null ? 'hidden' : ''} ${className}`} width={size} height={size} viewBox="0 0 100 100" style={style} aria-label={face === null ? '가려진 주사위' : `주사위 ${face}`}>
      <rect x="4" y="4" width="92" height="92" rx="20" fill={face === null ? col : 'var(--die-face)'} stroke={face === null ? 'rgb(0 0 0 / .25)' : col} strokeWidth="6" />
      {face === null ? (
        <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="900" fill="rgb(255 255 255 / .75)">
          ?
        </text>
      ) : (
        (PIPS[face] ?? []).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={face >= 7 ? 7.5 : 9} fill={face === 1 ? '#d0533f' : 'var(--die-pip)'} />)
      )}
    </svg>
  );
}

/** 컵 (가려진 주사위 개수) */
export function Cup({ seat, count, size = 46 }: { seat: number; count: number; size?: number }) {
  return (
    <span className="cup" style={{ ['--seat' as string]: seatColor(seat), width: size, height: size }} aria-label={`주사위 ${count}개`}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        <path d="M14 10 h36 l-5 46 h-26 z" fill="var(--seat)" stroke="rgb(0 0 0 / .25)" strokeWidth="2" />
        <rect x="10" y="6" width="44" height="7" rx="3" fill="var(--seat)" stroke="rgb(0 0 0 / .25)" strokeWidth="2" />
      </svg>
      <b>{count}</b>
    </span>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2a1f1a" />
      <path d="M18 12 h28 l-4 30 h-20 z" fill="#b3542e" />
      <rect x="15" y="9" width="34" height="6" rx="3" fill="#c96a3e" />
      <rect x="22" y="40" width="20" height="20" rx="5" fill="#f6efe2" />
      <circle cx="27" cy="45" r="2.3" fill="#2a1f1a" />
      <circle cx="37" cy="55" r="2.3" fill="#2a1f1a" />
      <circle cx="32" cy="50" r="2.3" fill="#d0533f" />
    </svg>
  );
}
