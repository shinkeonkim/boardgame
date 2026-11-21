import { describe, expect, it } from 'vitest';
import { playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { game } from './module';

const avg = (level: 'easy' | 'normal' | 'hard', players: number, n = 30) => {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += playOut(game, CLASSIC, Array(players).fill(level), 900 + i).totals[0];
  return sum / n;
};

describe('봇', () => {
  it('모든 프리셋 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const players of [2, 4, 6]) for (const level of ['easy', 'normal', 'hard'] as const) {
      expect(playOut(game, p.config, Array(players).fill(level), 4).illegal, `${p.label} ${players} ${level}`).toBe(0);
    }
  });
  it('협력 점수: 어려움 > 보통 > 쉬움 (봇끼리 3명)', () => {
    const r = { hard: avg('hard', 3), normal: avg('normal', 3), easy: avg('easy', 3) };
    console.log('flare-signals 평균 점수(25점 만점)', r);
    expect(r.hard).toBeGreaterThan(r.easy + 3);
    expect(r.normal).toBeGreaterThan(r.easy);
  });
});
