import { TrickPlay, sortHand } from '@bg/core';
import { GameConfig } from './config';
import { Card, LogEntry, MatchState, PassDir, actors, legalCards, matchTotals, passTarget, pointsOf } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  me: number;
  turn: number;
  leader: number;
  /** 내 손패 (정렬됨) */
  hand: Card[];
  /** 지금 낼 수 있는 카드 id */
  legal: string[];
  /** 방금 건네받은 카드 id */
  received: string[];
  handCounts: number[];
  passDir: PassDir;
  /** 내가 건넬 사람 (건네기 중) */
  passTo: number | null;
  /** 건넬 카드를 골랐는지 (좌석별, 무엇인지는 비밀) */
  passed: boolean[];
  trick: TrickPlay<Card>[];
  lastTrick: MatchState['lastTrick'];
  trickNo: number;
  heartsBroken: boolean;
  /** 이번 판에 먹은 점수 카드 (모두에게 공개) */
  taken: Card[][];
  /** 이번 판 지금까지의 점수 */
  handPoints: number[];
  handScores: number[][];
  totals: number[];
  removed: Card[];
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
    leader: m.leader,
    hand: me >= 0 ? sortHand(m.hands[me]) : [],
    legal: me >= 0 ? legalCards(m, me).map((c) => c.id) : [],
    received: me >= 0 ? m.received[me] : [],
    handCounts: m.hands.map((h) => h.length),
    passDir: m.passDir,
    passTo: me >= 0 && m.phase === 'pass' && m.passDir !== 'hold' ? passTarget(me, m.players, m.passDir) : null,
    passed: m.passPicks.map((p) => p !== null),
    trick: m.trick,
    lastTrick: m.lastTrick ?? null,
    trickNo: m.trickNo,
    heartsBroken: m.heartsBroken,
    taken: m.taken,
    handPoints: m.taken.map((t) => t.reduce((a, c) => a + pointsOf(c, m.config), 0)),
    handScores: m.handScores,
    totals: matchTotals(m),
    removed: m.removed,
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
