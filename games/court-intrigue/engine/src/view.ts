import { GameConfig } from './config';
import { Influence, LogEntry, MatchState, Pending, actors, influence, legalActions, matchTotals } from './game';
import { ActionKind, ROLES, Role } from './roles';

/** 남의 카드: 잃은 카드는 역할 공개, 살아 있는 카드는 가려짐(null) */
export interface SeenInfluence {
  id: string;
  role: Role | null;
  lost: boolean;
}

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  turn: number;
  me: number;
  hands: SeenInfluence[][];
  coins: number[];
  influence: number[];
  pending: Pending | null;
  passed: number[];
  /** 지금 잃어야 하는 사람과 이유 */
  loss: { seat: number; why: string } | null;
  /** 교환 중 뽑은 카드 (교환하는 사람에게만) */
  drawn: Influence[];
  deckCount: number;
  legal: ActionKind[];
  outOrder: number[];
  winners: number[];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const over = m.status !== 'playing';
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    turn: m.turn,
    me,
    hands: m.hands.map((h, s) => h.map((c) => ({ id: c.id, role: s === me || c.lost || over ? c.role : null, lost: c.lost }))),
    coins: m.coins,
    influence: m.hands.map((_, s) => influence(m, s)),
    pending: m.pending,
    passed: m.passed,
    loss: m.losses[0] ?? null,
    drawn: m.phase === 'exchange' && m.turn === me ? m.drawn : [],
    deckCount: m.deck.length,
    legal: me >= 0 && m.phase === 'action' && m.turn === me ? legalActions(m, me) : [],
    outOrder: m.outOrder,
    winners: m.winners,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}

/** 내가 볼 때 seat가 role을 적어도 한 장 가졌을 확률 (공개된 카드·내 카드로 장수를 셈) */
export function roleProb(v: GameView, seat: number, role: Role): number {
  if (seat === v.me) return v.hands[seat].some((h) => !h.lost && h.role === role) ? 1 : 0;
  const total = v.config.copies * ROLES.length;
  const seenRole = v.hands.flat().filter((h) => h.role === role && (h.lost || v.hands[v.me]?.includes(h))).length + v.drawn.filter((d) => d.role === role).length;
  const seenAll = v.hands.flat().filter((h) => h.lost).length + (v.hands[v.me]?.filter((h) => !h.lost).length ?? 0) + v.drawn.length;
  const left = v.config.copies - seenRole;
  const pool = total - seenAll;
  if (left <= 0 || pool <= 0) return 0;
  const k = v.influence[seat];
  // 가려진 k장 중 적어도 하나가 role일 확률 (비복원 근사)
  let none = 1;
  for (let i = 0; i < k; i++) none *= Math.max(0, (pool - left - i) / (pool - i));
  return 1 - none;
}
