import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, parseCustom, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound, timerSec } from './game';
import { GameView, viewFor } from './view';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'wow', text: '화가시네요 🎨' },
  { id: 'what', text: '이게 뭐야?? 🤔' },
  { id: 'close', text: '거의 다 왔어! 🔥' },
];

const PACK_LABEL = { all: '모든 단어', nature: '자연·동물', daily: '일상·음식', fantasy: '모험·상상', custom: '직접 넣은 단어' } as const;

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  switch (x.type) {
    case 'pick':
      return Number.isFinite(Number(x.idx));
    case 'stroke':
      return Array.isArray(x.p) && typeof x.c === 'string';
    case 'guess':
      return typeof x.text === 'string';
    default:
      return ['skip', 'undo', 'clear', 'timeup', 'next'].includes(String(x.type));
  }
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'sketch-quiz',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig: (c) => validateConfig(c),
  lobbySummary(c, players) {
    return {
      text: `한 사람이 ${c.rounds}번씩 그려요 (모두 ${players * c.rounds}번) · ${c.drawSec}초 · ${PACK_LABEL[c.pack]}${c.pack === 'custom' ? ` ${parseCustom(c.customWords).length}개` : ''}${c.hints ? ' · 초성 힌트' : ''}`,
      warnings: [],
      info: {},
    };
  },
  turnTimerSec: (c) => c.drawSec,
  timerSec,
  phaseKey: (m) => `${m.turnNo}-${m.phase}`,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  // 봇은 그림을 못 그려서 사람끼리만
  bots: false,
  status: (m) => m.status,
  turn: (m) => m.drawer,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
