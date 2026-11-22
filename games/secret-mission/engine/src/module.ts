import type { EmoteDef, GameModule } from '@bg/core';
import { CLASSIC, GameConfig, LIMITS, SPIES, rolesFor, sanitizeConfig, validateConfig } from './config';
import { MatchState, Move, actors, applyMove, autoMove, continueMatch, matchTotals, newMatch, startNextRound } from './game';
import { GameView, viewFor } from './view';
import { missionBot } from './bot';

export const EXTRA_EMOTES: EmoteDef[] = [
  { id: 'trust', text: '나 믿어 🙋' },
  { id: 'sus', text: '수상한데… 🤨' },
  { id: 'swear', text: '맹세코 요원 ✋' },
];

function isMove(m: unknown): m is Move {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  switch (x.type) {
    case 'team':
      return Array.isArray(x.seats) && x.seats.length <= 10;
    case 'vote':
      return typeof x.approve === 'boolean';
    case 'play':
      return typeof x.success === 'boolean';
    case 'hunt':
      return Number.isInteger(x.target);
  }
  return false;
}

export const game: GameModule<GameConfig, MatchState, Move, GameView> = {
  id: 'secret-mission',
  players: { min: LIMITS.players[0], max: LIMITS.players[1] },
  defaultConfig: CLASSIC,
  sanitizeConfig,
  validateConfig,
  lobbySummary(c, players) {
    const p = Math.max(5, Math.min(10, players));
    const roles = rolesFor(c, p);
    return { text: `${p}명: 요원 ${p - SPIES[p]} · 첩자 ${SPIES[p]}${c.seer ? ` · 특수 역할 ${roles.filter((r) => r !== 'agent' && r !== 'spy').length}` : ''} · ${c.rejectLimit}번 부결되면 첩자 승`, warnings: [], info: {} };
  },
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch,
  isMove,
  applyMove,
  autoMove,
  viewFor,
  actors,
  bot: missionBot,
  status: (m) => m.status,
  turn: (m) => m.leader,
  round: (m) => m.round,
  config: (m) => m.config,
  totals: matchTotals,
  startNextRound: (m) => startNextRound(m),
  continueMatch,
  roundsDone: (m) => m.roundScores.length,
};
