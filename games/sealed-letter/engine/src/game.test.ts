import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { Card, MatchState, applyMove, autoMove, buildDeck, newMatch, startNextRound } from './game';
import { viewFor } from './view';

const C = (kind: Card['kind'], value: number, k = 0): Card => ({ id: `${kind}${k}`, kind, value });

function setup(hands: Card[][], deck: Card[] = [C('watch', 1, 4), C('watch', 1, 3)], over = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, hands.length, () => 0.2);
  m.hands = hands;
  m.deck = deck;
  m.turn = 0;
  m.alive = hands.map(() => true);
  m.protectedSeats = hands.map(() => false);
  m.discards = hands.map(() => []);
  m.known = hands.map(() => hands.map(() => null));
  m.phase = 'play';
  return m;
}

describe('카드', () => {
  it('원작 16장 · 확장 21장', () => {
    expect(buildDeck('classic')).toHaveLength(16);
    expect(buildDeck('extended')).toHaveLength(21);
  });
});

describe('효과', () => {
  it('파수꾼: 맞히면 탈락, 파수꾼은 지목 불가', () => {
    const m = setup([[C('watch', 1), C('seer', 2)], [C('duelist', 3)], [C('shield', 4)]]);
    expect(() => applyMove(m, 0, { type: 'play', cardId: 'watch0', target: 1, guess: 'watch' })).toThrow('파수꾼으로');
    applyMove(m, 0, { type: 'play', cardId: 'watch0', target: 1, guess: 'duelist' });
    expect(m.alive).toEqual([true, false, true]);
  });
  it('점술가: 본 카드를 기억', () => {
    const m = setup([[C('seer', 2), C('watch', 1)], [C('queen', 8)]]);
    applyMove(m, 0, { type: 'play', cardId: 'seer0', target: 1 });
    expect(viewFor(m, 0).known[1]?.kind).toBe('queen');
    expect(viewFor(m, 1).known[0]).toBeNull();
  });
  it('결투사: 낮은 쪽 탈락', () => {
    const m = setup([[C('duelist', 3), C('agent', 7)], [C('envoy', 5)]]);
    applyMove(m, 0, { type: 'play', cardId: 'duelist0', target: 1 });
    expect(m.alive).toEqual([true, false]);
  });
  it('방패병: 다음 차례까지 지목 불가', () => {
    const m = setup([[C('shield', 4), C('watch', 1)], [C('watch', 1, 1), C('watch', 1, 2)], [C('seer', 2)]]);
    applyMove(m, 0, { type: 'play', cardId: 'shield0' });
    // 이제 좌석1 차례 — 좌석0은 지목 불가
    expect(() => applyMove(m, 1, { type: 'play', cardId: 'watch1', target: 0, guess: 'seer' })).toThrow('보호');
  });
  it('사절: 여왕을 버리게 하면 탈락, 아니면 새로 뽑음', () => {
    const m = setup([[C('envoy', 5), C('watch', 1)], [C('queen', 8)], [C('seer', 2)]]);
    applyMove(m, 0, { type: 'play', cardId: 'envoy0', target: 1 });
    expect(m.alive[1]).toBe(false);
  });
  it('재상: 카드 교환하고 서로 알게 됨', () => {
    const m = setup([[C('chancellor', 6), C('watch', 1)], [C('queen', 8)]]);
    applyMove(m, 0, { type: 'play', cardId: 'chancellor0', target: 1 });
    expect(m.hands[0][0].kind).toBe('queen');
    expect(viewFor(m, 1).known[0]?.kind).toBe('queen');
  });
  it('밀정: 재상·사절과 함께면 반드시 밀정', () => {
    const m = setup([[C('agent', 7), C('envoy', 5)], [C('watch', 1)]]);
    expect(() => applyMove(m, 0, { type: 'play', cardId: 'envoy0', target: 1 })).toThrow('밀정을 내야');
  });
  it('여왕을 내면 탈락', () => {
    const m = setup([[C('queen', 8), C('watch', 1)], [C('seer', 2)]]);
    applyMove(m, 0, { type: 'play', cardId: 'queen0' });
    expect(m.alive[0]).toBe(false);
    expect(m.status).not.toBe('playing');
  });
  it('더미가 비면 숫자가 높은 사람이 인장', () => {
    const m = setup([[C('seer', 2), C('agent', 7)], [C('envoy', 5)]], []);
    applyMove(m, 0, { type: 'play', cardId: 'seer0', target: 1 });
    expect(m.tokens).toEqual([1, 0]);
    expect(m.lastRound?.reason).toBe('deck');
  });
  it('자동 수로 끝까지 (확장 6명)', () => {
    const m = newMatch({ ...CLASSIC, edition: 'extended' }, 6, () => 0.6);
    for (let i = 0; i < 5000 && m.status !== 'match-over'; i++) {
      if (m.status === 'round-over') startNextRound(m);
      else applyMove(m, m.turn, autoMove(m, m.turn));
    }
    expect(m.status).toBe('match-over');
  });
});
