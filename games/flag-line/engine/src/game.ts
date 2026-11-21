import { RuleError } from '@bg/core';
import { GameConfig, majority, validateConfig } from './config';
import { TroopCard, bestCompletion, strength } from './formation';

export class MoveError extends RuleError {}

export type Side = 0 | 1;
export const sideOf = (seat: number): Side => (seat % 2) as Side;

export interface Flag {
  cards: [TroopCard[], TroopCard[]];
  /** 양쪽이 대형을 완성한 순번 (먼저 완성한 쪽이 동점에서 이김) */
  doneAt: [number | null, number | null];
  owner: Side | null;
}

export type Move = { type: 'play'; cardId: string; flag: number } | { type: 'claim'; flag: number } | { type: 'pass' };

export type LogEntry =
  | { n: number; type: 'play'; seat: number; card: TroopCard; flag: number }
  | { n: number; type: 'claim'; seat: number; side: Side; flag: number; auto: boolean }
  | { n: number; type: 'pass'; seat: number }
  | { n: number; type: 'win'; side: Side; why: 'majority' | 'adjacent' | 'end' };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  turn: number;
  deck: TroopCard[];
  hands: TroopCard[][];
  flags: Flag[];
  /** 카드를 놓은 순번 (완성 순서 비교) */
  tick: number;
  winners: Side[];
  winWhy: 'majority' | 'adjacent' | 'end' | null;
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

type DistOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
function log(m: MatchState, e: DistOmit<LogEntry, 'n'>) {
  m.log.push({ ...(e as LogEntry), n: ++m.seq });
  if (m.log.length > 60) m.log.shift();
}

function deal(m: MatchState, first: number) {
  const c = m.config;
  const deck: TroopCard[] = [];
  for (let color = 0; color < c.colors; color++) for (let v = 1; v <= c.maxValue; v++) deck.push({ id: `${color}-${v}`, color, value: v });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(m) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  m.hands = Array.from({ length: m.players }, () => deck.splice(0, c.handSize));
  m.deck = deck;
  m.flags = Array.from({ length: c.flags }, () => ({ cards: [[], []], doneAt: [null, null], owner: null }));
  m.tick = 0;
  m.turn = first;
  m.winWhy = null;
  m.status = 'playing';
  autoClaims(m);
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, winners: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m, Math.floor(nextRandom(m) * players));
  return m;
}

/** 아직 보드에 나오지 않은 카드 (덱 + 모든 손패) — 주장 증명은 보드에 보이는 카드만으로 */
export function unseenOnBoard(m: Pick<MatchState, 'deck' | 'hands'>): TroopCard[] {
  return [...m.deck, ...m.hands.flat()];
}

/** side가 이 깃발을 지금 확실히 가져갈 수 있는지 */
export function canClaim(m: Pick<MatchState, 'flags' | 'config' | 'deck' | 'hands'>, f: number, side: Side): boolean {
  const flag = m.flags[f];
  if (flag.owner !== null) return false;
  const mine = flag.cards[side];
  const theirs = flag.cards[1 - side];
  const size = m.config.size;
  if (mine.length < size) return false;
  const my = strength(mine);
  if (theirs.length === size) {
    const th = strength(theirs);
    return my > th || (my === th && (flag.doneAt[side] ?? 0) < (flag.doneAt[1 - side] ?? Infinity));
  }
  // 상대가 아직 덜 놓았으면: 남은 카드로 만들 수 있는 최고가 내 것을 넘지 못해야 (같으면 내가 먼저 완성했으니 나의 승)
  const best = bestCompletion(theirs, unseenOnBoard(m), size, my);
  return best <= my;
}

export function actors(m: MatchState): number[] {
  return m.status === 'playing' ? [m.turn] : [];
}

const openFlags = (m: MatchState, side: Side) => m.flags.map((f, i) => ({ f, i })).filter(({ f }) => f.owner === null && f.cards[side].length < m.config.size).map(({ i }) => i);

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  if (seat !== m.turn) throw new MoveError('지금은 내 차례가 아니에요');
  const side = sideOf(seat);
  if (move.type === 'claim') {
    if (!Number.isInteger(move.flag) || !m.flags[move.flag]) throw new MoveError('그런 깃발은 없어요');
    if (!canClaim(m, move.flag, side)) throw new MoveError('아직 확실하지 않아요. 상대가 이길 수 있는 카드가 남아 있어요');
    m.flags[move.flag].owner = side;
    log(m, { type: 'claim', seat, side, flag: move.flag, auto: false });
    checkWin(m);
    return;
  }
  if (move.type === 'pass') {
    if (m.hands[seat].length && openFlags(m, side).length) throw new MoveError('놓을 수 있는 카드가 있어요');
    log(m, { type: 'pass', seat });
    return endTurn(m);
  }
  if (move.type !== 'play') throw new MoveError('카드를 깃발에 놓아 주세요');
  const idx = m.hands[seat].findIndex((c) => c.id === move.cardId);
  if (idx < 0) throw new MoveError('손에 없는 카드예요');
  const flag = m.flags[move.flag];
  if (!flag) throw new MoveError('그런 깃발은 없어요');
  if (flag.owner !== null) throw new MoveError('이미 주인이 정해진 깃발이에요');
  if (flag.cards[side].length >= m.config.size) throw new MoveError(`깃발 한쪽에는 ${m.config.size}장까지예요`);
  const [card] = m.hands[seat].splice(idx, 1);
  flag.cards[side].push(card);
  m.tick++;
  if (flag.cards[side].length === m.config.size) flag.doneAt[side] = m.tick;
  log(m, { type: 'play', seat, card, flag: move.flag });
  const drawn = m.deck.pop();
  if (drawn) m.hands[seat].push(drawn);
  endTurn(m);
}

function endTurn(m: MatchState) {
  if (checkWin(m)) return;
  // 모든 깃발이 꽉 찼으면 남은 깃발을 비교해 끝
  if (m.flags.every((f) => f.owner !== null || (f.cards[0].length === m.config.size && f.cards[1].length === m.config.size))) {
    for (const [i, f] of m.flags.entries()) {
      if (f.owner !== null) continue;
      const a = strength(f.cards[0]);
      const b = strength(f.cards[1]);
      f.owner = a > b ? 0 : b > a ? 1 : (f.doneAt[0] ?? 0) < (f.doneAt[1] ?? 0) ? 0 : 1;
      log(m, { type: 'claim', seat: f.owner, side: f.owner, flag: i, auto: true });
    }
    if (!checkWin(m)) {
      const count = [0, 1].map((s) => m.flags.filter((f) => f.owner === s).length);
      return win(m, count[0] >= count[1] ? 0 : 1, 'end');
    }
    return;
  }
  // 아무도 낼 수 없으면(카드가 떨어짐) 남은 깃발을 지금 카드로 비교해 끝
  const canPlay = (seat: number) => m.hands[seat].length > 0 && openFlags(m, sideOf(seat)).length > 0;
  if (!Array.from({ length: m.players }, (_, s) => s).some(canPlay)) {
    for (const [i, f] of m.flags.entries()) {
      if (f.owner !== null) continue;
      const a = f.cards[0].length ? strength(f.cards[0]) : -1;
      const b = f.cards[1].length ? strength(f.cards[1]) : -1;
      if (a === b) continue;
      f.owner = a > b ? 0 : 1;
      log(m, { type: 'claim', seat: f.owner, side: f.owner, flag: i, auto: true });
    }
    if (!checkWin(m)) {
      const count = [0, 1].map((s) => m.flags.filter((f) => f.owner === s).length);
      return win(m, count[0] >= count[1] ? 0 : 1, 'end');
    }
    return;
  }
  m.turn = (m.turn + 1) % m.players;
  autoClaims(m);
}

/** 차례 시작: 확정된 깃발 자동 획득 (설정) */
function autoClaims(m: MatchState) {
  if (!m.config.autoClaim || m.status !== 'playing') return;
  const side = sideOf(m.turn);
  m.flags.forEach((f, i) => {
    if (f.owner === null && canClaim(m, i, side)) {
      f.owner = side;
      log(m, { type: 'claim', seat: m.turn, side, flag: i, auto: true });
    }
  });
  checkWin(m);
}

function checkWin(m: MatchState): boolean {
  if (m.status !== 'playing') return true;
  const c = m.config;
  for (const s of [0, 1] as Side[]) {
    const owned = m.flags.map((f) => f.owner === s);
    if (owned.filter(Boolean).length >= majority(c)) return win(m, s, 'majority'), true;
    if (c.adjacentToWin > 0) {
      let run = 0;
      for (const o of owned) {
        run = o ? run + 1 : 0;
        if (run >= c.adjacentToWin) return win(m, s, 'adjacent'), true;
      }
    }
  }
  return false;
}

function win(m: MatchState, side: Side, why: 'majority' | 'adjacent' | 'end') {
  m.winners.push(side);
  m.winWhy = why;
  log(m, { type: 'win', side, why });
  m.status = m.round >= m.config.rounds || m.winners.filter((w) => w === side).length > m.config.rounds / 2 ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  // 진 편이 먼저
  const lost = 1 - m.winners[m.winners.length - 1];
  deal(m, lost);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.winners.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.winners = [...prev.winners];
  return m;
}

/** 좌석별 = 그 편이 이긴 판 수 */
export function matchTotals(m: Pick<MatchState, 'winners' | 'players'>): number[] {
  return Array.from({ length: m.players }, (_, s) => m.winners.filter((w) => w === sideOf(s)).length);
}

/** 시간 초과: 가장 낮은 카드를 빈자리가 가장 많은 깃발에 */
export function autoMove(m: MatchState, seat: number): Move {
  const side = sideOf(seat);
  const open = openFlags(m, side);
  const hand = m.hands[seat];
  if (!open.length || !hand.length) return { type: 'pass' };
  const card = [...hand].sort((a, b) => a.value - b.value)[0];
  const flag = [...open].sort((a, b) => m.flags[a].cards[side].length - m.flags[b].cards[side].length)[0];
  return { type: 'play', cardId: card.id, flag };
}


