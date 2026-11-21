import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { Influence, MatchState, actors, applyMove, autoMove, newMatch } from './game';
import { Role } from './roles';
import { viewFor } from './view';

let k = 0;
const I = (role: Role, lost = false): Influence => ({ id: `t${++k}`, role, lost });

function setup(hands: Role[][], coins?: number[]): MatchState {
  const m = newMatch(CLASSIC, hands.length, () => 0.3);
  m.hands = hands.map((h) => h.map((r) => I(r)));
  m.coins = coins ?? hands.map(() => 2);
  m.turn = 0;
  m.phase = 'action';
  return m;
}
/** 지금 단계(도전·막기 창)만 모두 통과 */
const passAll = (m: MatchState) => {
  const ph = m.phase;
  for (let i = 0; i < 10 && m.phase === ph && actors(m).length; i++) applyMove(m, actors(m)[0], { type: 'pass' });
};

describe('행동', () => {
  it('소득·원조·세금', () => {
    const m = setup([['treasurer', 'guard'], ['raider', 'diplomat'], ['assassin', 'guard']]);
    applyMove(m, 0, { type: 'act', action: 'tax' });
    expect(m.phase).toBe('challenge');
    expect(actors(m)).toEqual([1, 2]);
    passAll(m);
    expect(m.coins[0]).toBe(5);
    expect(m.turn).toBe(1);
    applyMove(m, 1, { type: 'act', action: 'income' });
    expect(m.coins[1]).toBe(3);
  });
  it('10개 이상이면 쿠데타만', () => {
    const m = setup([['treasurer', 'guard'], ['raider', 'diplomat']], [10, 2]);
    expect(() => applyMove(m, 0, { type: 'act', action: 'income' })).toThrow('쿠데타');
    applyMove(m, 0, { type: 'act', action: 'coup', target: 1 });
    expect(m.phase).toBe('lose');
    applyMove(m, 1, { type: 'lose', cardId: m.hands[1][0].id });
    expect(m.hands[1][0].lost).toBe(true);
  });
});

describe('도전', () => {
  it('거짓 주장에 도전하면 주장한 사람이 잃고 행동 취소 (암살 금화 반환)', () => {
    const m = setup([['treasurer', 'guard'], ['raider', 'diplomat']], [3, 2]);
    applyMove(m, 0, { type: 'act', action: 'assassinate', target: 1 });
    expect(m.coins[0]).toBe(0);
    applyMove(m, 1, { type: 'challenge' });
    expect(m.phase).toBe('lose');
    expect(actors(m)).toEqual([0]);
    applyMove(m, 0, { type: 'lose', cardId: m.hands[0][1].id });
    expect(m.coins[0]).toBe(3);
    expect(m.hands[1].every((h) => !h.lost)).toBe(true);
    expect(m.turn).toBe(1);
  });
  it('참 주장에 도전하면 도전한 사람이 잃고, 들킨 카드는 바뀜', () => {
    const m = setup([['treasurer', 'guard'], ['raider', 'diplomat']]);
    const shown = m.hands[0][0].id;
    applyMove(m, 0, { type: 'act', action: 'tax' });
    applyMove(m, 1, { type: 'challenge' });
    expect(actors(m)).toEqual([1]);
    expect(m.hands[0][0].id).not.toBe(shown);
    applyMove(m, 1, { type: 'lose', cardId: m.hands[1][0].id });
    expect(m.coins[0]).toBe(5);
  });
});

describe('막기', () => {
  it('원조는 누구나 재무관으로 막기, 막기에 도전 → 거짓이면 원조 성공', () => {
    const m = setup([['guard', 'guard'], ['raider', 'diplomat'], ['assassin', 'diplomat']]);
    applyMove(m, 0, { type: 'act', action: 'aid' });
    expect(m.phase).toBe('block');
    applyMove(m, 1, { type: 'block', role: 'treasurer' });
    expect(m.phase).toBe('blockChallenge');
    applyMove(m, 0, { type: 'challenge' });
    applyMove(m, 1, { type: 'lose', cardId: m.hands[1][0].id });
    expect(m.coins[0]).toBe(4);
  });
  it('암살은 대상만 호위 기사로 막기, 참이면 막힘', () => {
    const m = setup([['assassin', 'guard'], ['guard', 'diplomat'], ['raider', 'raider']], [3, 2, 2]);
    applyMove(m, 0, { type: 'act', action: 'assassinate', target: 1 });
    passAll(m);
    expect(m.phase).toBe('block');
    expect(actors(m)).toEqual([1]);
    applyMove(m, 1, { type: 'block', role: 'guard' });
    applyMove(m, 0, { type: 'challenge' });
    // 막기가 참 → 도전한 0번이 잃음, 암살은 막힘
    applyMove(m, 0, { type: 'lose', cardId: m.hands[0][0].id });
    expect(m.hands[1].every((h) => !h.lost)).toBe(true);
    expect(m.coins[0]).toBe(0);
  });
  it('약탈: 대상이 외교관으로 막을 수 있음', () => {
    const m = setup([['raider', 'guard'], ['diplomat', 'guard']]);
    applyMove(m, 0, { type: 'act', action: 'steal', target: 1 });
    passAll(m);
    applyMove(m, 1, { type: 'block', role: 'diplomat' });
    passAll(m);
    expect(m.coins).toEqual([2, 2]);
  });
});

describe('기타', () => {
  it('외교관 교환: 4장 중 2장 남기기', () => {
    const m = setup([['diplomat', 'guard'], ['raider', 'raider']]);
    applyMove(m, 0, { type: 'act', action: 'exchange' });
    passAll(m);
    expect(m.phase).toBe('exchange');
    const v = viewFor(m, 0);
    expect(v.drawn).toHaveLength(2);
    applyMove(m, 0, { type: 'keep', cardIds: [v.drawn[0].id, v.drawn[1].id] });
    expect(m.hands[0].map((h) => h.id)).toEqual(v.drawn.map((d) => d.id));
  });
  it('남의 살아 있는 카드는 가려짐', () => {
    const m = setup([['diplomat', 'guard'], ['raider', 'raider']]);
    expect(viewFor(m, 0).hands[1].map((h) => h.role)).toEqual([null, null]);
  });
  it('자동 수로 끝까지 (6명)', () => {
    const m = newMatch({ ...CLASSIC, copies: 4 }, 6, () => 0.9);
    for (let i = 0; i < 4000 && m.status === 'playing'; i++) {
      const a = actors(m)[0];
      applyMove(m, a, autoMove(m, a));
    }
    expect(m.status).toBe('match-over');
  });
});
