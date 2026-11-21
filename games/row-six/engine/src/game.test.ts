import { describe, expect, it } from 'vitest';
import { CLASSIC, cardsNeeded, penaltyOf, sanitizeConfig, validateConfig } from './config';
import { MatchState, applyMove, autoMove, matchTotals, newMatch, startNextRound, targetRow } from './game';
import { viewFor } from './view';
import { game } from './module';

/** 손패·줄을 정해 둔 매치 */
function fixed(hands: number[][], rows: number[][], over: Partial<typeof CLASSIC> = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, hands.length, () => 0.42);
  m.hands = hands.map((h) => [...h]);
  m.rows = rows.map((r) => [...r]);
  return m;
}

describe('설정', () => {
  it('원작 수치와 벌점', () => {
    expect(CLASSIC).toMatchObject({ maxCard: 104, rows: 4, rowLimit: 5, handSize: 10, target: 66 });
    expect([1, 5, 10, 11, 55, 22, 100].map((n) => penaltyOf(CLASSIC, n))).toEqual([1, 2, 3, 5, 7, 5, 3]);
    // 1~104 벌점 합 = 171 (원작)
    let sum = 0;
    for (let n = 1; n <= 104; n++) sum += penaltyOf(CLASSIC, n);
    expect(sum).toBe(171);
    expect(penaltyOf({ penalty: 'flat' }, 55)).toBe(1);
  });
  it('카드가 모자라면 시작 불가, 팀전은 짝수 4명 이상', () => {
    expect(cardsNeeded(CLASSIC, 10)).toBe(104);
    expect(validateConfig(CLASSIC, 10)).toEqual([]);
    expect(validateConfig({ ...CLASSIC, maxCard: 44 }, 5)[0]).toMatch('카드가 모자라요');
    expect(validateConfig({ ...CLASSIC, teams: true }, 3)[0]).toMatch('팀전');
    expect(sanitizeConfig({ rows: 99 as never, penalty: 'x' as never }).rows).toBe(6);
  });
});

describe('규칙', () => {
  it('들어갈 줄 = 끝 숫자가 카드보다 작은 것 중 가장 큰 줄', () => {
    expect(targetRow([[10], [20], [30], [40]], 25)).toBe(1);
    expect(targetRow([[10], [20], [30], [40]], 5)).toBe(-1);
    expect(targetRow([[10], [20], [30], [40]], 99)).toBe(3);
  });

  it('모두 고르면 작은 카드부터 놓고, 6번째는 줄을 가져간다', () => {
    const m = fixed(
      [
        [26, 90],
        [27, 91],
      ],
      [[1, 2, 3, 4, 25], [50], [60], [70]],
    );
    applyMove(m, 0, { type: 'pick', card: 26 });
    expect(m.picks).toEqual([26, null]);
    expect(viewFor(m, 1).picked).toEqual([true, false]);
    expect(viewFor(m, 1).myPick).toBeNull();
    applyMove(m, 1, { type: 'pick', card: 27 });
    // 26이 6번째 → 좌석0이 1·2·3·4·25를 가져가고 26이 새 줄, 27은 그 뒤
    expect(m.taken[0]).toEqual([1, 2, 3, 4, 25]);
    expect(m.rows[0]).toEqual([26, 27]);
    expect(viewFor(m, 0).penalties[0]).toBe(1 + 1 + 1 + 1 + 2);
    expect(m.turn).toBe(2);
  });

  it('가장 작은 카드: 줄을 골라 가져가고, 그동안 다음 카드는 기다린다', () => {
    const m = fixed(
      [
        [3, 90],
        [55, 91],
      ],
      [[10, 11], [20], [30], [40]],
    );
    applyMove(m, 0, { type: 'pick', card: 3 });
    applyMove(m, 1, { type: 'pick', card: 55 });
    expect(m.phase).toBe('take');
    expect(game.actors!(m)).toEqual([0]);
    expect(() => applyMove(m, 1, { type: 'take', row: 0 })).toThrow('줄을 고를 때가');
    applyMove(m, 0, { type: 'take', row: 0 });
    expect(m.taken[0]).toEqual([10, 11]);
    expect(m.rows[0]).toEqual([3]);
    expect(m.rows[3]).toEqual([40, 55]);
    expect(m.phase).toBe('pick');
  });

  it('작은 카드 자동(fewest)은 가장 가벼운 줄', () => {
    const m = fixed(
      [
        [3, 90],
        [95, 91],
      ],
      [[10, 11], [20], [30, 55], [40]],
      { lowCard: 'fewest' },
    );
    applyMove(m, 0, { type: 'pick', card: 3 });
    applyMove(m, 1, { type: 'pick', card: 95 });
    expect(m.taken[0]).toEqual([20]);
    expect(m.phase).toBe('pick');
  });

  it('공개 전에 다시 고를 수 있다 (설정)', () => {
    const m = fixed([[5, 90], [6, 91]], [[1], [2], [3], [4]]);
    applyMove(m, 0, { type: 'pick', card: 5 });
    applyMove(m, 0, { type: 'pick', card: 90 });
    expect(m.picks[0]).toBe(90);
    const n = fixed([[5, 90], [6, 91]], [[1], [2], [3], [4]], { allowChange: false });
    applyMove(n, 0, { type: 'pick', card: 5 });
    expect(() => applyMove(n, 0, { type: 'pick', card: 90 })).toThrow('이미');
  });

  it('손패를 다 쓰면 판 끝, 66점을 넘으면 게임 끝', () => {
    const m = fixed([[50], [51]], [[1, 2, 3, 4, 45], [6], [7], [8]], { handSize: 1 });
    m.roundScores = [[60, 0]];
    applyMove(m, 0, { type: 'pick', card: 50 });
    applyMove(m, 1, { type: 'pick', card: 51 });
    expect(m.status).toBe('match-over');
    expect(matchTotals(m)[0]).toBeGreaterThanOrEqual(66);
    const k = fixed([[50], [51]], [[1], [6], [7], [8]], { handSize: 1 });
    applyMove(k, 0, { type: 'pick', card: 50 });
    applyMove(k, 1, { type: 'pick', card: 51 });
    expect(k.status).toBe('round-over');
    startNextRound(k);
    expect(k.round).toBe(2);
    expect(k.hands[0]).toHaveLength(1);
  });

  it('팀전 합산', () => {
    const m = newMatch({ ...CLASSIC, teams: true }, 4, () => 0.3);
    m.roundScores = [[3, 4, 10, 1]];
    expect(matchTotals(m)).toEqual([7, 7, 11, 11]);
  });

  it('자동 수는 늘 합법', () => {
    const m = newMatch(CLASSIC, 5, () => 0.7);
    while (m.status === 'playing') {
      for (const s of game.actors!(m)) if (game.actors!(m).includes(s)) applyMove(m, s, autoMove(m, s));
    }
    expect(m.status).not.toBe('playing');
  });
});
