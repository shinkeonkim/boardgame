/**
 * 트럼프 카드 (직접 그린 무늬 배치 · J/Q/K 초상 · 조커 광대). 원카드·홀덤 등 트럼프를 쓰는 게임이 함께 쓴다.
 * suit: 0 ♠ · 1 ♥ · 2 ♦ · 3 ♣ · -1 조커(rank 0 흑백, 1 컬러) / rank: 1(A)~13(K)
 */
import { CSSProperties } from 'react';
import { ArtDefs, Bust, SKIN } from './art';

export interface Card {
  id: string;
  suit: number;
  rank: number;
}

export const SUITS = ['♠', '♥', '♦', '♣'];
export const SUIT_NAMES = ['스페이드', '하트', '다이아', '클로버'];
export const isRed = (s: number) => s === 1 || s === 2;
const RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const cardName = (c: Card) => (c.suit < 0 ? (c.rank === 1 ? '컬러 조커' : '흑백 조커') : `${SUIT_NAMES[c.suit]} ${RANK[c.rank]}`);

/** 숫자 카드 무늬 자리 (가운데 칸 안, 0~1) */
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.5, 0.12], [0.5, 0.88]],
  3: [[0.5, 0.12], [0.5, 0.5], [0.5, 0.88]],
  4: [[0.22, 0.12], [0.78, 0.12], [0.22, 0.88], [0.78, 0.88]],
  5: [[0.22, 0.12], [0.78, 0.12], [0.5, 0.5], [0.22, 0.88], [0.78, 0.88]],
  6: [[0.22, 0.12], [0.78, 0.12], [0.22, 0.5], [0.78, 0.5], [0.22, 0.88], [0.78, 0.88]],
  7: [[0.22, 0.12], [0.78, 0.12], [0.5, 0.31], [0.22, 0.5], [0.78, 0.5], [0.22, 0.88], [0.78, 0.88]],
  8: [[0.22, 0.12], [0.78, 0.12], [0.5, 0.31], [0.22, 0.5], [0.78, 0.5], [0.5, 0.69], [0.22, 0.88], [0.78, 0.88]],
  9: [[0.22, 0.1], [0.78, 0.1], [0.22, 0.37], [0.78, 0.37], [0.5, 0.5], [0.22, 0.63], [0.78, 0.63], [0.22, 0.9], [0.78, 0.9]],
  10: [[0.22, 0.1], [0.78, 0.1], [0.5, 0.24], [0.22, 0.37], [0.78, 0.37], [0.22, 0.63], [0.78, 0.63], [0.5, 0.76], [0.22, 0.9], [0.78, 0.9]],
};

/** J·Q·K 그림 (무늬 색 옷) · 조커는 광대 */
function Court({ card }: { card: Card }) {
  const red = isRed(card.suit);
  const robe = red ? '#b8322a' : '#2a3a5a';
  const trim = '#d8a83a';
  if (card.suit < 0) {
    const color = card.rank === 1;
    return (
      <svg className="oc-court" viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <ArtDefs />
        <rect width="60" height="40" fill={color ? '#f6e7c8' : '#e8e8e8'} />
        <Bust robe={color ? '#6a3fb0' : '#2a2a2a'} skin={SKIN[0]} collar={color ? '#e0a526' : '#9a9a9a'}>
          <path d="M22 12 l-6 -9 9 6 5 -7 5 7 9 -6 -6 9 z" fill={color ? '#d0453a' : '#3a3a3a'} />
          <circle cx="16" cy="3" r="1.8" fill={color ? '#e0a526' : '#bbb'} />
          <circle cx="30" cy="2" r="1.8" fill={color ? '#3a7bd5' : '#bbb'} />
          <circle cx="44" cy="3" r="1.8" fill={color ? '#2f9e6a' : '#bbb'} />
          <path d="M26 19 q4 3 8 0" stroke="#7a2a2a" strokeWidth="0.8" fill="none" />
        </Bust>
      </svg>
    );
  }
  return (
    <svg className="oc-court" viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <ArtDefs />
      <rect width="60" height="40" fill="#fbf3e2" />
      <path d="M0 0 h60 v3 h-60 z M0 37 h60 v3 h-60 z" fill={robe} opacity="0.3" />
      {card.rank === 11 && (
        <Bust robe={robe} skin={SKIN[1]} collar={trim} hair={<path d="M22 18 Q21 8 30 8 Q39 8 38 18 Q35 12 30 12 Q25 12 22 18 Z" fill="#6a3a1a" />}>
          <path d="M21 11 q9 -7 18 0 l-1 1.5 h-16 z" fill={robe} />
          <path d="M36 8 q6 -6 8 -1 q-3 0 -6 3 z" fill={trim} />
        </Bust>
      )}
      {card.rank === 12 && (
        <Bust robe={robe} skin={SKIN[0]} collar={trim} hair={<path d="M21 30 Q19 8 30 7 Q41 8 39 30 Q35 22 30 22 Q25 22 21 30 Z" fill="#3a2414" />}>
          <path d="M23 9 l2 -5 2.5 3.5 2.5 -4.5 2.5 4.5 2.5 -3.5 2 5 z" fill={trim} />
          <circle cx="30" cy="30" r="1.2" fill="#3a7bd5" />
        </Bust>
      )}
      {card.rank === 13 && (
        <Bust robe={robe} skin={SKIN[1]} collar={trim}>
          <path d="M22 10 l1.5 -6 3 3 3.5 -5 3.5 5 3 -3 1.5 6 z" fill={trim} />
          <path d="M24.5 19 q5.5 8 11 0 q-1 5 -5.5 6 q-4.5 -1 -5.5 -6 z" fill="#7a5a3a" />
          <path d="M43 6 v30" stroke="#9aa1ab" strokeWidth="1.2" />
          <path d="M41 8 h4" stroke={trim} strokeWidth="1.2" />
        </Bust>
      )}
    </svg>
  );
}

export function PlayingCard({
  card,
  size = 'md',
  playable,
  onClick,
  flip,
  className = '',
  style,
  flipFrom,
}: {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  playable?: boolean;
  onClick?: () => void;
  flip?: string;
  /** 처음 나타날 때 어디서 날아오는지 (선택자, 예: '.oc-deck') */
  flipFrom?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const joker = card.suit < 0;
  const red = joker ? card.rank === 1 : isRed(card.suit);
  const Tag = onClick ? 'button' : 'div';
  const rank = joker ? '★' : RANK[card.rank];
  const sym = joker ? 'JOKER' : SUITS[card.suit];
  return (
    <Tag data-flip={flip} data-flip-from={flipFrom} className={`oc-card pc light ${size} ${red ? 'red' : 'black'} ${playable ? 'playable' : ''} ${className}`} onClick={onClick} style={style} aria-label={cardName(card)}>
      <span className="pc-idx tl">
        <b>{rank}</b>
        {!joker && <i>{sym}</i>}
      </span>
      <span className="pc-idx br">
        <b>{rank}</b>
        {!joker && <i>{sym}</i>}
      </span>
      <span className="oc-face">
        {joker || card.rank >= 11 ? (
          <span className="oc-court-frame">
            <Court card={card} />
            <b className="oc-court-sym">{joker ? 'JOKER' : sym}</b>
          </span>
        ) : (
          (PIPS[card.rank] ?? []).map(([x, y], i) => (
            <i key={i} className={`oc-pip ${card.rank === 1 ? 'ace' : ''} ${y > 0.6 ? 'flip' : ''}`} style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
              {sym}
            </i>
          ))
        )}
      </span>
    </Tag>
  );
}

export function CardBack({ size = 'md', className = '', flip, flipFrom }: { size?: 'sm' | 'md' | 'lg'; className?: string; flip?: string; flipFrom?: string }) {
  return <div data-flip={flip} data-flip-from={flipFrom} className={`oc-card pc back ${size} ${className}`} aria-hidden />;
}

