import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { bluffBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'liar', text: '거짓말 냄새 👃' },
  { id: 'poker', text: '포커페이스 😐' },
  { id: 'dice', text: '주사위 신이시여 🎲' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'bid') return Number.isInteger(x.count) && Number.isInteger(x.face);
  return x.type === 'challenge' || x.type === 'exact' || x.type === 'roll';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'bluff-dice',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    return {
      text: `주사위 ${c.dice}개 × ${players}명 = ${c.dice * players}개 · ${c.faces}면 · ${c.wildOnes ? '1은 와일드' : '와일드 없음'}${c.exactCall ? ' · 딱 맞다' : ''}`,
      warnings: [],
      info: {},
    };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: bluffBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.winners.length,
};
