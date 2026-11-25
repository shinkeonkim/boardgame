import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, levelsFor, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { mindBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'wait', text: '잠깐만…! ✋' },
  { id: 'feel', text: '느낌이 와요 🔮' },
  { id: 'sorry', text: '미안해요 😭' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'star') return typeof x.on === 'boolean';
  return x.type === 'play' || x.type === 'wait';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'silent-count',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    return { text: `${levelsFor(c, players)}단계까지 · 수리검 ${c.stars}개${c.rewards ? ' · 단계 보상' : ''}`, warnings: [], info: {} };
  },
  // 실시간이라 차례 제한시간이 없음
  turnTimerSec: () => 0,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: mindBot,
  status: (m) => m.status,
  turn: (m) => actors(m)[0] ?? 0,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.cleared,
  // 봇은 자주 들여다보며(약 0.3~0.6초) 「지금 낼까」를 정함 — 생각 시간이 아니라 시간 감각으로 둠
  botPaceMs: () => [250, 450],
  animMs: () => 0,
};
