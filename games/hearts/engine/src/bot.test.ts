import { describe, expect, it } from 'vitest';
import { playOut } from '@bg/core';
import { PRESETS } from './config';
import { game } from './module';

describe('하트 봇', () => {
  it('모든 프리셋 · 3~6명 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const n of [3, 4, 5, 6]) for (const level of ['easy', 'hard'] as const) {
      expect(playOut(game, p.config, Array(n).fill(level), 2).illegal, `${p.label} ${n} ${level}`).toBe(0);
    }
  });
  it('어려움은 쉬움보다 평균 점수가 낮다 (벌점이 적다)', () => {
    let hard = 0;
    let easy = 0;
    for (let i = 0; i < 6; i++) {
      const r = playOut(game, { ...PRESETS[0].config, target: 50 }, ['hard', 'easy', 'hard', 'easy'], i + 1);
      hard += r.totals[0] + r.totals[2];
      easy += r.totals[1] + r.totals[3];
    }
    expect(hard).toBeLessThan(easy);
  });
});
