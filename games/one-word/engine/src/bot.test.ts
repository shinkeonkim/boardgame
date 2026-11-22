import { describe, expect, it } from 'vitest';
import { playOut, seeded } from '@bg/core';
import { CLASSIC, PRESETS } from './config';
import { actors, applyMove, newMatch } from './game';
import { game } from './module';
import { viewFor } from './view';

const teamScore = (level: 'easy' | 'hard') => {
  let total = 0;
  for (let k = 0; k < 30; k++) {
    const rng = seeded(77 + k);
    const m = newMatch(CLASSIC, 5, rng);
    let g = 0;
    while (m.status === 'playing' && g++ < 400) {
      const s = actors(m)[0];
      applyMove(m, s, game.bot!.choose({ view: viewFor(m, s), level, rng, seat: s } as never));
    }
    total += m.score;
  }
  return total / 30;
};

describe('봇', () => {
  it('모든 프리셋 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const players of [3, 5, 8]) for (const level of ['easy', 'normal', 'hard'] as const) {
      expect(playOut(game, p.config, Array(players).fill(level), 3).illegal, `${p.label} ${players} ${level}`).toBe(0);
    }
  });
  it('어려운 봇 팀이 쉬운 봇 팀보다 많이 맞힌다', () => {
    const hard = teamScore('hard');
    const easy = teamScore('easy');
    console.log('one-word 13장 중 평균', { hard, easy });
    expect(hard).toBeGreaterThan(easy);
  });
});
