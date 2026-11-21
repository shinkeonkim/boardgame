import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, cardsNeeded, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { rowSixBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'row', text: '그 줄 내 거 아니지? 😰' },
  { id: 'phew', text: '휴 살았다 😮‍💨' },
  { id: 'gift', text: '줄 선물 받아라 🎁' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'pick') return Number.isInteger(x.card);
  if (x.type === 'take') return Number.isInteger(x.row);
  return false;
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'row-six',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const need = cardsNeeded(c, players);
    const warnings: string[] = [];
    if (c.maxCard > need * 2.2 && players <= 4) warnings.push('카드 범위가 넓어 운이 커요. 「인원에 맞추기」로 줄일 수 있어요');
    return {
      text: `카드 1~${c.maxCard} 중 ${need}장 사용 · ${c.rows}줄 · ${c.rowLimit + 1}번째에 가져감 · ${c.endMode === 'target' ? `${c.target}점 넘으면 끝` : `${c.rounds}판`}`,
      warnings,
      info: { cardsNeeded: need },
    };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: rowSixBot,
  status: (m) => m.status,
  turn: (m) => actors(m)[0] ?? 0,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
