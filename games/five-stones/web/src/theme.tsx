import type { Stone } from '@bg/five-stones-engine';

/** 바둑돌: 흑은 윤나는 검정, 백은 조개빛 — 윗면 하이라이트와 바닥 그림자 */
export function StoneView({ stone, size = 28, ghost, last, win }: { stone: Stone; size?: number; ghost?: boolean; last?: boolean; win?: boolean }) {
  const id = stone === 0 ? 'fs-black' : 'fs-white';
  return (
    <svg className={`fs-stone ${ghost ? 'ghost' : ''} ${win ? 'win' : ''}`} width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <radialGradient id="fs-black" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#6b6a6e" />
          <stop offset="0.35" stopColor="#2a292c" />
          <stop offset="1" stopColor="#0c0b0d" />
        </radialGradient>
        <radialGradient id="fs-white" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#f1ede4" />
          <stop offset="1" stopColor="#c9c1b0" />
        </radialGradient>
      </defs>
      <ellipse cx="21" cy="23" rx="17" ry="16" fill="rgba(40,25,5,.35)" />
      <circle cx="20" cy="20" r="17" fill={`url(#${id})`} stroke={stone === 0 ? '#000' : '#a89f8c'} strokeWidth="0.8" />
      {last && <circle cx="20" cy="20" r="5" fill={stone === 0 ? '#f2b33d' : '#d0453a'} />}
    </svg>
  );
}

export const stoneName = (s: Stone) => (s === 0 ? '흑' : '백');

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#d9a65a" />
      <path d="M12 16h40M12 26h40M12 36h40M12 46h40M16 12v40M26 12v40M36 12v40M46 12v40" stroke="#5a3c16" strokeWidth="1.6" />
      {[16, 26, 36, 46].map((x, i) => (
        <circle key={x} cx={x} cy={46 - i * 10} r="5.5" fill="#1b1a17" />
      ))}
      <circle cx="26" cy="16" r="5.5" fill="#fffaf1" stroke="#5a3c16" />
      <circle cx="46" cy="36" r="5.5" fill="#fffaf1" stroke="#5a3c16" />
    </svg>
  );
}
