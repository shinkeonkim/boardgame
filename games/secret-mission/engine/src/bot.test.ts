import { describe, expect, it } from 'vitest';
import { playOut, seeded } from '@bg/core';
import { CLASSIC, PRESETS, isSpy } from './config';
import { applyMove, newMatch } from './game';
import { game } from './module';
import { viewFor } from './view';

describe('봇', () => {
  it('모든 프리셋 · 인원 · 난이도에서 규칙에 맞게 끝까지', () => {
    for (const p of PRESETS) for (const players of [5, 7, 10]) for (const level of ['easy', 'normal', 'hard'] as const) {
      if (game.validateConfig(p.config, players).length) continue;
      expect(playOut(game, p.config, Array(players).fill(level), 3).illegal, `${p.label} ${players} ${level}`).toBe(0);
    }
  });
  it('어려운 요원들이 쉬운 요원들보다 자주 이긴다 (첩자는 보통)', () => {
    const rate = (agentLevel: 'easy' | 'hard') => {
      let won = 0;
      const N = 120;
      for (let k = 0; k < N; k++) {
        const rng = seeded(1000 + k);
        const m = newMatch(CLASSIC, 7, rng);
        let guard = 0;
        while (m.status === 'playing' && guard++ < 500) {
          const actors = game.actors!(m);
          const s = actors[0];
          const level = isSpy(m.roles[s]) ? 'normal' : agentLevel;
          const move = game.bot!.choose({ view: viewFor(m, s), level, rng, seat: s } as never);
          applyMove(m, s, move);
        }
        if (m.winner === 'agents') won++;
      }
      return won / N;
    };
    const hard = rate('hard');
    const easy = rate('easy');
    console.log('secret-mission 요원 승률 어려움', hard, '쉬움', easy);
    expect(hard).toBeGreaterThan(easy);
  });
});
