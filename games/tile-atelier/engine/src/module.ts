import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, factoriesFor, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { atelierBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'floor', text: '바닥에 다 깨졌어… 💔' },
  { id: 'perfect', text: '딱 맞게 들어갔다 ✨' },
  { id: 'mine', text: '그 색 내가 필요했는데! 😤' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'take') return Number.isInteger(x.source) && Number.isInteger(x.color) && Number.isInteger(x.line);
  if (x.type === 'wall') return Number.isInteger(x.row) && Number.isInteger(x.col);
  return false;
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'tile-atelier',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    return { text: `${c.colors}색 × ${c.tilesPerColor}장 · 공장 ${factoriesFor(c, players)}개${c.freeWall ? ' · 자유 벽' : ''}${c.maxRounds ? ` · ${c.maxRounds}판` : ' · 가로줄 완성하면 끝'}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: atelierBot,
  status: (m) => m.status,
  turn: (m) => actors(m)[0] ?? m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.winners.length,
};
