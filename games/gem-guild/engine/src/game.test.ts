import { describe, expect, it } from 'vitest';
import { CARDS, NOBLES } from './cards';
import { CLASSIC } from './config';
import { viewFor } from './view';
import { MatchState, applyMove, autoMove, newMatch, payment, pointsOf } from './game';

describe('카드', () => {
  it('단계별 40·30·20장, 귀족 10명, id 중복 없음', () => {
    expect([1, 2, 3].map((t) => CARDS.filter((c) => c.tier === t).length)).toEqual([40, 30, 20]);
    expect(NOBLES).toHaveLength(10);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(90);
    // 자기 색 비용 없음, 비용 > 0
    for (const c of CARDS) expect(c.cost.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });
});

function fresh(): MatchState {
  const m = newMatch(CLASSIC, 2, () => 0.3);
  m.turn = 0;
  return m;
}

describe('행동', () => {
  it('서로 다른 3색 / 같은 색 2개(4개 이상 남았을 때)', () => {
    const m = fresh();
    applyMove(m, 0, { type: 'take', gems: [0, 1, 2] });
    expect(m.me[0].tokens.slice(0, 3)).toEqual([1, 1, 1]);
    applyMove(m, 1, { type: 'take', gems: [3, 3] });
    expect(m.bank[3]).toBe(2);
    expect(() => applyMove(m, 0, { type: 'take', gems: [3, 3] })).toThrow('4개 이상');
    expect(() => applyMove(m, 0, { type: 'take', gems: [0, 0, 1] })).toThrow();
  });
  it('예약하면 황금 1개, 예약은 3장까지', () => {
    const m = fresh();
    applyMove(m, 0, { type: 'reserve', cardId: m.market[0][0].id });
    expect(m.me[0].tokens[5]).toBe(1);
    expect(m.market[0]).toHaveLength(4);
    m.me[0].reserved.push(m.market[1][0], m.market[1][1]);
    m.turn = 0;
    expect(() => applyMove(m, 0, { type: 'reserve', tier: 1 })).toThrow('3장');
  });
  it('사기: 보너스 빼고 모자라면 황금, 귀족 자동 방문', () => {
    const m = fresh();
    const card = m.market[0][0];
    m.me[0].tokens = [...card.cost, 0];
    expect(payment(m.me[0], card)).not.toBeNull();
    applyMove(m, 0, { type: 'buy', cardId: card.id });
    expect(m.me[0].cards).toHaveLength(1);
    expect(m.me[0].tokens.reduce((a, b) => a + b, 0)).toBe(0);
    // 황금 대신
    const c2 = m.market[0][0];
    const total = c2.cost.reduce((a, b) => a + b, 0);
    m.me[1].tokens = [0, 0, 0, 0, 0, total];
    m.turn = 1;
    applyMove(m, 1, { type: 'buy', cardId: c2.id });
    expect(m.me[1].tokens[5]).toBe(0);
  });
  it('10개를 넘으면 버리기', () => {
    const m = fresh();
    m.me[0].tokens = [2, 2, 2, 2, 1, 0];
    applyMove(m, 0, { type: 'take', gems: [0, 1, 2] });
    expect(m.phase).toBe('discard');
    expect(() => applyMove(m, 0, { type: 'discard', gems: [1, 0, 0, 0, 0, 0] })).toThrow('2개');
    applyMove(m, 0, { type: 'discard', gems: [1, 1, 0, 0, 0, 0] });
    expect(m.turn).toBe(1);
  });
  it('15점에 닿으면 그 바퀴까지 하고 끝', () => {
    const m = fresh();
    m.first = 0;
    m.me[0].cards = CARDS.filter((c) => c.tier === 3).slice(0, 4);
    expect(pointsOf(m.me[0])).toBeGreaterThanOrEqual(15);
    applyMove(m, 0, { type: 'take', gems: [0, 1, 2] });
    expect(m.finalRound).toBe(true);
    expect(m.status).toBe('playing');
    applyMove(m, 1, { type: 'take', gems: [0, 1, 2] });
    expect(m.status).toBe('match-over');
    expect(m.winners).toEqual([0]);
  });
  it('자동 수로 끝까지 (4명)', () => {
    const m = newMatch(CLASSIC, 4, () => 0.6);
    for (let i = 0; i < 3000 && m.status === 'playing'; i++) applyMove(m, m.turn, autoMove(m, m.turn));
    expect(m.status).toBe('match-over');
  });
});

describe('예약 카드 공개', () => {
  it('시장에서 예약 = 모두에게 앞면, 더미에서 몰래 = 남에게는 뒷면(단계만), 나에게는 앞면', () => {
    const m = newMatch(CLASSIC, 2, () => 0.3);
    const p = m.turn;
    const open = m.market[0][0];
    applyMove(m, p, { type: 'reserve', cardId: open.id });
    let q = m.turn;
    if (q === p) q = 1 - p;
    // 상대 차례 하나 넘기기 (보석 가져오기)
    applyMove(m, m.turn, { type: 'take', gems: [0, 1, 2] });
    applyMove(m, p, { type: 'reserve', tier: 2 });
    const other = viewFor(m, 1 - p).seats[p];
    expect(other.reserved).toBeNull();
    expect(other.reservedSeen[0]).toMatchObject({ card: { id: open.id }, secret: false });
    expect(other.reservedSeen[1]).toEqual({ card: null, secret: true, tier: 2 });
    const self = viewFor(m, p).seats[p];
    expect(self.reservedSeen[1].card).not.toBeNull();
    expect(self.reservedSeen[1].secret).toBe(true);
    expect(other.tokenTotal).toBe(2);
  });
});
