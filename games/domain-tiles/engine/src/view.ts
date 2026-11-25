import { GameConfig } from './config';
import { Kingdom, LogEntry, MatchState, Placement, Slot, actors, currentSeat, legalPlacements, matchTotals, scoreKingdom } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  step: MatchState['step'];
  me: number;
  turn: number;
  kingdoms: Kingdom[];
  row: Slot[];
  next: Slot[];
  active: number;
  deckLeft: number;
  /** 내가 지금 놓을 수 있는 자리 (내 놓기 차례일 때만) */
  legal: Placement[];
  scores: number[];
  roundScores: number[][];
  totals: number[];
  discarded: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const turn = m.status === 'playing' ? currentSeat(m) : -1;
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    step: m.step,
    me,
    turn,
    kingdoms: m.kingdoms,
    row: m.row,
    next: m.next,
    active: m.active,
    deckLeft: m.deck.length,
    legal: me >= 0 && turn === me && m.step === 'place' ? legalPlacements(m.kingdoms[me], m.row[m.active].domino, m.config.size) : [],
    scores: m.kingdoms.map((k) => scoreKingdom(k).total),
    roundScores: m.roundScores,
    totals: matchTotals(m),
    discarded: m.discarded,
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
