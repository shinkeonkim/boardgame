import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, gemsFor, noblesFor, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { guildBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'rich', text: '부자 되는 중 💎' },
  { id: 'snipe', text: '그 카드 찜! 📌' },
  { id: 'noble', text: '귀족님 어서 오세요 🎩' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  switch (x.type) {
    case 'take':
      return Array.isArray(x.gems) && x.gems.every((g) => Number.isInteger(g));
    case 'reserve':
      return typeof x.cardId === 'string' || x.tier === 1 || x.tier === 2 || x.tier === 3;
    case 'buy':
      return typeof x.cardId === 'string';
    case 'discard':
      return Array.isArray(x.gems) && x.gems.every((g) => Number.isInteger(g));
    case 'noble':
      return typeof x.nobleId === 'string';
  }
  return false;
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'gem-guild',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    return { text: `${c.winPoints}점 · 보석 색마다 ${gemsFor(c, players)}개 · 황금 ${c.gold} · 귀족 ${noblesFor(c, players)}명`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: guildBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.winners.length,
};
