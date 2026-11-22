import { GameConfig, splitFor } from './config';
import { Card, Flip, LogEntry, MatchState, actors, endCard, matchTotals } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  me: number;
  turn: number;
  /** 내 손패 (정렬됨) */
  hand: Card[];
  /** 좌석별: 남은 장수, 지금 뒤집을 수 있는 양 끝 카드 id (숫자는 비밀) */
  hands: { count: number; lowId: string | null; highId: string | null; openIds: string[] }[];
  /** 가운데 카드 id (가져간 자리는 null) */
  middle: (string | null)[];
  /** 이번 차례에 뒤집힌 카드 (모두 공개) */
  flips: Flip[];
  lastMiss: Flip[];
  trios: number[][];
  handSize: number;
  winners: number[];
  roundScores: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const open = new Set(m.flips.map((f) => f.id));
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    me,
    turn: m.turn,
    hand: me >= 0 ? m.hands[me] : [],
    hands: m.hands.map((h, s) => ({ count: h.length, lowId: endCard(m, s, 'low')?.id ?? null, highId: endCard(m, s, 'high')?.id ?? null, openIds: h.filter((c) => open.has(c.id)).map((c) => c.id) })),
    middle: m.middle.map((c) => c?.id ?? null),
    flips: m.flips,
    lastMiss: m.lastMiss,
    trios: m.trios,
    handSize: splitFor(m.config, m.players).hand,
    winners: m.winners,
    roundScores: m.roundScores,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-120),
  };
}
