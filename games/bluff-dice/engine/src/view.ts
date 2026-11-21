import { GameConfig } from './config';
import { Bid, LogEntry, MatchState, Reveal, actors, matchTotals, minCount, totalDice, wildNow } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  me: number;
  turn: number;
  counts: number[];
  /** 내 주사위 (공개 단계에선 reveal.dice로 모두) */
  myDice: number[];
  total: number;
  bids: Bid[];
  palifico: boolean;
  wild: boolean;
  reveal: Reveal | null;
  /** 숫자별 지금 걸 수 있는 최소 개수 (못 걸면 null) */
  minCounts: (number | null)[];
  hand: number;
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
    me,
    turn: m.turn,
    counts: m.counts,
    myDice: me >= 0 ? m.dice[me] ?? [] : [],
    total: totalDice(m),
    bids: m.bids,
    palifico: m.palifico,
    wild: wildNow(m),
    reveal: m.reveal,
    minCounts: Array.from({ length: m.config.faces + 1 }, (_, f) => (f === 0 ? null : minCount(m, f))),
    hand: m.hand,
    winners: m.winners,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-30),
  };
}
