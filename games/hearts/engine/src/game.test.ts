import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { Card, applyMove, deckFor, legalCards, matchTotals, newMatch } from './game';
import { viewFor } from './view';

const c = (suit: number, rank: number): Card => ({ id: `${suit}-${rank}`, suit, rank });

describe('하트', () => {
  it('인원에 맞춰 낮은 다이아·클로버를 뺌', () => {
    expect(deckFor(4).deck).toHaveLength(52);
    expect(deckFor(3).removed.map((x) => x.id)).toEqual(['2-2']);
    expect(deckFor(5).removed.map((x) => x.id)).toEqual(['2-2', '3-2']);
    expect(deckFor(6).deck).toHaveLength(48);
  });
  it('건네기: 모두 3장씩 고르면 방향대로 건네고, 가장 낮은 클로버를 가진 사람이 시작', () => {
    const m = newMatch(CLASSIC, 4, () => 0.3);
    expect(m.phase).toBe('pass');
    for (let s = 0; s < 4; s++) applyMove(m, s, { type: 'pass', cards: m.hands[s].slice(0, 3).map((x) => x.id) });
    expect(m.phase).toBe('play');
    expect(m.hands.every((h) => h.length === 13)).toBe(true);
    expect(m.hands[m.turn].some((x) => x.id === '3-2')).toBe(true);
    expect(legalCards(m, m.turn).map((x) => x.id)).toEqual(['3-2']);
  });
  it('무늬 따르기 · 하트가 깨지기 전엔 하트로 시작 못 함 · 첫 트릭엔 점수 카드 못 버림', () => {
    const m = newMatch({ ...CLASSIC, passing: false }, 4, () => 0.3);
    m.hands = [[c(3, 2), c(1, 5)], [c(3, 9), c(0, 12)], [c(1, 9), c(2, 4)], [c(3, 4), c(1, 2)]];
    m.turn = m.leader = 0;
    applyMove(m, 0, { type: 'play', card: '3-2' });
    expect(legalCards(m, 1).map((x) => x.id)).toEqual(['3-9']);
    applyMove(m, 1, { type: 'play', card: '3-9' });
    // 2번은 클로버가 없지만 첫 트릭이라 하트를 버릴 수 없음
    expect(legalCards(m, 2).map((x) => x.id)).toEqual(['2-4']);
    applyMove(m, 2, { type: 'play', card: '2-4' });
    applyMove(m, 3, { type: 'play', card: '3-4' });
    expect(m.turn).toBe(1);
    // 1번이 엶: 하트가 안 깨졌으니 스페이드 Q
    expect(legalCards(m, 1).map((x) => x.id)).toEqual(['0-12']);
  });
  it('문 쏘기: 하트 13장 + 스페이드 Q 를 혼자 먹으면 나머지가 26점', () => {
    const m = newMatch({ ...CLASSIC, passing: false }, 4, () => 0.3);
    m.taken = [[...Array.from({ length: 13 }, (_, i) => c(1, i + 1)), c(0, 12)], [], [], []];
    m.hands = [[c(3, 5)], [c(3, 6)], [c(3, 7)], [c(3, 8)]];
    m.turn = m.leader = 0;
    m.trickNo = 5;
    for (let s = 0; s < 4; s++) applyMove(m, s, { type: 'play', card: m.hands[s][0].id });
    expect(m.handScores[0]).toEqual([0, 26, 26, 26]);
    expect(matchTotals(m)).toEqual([0, 26, 26, 26]);
    expect(viewFor(m, 0).status).toBe('round-over');
  });
});
