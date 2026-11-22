import { GameConfig } from './config';
import { Card, LogEntry, MatchState, PotResult, Street, actors, blinds, matchTotals, raiseRange } from './game';
import { HAND_NAMES, best, categoryOf } from './hand';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  street: Street;
  handNo: number;
  me: number;
  turn: number;
  board: Card[];
  /** 내 패는 늘, 남의 패는 쇼다운에 보여 준 것만 */
  hole: (Card[] | null)[];
  chips: number[];
  bets: number[];
  committed: number[];
  pot: number;
  folded: boolean[];
  busted: boolean[];
  dealer: number;
  sb: number;
  bb: number;
  blinds: { sb: number; bb: number; level: number };
  currentBet: number;
  toCall: number;
  raise: { min: number; max: number } | null;
  /** 내 지금 족보 이름 (보드 3장 이상일 때) */
  myHand: string | null;
  results: PotResult[];
  ready: boolean[];
  outOrder: number[];
  roundScores: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const showAll = m.status !== 'playing';
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    street: m.street,
    handNo: m.handNo,
    me,
    turn: m.toAct,
    board: m.board,
    hole: m.hole.map((h, s) => (s === me || (m.phase === 'showdown' && m.shown[s]) || showAll ? h : h.length ? null : [])),
    chips: m.chips,
    bets: m.bets,
    committed: m.committed,
    pot: m.committed.reduce((a, b) => a + b, 0),
    folded: m.folded,
    busted: m.busted,
    dealer: m.dealer,
    sb: m.sb,
    bb: m.bb,
    blinds: blinds(m),
    currentBet: m.currentBet,
    toCall: me >= 0 ? Math.max(0, m.currentBet - m.bets[me]) : 0,
    raise: me >= 0 && m.phase === 'bet' && m.toAct === me ? raiseRange(m, me) : null,
    myHand: me >= 0 && m.board.length >= 3 && m.hole[me]?.length ? HAND_NAMES[categoryOf(best([...m.hole[me], ...m.board]).score)] : null,
    results: m.results,
    ready: m.ready,
    outOrder: m.outOrder,
    roundScores: m.roundScores,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
