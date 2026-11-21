import { describe, expect, it } from 'vitest';
import { playOut } from '@bg/core';
import { CLASSIC, PRESETS, cardsNeeded } from './config';
import { game } from './module';

describe('봇', () => {
  it('모든 프리셋 · 난이도 · 인원에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) {
      for (const players of [2, 4, 7]) {
        const config = { ...p.config, maxCard: Math.max(p.config.maxCard, cardsNeeded(p.config, players)) };
        for (const level of ['easy', 'normal', 'hard'] as const) {
          expect(playOut(game, config, Array(players).fill(level), 3).illegal, `${p.label} ${players} ${level}`).toBe(0);
        }
      }
    }
  });
  it('평균 벌점: 어려움 < 보통 < 쉬움 (4명, 한 판 × 80)', () => {
    const avg = (lv: 'hard' | 'normal') => {
      let mine = 0;
      let other = 0;
      for (let i = 0; i < 80; i++) {
        const seat = i % 4;
        const levels = Array.from({ length: 4 }, (_, s) => (s === seat ? lv : 'easy')) as ('hard' | 'normal' | 'easy')[];
        const r = playOut(game, { ...CLASSIC, endMode: 'rounds', rounds: 1 }, levels, 5000 + i);
        mine += r.totals[seat];
        other += r.totals.filter((_, s) => s !== seat).reduce((a, b) => a + b, 0) / 3;
      }
      return { mine: mine / 80, easy: other / 80 };
    };
    const hard = avg('hard');
    const normal = avg('normal');
    console.log('row-six 평균 벌점', { hard, normal });
    expect(hard.mine).toBeLessThan(hard.easy * 0.8);
    expect(normal.mine).toBeLessThan(normal.easy);
  });
});
