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
      <defs>
        <linearGradient id="bd-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6dcc6" />
        </linearGradient>
        <radialGradient id="bd-pip" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#5a5248" />
          <stop offset="1" stopColor="#141210" />
        </radialGradient>
      </defs>
      {/* 아래 두께 */}
      <rect x="4" y="9" width="92" height="88" rx="20" fill={face === null ? `color-mix(in srgb, ${col} 55%, black)` : '#b9ad95'} />
      <rect x="4" y="4" width="92" height="90" rx="20" fill={face === null ? col : 'url(#bd-face)'} stroke={face === null ? 'rgb(0 0 0 / .25)' : col} strokeWidth="5" />
      <rect x="14" y="10" width="60" height="14" rx="7" fill="#fff" opacity={face === null ? 0.18 : 0.55} />
      {face === null ? (
        <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="900" fill="rgb(255 255 255 / .75)">
          ?
        </text>
      ) : (
        (PIPS[face] ?? []).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={face >= 7 ? 7.5 : 9} fill={face === 1 ? '#c8402f' : 'url(#bd-pip)'} stroke="rgba(255,255,255,.6)" strokeWidth="1" />)
      )}
    </svg>
  );
}

/** 컵 (가려진 주사위 개수) */
export function Cup({ seat, count, size = 46 }: { seat: number; count: number; size?: number }) {
  return (
    <span className="cup" style={{ ['--seat' as string]: seatColor(seat), width: size, height: size }} aria-label={`주사위 ${count}개`}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id="bd-cup" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity=".25" />
            <stop offset=".35" stopColor="#fff" stopOpacity=".28" />
            <stop offset=".6" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".3" />
          </linearGradient>
        </defs>
        <path d="M14 10 h36 l-5 46 h-26 z" fill="var(--seat)" stroke="rgb(0 0 0 / .35)" strokeWidth="2" />
        <path d="M14 10 h36 l-5 46 h-26 z" fill="url(#bd-cup)" />
        <path d="M17 30 h30 M16 22 h32" stroke="rgb(255 255 255 / .35)" strokeWidth="1.5" />
        <rect x="10" y="6" width="44" height="7" rx="3" fill="var(--seat)" stroke="rgb(0 0 0 / .35)" strokeWidth="2" />
        <rect x="10" y="6" width="44" height="7" rx="3" fill="url(#bd-cup)" />
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
