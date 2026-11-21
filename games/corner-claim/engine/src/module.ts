import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, colorCount, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, ownerOf, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { claimBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'blocked', text: '길 막혔다… 🚧' },
  { id: 'squeeze', text: '쏙 들어갔다 🧩' },
  { id: 'room', text: '자리 좀 비켜 줘 🙏' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  return x.type === 'place' && typeof x.piece === 'string' && Number.isInteger(x.orient) && Number.isInteger(x.x) && Number.isInteger(x.y);
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'corner-claim',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const colors = colorCount(c);
    return {
      text: `${c.size}×${c.size} · ${colors}색${c.mode === 'classic' && players === 2 ? ' (한 사람 두 색)' : c.mode === 'classic' && players === 3 ? ' (넷째 색은 돌아가며)' : ''} · 조각 ${c.pieceSet === 'full' ? 21 : c.pieceSet === 'medium' ? 15 : 9}개`,
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
  bot: claimBot,
  status: (m) => m.status,
  turn: (m) => ownerOf(m, m.color),
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.winners.length,
};
