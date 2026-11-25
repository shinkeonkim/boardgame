import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { stoneBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'four', text: '사(4)다! ⚠️' },
  { id: 'hmm', text: '그 수는 생각 못 했네 🤔' },
  { id: 'gg', text: '한 수 배웠어요 🙇' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'resign') return true;
  return x.type === 'place' && Number.isInteger(x.x) && Number.isInteger(x.y);
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'five-stones',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c) {
    return { text: `${c.size}줄 판 · ${c.exactFive ? '딱 다섯만 승리' : '다섯 이상이면 승리'}${c.rounds > 1 ? ` · ${c.rounds}판 (흑백 번갈아)` : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: stoneBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundWinners.length,
  animMs: () => 500,
};
