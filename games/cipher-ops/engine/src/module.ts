import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, layout, sanitizeConfig, validateConfig, wordPool } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { cipherBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'genius', text: '팀장 천재 아님? 🧠' },
  { id: 'what', text: '그 힌트 뭐야?? 🤯' },
  { id: 'trust', text: '나만 믿어 😎' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'clue') return typeof x.word === 'string' && Number.isFinite(x.count);
  if (x.type === 'guess' || x.type === 'mark') return Number.isInteger(x.index);
  return x.type === 'end';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'cipher-ops',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const l = layout(c);
    return {
      text: `${c.size}×${c.size} · 팀 카드 ${l.first}·${l.second}장 · 중립 ${l.neutral} · 암살자 ${l.assassins} · 단어 ${wordPool(c).length}개 중에서`,
      warnings: players % 2 === 1 ? ['인원이 홀수라 한 팀이 한 명 더 많아요'] : [],
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
  bot: cipherBot,
  status: (m) => m.status,
  turn: (m) => actors(m)[0] ?? 0,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.winners.length,
};
