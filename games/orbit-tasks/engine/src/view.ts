import { TrickPlay, sortHand } from '@bg/core';
import { GameConfig } from './config';
import { Card, LogEntry, MatchState, Signal, Task, actors, bestLevel, legalCards, matchTotals, signalKind } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  level: number;
  me: number;
  turn: number;
  captain: number;
  hand: Card[];
  legal: string[];
  /** 내 손패 중 신호로 알릴 수 있는 카드 id (트릭 사이·아직 안 보냈을 때만) */
  signalable: string[];
  handCounts: number[];
  tasks: Task[];
  signals: (Signal | null)[];
  trick: TrickPlay<Card>[];
  lastTrick: MatchState['lastTrick'];
  trickNo: number;
  nextOrder: number;
  results: MatchState['results'];
  best: number;
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const hand = me >= 0 ? m.hands[me] : [];
  const canSignal = me >= 0 && m.config.signals && m.status === 'playing' && m.phase === 'play' && !m.trick.length && !m.signals[me];
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    level: m.level,
    me,
    turn: m.turn,
    captain: m.captain,
    hand: sortHand(hand, [0, 1, 2, 3, 4], (c) => c.rank),
    legal: me >= 0 ? legalCards(m, me).map((c) => c.id) : [],
    signalable: canSignal ? hand.filter((c) => signalKind(hand, c)).map((c) => c.id) : [],
    handCounts: m.hands.map((h) => h.length),
    tasks: m.tasks,
    signals: m.signals,
    trick: m.trick,
    lastTrick: m.lastTrick,
    trickNo: m.trickNo,
    nextOrder: m.nextOrder,
    results: m.results,
    best: bestLevel(m),
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
