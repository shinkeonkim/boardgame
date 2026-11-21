import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound, timerSec } from './game';
import { GameView, viewFor } from './view';
import { intrigueBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'sure', text: '진짜야, 믿어 😇' },
  { id: 'liar', text: '거짓말쟁이! 🤥' },
  { id: 'coin', text: '돈이 최고야 💰' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  switch (x.type) {
    case 'act':
      return typeof x.action === 'string' && (x.target === undefined || Number.isInteger(x.target));
    case 'block':
      return typeof x.role === 'string';
    case 'lose':
      return typeof x.cardId === 'string';
    case 'keep':
      return Array.isArray(x.cardIds) && x.cardIds.every((s) => typeof s === 'string');
    case 'challenge':
    case 'pass':
      return true;
  }
  return false;
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'court-intrigue',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c) {
    return { text: `역할 5종 × ${c.copies}장 · 금화 ${c.startCoins}개로 시작 · 쿠데타 ${c.coupCost} · 도전 대기 ${c.reactionSec}초`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  timerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: intrigueBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.winners.length,
};
