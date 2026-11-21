export const TROOP_COLORS = ['#d0533f', '#e0a526', '#2f9e6a', '#3a7bd5', '#8a5cd0', '#e06aa8'];
export const TROOP_NAMES = ['빨강', '노랑', '초록', '파랑', '보라', '분홍'];

export function Troop({ color, value, size = 'md', selected, onClick, className = '' }: { color: number; value: number; size?: 'xs' | 'sm' | 'md'; selected?: boolean; onClick?: () => void; className?: string }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`troop ${size} ${selected ? 'selected' : ''} ${className}`} style={{ ['--tc' as string]: TROOP_COLORS[color] }} onClick={onClick} aria-label={`${TROOP_NAMES[color]} ${value}`}>
      <span className="troop-num">{value}</span>
      <span className="troop-pip" aria-hidden />
    </Tag>
  );
}

export function FlagIcon({ owner, size = 22 }: { owner: 0 | 1 | null; size?: number }) {
  const fill = owner === null ? 'var(--muted)' : owner === 0 ? 'var(--side0)' : 'var(--side1)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="3" width="2" height="19" rx="1" fill="var(--ink)" />
      <path d="M7 4 L20 7 L7 11 Z" fill={fill} />
    </svg>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#1e2630" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${8 + i * 11} 18)`}>
          <rect x="3" y="0" width="1.6" height="26" fill="#cfd6e0" />
          <path d="M4.6 1 L12 3 L4.6 6 Z" fill={i < 2 ? '#d0533f' : i > 2 ? '#3a7bd5' : '#8792a2'} />
        </g>
      ))}
      <rect x="6" y="44" width="52" height="3" rx="1.5" fill="#cfd6e0" opacity=".5" />
    </svg>
  );
}
