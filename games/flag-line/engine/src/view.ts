import { GameConfig, majority } from './config';
import { TroopCard } from './formation';
import { Flag, LogEntry, MatchState, Side, actors, canClaim, matchTotals, sideOf } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  turn: number;
  me: number;
  mySide: Side | null;
  hand: TroopCard[];
  handCounts: number[];
  flags: Flag[];
  deckCount: number;
  /** 내가 지금 가져갈 수 있는 깃발 (자동 획득이 꺼져 있을 때 쓰임) */
  claimable: number[];
  goal: number;
  winners: Side[];
  winWhy: MatchState['winWhy'];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const side = me >= 0 ? sideOf(me) : null;
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    turn: m.turn,
    me,
    mySide: side,
    hand: me >= 0 ? m.hands[me] : [],
    handCounts: m.hands.map((h) => h.length),
    flags: m.flags,
    deckCount: m.deck.length,
    claimable: side !== null && m.status === 'playing' && m.turn === me ? m.flags.flatMap((_, i) => (canClaim(m, i, side) ? [i] : [])) : [],
    goal: majority(m.config),
    winners: m.winners,
    winWhy: m.winWhy,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
