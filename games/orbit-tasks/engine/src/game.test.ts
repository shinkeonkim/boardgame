import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { Card, applyMove, fullDeck, matchTotals, newMatch, signalKind, startNextRound } from './game';

const c = (suit: number, rank: number): Card => ({ id: `${suit}-${rank}`, suit, rank });

describe('궤도 임무', () => {
  it('40장(색 1~9 ×4 + 로켓 1~4)을 모두 나누고, 로켓 4를 가진 사람이 대장', () => {
    expect(fullDeck()).toHaveLength(40);
    const m = newMatch(CLASSIC, 4, () => 0.2);
    expect(m.hands.flat()).toHaveLength(40);
    expect(m.hands[m.captain].some((x) => x.id === '4-4')).toBe(true);
    expect(m.turn).toBe(m.captain);
    expect(m.tasks).toHaveLength(1);
  });
  it('과제를 맡은 사람이 그 카드를 가져가면 성공, 다른 사람이 가져가면 바로 실패', () => {
    const m = newMatch({ ...CLASSIC, tasks: 1 }, 3, () => 0.2);
    m.hands = [[c(1, 5), c(0, 1)], [c(1, 9), c(0, 2)], [c(1, 2), c(0, 3)]];
    m.tasks = [{ card: c(1, 5), owner: null, order: null, done: false }];
    m.captain = m.turn = 0;
    applyMove(m, 0, { type: 'take', task: '1-5' });
    expect(m.phase).toBe('play');
    applyMove(m, 0, { type: 'play', card: '1-5' });
    applyMove(m, 1, { type: 'play', card: '1-9' });
    applyMove(m, 2, { type: 'play', card: '1-2' });
    // 1번이 9로 가져가서 0번 과제 실패
    expect(m.results).toEqual([{ level: 1, success: false }]);
    expect(m.status).toBe('round-over');
  });
  it('로켓이 으뜸: 무늬가 없으면 로켓으로 이길 수 있음 · 성공하면 다음 임무에 과제 +1', () => {
    const m = newMatch({ ...CLASSIC, tasks: 1 }, 3, () => 0.2);
    m.hands = [[c(2, 7), c(0, 1)], [c(4, 1), c(0, 2)], [c(2, 2), c(0, 3)]];
    m.tasks = [{ card: c(2, 7), owner: 1, order: null, done: false }];
    m.phase = 'play';
    m.captain = m.turn = 0;
    applyMove(m, 0, { type: 'play', card: '2-7' });
    applyMove(m, 1, { type: 'play', card: '4-1' });
    applyMove(m, 2, { type: 'play', card: '2-2' });
    expect(m.results).toEqual([{ level: 1, success: true }]);
    expect(matchTotals(m)).toEqual([1, 1, 1]);
    startNextRound(m);
    expect(m.level).toBe(2);
    expect(m.tasks).toHaveLength(2);
  });
  it('신호: 그 색에서 가장 높음·가장 낮음·하나뿐만, 로켓은 안 됨', () => {
    const hand = [c(0, 3), c(0, 7), c(0, 5), c(1, 4), c(4, 2)];
    expect(signalKind(hand, c(0, 7))).toBe('top');
    expect(signalKind(hand, c(0, 3))).toBe('bottom');
    expect(signalKind(hand, c(0, 5))).toBeNull();
    expect(signalKind(hand, c(1, 4))).toBe('only');
    expect(signalKind(hand, c(4, 2))).toBeNull();
  });
});
