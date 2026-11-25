import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { orbitBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'trust', text: '믿고 맡겨요 🚀' },
  { id: 'oops', text: '앗, 그건… 😱' },
  { id: 'nice', text: '완벽한 호흡 🙌' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'take') return typeof x.task === 'string';
  return (x.type === 'signal' || x.type === 'play') && typeof x.card === 'string';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'orbit-tasks',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c) {
    return { text: `과제 ${c.tasks}개부터${c.climb ? '(성공하면 +1)' : ''} · ${c.attempts}번 도전${c.ordered ? ` · 순서 표시 ${c.ordered}개` : ''}${c.signals ? ' · 신호' : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: orbitBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  phaseKey: (m) => `${m.phase}-${m.trickNo}`,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.results.length,
  animMs: (m) => (m.trick.length === 0 && m.trickNo > 0 ? 1400 : 500),
};
