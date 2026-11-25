import { beforeEach, describe, expect, it } from 'vitest';
import { readStats, recordOutcome, summarize } from './stats';

const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  };
});

const done = (totals: number[], id = 1, lowerWins = false) => ({ id, status: 'match-over' as const, totals, lowerWins, bots: totals.map((_, i) => i > 0) });

describe('기기 전적', () => {
  it('끝난 매치만, 한 번만 기록', () => {
    expect(recordOutcome('yacht', 'Yacht', 'ABCD', 0, { ...done([10, 5]), status: 'playing' })).toBe(false);
    expect(recordOutcome('yacht', 'Yacht', 'ABCD', 0, done([10, 5]))).toBe(true);
    expect(recordOutcome('yacht', 'Yacht', 'ABCD', 0, done([10, 5]))).toBe(false);
    expect(readStats()).toHaveLength(1);
    expect(readStats()[0]).toMatchObject({ rank: 1, won: true, players: 2, bots: 1 });
  });
  it('벌점 게임은 낮은 점수가 1등, 같은 점수는 공동', () => {
    recordOutcome('row-six', 'Row Six', 'X', 1, done([30, 12, 12], 1, true));
    expect(readStats()[0]).toMatchObject({ rank: 1, won: true });
    recordOutcome('row-six', 'Row Six', 'X', 0, done([30, 12, 12], 2, true));
    expect(readStats()[0]).toMatchObject({ rank: 3, won: false });
  });
  it('요약: 승률·게임별·연승', () => {
    recordOutcome('yacht', 'Yacht', 'A', 0, done([1, 5], 1));
    recordOutcome('yacht', 'Yacht', 'A', 0, done([9, 5], 2));
    recordOutcome('holdem', "Hold'em", 'B', 0, done([9, 5], 3));
    const s = summarize();
    expect(s).toMatchObject({ played: 3, wins: 2, streak: 2 });
    expect(s.byGame[0]).toMatchObject({ game: 'yacht', played: 2, wins: 1 });
  });
});
