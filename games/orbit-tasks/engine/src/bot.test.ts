import { describe, expect, it } from 'vitest';
import { playOut } from '@bg/core';
import { PRESETS } from './config';
import { game } from './module';

describe('궤도 임무 봇', () => {
  it('모든 프리셋 · 3~5명 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const n of [3, 4, 5]) for (const level of ['easy', 'hard'] as const) {
      expect(playOut(game, p.config, Array(n).fill(level), 3).illegal, `${p.label} ${n} ${level}`).toBe(0);
    }
  });
  it('어려움 봇들은 과제 1~2개 임무를 꽤 해낸다', () => {
    let score = 0;
    for (let s = 1; s <= 10; s++) score += playOut(game, PRESETS[0].config, ['hard', 'hard', 'hard', 'hard'], s).totals[0];
    console.log('orbit 어려움 4명 10판 평균 점수', score / 10);
    expect(score).toBeGreaterThan(5);
  });
});
