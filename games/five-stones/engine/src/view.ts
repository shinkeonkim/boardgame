import { GameConfig } from './config';
import { LogEntry, MatchState, Stone, actors, matchTotals, stoneOf } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  me: number;
  /** 내 돌 색 (관전이면 null) */
  myStone: Stone | null;
  turn: number;
  /** 좌석별 돌 색 */
  stones: Stone[];
  board: number[];
  moves: number;
  lastMove: [number, number] | null;
  winLine: [number, number][] | null;
  roundWinners: number[];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const last = [...m.log].reverse().find((e) => e.type === 'place');
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    me,
    myStone: me >= 0 ? stoneOf(m, me) : null,
    turn: m.turn,
    stones: [stoneOf(m, 0), stoneOf(m, 1)],
    board: m.board,
    moves: m.moves,
    lastMove: last && last.type === 'place' && m.moves > 0 ? [last.x, last.y] : null,
    winLine: m.winLine,
    roundWinners: m.roundWinners,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
