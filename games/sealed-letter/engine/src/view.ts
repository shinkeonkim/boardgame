import { CARD_DEFS, Kind } from './cards';
import { GameConfig, tokensFor } from './config';
import { Card, LogEntry, MatchState, actors, matchTotals, mustPlayAgent, targetsFor } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  turn: number;
  me: number;
  hand: Card[];
  handCounts: number[];
  /** 내가 아는 남의 카드 (점술가·결투·재상으로 알게 된 것, 아직 들고 있을 때만) */
  known: (Card | null)[];
  discards: Card[][];
  burnedOpen: Card[];
  deckCount: number;
  alive: boolean[];
  protectedSeats: boolean[];
  tokens: number[];
  goal: number;
  /** 카드마다 지목할 수 있는 사람 */
  targets: Record<string, number[]>;
  mustAgent: boolean;
  lastRound: MatchState['lastRound'];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const hand = me >= 0 ? m.hands[me] : [];
  const targets: Record<string, number[]> = {};
  for (const c of hand) if (CARD_DEFS[c.kind].needsTarget) targetsFor(m, me, CARD_DEFS[c.kind].self).forEach(() => (targets[c.id] = targetsFor(m, me, CARD_DEFS[c.kind].self)));
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    turn: m.turn,
    me,
    hand,
    handCounts: m.hands.map((h) => h.length),
    known: Array.from({ length: m.players }, (_, t) => {
      if (me < 0 || t === me) return null;
      const id = m.known[me][t];
      return id ? m.hands[t].find((c) => c.id === id) ?? null : null;
    }),
    discards: m.discards,
    burnedOpen: m.burnedOpen,
    deckCount: m.deck.length,
    alive: m.alive,
    protectedSeats: m.protectedSeats,
    tokens: m.tokens,
    goal: tokensFor(m.config, m.players),
    targets,
    mustAgent: mustPlayAgent(hand),
    lastRound: m.lastRound,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-30),
  };
}

/** 내가 볼 때 아직 위치를 모르는 카드 종류별 장수 (덱·빼 둔 카드·남의 손) */
export function unseenCounts(v: GameView, spec: { kind: Kind; copies: number }[]): Map<Kind, number> {
  const out = new Map<Kind, number>(spec.map((s) => [s.kind, s.copies]));
  const take = (k: Kind) => out.set(k, Math.max(0, (out.get(k) ?? 0) - 1));
  v.hand.forEach((c) => take(c.kind));
  v.discards.flat().forEach((c) => take(c.kind));
  v.burnedOpen.forEach((c) => take(c.kind));
  v.known.forEach((c) => c && take(c.kind));
  return out;
}
