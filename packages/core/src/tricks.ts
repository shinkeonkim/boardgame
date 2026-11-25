/**
 * 트릭 테이킹 공통 부품 (하트·궤도 임무 등): 낸 무늬 따르기, 트릭 승자, 카드 세기.
 * 카드 모양은 트럼프 카드와 같다 — suit: 0 ♠ · 1 ♥ · 2 ♦ · 3 ♣ (게임마다 다른 무늬 수도 됨), rank: 숫자.
 * 「높이」는 게임이 정함 (트럼프는 A=1 을 14로 보는 aceHigh).
 */
export interface TrickCard {
  id: string;
  suit: number;
  rank: number;
}
export interface TrickPlay<C extends TrickCard = TrickCard> {
  seat: number;
  card: C;
}

/** A(1)를 가장 높게 */
export const aceHigh = (c: TrickCard) => (c.rank === 1 ? 14 : c.rank);

/** 낸 무늬(led)를 따라야 함: 그 무늬가 있으면 그것만, 없으면 아무거나 */
export function followSuit<C extends TrickCard>(hand: C[], led: number | null): C[] {
  if (led === null) return hand;
  const same = hand.filter((c) => c.suit === led);
  return same.length ? same : hand;
}

/** 트릭 승자: 으뜸 무늬(trump)가 있으면 가장 높은 으뜸, 없으면 처음 낸 무늬 중 가장 높은 카드 */
export function trickWinner<C extends TrickCard>(plays: TrickPlay<C>[], trump: number | null = null, value: (c: C) => number = aceHigh): number {
  if (!plays.length) throw new Error('빈 트릭');
  const led = plays[0].card.suit;
  let best = plays[0];
  for (const p of plays.slice(1)) {
    const a = best.card;
    const b = p.card;
    const bTrump = trump !== null && b.suit === trump;
    const aTrump = trump !== null && a.suit === trump;
    if (bTrump && !aTrump) best = p;
    else if (b.suit === a.suit && value(b) > value(a)) best = p;
    else if (!aTrump && !bTrump && b.suit === led && a.suit !== led) best = p;
  }
  return best.seat;
}

/** 손패 정렬: 무늬별로 모으고 높은 순 (화면용) */
export function sortHand<C extends TrickCard>(hand: C[], suitOrder: number[] = [0, 1, 3, 2], value: (c: C) => number = aceHigh): C[] {
  return [...hand].sort((a, b) => suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit) || value(b) - value(a));
}

/** 다음 좌석 (시계 방향) */
export const nextSeat = (seat: number, players: number, step = 1) => (((seat + step) % players) + players) % players;
