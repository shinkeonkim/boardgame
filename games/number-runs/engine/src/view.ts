import { GameConfig } from './config';
import { LogEntry, MatchState, actors, handPoints, matchTotals } from './game';
import { Tile } from './sets';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  turn: number;
  me: number;
  hand: Tile[];
  handCounts: number[];
  /** 판이 끝나면 모두의 남은 타일 */
  hands: Tile[][] | null;
  table: Tile[][];
  poolCount: number;
  opened: boolean[];
  lastPlayed: string[];
  roundScores: number[][];
  handPoints: number[] | null;
  winners: number[];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const over = m.status !== 'playing';
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    turn: m.turn,
    me,
    hand: me >= 0 ? m.hands[me] : [],
    handCounts: m.hands.map((h) => h.length),
    hands: over ? m.hands : null,
    table: m.table,
    poolCount: m.pool.length,
    opened: m.opened,
    lastPlayed: m.lastPlayed,
    roundScores: m.roundScores,
    handPoints: over ? m.hands.map(handPoints) : null,
    winners: m.winners,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-30),
  };
}
