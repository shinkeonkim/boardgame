/** 숫자 카드: 숫자가 클수록 따뜻한 색 (1 보라 → 100 주황) */
export function NumCard({ n, size = 'md', className = '', flip }: { n: number; size?: 'sm' | 'md' | 'lg'; className?: string; flip?: string }) {
  const hue = 270 - (n / 100) * 245;
  return (
    <div data-flip={flip} className={`sc-card pc ${size} ${className}`} style={{ ['--h' as string]: hue }} aria-label={`${n}`}>
      <span className="sc-n">{n}</span>
      <span className="sc-corner">{n}</span>
    </div>
  );
}

export function Lives({ n }: { n: number }) {
  return (
    <span className="sc-res" aria-label={`생명 ${n}`}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 20 20" aria-hidden>
          <path d="M10 17s-7-4.4-7-9.4C3 4.8 5 3 7.2 3 8.6 3 9.6 3.8 10 4.8 10.4 3.8 11.4 3 12.8 3 15 3 17 4.8 17 7.6 17 12.6 10 17 10 17z" fill="#e0483c" />
        </svg>
      ))}
      {n === 0 && <span className="muted small">없음</span>}
    </span>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="sc-res" aria-label={`수리검 ${n}`}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 20 20" aria-hidden>
          <path d="M10 1l2.2 6.3L19 10l-6.8 2.7L10 19l-2.2-6.3L1 10l6.8-2.7z" fill="#8fa3b8" stroke="#3d4d5e" strokeWidth="1" />
          <circle cx="10" cy="10" r="1.8" fill="#3d4d5e" />
        </svg>
      ))}
      {n === 0 && <span className="muted small">없음</span>}
    </span>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#221a3a" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#b49cff" strokeWidth="2" opacity=".6" />
      <circle cx="32" cy="32" r="11" fill="none" stroke="#b49cff" strokeWidth="2" />
      <rect x="22" y="20" width="20" height="26" rx="4" fill="#fffaf1" />
      <text x="32" y="38" textAnchor="middle" fontSize="13" fontWeight="900" fill="#221a3a" fontFamily="Georgia, serif">
        42
      </text>
    </svg>
  );
}
