import { GameConfig, factoriesFor } from './config';
import { Board, LogEntry, MatchState, Tile, actors, bonusOf, matchTotals, pendingRows } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  stage: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  turn: number;
  me: number;
  factories: number[][];
  center: Tile[];
  boards: Board[];
  bagCount: number;
  lidCount: number;
  nextFirst: number;
  pendingRows: number[];
  /** 끝 보너스 미리보기 */
  bonus: { rows: number; cols: number; colors: number; points: number }[];
  winners: number[];
  roundTotals: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
  factoryCount: number;
}

export function viewFor(m: MatchState, me: number): GameView {
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    stage: m.stage,
    status: m.status,
    phase: m.phase,
    turn: m.turn,
    me,
    factories: m.factories,
    center: m.center,
    boards: m.boards,
    bagCount: m.bag.length,
    lidCount: m.lid.length,
    nextFirst: m.nextFirst,
    pendingRows: me >= 0 ? pendingRows(m.config, m.boards[me]) : [],
    bonus: m.boards.map((b) => bonusOf(m.config, b)),
    winners: m.winners,
    roundTotals: m.roundTotals,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-30),
    factoryCount: factoriesFor(m.config, m.players),
  };
}
