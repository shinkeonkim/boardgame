import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, deckSize, expectedTurns, openCells, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';

/** 이 게임에만 있는 감정 표현 (공통 목록 뒤에 붙음) */
export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'knight', text: '기사 나간다 ⚔️' },
  { id: 'crown', text: '이 땅 내 거야 👑' },
  { id: 'steal', text: '거기 내가 먹는다 🍽️' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'play') return typeof x.cardId === 'string';
  return x.type === 'draw' || x.type === 'pass';
}

export const crownMarch: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'crown-march',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const turns = Math.round(expectedTurns(c, players));
    return {
      text: `이동 카드 ${deckSize(c)}장 · 돌 ${c.stones}개 / 빈 칸 ${openCells(c)} · 1인당 약 ${turns}번 놓기`,
      warnings: turns < 8 ? ['게임이 짧을 수 있어요'] : [],
      info: { deckSize: deckSize(c), openCells: openCells(c), expectedTurns: turns },
    };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  status: (m) => m.status,
  turn: (m) => m.state.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
