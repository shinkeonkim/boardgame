import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, deckSize, handSizeFor, maxScore, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { flareBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'trust', text: '믿고 낸다 🙏' },
  { id: 'nope', text: '그거 내지 마!! 🙅' },
  { id: 'boom', text: '펑! 💥' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'play' || x.type === 'discard') return typeof x.cardId === 'string';
  if (x.type === 'hint') return Number.isInteger(x.to) && (Number.isInteger(x.color) || Number.isInteger(x.value));
  return false;
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'flare-signals',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const hs = handSizeFor(c, players);
    return {
      text: `카드 ${deckSize(c)}장 · 손패 ${hs}장 · 힌트 ${c.hints} · 실수 ${c.fuses}번까지 · 만점 ${maxScore(c)}`,
      warnings: c.fuses >= 5 && c.bombScore === 'keep' ? ['연습용 설정이에요'] : [],
      info: { handSize: hs, maxScore: maxScore(c) },
    };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  bot: flareBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
