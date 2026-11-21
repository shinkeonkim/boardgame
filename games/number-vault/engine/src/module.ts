import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, startTilesFor, tileCount, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { vaultBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'gotcha', text: '찾았다 🔍' },
  { id: 'how', text: '어떻게 알았어?! 😳' },
  { id: 'safe', text: '내 금고는 튼튼해 🔐' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  switch (x.type) {
    case 'draw':
      return x.color === undefined || x.color === 0 || x.color === 1;
    case 'guess':
      return Number.isInteger(x.target) && typeof x.tileId === 'string' && Number.isFinite(x.value);
    case 'reveal':
      return typeof x.tileId === 'string';
    case 'place':
      return Number.isInteger(x.index);
    case 'stop':
      return true;
  }
  return false;
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'number-vault',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    return { text: `타일 ${tileCount(c)}장 (0~${c.maxNumber} 흑백${c.jokers ? ` + 조커 ${c.jokers}` : ''}) · 한 사람 ${startTilesFor(c, players)}장으로 시작`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: vaultBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.winners.length,
};
