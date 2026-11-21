import { GameConfig, colorCount, colorOwner, startCell } from './config';
import { LogEntry, MatchState, actors, colorScore, matchTotals, ownerOf } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  me: number;
  board: number[];
  remaining: string[][];
  color: number;
  /** 색마다 지금 두는 좌석 (공유 색은 차례마다) */
  owners: number[];
  /** 색마다 고정 주인 (공유면 -1) */
  fixedOwners: number[];
  stuck: boolean[];
  lastCells: number[];
  starts: [number, number][];
  colorScores: number[];
  winners: number[];
  roundTotals: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const n = colorCount(m.config);
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    me,
    board: m.board,
    remaining: m.remaining,
    color: m.color,
    owners: Array.from({ length: n }, (_, c) => ownerOf(m, c)),
    fixedOwners: Array.from({ length: n }, (_, c) => colorOwner(m.config, m.players, c)),
    stuck: m.stuck,
    lastCells: m.lastCells,
    starts: Array.from({ length: n }, (_, c) => startCell(m.config, c)),
    colorScores: Array.from({ length: n }, (_, c) => colorScore(m, c)),
    winners: m.winners,
    roundTotals: m.roundTotals,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-30),
  };
}
