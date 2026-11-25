import type { Card } from '@bg/hearts-engine';
import { isQueenOfSpades } from '@bg/hearts-engine';

/** 이번 판에 먹은 점수 카드 요약: 하트 수 · 스페이드 Q · 다이아 J */
export function TakenBadge({ cards, jackBonus }: { cards: Card[]; jackBonus: boolean }) {
  const hearts = cards.filter((c) => c.suit === 1).length;
  const queen = cards.some(isQueenOfSpades);
  const jack = jackBonus && cards.some((c) => c.suit === 2 && c.rank === 11);
  if (!hearts && !queen && !jack) return <span className="hr-taken muted small">점수 카드 없음</span>;
  return (
    <span className="hr-taken" aria-label={`하트 ${hearts}장${queen ? ', 스페이드 Q' : ''}${jack ? ', 다이아 J' : ''}`}>
      {hearts > 0 && (
        <span className="hr-chip heart">
          <HeartIcon /> {hearts}
        </span>
      )}
      {queen && <span className="hr-chip queen">♠Q</span>}
      {jack && <span className="hr-chip jack">♦J</span>}
    </span>
  );
}

export function HeartIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <path d="M10 17s-7-4.4-7-9.4C3 4.8 5 3 7.2 3 8.6 3 9.6 3.8 10 4.8 10.4 3.8 11.4 3 12.8 3 15 3 17 4.8 17 7.6 17 12.6 10 17 10 17z" fill="#d0453a" />
    </svg>
  );
}

export const DIR_TEXT = { left: '왼쪽 사람', right: '오른쪽 사람', across: '맞은편 사람', hold: '' } as const;

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#1f5a3a" />
      <rect x="12" y="12" width="24" height="34" rx="4" fill="#fffaf0" transform="rotate(-12 24 29)" />
      <rect x="28" y="16" width="24" height="34" rx="4" fill="#fffaf0" transform="rotate(10 40 33)" />
      <path d="M40 30c-3-5-10-3-9 3 1 4 6 7 9 10 3-3 8-6 9-10 1-6-6-8-9-3z" fill="#d0453a" />
      <text x="17" y="30" fontSize="12" fontWeight="900" fill="#1f2430" fontFamily="Georgia, serif" transform="rotate(-12 24 29)">
        Q
      </text>
    </svg>
  );
}
