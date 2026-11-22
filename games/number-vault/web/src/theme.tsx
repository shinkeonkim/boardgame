import type { SeenTile } from '@bg/number-vault-engine';

/** 숫자 타일 (검정/하양). hidden=남에게 가려진 상태(내 것이면 숫자는 보이지만 표시) */
export function TileView({
  t,
  mine,
  size = 'md',
  selected,
  onClick,
  className = '',
  label,
}: {
  t: Pick<SeenTile, 'n' | 'color' | 'revealed'>;
  mine?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  label?: string;
}) {
  const Tag = onClick ? 'button' : 'div';
  const known = t.n !== null;
  return (
    <Tag
      className={`vtile ${size} ${t.color ? 'white' : 'black'} ${t.revealed ? 'open' : 'closed'} ${mine && !t.revealed ? 'mine-hidden' : ''} ${selected ? 'selected' : ''} ${className}`}
      onClick={onClick}
      aria-label={label ?? `${t.color ? '하얀' : '검은'} 타일 ${known ? (t.n === -1 ? '조커' : t.n) : '가려짐'}${t.revealed ? ' (공개됨)' : ''}`}
    >
      <span className="vtile-num">{known ? (t.n === -1 ? '–' : t.n) : ''}</span>
      {mine && !t.revealed && <span className="vtile-eye" title="다른 사람에게는 가려져 있어요" aria-hidden />}
      {!known && (
        // 가려진 타일 뒷면: 금고 다이얼
        <svg className="vtile-back" viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="10" cy="10" r="2.3" fill="currentColor" />
          <path d="M10 2.6v2.6M10 14.8v2.6M2.6 10h2.6M14.8 10h2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </Tag>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2b2f3a" />
      <rect x="10" y="16" width="13" height="30" rx="3" fill="#15171c" stroke="#5c6475" strokeWidth="1.5" />
      <rect x="25.5" y="16" width="13" height="30" rx="3" fill="#f4f1ea" />
      <rect x="41" y="16" width="13" height="30" rx="3" fill="#15171c" stroke="#5c6475" strokeWidth="1.5" />
      <text x="16.5" y="36" textAnchor="middle" fontSize="12" fontWeight="900" fill="#f4f1ea" fontFamily="system-ui">3</text>
      <text x="32" y="36" textAnchor="middle" fontSize="12" fontWeight="900" fill="#15171c" fontFamily="system-ui">?</text>
      <text x="47.5" y="36" textAnchor="middle" fontSize="12" fontWeight="900" fill="#f4f1ea" fontFamily="system-ui">9</text>
      <circle cx="32" cy="54" r="3" fill="#e8b04a" />
    </svg>
  );
}
