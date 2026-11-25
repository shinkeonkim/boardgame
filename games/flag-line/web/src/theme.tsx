export const TROOP_COLORS = ['#d0533f', '#e0a526', '#2f9e6a', '#3a7bd5', '#8a5cd0', '#e06aa8'];
export const TROOP_NAMES = ['빨강', '노랑', '초록', '파랑', '보라', '분홍'];

/**
 * 부대 카드 그림: 하늘 + 언덕 + 그 색 깃발 + 숫자만큼의 창 (1~10). 가로로 놓인 작은 카드에서도 가운데가 보이게 slice.
 */
function TroopArt({ color, value }: { color: string; value: number }) {
  const n = Math.min(value, 10);
  return (
    <svg className="troop-art" viewBox="0 0 60 84" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="60" height="84" style={{ fill: `color-mix(in srgb, ${color} 35%, #f3ead6)` }} />
      <rect width="60" height="40" style={{ fill: `color-mix(in srgb, ${color} 18%, #fffaf0)` }} opacity="0.7" />
      <path d="M0 52 Q15 42 30 48 T60 44 V84 H0 Z" style={{ fill: `color-mix(in srgb, ${color} 30%, #6a7a4a)` }} />
      <path d="M0 62 Q20 54 38 60 T60 58 V84 H0 Z" style={{ fill: `color-mix(in srgb, ${color} 25%, #4a5a32)` }} />
      {/* 깃발 */}
      <path d="M44 14 V46" stroke="#5a3a22" strokeWidth="1.2" />
      <path d="M44.6 14 q7 -2 12 1 q-5 3 0 7 q-5 2.5 -12 0.5 z" style={{ fill: color }} stroke="rgba(0,0,0,.35)" strokeWidth="0.5" />
      {/* 창 (숫자만큼, 두 줄로) */}
      {Array.from({ length: n }, (_, i) => {
        const row = i < 5 ? 0 : 1;
        const k = row ? i - 5 : i;
        const x = 8 + k * 10 + row * 5;
        const y = row ? 74 : 66;
        return (
          <g key={i}>
            <path d={`M${x} ${y} V${y - 18}`} stroke="#4a3220" strokeWidth="1" />
            <path d={`M${x} ${y - 21} l1.4 3.4 h-2.8 z`} fill="#d8dce4" />
            <circle cx={x} cy={y + 2} r="2.6" style={{ fill: `color-mix(in srgb, ${color} 70%, black)` }} />
          </g>
        );
      })}
    </svg>
  );
}

export function Troop({ color, value, size = 'md', selected, onClick, className = '', flip }: { color: number; value: number; size?: 'xs' | 'sm' | 'md'; selected?: boolean; onClick?: () => void; className?: string; flip?: string }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag data-flip={flip} data-cbl={TROOP_NAMES[color][0]} className={`troop pc ${size} ${selected ? 'selected' : ''} ${className}`} style={{ ['--tc' as string]: TROOP_COLORS[color] }} onClick={onClick} aria-label={`${TROOP_NAMES[color]} ${value}`}>
      <TroopArt color={TROOP_COLORS[color]} value={value} />
      <span className="troop-num pc-num">{value}</span>
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
