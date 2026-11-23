import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, catsFor, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { yachtBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'yacht', text: '요트 가자 ⛵' },
  { id: 'pray', text: '한 번만 더 🙏' },
  { id: 'zero', text: '0점 처리… 😇' },
];

const CATS = new Set(['ones', 'twos', 'threes', 'fours', 'fives', 'sixes', 'choice', 'threeKind', 'fourKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yacht']);

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'hold') return Array.isArray(x.hold) && x.hold.length <= 5;
  if (x.type === 'roll') return x.hold === undefined || (Array.isArray(x.hold) && x.hold.length <= 5);
  return x.type === 'score' && typeof x.cat === 'string' && CATS.has(x.cat);
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'yacht',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c) {
    return {
      text: `${catsFor(c).length}칸 · ${c.rolls}번 굴리기 · 위쪽 ${c.bonusAt}점 넘으면 +${c.bonus}${c.mode === 'together' ? ' · 모두 동시에' : ''}`,
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
  bot: yachtBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
