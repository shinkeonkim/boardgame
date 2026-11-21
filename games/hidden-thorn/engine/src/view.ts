import { GameConfig } from './config';
import { Disc, LogEntry, MatchState, actors, matchTotals, totalOnMats } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  turn: number;
  me: number;
  /** 내 손의 원판 */
  hand: Disc[];
  /** 내 앞 원판 (아래→위) */
  myMat: Disc[];
  /** 좌석별 쌓인 개수 */
  matCounts: number[];
  /** 좌석별 뒤집혀 공개된 원판 (위에서부터) */
  flippedDiscs: Disc[][];
  /** 좌석별 가진 원판 수 */
  ownedCounts: number[];
  /** 내가 가진 원판 종류 */
  myOwned: Disc[];
  points: number[];
  bid: MatchState['bid'];
  passed: number[];
  roses: number;
  total: number;
  outOrder: number[];
  winners: number[];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    turn: m.turn,
    me,
    hand: me >= 0 ? m.hands[me] : [],
    myMat: me >= 0 ? m.mats[me] : [],
    matCounts: m.mats.map((x) => x.length),
    flippedDiscs: m.mats.map((mat, s) => mat.slice(mat.length - m.flipped[s]).reverse()),
    ownedCounts: m.owned.map((o) => o.length),
    myOwned: me >= 0 ? m.owned[me] : [],
    points: m.points,
    bid: m.bid,
    passed: m.passed,
    roses: m.roses,
    total: totalOnMats(m),
    outOrder: m.outOrder,
    winners: m.winners,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
