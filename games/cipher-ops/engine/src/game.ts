import { RuleError } from '@bg/core';
import { GameConfig, layout, parseCustom, validateConfig, wordPool } from './config';

export class MoveError extends RuleError {}

/** A = 먼저 시작하는 팀이 아니라 "빨강 팀"(좌석 0·2·4…), B = "파랑 팀"(좌석 1·3·5…) */
export type Team = 0 | 1;
export type Key = 0 | 1 | 'N' | 'X';

export type Move = { type: 'clue'; word: string; count: number } | { type: 'guess'; index: number } | { type: 'end' } | { type: 'mark'; index: number };

export interface ClueRec {
  team: Team;
  word: string;
  /** 0~9, 99 = 무제한(∞) */
  count: number;
  /** 이 힌트로 맞힌 카드 */
  hits: number[];
}

export type LogEntry =
  | { n: number; type: 'clue'; seat: number; team: Team; word: string; count: number }
  | { n: number; type: 'guess'; seat: number; team: Team; index: number; word: string; key: Key }
  | { n: number; type: 'end'; seat: number; team: Team }
  | { n: number; type: 'win'; team: Team; reason: 'all' | 'assassin' };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  words: string[];
  key: Key[];
  /** 공개된 카드: 공개한 좌석 (안 됐으면 null) */
  revealed: (number | null)[];
  /** 지금 차례 팀 */
  team: Team;
  /** 먼저 시작한 팀 (카드 1장 더) */
  starter: Team;
  phase: 'clue' | 'guess';
  clue: ClueRec | null;
  guessesLeft: number;
  clues: ClueRec[];
  /** 팀별 팀장 좌석 */
  spymasters: [number, number];
  /** 요원들이 "이거 같아" 표시한 카드: 카드 번호 → 좌석들 (같은 팀에게만 보임, 판정에 영향 없음) */
  marks: Record<number, number[]>;
  /** 판별 이긴 팀 */
  winners: Team[];
  winReason: 'all' | 'assassin' | null;
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
  if (m.log.length > 80) m.log.shift();
}

export const teamOf = (seat: number): Team => (seat % 2) as Team;
export const teamSeats = (players: number, team: Team) => Array.from({ length: players }, (_, i) => i).filter((s) => s % 2 === team);

function deal(m: MatchState) {
  const c = m.config;
  const l = layout(c);
  // 방장이 넣은 단어를 먼저 쓰고, 모자라면 묶음에서
  const custom = parseCustom(c.customWords);
  const rest = shuffle(
    wordPool(c).filter((w) => !custom.includes(w)),
    m,
  );
  const words = shuffle([...shuffle([...custom], m).slice(0, l.total), ...rest].slice(0, l.total), m);
  const starter = (m.round % 2 === 1 ? Math.floor(nextRandom(m) * 2) : 1 - m.starter) as Team;
  const key: Key[] = shuffle([...Array(l.first).fill(starter), ...Array(l.second).fill(1 - starter), ...Array(l.neutral).fill('N'), ...Array(l.assassins).fill('X')], m);
  const pick = (team: Team) => {
    const seats = teamSeats(m.players, team);
    return seats[c.rotateSpymaster ? (m.round - 1) % seats.length : 0];
  };
  Object.assign(m, {
    words,
    key,
    revealed: Array(l.total).fill(null),
    team: starter,
    starter,
    phase: 'clue',
    clue: null,
    guessesLeft: 0,
    clues: [],
    spymasters: [pick(0), pick(1)],
    marks: {},
    winReason: null,
    status: 'playing',
  });
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, winners: [], log: [], seq: 0, starter: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m);
  return m;
}

export const isSpymaster = (m: Pick<MatchState, 'spymasters'>, seat: number) => m.spymasters.includes(seat);
export const operatives = (m: Pick<MatchState, 'spymasters' | 'players'>, team: Team) => teamSeats(m.players, team).filter((s) => s !== m.spymasters[team]);

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  return m.phase === 'clue' ? [m.spymasters[m.team]] : operatives(m, m.team);
}

export const remaining = (m: Pick<MatchState, 'key' | 'revealed'>, team: Team) => m.key.filter((k, i) => k === team && m.revealed[i] === null).length;

/** 힌트 단어 검사: 한 단어, 보드의 공개 안 된 단어와 같거나 서로 포함하면 안 됨 */
export function clueProblem(m: Pick<MatchState, 'words' | 'revealed'>, word: string): string | null {
  const w = word.trim();
  if (!w) return '힌트 단어를 입력해 주세요';
  if (/\s/.test(w)) return '힌트는 띄어쓰기 없는 한 단어로 주세요';
  if (w.length > 16) return '힌트 단어가 너무 길어요';
  for (let i = 0; i < m.words.length; i++) {
    if (m.revealed[i] !== null) continue;
    const b = m.words[i];
    if (b === w) return `「${b}」는 보드에 있는 단어라 힌트로 줄 수 없어요`;
    if (w.length >= 2 && b.length >= 2 && (b.includes(w) || w.includes(b))) return `「${b}」와 겹치는 단어라 힌트로 줄 수 없어요`;
  }
  return null;
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 판이 없어요');
  const c = m.config;
  if (move.type === 'end' && m.phase === 'clue') {
    // 팀장이 힌트를 못 정하고 넘김 (시간 초과·대신 진행)
    if (seat !== m.spymasters[m.team]) throw new MoveError('지금은 팀장이 힌트를 정하는 중이에요');
    log(m, { type: 'end', seat, team: m.team });
    return passTurn(m);
  }
  if (move.type === 'clue') {
    if (m.phase !== 'clue') throw new MoveError('지금은 요원들이 맞히는 중이에요');
    if (seat !== m.spymasters[m.team]) throw new MoveError(isSpymaster(m, seat) ? '상대 팀장의 차례예요' : '힌트는 팀장만 줄 수 있어요');
    const problem = clueProblem(m, String(move.word ?? ''));
    if (problem) throw new MoveError(problem);
    const count = move.count === 99 ? 99 : Math.max(0, Math.min(9, Math.round(move.count)));
    if (!Number.isFinite(count)) throw new MoveError('숫자를 골라 주세요');
    const rec: ClueRec = { team: m.team, word: move.word.trim(), count, hits: [] };
    m.clue = rec;
    m.clues.push(rec);
    m.phase = 'guess';
    m.guessesLeft = count === 0 || count === 99 || c.guessLimit === 'unlimited' ? 99 : c.guessLimit === 'plusOne' ? count + 1 : count;
    log(m, { type: 'clue', seat, team: m.team, word: rec.word, count });
    return;
  }
  if (m.phase !== 'guess') throw new MoveError('먼저 팀장이 힌트를 줘야 해요');
  if (!operatives(m, m.team).includes(seat)) throw new MoveError(teamOf(seat) === m.team ? '팀장은 맞힐 수 없어요. 요원이 골라요' : '지금은 상대 팀이 맞히는 중이에요');
  if (move.type === 'mark') {
    const i = move.index;
    if (!Number.isInteger(i) || i < 0 || i >= m.words.length || m.revealed[i] !== null) throw new MoveError('표시할 수 없는 카드예요');
    const cur = m.marks[i] ?? [];
    m.marks[i] = cur.includes(seat) ? cur.filter((x) => x !== seat) : [...cur, seat];
    return;
  }
  if (move.type === 'end') {
    log(m, { type: 'end', seat, team: m.team });
    return passTurn(m);
  }
  if (move.type === 'guess') {
    const i = move.index;
    if (!Number.isInteger(i) || i < 0 || i >= m.words.length) throw new MoveError('그런 카드는 없어요');
    if (m.revealed[i] !== null) throw new MoveError('이미 공개된 카드예요');
    m.revealed[i] = seat;
    delete m.marks[i];
    const k = m.key[i];
    log(m, { type: 'guess', seat, team: m.team, index: i, word: m.words[i], key: k });
    if (k === 'X') return win(m, (1 - m.team) as Team, 'assassin');
    if (k === m.team) m.clue!.hits.push(i);
    // 어느 팀이든 자기 카드를 다 찾으면 승리 (상대 카드를 대신 열어 줘도)
    for (const t of [0, 1] as Team[]) if (remaining(m, t) === 0) return win(m, t, 'all');
    if (k !== m.team) return passTurn(m);
    m.guessesLeft--;
    if (m.guessesLeft <= 0) passTurn(m);
    return;
  }
  throw new MoveError('할 수 없는 동작이에요');
}

function passTurn(m: MatchState) {
  m.marks = {};
  m.team = (1 - m.team) as Team;
  m.phase = 'clue';
  m.clue = null;
  m.guessesLeft = 0;
}

function win(m: MatchState, team: Team, reason: 'all' | 'assassin') {
  m.winners.push(team);
  m.winReason = reason;
  log(m, { type: 'win', team, reason });
  const need = Math.floor(m.config.rounds / 2) + 1;
  const wins = m.winners.filter((t) => t === team).length;
  m.status = m.round >= m.config.rounds || wins >= need ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 판이 끝나지 않았어요');
  m.round++;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.winners.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.winners = [...prev.winners];
  deal(m);
  return m;
}

/** 좌석별 = 그 팀이 이긴 판 수 */
export function matchTotals(m: Pick<MatchState, 'winners' | 'players'>): number[] {
  return Array.from({ length: m.players }, (_, s) => m.winners.filter((t) => t === teamOf(s)).length);
}

/** 시간 초과·대신 진행: 팀장은 이번 차례를 넘기고, 요원은 그만 고른다 (무작위로 찍다가 암살자를 고르지 않게) */
export function autoMove(_m: MatchState, _seat: number): Move {
  return { type: 'end' };
}
