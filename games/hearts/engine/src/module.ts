import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { heartsBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'queen', text: '스페이드 Q 받아라 ♠' },
  { id: 'moon', text: '문 쏘는 거 아니지? 🌕' },
  { id: 'safe', text: '휴, 살았다 😮‍💨' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'pass') return Array.isArray(x.cards) && x.cards.length <= 3 && x.cards.every((c) => typeof c === 'string');
  return x.type === 'play' && typeof x.card === 'string';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'hearts',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const cards = Math.floor((52 - (52 % Math.max(3, players))) / Math.max(3, players));
    return { text: `${c.target}점에 닿으면 끝 · 한 사람 ${cards}장${c.passing ? ' · 3장 건네기' : ''}${c.shootMoon ? ' · 문 쏘기' : ''}${c.jackBonus ? ' · 다이아 J -10' : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: heartsBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  lowerWins: true,
  phaseKey: (m) => `${m.phase}-${m.trickNo}`,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.handScores.length,
  // 트릭이 끝나면 카드가 모이는 연출을 볼 틈
  animMs: (m) => (m.trick.length === 0 && m.trickNo > 0 ? 1400 : 500),
};
