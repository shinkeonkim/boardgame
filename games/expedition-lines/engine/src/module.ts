import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, deckSize, expectedTurns, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';

/** 이 게임에만 있는 감정 표현 (공통 목록 뒤에 붙음) */
export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'thanks', text: '버려 줘서 땡큐 🙏' },
  { id: 'yum', text: '그 카드 내 거 😋' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if ((x.type === 'play' || x.type === 'discard') && typeof x.cardId === 'string') return true;
  if (x.type === 'draw' && (x.source === 'deck' || Number.isInteger(x.source))) return true;
  return false;
}

export const expeditionLines: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'expedition-lines',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const turns = Math.round(expectedTurns(c, players) * 10) / 10;
    return {
      text: `덱 ${deckSize(c)}장 · 1인당 약 ${turns}턴`,
      warnings: turns < 12 ? ['게임이 짧을 수 있어요'] : [],
      info: { deckSize: deckSize(c), expectedTurns: turns },
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
  round: (m) => m.round + 1,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound,
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
