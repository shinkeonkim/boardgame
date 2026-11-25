import { HCard, ScoreLine, scoreCards } from './cards';
import { GameConfig, goAtFor } from './config';
import { LogEntry, MatchState, actors, matchTotals } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  me: number;
  turn: number;
  goAt: number;
  hand: HCard[];
  handCounts: number[];
  table: HCard[];
  pileCount: number;
  captured: HCard[][];
  scores: number[];
  lines: ScoreLine[][];
  goes: number[];
  roundScores: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const sc = m.captured.map((c) => scoreCards(c));
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    me,
    turn: m.turn,
    goAt: goAtFor(m.config, m.players),
    hand: me >= 0 ? [...m.hands[me]].sort((a, b) => a.month - b.month || a.id.localeCompare(b.id)) : [],
    handCounts: m.hands.map((h) => h.length),
    table: [...m.table].sort((a, b) => a.month - b.month),
    pileCount: m.pile.length,
    captured: m.captured,
    scores: sc.map((s) => s.total),
    lines: sc.map((s) => s.lines),
    goes: m.goes,
    roundScores: m.roundScores,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
