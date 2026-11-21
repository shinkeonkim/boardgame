import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, tokensFor, validateConfig } from './config';
import { buildDeck, MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { letterBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'poker', text: '내 패? 안 알려 줘 🤫' },
  { id: 'queen', text: '여왕님 지켜 👑' },
  { id: 'gotyou', text: '딱 걸렸어 🗡️' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'play') return typeof x.cardId === 'string' && (x.target === undefined || Number.isInteger(x.target)) && (x.guess === undefined || typeof x.guess === 'string');
  return x.type === 'keep' && typeof x.cardId === 'string';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'sealed-letter',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    return { text: `카드 ${buildDeck(c.edition).length}장 · 인장 ${tokensFor(c, players)}개를 먼저 모으면 우승`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: letterBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundWinners.length,
};
