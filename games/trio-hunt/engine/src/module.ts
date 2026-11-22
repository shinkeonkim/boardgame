import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, splitFor, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { trioBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'remember', text: '기억났다! 🧠' },
  { id: 'oops', text: '아 그게 아니었어… 🤦' },
  { id: 'seven', text: '7 노린다 🎯' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type !== 'reveal' || !Number.isInteger(x.seat)) return false;
  return x.seat === -1 ? Number.isInteger(x.idx) : x.end === 'low' || x.end === 'high';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'trio-hunt',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const p = Math.min(6, Math.max(3, players));
    const s = splitFor(c, p);
    return { text: `손패 ${s.hand}장 · 가운데 ${s.middle}장 · 세트 ${c.goal}개${c.sevenWins ? ' (7 세 장이면 바로)' : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: trioBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
