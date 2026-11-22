import { CSSProperties } from 'react';
import type { Cat } from '@bg/yacht-engine';

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]],
};

/** 상아색 주사위 (윗면 광택·두께·오목한 눈). held = 남겨 둔 주사위 */
export function Die({ face, size = 56, held, className = '', style, onClick, label }: { face: number; size?: number; held?: boolean; className?: string; style?: CSSProperties; onClick?: () => void; label?: string }) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id="ya-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9dfc8" />
        </linearGradient>
        <radialGradient id="ya-pip" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#4a4038" />
          <stop offset="1" stopColor="#100c0a" />
        </radialGradient>
      </defs>
      <rect x="4" y="9" width="92" height="88" rx="22" fill="#b6a88c" />
      <rect x="4" y="4" width="92" height="90" rx="22" fill="url(#ya-face)" stroke={held ? '#c0612a' : '#cfc2a6'} strokeWidth={held ? 6 : 3} />
      <rect x="16" y="10" width="58" height="13" rx="6.5" fill="#fff" opacity="0.6" />
      {(PIPS[face] ?? []).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={face === 1 ? 12 : 9} fill={face === 1 ? '#c8402f' : 'url(#ya-pip)'} stroke="rgba(255,255,255,.6)" strokeWidth="1" />
      ))}
    </svg>
  );
  if (!onClick) return <span className={`ya-die ${held ? 'held' : ''} ${className}`} style={style}>{svg}</span>;
  return (
    <button type="button" className={`ya-die ${held ? 'held' : ''} ${className}`} style={style} onClick={onClick} aria-pressed={!!held} aria-label={label ?? `주사위 ${face}${held ? ', 남겨 둠' : ''}`}>
      {svg}
    </button>
  );
}

export const CAT_INFO: Record<Cat, { name: string; short: string; hint: string; icon: string }> = {
  ones: { name: '1', short: '1', hint: '1이 나온 눈의 합', icon: '⚀' },
  twos: { name: '2', short: '2', hint: '2가 나온 눈의 합', icon: '⚁' },
  threes: { name: '3', short: '3', hint: '3이 나온 눈의 합', icon: '⚂' },
  fours: { name: '4', short: '4', hint: '4가 나온 눈의 합', icon: '⚃' },
  fives: { name: '5', short: '5', hint: '5가 나온 눈의 합', icon: '⚄' },
  sixes: { name: '6', short: '6', hint: '6이 나온 눈의 합', icon: '⚅' },
  choice: { name: '초이스', short: '초이스', hint: '아무 조합 · 주사위 5개의 합', icon: '' },
  threeKind: { name: '트리플', short: '트리플', hint: '같은 눈 3개 이상 · 주사위 5개의 합', icon: '' },
  fourKind: { name: '포카드', short: '포카드', hint: '같은 눈 4개 이상 · 주사위 5개의 합', icon: '' },
  fullHouse: { name: '풀하우스', short: '풀하우스', hint: '같은 눈 3개 + 2개', icon: '' },
  smallStraight: { name: '스몰 스트레이트', short: 'S.스트', hint: '4개 연속 (1234 · 2345 · 3456)', icon: '' },
  largeStraight: { name: '라지 스트레이트', short: 'L.스트', hint: '5개 연속 (12345 · 23456)', icon: '' },
  yacht: { name: '요트', short: '요트', hint: '5개 모두 같은 눈 · 50점', icon: '' },
};

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#1f4a6e" />
      <path d="M10 44 q22 10 44 0 l-4 6 h-36 z" fill="#f6efe2" />
      <path d="M32 10 v32 M32 12 l14 26 h-14 z" stroke="#f6efe2" strokeWidth="2" fill="#f6efe2" />
      <path d="M30 18 l-12 20 h12 z" fill="#e0a526" />
      <rect x="40" y="40" width="16" height="16" rx="4" fill="#fffdf6" transform="rotate(12 48 48)" />
      <circle cx="44.5" cy="45" r="1.8" fill="#1d1a16" />
      <circle cx="51" cy="51.5" r="1.8" fill="#1d1a16" />
    </svg>
  );
}
