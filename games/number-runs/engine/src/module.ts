import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, tileTotal, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { runsBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'joker', text: '조커 나왔다 🃏' },
  { id: 'stuck', text: '낼 게 없어… 😩' },
  { id: 'magic', text: '테이블 마술 ✨' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'draw') return true;
  return x.type === 'play' && Array.isArray(x.table) && x.table.length <= 60 && x.table.every((s) => Array.isArray(s) && s.length <= 15 && s.every((id) => typeof id === 'string'));
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'number-runs',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c) {
    return { text: `타일 ${tileTotal(c)}장 (${c.colors}색 × 1~${c.maxNumber} × ${c.copies}벌 + 조커 ${c.jokers}) · 손패 ${c.handSize}장${c.initialMeld ? ` · 처음 ${c.initialMeld}점` : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: runsBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
