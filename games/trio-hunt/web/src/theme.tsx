/** 숫자 1~12마다 색과 작은 무늬 (같은 숫자를 한눈에 찾게) */
export const TONES = ['#c0392b', '#d35400', '#d4a017', '#7a9a1a', '#2e8b57', '#16a085', '#1f6fb0', '#3a4ab0', '#6a3fb0', '#9b3a8a', '#b03a5a', '#5a4a3a'];
const STICKER = ['●', '▲', '■', '◆', '★', '♥', '☀', '☾', '✿', '♣', '♠', '♦'];

export function TrioCard({ n, size = 'md', faceDown, onClick, glow, flip }: { n: number | null; size?: 'sm' | 'md' | 'lg'; faceDown?: boolean; onClick?: () => void; glow?: boolean; flip?: string }) {
  const Tag = onClick ? 'button' : 'span';
  if (faceDown || n === null)
    return (
      <Tag data-flip={flip} className={`th-card pc back ${size} ${glow ? 'glow' : ''}`} onClick={onClick} aria-label="뒤집힌 카드" />
    );
  const tone = TONES[n - 1];
  return (
    <Tag data-flip={flip} className={`th-card pc light ${size} ${glow ? 'glow' : ''}`} onClick={onClick} style={{ ['--tone' as string]: tone }} aria-label={`${n}`}>
      <b className="th-num pc-num">{n}</b>
      <i className="th-sticker" aria-hidden>
        {STICKER[n - 1]}
      </i>
    </Tag>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2a2440" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${10 + i * 15} ${16 + (i === 1 ? -4 : 0)}) rotate(${(i - 1) * 8} 10 15)`}>
          <rect width="20" height="30" rx="4" fill="#fffaf0" />
          <text x="10" y="21" textAnchor="middle" fontSize="15" fontWeight="900" fill="#1f6fb0" fontFamily="Georgia, serif">
            7
          </text>
        </g>
      ))}
    </svg>
  );
}
