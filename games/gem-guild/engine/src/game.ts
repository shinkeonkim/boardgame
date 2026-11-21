import { RuleError } from '@bg/core';
import { CARDS, DevCard, GEMS, GOLD, Gem, NOBLES, Noble } from './cards';
import { GameConfig, gemsFor, noblesFor } from './config';

export class MoveError extends RuleError {}

export type Move =
  | { type: 'take'; gems: Gem[] }
  | { type: 'reserve'; cardId?: string; tier?: 1 | 2 | 3 }
  | { type: 'buy'; cardId: string }
  | { type: 'discard'; gems: number[] }
  | { type: 'noble'; nobleId: string };

export interface PlayerState {
  /** 색 0~4 + 황금(5) */
  tokens: number[];
  cards: DevCard[];
  reserved: DevCard[];
  nobles: Noble[];
}

export type LogEntry =
  | { n: number; type: 'take'; seat: number; gems: Gem[] }
  | { n: number; type: 'reserve'; seat: number; card: DevCard | null; tier: number; gold: boolean }
  | { n: number; type: 'buy'; seat: number; card: DevCard }
  | { n: number; type: 'noble'; seat: number; noble: Noble }
  | { n: number; type: 'discard'; seat: number; gems: number[] }
  | { n: number; type: 'final'; seat: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  /** turn: 행동 하나 · discard: 보석이 넘쳐 버리기 · noble: 방문할 귀족 고르기 */
  phase: 'turn' | 'discard' | 'noble';
  turn: number;
  first: number;
  bank: number[];
  decks: [DevCard[], DevCard[], DevCard[]];
  market: [DevCard[], DevCard[], DevCard[]];
  nobles: Noble[];
  me: PlayerState[];
  /** 누군가 목표 점수에 닿아 마지막 바퀴 */
  finalRound: boolean;
  winners: number[];
  roundTotals: number[][];
  log: LogEntry[];
  seq: number;
  rng: number;
}

function nextRandom(m: { rng: number }): number {
  let t = (m.rng = (m.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle<T>(arr: T[], m: { rng: number }): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type DistOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
function log(m: MatchState, e: DistOmit<LogEntry, 'n'>) {
  m.log.push({ ...(e as LogEntry), n: ++m.seq });
  if (m.log.length > 60) m.log.shift();
}

function deal(m: MatchState, first: number) {
  const c = m.config;
  const g = gemsFor(c, m.players);
  m.bank = [g, g, g, g, g, c.gold];
  m.decks = [1, 2, 3].map((t) => shuffle(CARDS.filter((x) => x.tier === t).map((x) => ({ ...x, cost: [...x.cost] })), m)) as MatchState['decks'];
  m.market = m.decks.map((d) => d.splice(0, c.market)) as MatchState['market'];
  m.nobles = shuffle([...NOBLES], m).slice(0, noblesFor(c, m.players));
  m.me = Array.from({ length: m.players }, () => ({ tokens: [0, 0, 0, 0, 0, 0], cards: [], reserved: [], nobles: [] }));
  m.turn = first;
  m.first = first;
  m.phase = 'turn';
  m.finalRound = false;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const m = { config: c, players, round: 1, winners: [], roundTotals: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m, Math.floor(nextRandom(m) * players));
  return m;
}

export const bonuses = (p: PlayerState) => GEMS.map((g) => p.cards.filter((c) => c.bonus === g).length);
export const pointsOf = (p: PlayerState) => p.cards.reduce((a, c) => a + c.points, 0) + p.nobles.reduce((a, n) => a + n.points, 0);
export const tokenCount = (p: PlayerState) => p.tokens.reduce((a, b) => a + b, 0);

/** 사려면 내야 할 보석 (보너스 뺀 뒤 모자라면 황금). 못 사면 null */
export function payment(p: PlayerState, card: DevCard): number[] | null {
  const b = bonuses(p);
  const pay = [0, 0, 0, 0, 0, 0];
  let goldNeed = 0;
  for (const g of GEMS) {
    const need = Math.max(0, card.cost[g] - b[g]);
    const use = Math.min(need, p.tokens[g]);
    pay[g] = use;
    goldNeed += need - use;
  }
  if (goldNeed > p.tokens[GOLD]) return null;
  pay[GOLD] = goldNeed;
  return pay;
}

export const findCard = (m: Pick<MatchState, 'market' | 'me'>, seat: number, id: string): { card: DevCard; from: 'market' | 'reserved'; tier?: number } | null => {
  for (let t = 0; t < 3; t++) {
    const c = m.market[t].find((x) => x.id === id);
    if (c) return { card: c, from: 'market', tier: t };
  }
  const r = m.me[seat].reserved.find((x) => x.id === id);
  return r ? { card: r, from: 'reserved' } : null;
};

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [m.turn] : [];
}

function refill(m: MatchState, t: number) {
  while (m.market[t].length < m.config.market && m.decks[t].length) m.market[t].push(m.decks[t].shift()!);
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  const c = m.config;
  const p = m.me[seat];
  if (m.phase === 'discard') {
    if (move.type !== 'discard') throw new MoveError(`보석이 ${c.tokenLimit}개를 넘어요. 버릴 보석을 골라 주세요`);
    const over = tokenCount(p) - c.tokenLimit;
    const total = move.gems.reduce((a, b) => a + b, 0);
    if (move.gems.length !== 6 || move.gems.some((n, i) => !Number.isInteger(n) || n < 0 || n > p.tokens[i])) throw new MoveError('가진 보석만 버릴 수 있어요');
    if (total !== over) throw new MoveError(`${over}개를 버려야 해요`);
    move.gems.forEach((n, i) => {
      p.tokens[i] -= n;
      m.bank[i] += n;
    });
    log(m, { type: 'discard', seat, gems: move.gems });
    m.phase = 'turn';
    return afterAction(m, seat);
  }
  if (m.phase === 'noble') {
    if (move.type !== 'noble') throw new MoveError('방문할 귀족을 골라 주세요');
    const n = eligibleNobles(m, seat).find((x) => x.id === move.nobleId);
    if (!n) throw new MoveError('그 귀족은 조건이 맞지 않아요');
    takeNoble(m, seat, n);
    m.phase = 'turn';
    return endTurn(m, seat);
  }
  switch (move.type) {
    case 'take': {
      const gems = move.gems;
      if (!Array.isArray(gems) || gems.some((g) => !GEMS.includes(g))) throw new MoveError('보석을 골라 주세요');
      const distinct = new Set(gems).size;
      if (gems.length === 2 && distinct === 1) {
        if (m.bank[gems[0]] < c.takeTwoMin) throw new MoveError(`같은 색 2개는 그 색이 ${c.takeTwoMin}개 이상 남았을 때만 가져갈 수 있어요`);
      } else if (distinct !== gems.length || gems.length > 3 || gems.length === 0) throw new MoveError('서로 다른 색 3개, 또는 같은 색 2개를 가져와요');
      else if (gems.length < 3) {
        // 남은 색이 3가지 미만일 때만 1~2개 허용
        const avail = GEMS.filter((g) => m.bank[g] > 0).length;
        if (avail >= 3) throw new MoveError('서로 다른 색 3개를 골라 주세요');
      }
      for (const g of gems) if (m.bank[g] <= 0) throw new MoveError('그 색은 남아 있지 않아요');
      for (const g of gems) {
        m.bank[g]--;
        p.tokens[g]++;
      }
      log(m, { type: 'take', seat, gems });
      return afterAction(m, seat);
    }
    case 'reserve': {
      if (p.reserved.length >= c.maxReserve) throw new MoveError(`예약은 ${c.maxReserve}장까지예요`);
      let card: DevCard | null = null;
      let tier = 0;
      if (move.cardId) {
        const f = findCard(m, seat, move.cardId);
        if (!f || f.from !== 'market') throw new MoveError('시장에 있는 카드만 예약할 수 있어요');
        card = f.card;
        tier = f.tier!;
        m.market[tier] = m.market[tier].filter((x) => x !== card);
        refill(m, tier);
      } else if (move.tier) {
        tier = move.tier - 1;
        card = m.decks[tier].shift() ?? null;
        if (!card) throw new MoveError('그 단계 더미가 비었어요');
      } else throw new MoveError('예약할 카드를 골라 주세요');
      p.reserved.push(card);
      const gold = m.bank[GOLD] > 0;
      if (gold) {
        m.bank[GOLD]--;
        p.tokens[GOLD]++;
      }
      log(m, { type: 'reserve', seat, card: move.cardId ? card : null, tier: tier + 1, gold });
      return afterAction(m, seat);
    }
    case 'buy': {
      const f = findCard(m, seat, move.cardId);
      if (!f) throw new MoveError('살 수 있는 곳에 없는 카드예요');
      const pay = payment(p, f.card);
      if (!pay) throw new MoveError('보석이 모자라요');
      pay.forEach((n, i) => {
        p.tokens[i] -= n;
        m.bank[i] += n;
      });
      if (f.from === 'market') {
        m.market[f.tier!] = m.market[f.tier!].filter((x) => x !== f.card);
        refill(m, f.tier!);
      } else p.reserved = p.reserved.filter((x) => x !== f.card);
      p.cards.push(f.card);
      log(m, { type: 'buy', seat, card: f.card });
      return afterAction(m, seat);
    }
  }
  throw new MoveError('할 수 없는 동작이에요');
}

export function eligibleNobles(m: Pick<MatchState, 'nobles' | 'me'>, seat: number): Noble[] {
  const b = bonuses(m.me[seat]);
  return m.nobles.filter((n) => n.need.every((x, i) => b[i] >= x));
}

function takeNoble(m: MatchState, seat: number, n: Noble) {
  m.nobles = m.nobles.filter((x) => x !== n);
  m.me[seat].nobles.push(n);
  log(m, { type: 'noble', seat, noble: n });
}

function afterAction(m: MatchState, seat: number) {
  if (tokenCount(m.me[seat]) > m.config.tokenLimit) {
    m.phase = 'discard';
    return;
  }
  const el = eligibleNobles(m, seat);
  if (el.length > 1) {
    m.phase = 'noble';
    return;
  }
  if (el.length === 1) takeNoble(m, seat, el[0]);
  endTurn(m, seat);
}

function endTurn(m: MatchState, seat: number, skips = 0) {
  if (!m.finalRound && pointsOf(m.me[seat]) >= m.config.winPoints) {
    m.finalRound = true;
    log(m, { type: 'final', seat });
  }
  const next = (seat + 1) % m.players;
  if (m.finalRound && next === m.first) return finish(m);
  m.turn = next;
  m.phase = 'turn';
  // 아무것도 할 수 없으면(보석·카드 모두 없음) 그냥 넘김
  if (!canAct(m, next)) {
    if (skips >= m.players) return finish(m); // 아무도 할 수 있는 게 없음
    log(m, { type: 'take', seat: next, gems: [] });
    endTurn(m, next, skips + 1);
  }
}

function canAct(m: MatchState, seat: number): boolean {
  const p = m.me[seat];
  if (GEMS.some((g) => m.bank[g] > 0)) return true;
  if (p.reserved.length < m.config.maxReserve && (m.market.some((t) => t.length) || m.decks.some((d) => d.length))) return true;
  return [...m.market.flat(), ...p.reserved].some((c) => payment(p, c));
}

export function standings(m: Pick<MatchState, 'me'>): number[] {
  // 점수 높은 순, 같으면 산 카드가 적은 쪽
  const key = m.me.map((p) => pointsOf(p) * 100 - p.cards.length);
  return key.map((k) => 1 + key.filter((o) => o > k).length);
}

function finish(m: MatchState) {
  const ranks = standings(m);
  const w = ranks.indexOf(1);
  m.winners.push(w);
  m.roundTotals.push(m.me.map(pointsOf));
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m, (m.first + 1) % m.players);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.winners.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.winners = [...prev.winners];
  m.roundTotals = prev.roundTotals.map((r) => [...r]);
  return m;
}

/** 판별 점수 합 (여러 판이면) */
export function matchTotals(m: Pick<MatchState, 'roundTotals' | 'players' | 'me' | 'status'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundTotals) r.forEach((v, i) => (t[i] += v));
  if (m.status === 'playing') m.me.forEach((p, i) => (t[i] += pointsOf(p)));
  return t;
}

/** 시간 초과·대신 진행: 살 수 있으면 사고, 아니면 보석 3색(없으면 예약) */
export function autoMove(m: MatchState, seat: number): Move {
  const p = m.me[seat];
  if (m.phase === 'discard') {
    let over = tokenCount(p) - m.config.tokenLimit;
    const gems = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6 && over > 0; i++) {
      const n = Math.min(p.tokens[i], over);
      gems[i] = n;
      over -= n;
    }
    return { type: 'discard', gems };
  }
  if (m.phase === 'noble') return { type: 'noble', nobleId: eligibleNobles(m, seat)[0].id };
  const buyable = [...m.market.flat(), ...p.reserved].find((c) => payment(p, c));
  if (buyable) return { type: 'buy', cardId: buyable.id };
  const colors = GEMS.filter((g) => m.bank[g] > 0).slice(0, 3);
  if (colors.length) return { type: 'take', gems: colors };
  const any = m.market.flat()[0];
  if (any && p.reserved.length < m.config.maxReserve) return { type: 'reserve', cardId: any.id };
  const tier = m.decks.findIndex((d) => d.length);
  return { type: 'reserve', tier: (tier + 1) as 1 | 2 | 3 };
}
