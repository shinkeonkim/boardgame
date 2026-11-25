import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, goAtFor, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { goStopBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'go', text: '고! 🔥' },
  { id: 'ppeok', text: '뻑이네… 😩' },
  { id: 'nice', text: '쪽! 😘' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'go' || x.type === 'stop') return true;
  return x.type === 'play' && typeof x.card === 'string' && (x.target === undefined || typeof x.target === 'string');
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'go-stop',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    return { text: `${goAtFor(c, players)}점부터 고/스톱 · ${c.rounds}판${c.bak ? ' · 피박·광박' : ''}${c.steal ? ' · 피 뺏기' : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: goStopBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  phaseKey: (m) => m.phase,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
  animMs: () => 1100,
};
