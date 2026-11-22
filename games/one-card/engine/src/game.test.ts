import { describe, expect, it } from 'vitest';
import { CLASSIC, validateConfig } from './config';
import { Card, MatchState, actors, applyMove, autoMove, newMatch, playProblem } from './game';

const C = (suit: number, rank: number): Card => ({ id: `${suit}-${rank}`, suit, rank });
function setup(hands: Card[][], topCard: Card, over = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, hands.length, () => 0.1);
  m.hands = hands;
  m.discard = [topCard];
  m.suit = topCard.suit < 0 ? null : topCard.suit;
  m.turn = 0;
  return m;
}

describe('내기', () => {
  it('무늬나 숫자가 같아야, 조커는 언제나', () => {
    const m = setup([[C(0, 5), C(1, 9), C(2, 3)], [C(3, 4)]], C(0, 9));
    expect(playProblem(m, C(0, 5))).toBeNull();
    expect(playProblem(m, C(1, 9))).toBeNull();
    expect(playProblem(m, C(2, 3))).toMatch('무늬');
    expect(playProblem(m, { id: 'J0', suit: -1, rank: 0 })).toBeNull();
  });
  it('공격: 2는 +2, 쌓이고, 더 약한 카드로는 못 막고, 받으면 그만큼', () => {
    const m = setup([[C(0, 2), C(0, 8), C(2, 8)], [C(0, 1), C(3, 2), C(1, 6)], [C(2, 5), C(2, 6)]], C(0, 9));
    applyMove(m, 0, { type: 'play', cardId: '0-2' });
    expect(m.attack).toBe(2);
    applyMove(m, 1, { type: 'play', cardId: '0-1' }); // ♠A +5
    expect(m.attack).toBe(7);
    expect(playProblem(m, C(2, 2))).toMatch('약한');
    const before = m.hands[2].length;
    applyMove(m, 2, { type: 'draw' });
    expect(m.hands[2].length).toBe(before + 7);
    expect(m.attack).toBe(0);
  });
  it('7은 무늬를 바꾸고, J는 건너뛰고, Q는 방향을, K는 한 번 더', () => {
    const m = setup([[C(0, 7), C(1, 11), C(1, 12), C(1, 13), C(1, 4)], [C(3, 3)], [C(3, 5)], [C(3, 6)]], C(0, 9));
    applyMove(m, 0, { type: 'play', cardId: '0-7', suit: 1 });
    expect(m.suit).toBe(1);
    m.turn = 0;
    applyMove(m, 0, { type: 'play', cardId: '1-11' });
    expect(m.turn).toBe(2);
    m.turn = 0;
    applyMove(m, 0, { type: 'play', cardId: '1-12' });
    expect(m.turn).toBe(3);
    m.turn = 0;
    applyMove(m, 0, { type: 'play', cardId: '1-13' });
    expect(m.turn).toBe(0);
    expect(m.again).toBe(true);
  });
  it('한 장 남으면 원카드 창: 남이 먼저 누르면 벌칙', () => {
    const m = setup([[C(0, 5), C(0, 6)], [C(3, 3), C(3, 8)], [C(2, 4)]], C(0, 9));
    applyMove(m, 0, { type: 'play', cardId: '0-5' });
    expect(m.phase).toBe('call');
    expect(actors(m)).toEqual([0, 1, 2]);
    applyMove(m, 2, { type: 'call' });
    expect(m.hands[0].length).toBe(1 + CLASSIC.callPenalty);
    expect(m.phase).toBe('play');
    expect(m.turn).toBe(1);
  });
  it('카드가 모자라면 시작 못 함', () => {
    expect(validateConfig({ ...CLASSIC, deal: 10 }, 6)[0]).toMatch('모자라요');
  });
  it('자동 진행만으로 끝까지', () => {
    for (const until of ['first', 'last'] as const) {
      const m = newMatch({ ...CLASSIC, until, rounds: 1 }, 4, () => 0.42);
      let g = 0;
      while (m.status === 'playing' && g++ < 5000) {
        const s = actors(m)[0];
        applyMove(m, s, autoMove(m, s));
      }
      expect(m.status).toBe('match-over');
    }
  });
});
