import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { wordBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'got', text: '알 것 같아! 💡' },
  { id: 'same', text: '겹쳤다… 🙈' },
  { id: 'genius', text: '천재 힌트 👏' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'clue' || x.type === 'guess') return typeof x.word === 'string' && x.word.length <= 30;
  return x.type === 'pass';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'one-word',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c) {
    return { text: `${c.cards}장 · ${c.dupes === 'similar' ? '비슷한 힌트도 지워짐' : '똑같은 힌트만 지워짐'}${c.wrongCostsNext ? ' · 틀리면 다음 카드도' : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.clueSec,
  timerSec: (m) => (m.phase === 'clue' ? m.config.clueSec : m.config.guessSec),
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: wordBot,
  status: (m) => m.status,
  turn: (m) => m.guesser,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
