import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, deckCopies, handSizeFor, oneDeck, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { plateBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'yum', text: '냠냠 😋' },
  { id: 'mine', text: '그거 내 거였는데! 😤' },
  { id: 'full', text: '배불러~ 🫃' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  return x.type === 'pick' && typeof x.cardId === 'string' && (x.second === undefined || typeof x.second === 'string');
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'pass-the-plate',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const copies = deckCopies(c, players);
    return { text: `${c.rounds}판 · 손패 ${handSizeFor(c, players)}장 · 요리 ${oneDeck(c).length}장${copies > 1 ? ` × ${copies}벌` : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: plateBot,
  status: (m) => m.status,
  turn: (m) => actors(m)[0] ?? 0,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
