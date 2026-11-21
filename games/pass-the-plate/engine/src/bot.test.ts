import { describe, expect, it } from 'vitest';
import { duel, playOut } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { game } from './module';

describe('봇', () => {
  it('모든 프리셋 · 난이도 · 인원에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const players of [2, 5, 8]) for (const level of ['easy', 'normal', 'hard'] as const) {
      expect(playOut(game, p.config, Array(players).fill(level), 3).illegal, `${p.label} ${players} ${level}`).toBe(0);
    }
  });
  it('어려움이 쉬움을 이긴다 (2명)', () => {
    const rate = duel(game, CLASSIC, 'hard', 'easy', 30);
    console.log('pass-the-plate 어려움 vs 쉬움', rate);
    expect(rate).toBeGreaterThan(0.65);
  });
  it('평균 점수: 어려움 > 쉬움 (4명, 어려움 1 vs 쉬움 3, 40게임)', () => {
    let hard = 0;
    let easy = 0;
    for (let i = 0; i < 40; i++) {
      const seat = i % 4;
      const levels = [0, 1, 2, 3].map((s) => (s === seat ? 'hard' : 'easy')) as ('hard' | 'easy')[];
      const r = playOut(game, CLASSIC, levels, 300 + i);
      hard += r.totals[seat];
      easy += r.totals.filter((_, s) => s !== seat).reduce((a, b) => a + b, 0) / 3;
    }
    console.log('pass-the-plate 평균', { hard: hard / 40, easy: easy / 40 });
    expect(hard / 40).toBeGreaterThan((easy / 40) * 1.1);
  });
});
