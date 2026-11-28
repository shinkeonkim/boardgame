import type { Card } from '@bg/orbit-tasks-engine';

export const SUIT = [
  { name: '분홍', short: '분', fill: '#e0559b', ink: '#fff' },
  { name: '파랑', short: '파', fill: '#3b7be0', ink: '#fff' },
  { name: '초록', short: '초', fill: '#2fa865', ink: '#fff' },
  { name: '노랑', short: '노', fill: '#e6b422', ink: '#3a2a00' },
  { name: '로켓', short: '로', fill: '#1b1f38', ink: '#fff' },
];
export const cardName = (c: Card) => `${SUIT[c.suit].name} ${c.rank}`;

/** 행성 무늬 (색마다 다른 모양 — 색을 구분하기 어려워도 알아보게) */
function Emblem({ suit }: { suit: number }) {
  const c = 'rgba(255,255,255,.85)';
  switch (suit) {
    case 0:
      return <circle cx="20" cy="20" r="7" fill="none" stroke={c} strokeWidth="2.4" />;
    case 1:
      return (
        <>
          <circle cx="20" cy="20" r="6" fill={c} />
          <ellipse cx="20" cy="20" rx="11" ry="3.4" fill="none" stroke={c} strokeWidth="1.8" transform="rotate(-20 20 20)" />
        </>
      );
    case 2:
      return <path d="M20 11l3 6 6 1-4.5 4.4 1 6.6L20 26l-5.5 3 1-6.6L11 18l6-1z" fill={c} />;
    case 3:
      return <path d="M20 12a8 8 0 1 0 6 13 7 7 0 0 1-6-13z" fill={c} />;
    default:
      return <path d="M24 9c5 2 7 7 7 11l-5 2-6-6 2-5c1-1 1-2 2-2zM19 15l-6 2 3 3zM27 23l-2 6-3-3zM16 27l-4 4" fill="none" stroke="#f2b33d" strokeWidth="2" strokeLinejoin="round" />;
  }
}

/** 우주 카드: 색 바탕 + 큰 숫자 + 행성 무늬. 로켓은 짙은 남색에 금빛 로켓 */
export function SpaceCard({ card, size = 'md', onClick, playable, dim, selected, className = '', flip, flipFrom }: { card: Card; size?: 'xs' | 'sm' | 'md'; onClick?: () => void; playable?: boolean; dim?: boolean; selected?: boolean; className?: string; flip?: string; flipFrom?: string }) {
  const s = SUIT[card.suit];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      data-flip={flip}
      data-flip-from={flipFrom}
      data-cbl={s.short}
      className={`ot-card pc ${size} ${card.suit === 4 ? 'rocket' : ''} ${playable ? 'playable' : ''} ${dim ? 'dim' : ''} ${selected ? 'selected' : ''} ${className}`}
      style={{ ['--suit' as string]: s.fill, ['--ink' as string]: s.ink }}
      onClick={onClick}
      aria-label={cardName(card)}
    >
      <b className="ot-num">{card.rank}</b>
      <svg className="ot-emblem" viewBox="0 0 40 40" aria-hidden>
        <Emblem suit={card.suit} />
      </svg>
      <b className="ot-num corner">{card.rank}</b>
    </Tag>
  );
}

export const SIGNAL_TEXT = { top: '가장 높음', bottom: '가장 낮음', only: '하나뿐' } as const;
export function SignalMark({ kind }: { kind: 'top' | 'bottom' | 'only' }) {
  return (
    <span className={`ot-signal ${kind}`} title={SIGNAL_TEXT[kind]}>
      {kind === 'top' ? '▲' : kind === 'bottom' ? '▼' : '●'} {SIGNAL_TEXT[kind]}
    </span>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#141a3a" />
      <circle cx="32" cy="34" r="15" fill="none" stroke="#8f86ff" strokeWidth="2.5" strokeDasharray="4 4" />
      <circle cx="32" cy="34" r="6" fill="#e6b422" />
      <path d="M44 10c5 2 8 7 8 12l-6 2-6-6 2-6c1-1 1-2 2-2z" fill="#fff" />
      <path d="M40 18l-6 2 2 2zM46 24l-2 6-2-2z" fill="#e0559b" />
    </svg>
  );
}
