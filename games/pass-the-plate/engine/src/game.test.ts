import { describe, expect, it } from 'vitest';
import { Dish } from './cards';
import { CLASSIC, handSizeFor, oneDeck } from './config';
import { Played, applyMove, autoMove, newMatch, scorePudding, scoreRound } from './game';
import { game } from './module';
import { viewFor } from './view';

let k = 0;
const P = (dish: Dish, onWasabi = false): Played => ({ id: `p${++k}`, dish, onWasabi });

describe('구성', () => {
  it('원작 108장, 인원별 손패', () => {
    expect(oneDeck(CLASSIC)).toHaveLength(108);
    expect([2, 3, 4, 5].map((n) => handSizeFor(CLASSIC, n))).toEqual([10, 9, 8, 7]);
  });
});

describe('점수', () => {
  it('튀김 2개 5 · 회 3개 10 · 만두 · 초밥(겨자 ×3)', () => {
    const [s] = scoreRound([[P('tempura'), P('tempura'), P('tempura'), P('sashimi'), P('sashimi'), P('sashimi'), P('dumpling'), P('dumpling'), P('dumpling'), P('wasabi'), P('squid', true), P('egg')]]);
    expect(s).toMatchObject({ tempura: 5, sashimi: 10, dumpling: 6, nigiri: 10 });
  });
  it('김밥: 1등 6, 2등 3, 1등 동점이면 나눠 갖고 2등 없음', () => {
    const r = scoreRound([[P('maki3')], [P('maki2')], [P('maki1')]]);
    expect(r.map((x) => x.maki)).toEqual([6, 3, 0]);
    const t = scoreRound([[P('maki2')], [P('maki2')], [P('maki1')]]);
    expect(t.map((x) => x.maki)).toEqual([3, 3, 0]);
  });
  it('푸딩: 가장 많으면 +6, 가장 적으면 −6 (2명이면 감점 없음)', () => {
    expect(scorePudding([3, 1, 1])).toEqual([6, -3, -3]);
    expect(scorePudding([2, 0])).toEqual([6, 0]);
    expect(scorePudding([2, 2, 2])).toEqual([0, 0, 0]);
  });
});

describe('진행', () => {
  it('동시에 고르고 공개되면 손패가 넘어감, 고른 카드는 남에게 안 보임', () => {
    const m = newMatch(CLASSIC, 3, () => 0.4);
    const hand1 = m.hands[1].map((c) => c.id);
    applyMove(m, 0, { type: 'pick', cardId: m.hands[0][0].id });
    expect(game.actors!(m)).toEqual([1, 2]);
    expect(viewFor(m, 1).myPick).toBeNull();
    expect(viewFor(m, 1).picked).toEqual([true, false, false]);
    applyMove(m, 1, { type: 'pick', cardId: m.hands[1][0].id });
    applyMove(m, 2, { type: 'pick', cardId: m.hands[2][0].id });
    expect(m.turn).toBe(2);
    // 좌석1의 남은 손패가 좌석2에게
    expect(m.hands[2].map((c) => c.id)).toEqual(hand1.slice(1));
  });
  it('젓가락으로 2장, 젓가락은 손패로 돌아감', () => {
    const m = newMatch(CLASSIC, 2, () => 0.4);
    m.tableaus[0].push(P('chopsticks'));
    const [a, b] = m.hands[0];
    applyMove(m, 0, { type: 'pick', cardId: a.id, second: b.id });
    applyMove(m, 1, { type: 'pick', cardId: m.hands[1][0].id });
    expect(m.tableaus[0].some((p) => p.dish === 'chopsticks')).toBe(false);
    expect(m.hands[1].some((c) => c.dish === 'chopsticks')).toBe(true); // 넘어간 손패에
  });
  it('3판 뒤 끝, 푸딩 점수 반영', () => {
    const m = newMatch(CLASSIC, 4, () => 0.8);
    while (m.status !== 'match-over') {
      if (m.status === 'round-over') game.startNextRound(m, () => 0.1);
      else for (const s of game.actors!(m)) if (game.actors!(m).includes(s)) applyMove(m, s, autoMove(m, s));
    }
    expect(m.roundScores).toHaveLength(3);
    expect(m.puddingScore).not.toBeNull();
  });
});
