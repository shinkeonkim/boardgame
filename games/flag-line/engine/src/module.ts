import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, deckSize, majority, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { lineBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'hold', text: '이 깃발은 내 거 🚩' },
  { id: 'wedge', text: '쐐기 완성 ⚡' },
  { id: 'retreat', text: '후퇴! 🏃' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'play') return typeof x.cardId === 'string' && Number.isInteger(x.flag);
  if (x.type === 'claim') return Number.isInteger(x.flag);
  return x.type === 'pass';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'flag-line',
  players: { min: 2, max: 4 },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    return {
      text: `깃발 ${c.flags} · ${c.size}장 대형 · 카드 ${deckSize(c)}장 · 깃발 ${majority(c)}개${c.adjacentToWin ? ` 또는 연속 ${c.adjacentToWin}개` : ''}면 승리${players === 4 ? ' · 2:2 팀전' : ''}`,
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
  bot: lineBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.winners.length,
};
void LIMITS;
