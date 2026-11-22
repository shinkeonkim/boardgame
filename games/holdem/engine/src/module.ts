import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { holdemBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'allin', text: '올인!! 💰' },
  { id: 'bluff', text: '블러핑 아니야 😏' },
  { id: 'fold', text: '이번엔 접을게 🏳️' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  if (x.type === 'raise') return Number.isFinite(Number(x.to));
  return ['fold', 'check', 'call', 'allin', 'next'].includes(String(x.type));
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'holdem',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig: (c) => validateConfig(c),
  lobbySummary(c) {
    return { text: `칩 ${c.startChips} · 블라인드 ${c.smallBlind}/${c.smallBlind * 2}${c.blindUp ? ` · ${c.blindUp}핸드마다 ×2` : ''}${c.maxHands ? ` · ${c.maxHands}핸드` : ' · 한 명 남을 때까지'} · 돈이 오가지 않는 칩 게임`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  // 쇼다운은 잠깐 보여 주고 넘어감
  timerSec: (m) => (m.phase === 'showdown' ? 8 : m.config.turnTimerSec),
  // 핸드·거리·행동마다 타이머를 새로 (같은 사람이 연달아 행동해도)
  phaseKey: (m) => `${m.handNo}-${m.phase}-${m.street}-${m.seq}`,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: holdemBot,
  status: (m) => m.status,
  turn: (m) => m.toAct,
  round: (m) => m.handNo,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
