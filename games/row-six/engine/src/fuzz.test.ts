import { describe, expect, it } from 'vitest';
import { seeded } from '@bg/core';
import { CLASSIC, PRESETS, cardsNeeded } from './config';
import { MatchState, Move, applyMove, autoMove, newMatch, startNextRound } from './game';
import { game } from './module';

function allCards(m: MatchState) {
  return [...m.hands.flat(), ...m.rows.flat(), ...m.taken.flat(), ...m.queue.map((q) => q.card)];
}

describe('퍼즈', () => {
  for (const p of PRESETS) {
    for (const players of [2, 3, 5, 10]) {
      const config = { ...CLASSIC, ...p.config, maxCard: Math.max(p.config.maxCard, cardsNeeded(p.config, players)) };
      if (config.maxCard > 154) continue;
      it(`${p.label} · ${players}명`, () => {
        for (let seed = 1; seed <= 6; seed++) {
          const rng = seeded(seed * 31 + players);
          const m = newMatch(config, players, rng);
          let steps = 0;
          while (m.status !== 'match-over' && steps++ < 5000) {
            if (m.status === 'round-over') {
              startNextRound(m);
              continue;
            }
            const before = allCards(m).length;
            const actors = game.actors!(m);
            expect(actors.length).toBeGreaterThan(0);
            const seat = actors[Math.floor(rng() * actors.length)];
            // 가끔 불법 수
            if (rng() < 0.2) {
              const bad: Move = rng() < 0.5 ? { type: 'pick', card: 999 } : { type: 'take', row: 9 };
              expect(() => applyMove(m, seat, bad)).toThrow();
            }
            const legal: Move = m.phase === 'take' ? { type: 'take', row: Math.floor(rng() * m.rows.length) } : { type: 'pick', card: m.hands[seat][Math.floor(rng() * m.hands[seat].length)] };
            applyMove(m, seat, rng() < 0.3 ? autoMove(m, seat) : legal);
            const cards = allCards(m);
            // 카드 보존: 처리 중인 카드(picks는 손에 남아 있음)
            expect(cards.length).toBe(before);
            expect(new Set(cards).size).toBe(cards.length);
            for (const r of m.rows) expect(r.length).toBeLessThanOrEqual(config.rowLimit);
            expect(m.rows).toHaveLength(config.rows);
          }
          expect(m.status).toBe('match-over');
        }
      });
    }
  }
});
