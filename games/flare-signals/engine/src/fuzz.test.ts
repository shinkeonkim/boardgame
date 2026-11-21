import { describe, expect, it } from 'vitest';
import { seeded } from '@bg/core';
import { PRESETS, deckSize } from './config';
import { MatchState, Move, applyMove, autoMove, newMatch, startNextRound } from './game';

const all = (m: MatchState) => m.deck.length + m.hands.flat().length + m.discard.length + m.piles.reduce((a, b) => a + b, 0);

describe('퍼즈', () => {
  for (const p of PRESETS) {
    for (const players of [2, 3, 5, 6]) {
      it(`${p.label} · ${players}명`, () => {
        for (let seed = 1; seed <= 8; seed++) {
          const rng = seeded(seed * 7 + players);
          const m = newMatch({ ...p.config, rounds: 2 }, players, rng);
          let steps = 0;
          while (m.status !== 'match-over' && steps++ < 2000) {
            if (m.status === 'round-over') {
              startNextRound(m);
              continue;
            }
            const seat = m.turn;
            const hand = m.hands[seat];
            const r = rng();
            const tries: Move[] = [
              { type: 'play', cardId: hand[Math.floor(rng() * hand.length)].id },
              { type: 'discard', cardId: hand[Math.floor(rng() * hand.length)].id },
              { type: 'hint', to: (seat + 1) % players, value: 1 + Math.floor(rng() * 5) },
              { type: 'hint', to: (seat + 1) % players, color: Math.floor(rng() * 5) },
            ];
            let done = false;
            for (const t of r < 0.5 ? tries : [...tries].reverse()) {
              try {
                applyMove(m, seat, t);
                done = true;
                break;
              } catch {
                /* 불법 수 */
              }
            }
            if (!done) applyMove(m, seat, autoMove(m, seat));
            // 카드 보존 (실수로 버린 카드 포함)
            expect(all(m)).toBe(deckSize(m.config));
            expect(m.hints).toBeGreaterThanOrEqual(0);
            expect(m.hints).toBeLessThanOrEqual(m.config.hints);
          }
          expect(m.status).toBe('match-over');
        }
      });
    }
  }
});
