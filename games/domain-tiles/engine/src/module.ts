import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, currentSeat, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { domainBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'crown', text: '왕관이다 👑' },
  { id: 'mine', text: '그거 내가 찜했는데 😤' },
  { id: 'full', text: '빈틈없이 꽉! 🧱' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'claim') return Number.isInteger(x.slot);
  if (x.type === 'discard') return true;
  return x.type === 'place' && [x.x1, x.y1, x.x2, x.y2].every((n) => Number.isInteger(n));
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'domain-tiles',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c) {
    return { text: `${c.size}×${c.size} 왕국 · 땅 크기 × 왕관${c.middle ? ' · 성 가운데 +10' : ''}${c.harmony ? ' · 꽉 채우면 +5' : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: domainBot,
  status: (m) => m.status,
  turn: (m) => (m.status === 'playing' ? currentSeat(m) : 0),
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  phaseKey: (m) => `${m.step}-${m.active}-${m.row.length}`,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
  animMs: () => 700,
};
