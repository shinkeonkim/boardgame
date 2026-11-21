import { GameConfig, penaltyOf } from './config';
import { LogEntry, MatchState, Placement, actors, matchTotals, roundPenalties, rowPenalty, targetRow } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  turn: number;
  /** 관전자면 -1 */
  me: number;
  hand: number[];
  handCounts: number[];
  rows: number[][];
  rowPenalties: number[];
  /** 내가 고른 카드 (공개 전) */
  myPick: number | null;
  /** 누가 골랐는지 (카드는 숨김) */
  picked: boolean[];
  /** 공개된 뒤 아직 놓지 않은 카드 (작은 것부터) */
  queue: { seat: number; card: number }[];
  chooser: number | null;
  /** 이번 차례에 놓인 결과 */
  placed: Placement[];
  /** 이번 판 가져간 벌점 (공개 설정이 아니면 내 것만, 남은 null) */
  penalties: (number | null)[];
  takenCounts: number[];
  roundScores: number[][];
  totals: number[];
  actors: number[];
  /** 내 카드마다: 들어갈 줄과 그 줄을 가져가게 되는지 (지금 줄 기준, 다른 사람 카드는 모름) */
  preview: Record<number, { row: number; take: boolean; penalty: number }>;
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const c = m.config;
  const preview: GameView['preview'] = {};
  if (me >= 0) {
    for (const card of m.hands[me]) {
      const r = targetRow(m.rows, card);
      if (r < 0) {
        const cheapest = Math.min(...m.rows.map((row) => rowPenalty(c, row)));
        preview[card] = { row: -1, take: true, penalty: cheapest };
      } else {
        const take = m.rows[r].length >= c.rowLimit;
        preview[card] = { row: r, take, penalty: take ? rowPenalty(c, m.rows[r]) : 0 };
      }
    }
  }
  const pens = roundPenalties(m);
  return {
    config: c,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    turn: m.turn,
    me,
    hand: me >= 0 ? m.hands[me] : [],
    handCounts: m.hands.map((h) => h.length),
    rows: m.rows,
    rowPenalties: m.rows.map((r) => rowPenalty(c, r)),
    myPick: me >= 0 ? m.picks[me] : null,
    picked: m.picks.map((p) => p !== null),
    queue: m.queue,
    chooser: m.chooser,
    placed: m.placed,
    penalties: pens.map((p, i) => (c.openPenalties || i === me || m.status !== 'playing' ? p : null)),
    takenCounts: m.taken.map((t) => t.length),
    roundScores: m.roundScores,
    totals: matchTotals(m),
    actors: actors(m),
    preview,
    log: m.log.slice(-20),
  };
}

export { penaltyOf };
