import { CSSProperties } from 'react';
import { penaltyOf } from '@bg/row-six-engine';

/** 벌점별 색 띠 (1점은 무늬 없음) */
export const PENALTY_TONE: Record<number, string> = { 1: 'p1', 2: 'p2', 3: 'p3', 5: 'p5', 7: 'p7' };

/** 숫자 카드: 가운데 큰 숫자 + 위쪽 벌점 마름모 */
/**
 * 카드 아랫단 그림: 벌점이 클수록 하늘이 어두워지고 양이 늘어난다 (1 = 맑은 풀밭, 7 = 번개 치는 밤).
 */
const SKY: Record<number, [string, string, string]> = {
  1: ['#cfe8f6', '#9fd07a', '#7ab654'],
  2: ['#f6e7b8', '#c9c56a', '#a8a84a'],
  3: ['#f6c79a', '#c99a5a', '#a87a3a'],
  5: ['#b9a8d8', '#7a6a9a', '#5a4a7a'],
  7: ['#4a3a5a', '#5a3a3a', '#3a2228'],
};
function Pasture({ p }: { p: number }) {
  const [sky, hill, ground] = SKY[p] ?? SKY[1];
  return (
    <svg className="ncard-art" viewBox="0 0 60 26" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="60" height="26" fill={sky} />
      {p >= 7 && <path d="M40 0 l-4 8 h3 l-3 7 7 -9 h-3 l3 -6 z" fill="#ffe27a" />}
      {p <= 2 && <circle cx="50" cy="6" r="3.4" fill="#fff3b0" />}
      <path d="M0 16 Q15 9 30 14 T60 12 V26 H0 Z" fill={hill} />
      <path d="M0 21 Q20 16 40 20 T60 19 V26 H0 Z" fill={ground} />
      {Array.from({ length: p }, (_, i) => {
        const x = 7 + ((i * 47) % 50);
        const y = 19 + (i % 2) * 3;
        return (
          <g key={i}>
            <ellipse cx={x} cy={y} rx="3" ry="2" fill={p >= 5 ? '#e8e2ea' : '#fffdf6'} />
            <circle cx={x + 2.6} cy={y - 0.6} r="1.1" fill="#3a3030" />
          </g>
        );
      })}
    </svg>
  );
}

export function NumberCard({
  n,
  flat,
  size = 'md',
  className = '',
  style,
  onClick,
  title,
  disabled,
  ariaLabel,
  flip,
  flipFrom,
}: {
  /** 움직임 추적 id (TableLayout의 FLIP) */
  flip?: string;
  /** 처음 나타날 때 어디서 날아오는지 (자리 번호나 선택자) */
  flipFrom?: string;
  n: number;
  flat?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const p = penaltyOf({ penalty: flat ? 'flat' : 'classic' }, n);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`ncard pc light ${size} ${PENALTY_TONE[p] ?? 'p1'} ${className}`}
      data-flip={flip}
      data-flip-from={flipFrom}
      style={style}
      onClick={onClick}
      title={title}
      disabled={onClick ? disabled : undefined}
      aria-label={ariaLabel ?? `${n}번 카드, 벌점 ${p}`}
    >
      <span className="ncard-pen" aria-hidden>
        {Array.from({ length: p }, (_, i) => (
          <i key={i} />
        ))}
      </span>
      {size !== 'xs' && <Pasture p={p} />}
      <span className="ncard-num pc-num">{n}</span>
      <span className="ncard-corner" aria-hidden>
        {n}
      </span>
    </Tag>
  );
}

/** 카드 뒷면 */
export function CardBack({ size = 'sm', className = '' }: { size?: 'xs' | 'sm' | 'md'; className?: string }) {
  return (
    <div className={`ncard pc back ${size} ${className}`} aria-hidden>
      <span className="ncard-back-mark">6</span>
    </div>
  );
}

/** 벌점 표시 (마름모 + 숫자) */
export function Penalty({ v, muted }: { v: number | null; muted?: boolean }) {
  return (
    <span className={`penalty ${muted ? 'muted' : ''}`} title="벌점">
      <i aria-hidden />
      {v ?? '?'}
    </span>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="var(--ink)" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={9 + i * 9} y={18} width="7" height="20" rx="1.6" fill="var(--panel)" opacity={0.55 + i * 0.09} />
      ))}
      <rect x="52" y="14" width="8" height="28" rx="1.8" fill="#d0533f" transform="rotate(12 56 28)" />
      <text x="32" y="56" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--panel)" fontFamily="system-ui">
        6
      </text>
    </svg>
  );
}
