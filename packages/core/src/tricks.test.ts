import { describe, expect, it } from 'vitest';
import { aceHigh, followSuit, sortHand, trickWinner } from './tricks';

const c = (suit: number, rank: number) => ({ id: `${suit}-${rank}`, suit, rank });

describe('트릭 테이킹 공통', () => {
  it('낸 무늬가 있으면 그것만, 없으면 아무거나', () => {
    const hand = [c(0, 5), c(1, 9), c(1, 2)];
    expect(followSuit(hand, 1).map((x) => x.id)).toEqual(['1-9', '1-2']);
    expect(followSuit(hand, 3)).toHaveLength(3);
    expect(followSuit(hand, null)).toHaveLength(3);
  });
  it('트릭 승자: 낸 무늬의 가장 높은 카드(A가 가장 높음), 다른 무늬는 못 이김', () => {
    expect(trickWinner([{ seat: 0, card: c(1, 10) }, { seat: 1, card: c(1, 1) }, { seat: 2, card: c(0, 13) }])).toBe(1);
    expect(aceHigh(c(2, 1))).toBe(14);
  });
  it('으뜸 무늬는 다른 무늬를 이김, 으뜸끼리는 높은 쪽', () => {
    const plays = [{ seat: 0, card: c(1, 13) }, { seat: 1, card: c(3, 2) }, { seat: 2, card: c(3, 5) }];
    expect(trickWinner(plays, 3)).toBe(2);
  });
  it('손패 정렬: 무늬별로 모으고 높은 순', () => {
    expect(sortHand([c(1, 2), c(0, 3), c(1, 1)]).map((x) => x.id)).toEqual(['0-3', '1-1', '1-2']);
  });
});
