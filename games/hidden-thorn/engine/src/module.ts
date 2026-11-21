import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { thornBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'rose', text: '전부 장미야 🌹' },
  { id: 'thorn', text: '찔렸다! 🌵' },
  { id: 'dare', text: '뒤집어 봐 😏' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  switch (x.type) {
    case 'place':
    case 'lose':
      return x.disc === 'rose' || x.disc === 'thorn';
    case 'bid':
      return Number.isInteger(x.count);
    case 'flip':
      return Number.isInteger(x.seat);
    case 'pass':
      return true;
  }
  return false;
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'hidden-thorn',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c) {
    return { text: `한 사람 장미 ${c.roses} · 가시 ${c.thorns} · ${c.winPoints}번 성공하면 우승`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: thornBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.winners.length,
};
