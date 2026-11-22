import { RuleError } from '@bg/core';
import { packWords } from '@bg/cipher-ops-engine';
import { GameConfig, parseCustom, validateConfig } from './config';

export class MoveError extends RuleError {}

/** 선 하나: 색, 굵기, 점들 (x,y를 0~1000 정수로, 한 값에 32진수 두 글자 → 보내는 양을 반으로) */
export interface Stroke {
  c: string;
  w: number;
  p: string;
}
const B32 = '0123456789abcdefghijklmnopqrstuv';
export const encodePts = (xs: number[]) => xs.map((x) => B32[x >> 5] + B32[x & 31]).join('');
export function decodePts(p: string): number[] {
  const out: number[] = [];
  for (let i = 0; i + 1 < p.length; i += 2) out.push((B32.indexOf(p[i]) << 5) | B32.indexOf(p[i + 1]));
  return out;
}

export type Move =
  | { type: 'pick'; idx: number }
  | { type: 'skip' }
  | { type: 'stroke'; c: string; w: number; p: number[]; cont?: boolean }
  | { type: 'undo' }
  | { type: 'clear' }
  | { type: 'guess'; text: string }
  | { type: 'timeup' }
  | { type: 'next' };

export type LogEntry =
  | { n: number; type: 'turn'; drawer: number; no: number }
  | { n: number; type: 'skip'; drawer: number }
  | { n: number; type: 'guess'; seat: number; text: string; close: boolean }
  | { n: number; type: 'correct'; seat: number; points: number; order: number }
  | { n: number; type: 'reveal'; drawer: number; word: string; correct: number; drawerPoints: number }
  | { n: number; type: 'end'; winners: number[] };

export const PALETTE = ['#1d1a16', '#ffffff', '#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#8b5a2b', '#f5a3b8'];
export const SIZES = [3, 7, 14, 28];
const MAX_POINTS = 12000;

/** 테스트에서 시계 바꾸기 */
export const clock = { now: () => Date.now() };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'pick' | 'draw' | 'reveal';
  /** 몇 번째 그리기 (0부터) · 그리는 사람 */
  turnNo: number;
  drawer: number;
  options: string[];
  word: string;
  strokes: Stroke[];
  points: number;
  /** 이번 그림을 맞힌 사람 (맞힌 순) · 포기한 사람 */
  solved: number[];
  passed: number[];
  /** 단계가 끝나는 시각 · 그리기 시작 시각 */
  deadline: number;
  startedAt: number;
  ready: boolean[];
  /** 맞혀서 얻은 점수 · 그려서 얻은 점수 */
  guessPts: number[];
  drawPts: number[];
  used: string[];
  roundScores: number[][];
  winners: number[];
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
  if (m.log.length > 120) m.log.shift();
}

export const wordPool = (c: GameConfig): string[] => (c.pack === 'custom' ? parseCustom(c.customWords) : packWords(c.pack));
export const totalTurns = (m: Pick<MatchState, 'players' | 'config'>) => m.players * m.config.rounds;

/** 비교용: 띄어쓰기·대소문자 무시 */
export const norm = (s: string) => String(s ?? '').replace(/\s+/g, '').toLowerCase();

/** 한글 초성 (가 → ㄱ), 한글이 아니면 그대로 */
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
export function choseong(ch: string): string {
  const k = ch.charCodeAt(0) - 0xac00;
  return k < 0 || k > 11171 ? ch : CHO[Math.floor(k / 588)];
}

/** 편집 거리 1 이하면 「아깝다」 */
function close(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1 || b.length < 2) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i);
}

/**
 * 힌트: 시간이 35% 지나면 초성 전부, 65% 지나면 (글자 2개 이상일 때) 한 글자.
 * 띄어쓰기는 처음부터 보여 줌. null = 아직 모르는 칸.
 */
export function hintFor(m: MatchState, now = clock.now()): { slots: (string | null)[]; cho: boolean; letter: number | null } {
  const chars = [...m.word];
  const t = m.config.hints && m.phase === 'draw' ? (now - m.startedAt) / (m.deadline - m.startedAt) : 0;
  const cho = t >= 0.35;
  const letters = chars.map((ch, i) => i).filter((i) => chars[i] !== ' ');
  const letter = t >= 0.65 && letters.length >= 2 ? letters[Math.floor((m.word.length * 7) % letters.length)] : null;
  return {
    slots: chars.map((ch, i) => (ch === ' ' ? ' ' : i === letter ? ch : null)),
    cho,
    letter,
  };
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c);
  if (errors.length) throw new MoveError(errors[0]);
  const m = {
    config: c,
    players,
    round: 1,
    status: 'playing',
    turnNo: -1,
    guessPts: Array(players).fill(0),
    drawPts: Array(players).fill(0),
    used: [],
    roundScores: [],
    winners: [],
    log: [],
    seq: 0,
    rng: Math.floor(rng() * 4294967296) >>> 0,
    strokes: [],
    points: 0,
  } as unknown as MatchState;
  nextTurn(m);
  return m;
}

function nextTurn(m: MatchState) {
  m.turnNo++;
  if (m.turnNo >= totalTurns(m)) return finish(m);
  m.drawer = m.turnNo % m.players;
  const pool = wordPool(m.config).filter((w) => !m.used.includes(w));
  const src = pool.length >= m.config.choices ? pool : wordPool(m.config);
  const opts: string[] = [];
  while (opts.length < Math.min(m.config.choices, src.length)) {
    const w = src[Math.floor(nextRandom(m) * src.length)];
    if (!opts.includes(w)) opts.push(w);
  }
  m.options = opts;
  m.word = '';
  m.strokes = [];
  m.points = 0;
  m.solved = [];
  m.passed = [];
  m.phase = 'pick';
  m.startedAt = clock.now();
  m.deadline = m.startedAt + 15000;
  m.ready = Array(m.players).fill(false);
  log(m, { type: 'turn', drawer: m.drawer, no: m.turnNo + 1 });
  // 고를 게 하나뿐이면 바로 그리기
  if (opts.length === 1) startDraw(m, 0);
}

function startDraw(m: MatchState, idx: number) {
  m.word = m.options[idx];
  m.used.push(m.word);
  m.phase = 'draw';
  m.startedAt = clock.now();
  m.deadline = m.startedAt + m.config.drawSec * 1000;
}

const guessers = (m: MatchState) => Array.from({ length: m.players }, (_, s) => s).filter((s) => s !== m.drawer && !m.solved.includes(s) && !m.passed.includes(s));

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  if (m.phase === 'pick') return [m.drawer];
  if (m.phase === 'draw') return [m.drawer, ...guessers(m)];
  return Array.from({ length: m.players }, (_, s) => s).filter((s) => !m.ready[s]);
}

/** 맞힌 순서대로 10, 8, 6, 5, 4, 3… */
const GUESS_POINTS = [10, 8, 6, 5, 4];

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 게임이 없어요');
  if (!actors(m).includes(seat)) throw new MoveError(m.phase === 'draw' && m.solved.includes(seat) ? '이미 맞혔어요 — 다른 사람을 기다려요' : '지금은 할 수 없어요');
  const isDrawer = seat === m.drawer;
  switch (move.type) {
    case 'pick': {
      if (m.phase !== 'pick' || !isDrawer) throw new MoveError('그리는 사람이 단어를 골라요');
      const i = Math.floor(Number(move.idx));
      if (!(i >= 0 && i < m.options.length)) throw new MoveError('보기 중에서 골라요');
      return startDraw(m, i);
    }
    case 'skip':
      if (!isDrawer || m.phase === 'reveal') throw new MoveError('그리는 사람만 넘길 수 있어요');
      if (m.phase === 'draw' && m.solved.length) return reveal(m);
      log(m, { type: 'skip', drawer: m.drawer });
      return nextTurn(m);
    case 'stroke': {
      if (m.phase !== 'draw' || !isDrawer) throw new MoveError('그리는 사람만 그릴 수 있어요');
      const pts = (Array.isArray(move.p) ? move.p : []).slice(0, 600).map((x) => Math.max(0, Math.min(1000, Math.round(Number(x) || 0))));
      if (pts.length < 2 || pts.length % 2) throw new MoveError('선이 비었어요');
      if (m.points + pts.length / 2 > MAX_POINTS) throw new MoveError('그림이 너무 많아요 — 조금 지우고 그려요');
      const last = m.strokes[m.strokes.length - 1];
      if (move.cont && last) last.p += encodePts(pts);
      else {
        if (m.strokes.length >= 800) throw new MoveError('선이 너무 많아요');
        const c = PALETTE.includes(move.c) ? move.c : PALETTE[0];
        const w = SIZES.includes(Number(move.w)) ? Number(move.w) : SIZES[1];
        m.strokes.push({ c, w, p: encodePts(pts) });
      }
      m.points += pts.length / 2;
      return;
    }
    case 'undo': {
      if (m.phase !== 'draw' || !isDrawer) throw new MoveError('그리는 사람만 지울 수 있어요');
      const s = m.strokes.pop();
      if (s) m.points -= s.p.length / 4;
      return;
    }
    case 'clear':
      if (m.phase !== 'draw' || !isDrawer) throw new MoveError('그리는 사람만 지울 수 있어요');
      m.strokes = [];
      m.points = 0;
      return;
    case 'guess': {
      if (m.phase !== 'draw' || isDrawer) throw new MoveError('그리는 사람은 맞힐 수 없어요');
      const text = String(move.text ?? '').trim().slice(0, 30);
      if (!text) throw new MoveError('답을 적어요');
      const g = norm(text);
      const w = norm(m.word);
      if (g === w) {
        const points = GUESS_POINTS[m.solved.length] ?? 3;
        m.solved.push(seat);
        m.guessPts[seat] += points;
        log(m, { type: 'correct', seat, points, order: m.solved.length });
        if (guessers(m).length === 0) reveal(m);
        return;
      }
      // 답을 품은 말은 다른 사람에게 보이면 안 됨 → 가려서 남김
      const leak = g.includes(w) || (w.length >= 2 && close(g, w));
      log(m, { type: 'guess', seat, text: leak ? '•'.repeat(Math.min(6, [...text].length)) : text, close: close(g, w) });
      return;
    }
    case 'timeup':
      // 시간 끝 (또는 그리는 사람이 일찍 끝냄). 시간 전에 맞히는 사람이 보내면 이번 그림 포기 (자리 비움 대신 진행)
      if (m.phase === 'reveal') throw new MoveError('이미 끝났어요');
      if (!isDrawer && clock.now() < m.deadline - 1500) {
        m.passed.push(seat);
        if (guessers(m).length === 0) reveal(m);
        return;
      }
      if (m.phase === 'pick') return startDraw(m, 0);
      return reveal(m);
    case 'next':
      if (m.phase !== 'reveal') throw new MoveError('그림이 끝나면 다음으로 넘어가요');
      m.ready[seat] = true;
      if (actors(m).length === 0) nextTurn(m);
      return;
  }
  throw new MoveError('알 수 없는 수');
}

function reveal(m: MatchState) {
  // 그린 사람: 맞힌 사람마다 +3 (모두 맞히면 +2 더)
  const n = m.solved.length;
  const pts = n * 3 + (n && n === m.players - 1 ? 2 : 0);
  m.drawPts[m.drawer] += pts;
  m.phase = 'reveal';
  m.startedAt = clock.now();
  m.deadline = m.startedAt + 6000;
  m.ready = Array(m.players).fill(false);
  log(m, { type: 'reveal', drawer: m.drawer, word: m.word, correct: n, drawerPoints: pts });
}

function finish(m: MatchState) {
  m.status = 'match-over';
  m.phase = 'reveal';
  const total = m.guessPts.map((g, s) => g + m.drawPts[s]);
  m.roundScores.push(total);
  const top = Math.max(...total);
  m.winners = total.map((t, s) => (t === top ? s : -1)).filter((s) => s >= 0);
  log(m, { type: 'end', winners: m.winners });
}

export function startNextRound(_m: MatchState) {
  throw new MoveError('그림 퀴즈는 한 게임으로 끝나요');
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const m = newMatch(config, prev.players, rng);
  m.round = prev.round + 1;
  return m;
}

export function matchTotals(m: Pick<MatchState, 'guessPts' | 'drawPts'>): number[] {
  return m.guessPts.map((g, s) => g + m.drawPts[s]);
}

/** 시간이 다 됐을 때: 단어는 첫 번째, 그리기·맞히기는 끝, 공개 화면은 다음 */
export function autoMove(m: MatchState, _seat: number): Move {
  if (m.phase === 'reveal') return { type: 'next' };
  return { type: 'timeup' };
}

export function timerSec(m: MatchState): number {
  return Math.max(1, Math.ceil((m.deadline - clock.now()) / 1000));
}
