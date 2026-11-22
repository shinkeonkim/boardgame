import { GameConfig } from './config';
import { Card, LogEntry, MatchState, actors, matchTotals, playProblem, top } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  me: number;
  turn: number;
  dir: 1 | -1;
  hand: Card[];
  /** 내 카드 중 지금 낼 수 있는 것 (id) */
  playable: string[];
  handCounts: number[];
  top: Card;
  discardCount: number;
  deckCount: number;
  suit: number | null;
  attack: number;
  again: boolean;
  out: number[];
  bankrupt: boolean[];
  callFor: number | null;
  callWaiting: number[];
  roundScores: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const hand = me >= 0 ? m.hands[me] : [];
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    me,
    turn: m.turn,
    dir: m.dir,
    hand,
    playable: m.phase === 'play' && m.turn === me ? hand.filter((c) => !playProblem(m, c)).map((c) => c.id) : [],
    handCounts: m.hands.map((h) => h.length),
    top: top(m),
    discardCount: m.discard.length,
    deckCount: m.deck.length,
    suit: m.suit,
    attack: m.attack,
    again: m.again,
    out: m.out,
    bankrupt: m.bankrupt,
    callFor: m.callFor,
    callWaiting: m.callWaiting,
    roundScores: m.roundScores,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-30),
  };
}
