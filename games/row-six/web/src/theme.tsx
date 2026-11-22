import { CSSProperties } from 'react';
import { penaltyOf } from '@bg/row-six-engine';

/** 벌점별 색 띠 (1점은 무늬 없음) */
export const PENALTY_TONE: Record<number, string> = { 1: 'p1', 2: 'p2', 3: 'p3', 5: 'p5', 7: 'p7' };

/** 숫자 카드: 가운데 큰 숫자 + 위쪽 벌점 마름모 */
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
}: {
  /** 움직임 추적 id (TableLayout의 FLIP) */
  flip?: string;
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
      className={`ncard ${size} ${PENALTY_TONE[p] ?? 'p1'} ${className}`}
      data-flip={flip}
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
      <span className="ncard-num">{n}</span>
      <span className="ncard-corner" aria-hidden>
        {n}
      </span>
    </Tag>
  );
}

/** 카드 뒷면 */
export function CardBack({ size = 'sm', className = '' }: { size?: 'xs' | 'sm' | 'md'; className?: string }) {
  return (
    <div className={`ncard back ${size} ${className}`} aria-hidden>
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
