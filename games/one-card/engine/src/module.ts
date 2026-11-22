import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { oneCardBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'onecard', text: '원카드!! ☝️' },
  { id: 'attack', text: '받아라 💥' },
  { id: 'why', text: '왜 나만… 😭' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'play') return typeof x.cardId === 'string' && (x.suit === undefined || Number.isInteger(x.suit));
  return x.type === 'draw' || x.type === 'call' || x.type === 'pass';
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'one-card',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const special = [c.attacks && '공격', c.jokers && '조커', c.seven && '7', c.jack && 'J', c.queen && 'Q', c.king && 'K'].filter(Boolean).join('·');
    return { text: `${players}명 × ${c.deal}장 · ${special || '특수 카드 없음'}${c.bankrupt ? ` · ${c.bankrupt}장 넘으면 파산` : ''}`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  // 원카드 외치기 창은 설정 시간만큼 (지나면 모두 넘김)
  timerSec: (m) => (m.phase === 'call' ? m.config.callSec : m.config.turnTimerSec),
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: oneCardBot,
  status: (m) => m.status,
  turn: (m) => m.turn,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
