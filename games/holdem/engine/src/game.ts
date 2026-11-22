import { RuleError } from '@bg/core';
import { GameConfig, validateConfig } from './config';
import { HAND_NAMES, best, categoryOf } from './hand';

export class MoveError extends RuleError {}

export interface Card {
  id: string;
  suit: number;
  rank: number;
}

/** raise.to = 이번 거리(스트리트)에 내가 낸 총액을 이만큼으로 */
export type Move = { type: 'fold' } | { type: 'check' } | { type: 'call' } | { type: 'raise'; to: number } | { type: 'allin' } | { type: 'next' };

export interface PotResult {
  amount: number;
  winners: number[];
  hand: string | null;
}

export type LogEntry =
  | { n: number; type: 'hand'; no: number; dealer: number; sb: number; bb: number }
  | { n: number; type: 'act'; seat: number; act: 'fold' | 'check' | 'call' | 'raise' | 'allin' | 'blind'; amount: number; to: number }
  | { n: number; type: 'street'; street: Street; board: Card[] }
  | { n: number; type: 'win'; pots: PotResult[]; shown: boolean }
  | { n: number; type: 'bust'; seat: number; place: number }
  | { n: number; type: 'end'; winner: number };

export type Street = 'preflop' | 'flop' | 'turn' | 'river';

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'bet' | 'showdown';
  street: Street;
  handNo: number;
  deck: Card[];
  board: Card[];
  hole: Card[][];
  chips: number[];
  /** 이번 거리에 낸 칩 · 이번 핸드에 낸 총 칩 */
  bets: number[];
  committed: number[];
  folded: boolean[];
  busted: boolean[];
  dealer: number;
  sb: number;
  bb: number;
  toAct: number;
  currentBet: number;
  minRaise: number;
  /** 마지막 레이즈 뒤에 행동한 사람 */
  acted: boolean[];
  /** 쇼다운: 결과와 「다음 핸드」 누른 사람 */
  results: PotResult[];
  shown: boolean[];
  ready: boolean[];
  /** 탈락 순서 (처음 탈락한 사람이 앞) */
  outOrder: number[];
  roundScores: number[][];
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
  if (m.log.length > 80) m.log.shift();
}

export const blinds = (m: Pick<MatchState, 'config' | 'handNo'>) => {
  const level = m.config.blindUp ? Math.floor((m.handNo - 1) / m.config.blindUp) : 0;
  const sb = m.config.smallBlind * 2 ** level;
  return { sb, bb: sb * 2, level };
};

const alive = (m: MatchState) => Array.from({ length: m.players }, (_, i) => i).filter((s) => !m.busted[s]);
const nextAlive = (m: MatchState, from: number) => {
  for (let k = 1; k <= m.players; k++) {
    const s = (from + k) % m.players;
    if (!m.busted[s]) return s;
  }
  return from;
};
/** 이번 핸드에서 아직 베팅할 수 있는 사람 (안 접었고, 올인 아님) */
const canAct = (m: MatchState, s: number) => !m.busted[s] && !m.folded[s] && m.chips[s] > 0;
const inHand = (m: MatchState) => alive(m).filter((s) => !m.folded[s]);

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c);
  if (errors.length) throw new MoveError(errors[0]);
  const m = {
    config: c,
    players,
    round: 1,
    status: 'playing',
    handNo: 0,
    chips: Array(players).fill(c.startChips),
    busted: Array(players).fill(false),
    outOrder: [],
    roundScores: [],
    log: [],
    seq: 0,
    rng: Math.floor(rng() * 4294967296) >>> 0,
  } as unknown as MatchState;
  m.dealer = Math.floor(nextRandom(m) * players);
  startHand(m, true);
  return m;
}

function startHand(m: MatchState, first = false) {
  m.handNo++;
  if (!first) m.dealer = nextAlive(m, m.dealer);
  const deck: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ id: `${s}-${r}`, suit: s, rank: r });
  for (let i = deck.length - 1; i > 0; i--) {
    const k = Math.floor(nextRandom(m) * (i + 1));
    [deck[i], deck[k]] = [deck[k], deck[i]];
  }
  m.deck = deck;
  m.board = [];
  m.hole = Array.from({ length: m.players }, (_, s) => (m.busted[s] ? [] : [m.deck.pop()!, m.deck.pop()!]));
  m.bets = Array(m.players).fill(0);
  m.committed = Array(m.players).fill(0);
  m.folded = m.busted.map((b) => b);
  m.results = [];
  m.shown = Array(m.players).fill(false);
  m.ready = Array(m.players).fill(false);
  m.street = 'preflop';
  m.phase = 'bet';
  const live = alive(m);
  // 둘이면 딜러가 스몰 블라인드
  m.sb = live.length === 2 ? m.dealer : nextAlive(m, m.dealer);
  m.bb = nextAlive(m, m.sb);
  const { sb, bb } = blinds(m);
  log(m, { type: 'hand', no: m.handNo, dealer: m.dealer, sb: m.sb, bb: m.bb });
  post(m, m.sb, sb);
  post(m, m.bb, bb);
  m.currentBet = Math.max(m.bets[m.sb], m.bets[m.bb]);
  m.minRaise = bb;
  m.acted = Array(m.players).fill(false);
  // 빅 블라인드 다음 사람부터 (둘이면 딜러 = 스몰 블라인드가 먼저)
  m.toAct = m.bb;
  if (!needsAction(m)) endStreet(m);
  else advanceTurn(m);
}

function post(m: MatchState, s: number, amount: number) {
  const a = Math.min(amount, m.chips[s]);
  m.chips[s] -= a;
  m.bets[s] += a;
  m.committed[s] += a;
  log(m, { type: 'act', seat: s, act: 'blind', amount: a, to: m.bets[s] });
}

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  if (m.phase === 'showdown') return alive(m).filter((s) => !m.ready[s]);
  return [m.toAct];
}

/** 이 사람이 낼 수 있는 레이즈 범위 (못 하면 null) */
export function raiseRange(m: MatchState, s: number): { min: number; max: number } | null {
  const total = m.bets[s] + m.chips[s];
  const toCall = m.currentBet - m.bets[s];
  if (m.chips[s] <= toCall) return null;
  let max = total;
  if (m.config.limit === 'pot') {
    const pot = m.committed.reduce((a, b) => a + b, 0) + toCall;
    max = Math.min(total, m.currentBet + pot);
  }
  const min = Math.min(total, m.currentBet + m.minRaise);
  return min > max ? { min: max, max } : { min, max };
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 게임이 없어요');
  if (!actors(m).includes(seat)) throw new MoveError(m.phase === 'showdown' ? '다음 핸드를 기다려요' : '지금은 내 차례가 아니에요');
  if (m.phase === 'showdown') {
    if (move.type !== 'next') throw new MoveError('「다음 핸드」를 눌러요');
    m.ready[seat] = true;
    if (actors(m).length === 0) nextHand(m);
    return;
  }
  const toCall = m.currentBet - m.bets[seat];
  switch (move.type) {
    case 'fold':
      m.folded[seat] = true;
      log(m, { type: 'act', seat, act: 'fold', amount: 0, to: m.bets[seat] });
      break;
    case 'check':
      if (toCall > 0) throw new MoveError(`${toCall} 콜하거나 접어야 해요`);
      log(m, { type: 'act', seat, act: 'check', amount: 0, to: m.bets[seat] });
      break;
    case 'call': {
      if (toCall <= 0) throw new MoveError('낼 칩이 없어요 — 체크하세요');
      const a = Math.min(toCall, m.chips[seat]);
      pay(m, seat, a);
      log(m, { type: 'act', seat, act: m.chips[seat] === 0 ? 'allin' : 'call', amount: a, to: m.bets[seat] });
      break;
    }
    case 'raise':
    case 'allin': {
      const range = raiseRange(m, seat);
      const total = m.bets[seat] + m.chips[seat];
      const to = move.type === 'allin' ? (m.config.limit === 'pot' && range ? range.max : total) : Math.round(Number(move.to));
      if (move.type === 'allin' && m.config.limit === 'pot' && to < total && !range) throw new MoveError('지금은 콜만 할 수 있어요');
      if (move.type === 'raise') {
        if (!range) throw new MoveError('칩이 모자라 콜(올인)만 할 수 있어요');
        if (!Number.isFinite(to) || to < range.min || to > range.max) throw new MoveError(`${range.min}~${range.max} 사이로 올려요`);
      }
      const amount = to - m.bets[seat];
      if (amount <= 0) throw new MoveError('지금보다 더 내야 해요');
      const raiseBy = to - m.currentBet;
      pay(m, seat, amount);
      if (to > m.currentBet) {
        // 최소 레이즈 미만 올인은 행동을 다시 열지 않음
        if (raiseBy >= m.minRaise) {
          m.minRaise = raiseBy;
          m.acted = Array(m.players).fill(false);
        }
        m.currentBet = to;
      }
      log(m, { type: 'act', seat, act: m.chips[seat] === 0 ? 'allin' : 'raise', amount, to });
      break;
    }
    default:
      throw new MoveError('접기·체크·콜·레이즈 중 하나를 골라요');
  }
  m.acted[seat] = true;
  if (inHand(m).length === 1) return award(m, false);
  if (!needsAction(m)) return endStreet(m);
  advanceTurn(m);
}

function pay(m: MatchState, s: number, a: number) {
  m.chips[s] -= a;
  m.bets[s] += a;
  m.committed[s] += a;
}

/** 아직 행동해야 할 사람이 있나 */
function needsAction(m: MatchState): boolean {
  const actable = inHand(m).filter((s) => canAct(m, s));
  if (actable.length === 0) return false;
  if (actable.length === 1 && m.bets[actable[0]] >= m.currentBet) return false;
  return actable.some((s) => !m.acted[s] || m.bets[s] < m.currentBet);
}

function advanceTurn(m: MatchState) {
  for (let k = 1; k <= m.players; k++) {
    const s = (m.toAct + k) % m.players;
    if (canAct(m, s) && (!m.acted[s] || m.bets[s] < m.currentBet)) {
      m.toAct = s;
      return;
    }
  }
}

const STREETS: Street[] = ['preflop', 'flop', 'turn', 'river'];

function endStreet(m: MatchState) {
  // 다음 거리로 (아무도 더 베팅할 수 없으면 리버까지 깔고 쇼다운)
  while (true) {
    const i = STREETS.indexOf(m.street);
    if (i === 3) return award(m, true);
    m.street = STREETS[i + 1];
    m.deck.pop(); // 번 카드
    const n = m.street === 'flop' ? 3 : 1;
    for (let k = 0; k < n; k++) m.board.push(m.deck.pop()!);
    log(m, { type: 'street', street: m.street, board: [...m.board] });
    m.bets = Array(m.players).fill(0);
    m.currentBet = 0;
    m.minRaise = blinds(m).bb;
    m.acted = Array(m.players).fill(false);
    m.toAct = m.dealer;
    if (needsAction(m)) {
      advanceTurn(m);
      return;
    }
  }
}

/** 팟 나누기: 낸 만큼씩 층을 쌓아 사이드 팟 */
function award(m: MatchState, showdown: boolean) {
  const contenders = inHand(m);
  const scores = new Map<number, number>();
  if (showdown) for (const s of contenders) scores.set(s, best([...m.hole[s], ...m.board]).score);
  const levels = [...new Set(m.committed.filter((x) => x > 0))].sort((a, b) => a - b);
  let prev = 0;
  const results: PotResult[] = [];
  for (const lv of levels) {
    const amount = m.committed.reduce((a, c) => a + Math.max(0, Math.min(c, lv) - prev), 0);
    const eligible = contenders.filter((s) => m.committed[s] >= lv);
    prev = lv;
    if (!amount) continue;
    if (!eligible.length) {
      // 접은 사람만 낸 층 → 가장 많이 낸 남은 사람에게
      const s = contenders.sort((a, b) => m.committed[b] - m.committed[a])[0];
      m.chips[s] += amount;
      continue;
    }
    let winners = eligible;
    let hand: string | null = null;
    if (showdown && eligible.length > 1) {
      const top = Math.max(...eligible.map((s) => scores.get(s)!));
      winners = eligible.filter((s) => scores.get(s) === top);
      hand = HAND_NAMES[categoryOf(top)];
    } else if (showdown) hand = HAND_NAMES[categoryOf(scores.get(eligible[0])!)];
    // 나머지 칩은 딜러 왼쪽부터
    const share = Math.floor(amount / winners.length);
    let rest = amount - share * winners.length;
    const order = [...winners].sort((a, b) => ((a - m.dealer + m.players) % m.players) - ((b - m.dealer + m.players) % m.players));
    for (const s of order) {
      m.chips[s] += share + (rest > 0 ? 1 : 0);
      rest--;
    }
    // 같은 이긴 사람·족보면 합침
    const last = results[results.length - 1];
    if (last && last.winners.join() === winners.join() && last.hand === hand) last.amount += amount;
    else results.push({ amount, winners, hand });
  }
  m.results = results;
  m.shown = Array.from({ length: m.players }, (_, s) => showdown && contenders.includes(s));
  log(m, { type: 'win', pots: results, shown: showdown });
  // 탈락
  for (const s of alive(m))
    if (m.chips[s] <= 0) {
      m.busted[s] = true;
      m.outOrder.push(s);
      log(m, { type: 'bust', seat: s, place: alive(m).length + 1 });
    }
  m.phase = 'showdown';
  m.ready = m.busted.map((b) => b);
  m.committed = Array(m.players).fill(0);
  m.bets = Array(m.players).fill(0);
}

function nextHand(m: MatchState) {
  const live = alive(m);
  if (live.length <= 1 || (m.config.maxHands && m.handNo >= m.config.maxHands)) return finish(m);
  startHand(m);
}

function finish(m: MatchState) {
  // 점수 = 남은 칩 (탈락한 사람은 탈락 순서가 늦을수록 조금 더: 0, 1, 2…)
  const scores = m.chips.map((c, s) => (m.busted[s] ? m.outOrder.indexOf(s) : c));
  m.roundScores.push(scores);
  const winner = scores.indexOf(Math.max(...scores));
  log(m, { type: 'end', winner });
  m.status = 'match-over';
}

export function startNextRound(_m: MatchState) {
  throw new MoveError('홀덤은 한 게임으로 끝나요');
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  // 새 게임: 칩을 다시 나눠 주고 지난 결과는 기록으로 남김
  const m = newMatch(config, prev.players, rng);
  m.round = prev.round + 1;
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players' | 'chips' | 'status' | 'committed'>): number[] {
  if (m.roundScores.length) return m.roundScores[m.roundScores.length - 1];
  return m.chips.map((c, s) => c + (m.committed?.[s] ?? 0));
}

/** 시간 초과·대신 진행: 체크할 수 있으면 체크, 아니면 접기 · 쇼다운은 다음 */
export function autoMove(m: MatchState, seat: number): Move {
  if (m.phase === 'showdown') return { type: 'next' };
  return m.currentBet - m.bets[seat] > 0 ? { type: 'fold' } : { type: 'check' };
}
