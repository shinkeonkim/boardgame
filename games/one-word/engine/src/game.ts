import { RuleError } from '@bg/core';
import { packWords } from '@bg/cipher-ops-engine';
import { GameConfig, validateConfig } from './config';

export class MoveError extends RuleError {}

export type Move = { type: 'clue'; word: string } | { type: 'guess'; word: string } | { type: 'pass' };

export interface Result {
  card: number;
  guesser: number;
  word: string;
  clues: { seat: number; word: string; erased: boolean }[];
  guess: string | null;
  ok: boolean;
}

export type LogEntry = { n: number; type: 'clues'; erased: number; left: number } | { n: number; type: 'guess'; seat: number; guess: string | null; word: string; ok: boolean; lostNext: boolean } | { n: number; type: 'end'; score: number };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'clue' | 'guess';
  deck: string[];
  /** 지금 카드 번호 (0부터) · 맞힌 수 */
  card: number;
  score: number;
  guesser: number;
  word: string;
  clues: (string | null)[];
  erased: boolean[];
  results: Result[];
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
  if (m.log.length > 60) m.log.shift();
}

/** 비교용: 공백·문장부호를 빼고 소문자 */
export const norm = (w: string) => w.normalize('NFC').replace(/[\s.,!?~'"·\-_/]/g, '').toLowerCase();

/** 한글을 자모로 풀기 (바닷가 → ㅂㅏㄷㅏㅅㄱㅏ): 받침이 붙어 모양이 바뀐 말도 비슷한지 알 수 있게 */
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
export function jamo(w: string): string {
  let out = '';
  for (const ch of w) {
    const k = ch.charCodeAt(0) - 0xac00;
    if (k < 0 || k > 11171) {
      out += ch;
      continue;
    }
    out += CHO[Math.floor(k / 588)] + JUNG[Math.floor((k % 588) / 28)] + JONG[k % 28];
  }
  return out;
}

/** 두 힌트가 같은지 (설정에 따라 비슷한 것도: 한쪽이 다른 쪽을 품거나, 자모로 앞 4개 이상이 같으면) */
export function sameClue(a: string, b: string, dupes: GameConfig['dupes']): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (dupes === 'exact') return false;
  const jx = jamo(x);
  const jy = jamo(y);
  const short = jx.length <= jy.length ? jx : jy;
  const long = short === jx ? jy : jx;
  return (x.length >= 2 && y.includes(x)) || (y.length >= 2 && x.includes(y)) || (short.length >= 4 && long.startsWith(short)) || (x.length >= 2 && y.length >= 2 && x.slice(0, 2) === y.slice(0, 2));
}

/** 힌트가 정답을 품거나 정답과 같으면 지운다 */
export const leaksAnswer = (clue: string, word: string) => {
  const c = norm(clue);
  const w = norm(word);
  return c.includes(w) || w.includes(c) && c.length >= 2;
};

function deal(m: MatchState, first: number) {
  const words = packWords(m.config.pack);
  for (let i = words.length - 1; i > 0; i--) {
    const k = Math.floor(nextRandom(m) * (i + 1));
    [words[i], words[k]] = [words[k], words[i]];
  }
  m.deck = words.slice(0, m.config.cards);
  m.card = 0;
  m.score = 0;
  m.results = [];
  m.guesser = first;
  m.status = 'playing';
  startCard(m);
}
function startCard(m: MatchState) {
  m.word = m.deck[m.card];
  m.clues = Array(m.players).fill(null);
  m.erased = Array(m.players).fill(false);
  m.phase = 'clue';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, roundScores: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m, Math.floor(nextRandom(m) * players));
  return m;
}

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  if (m.phase === 'guess') return [m.guesser];
  return m.clues.flatMap((c, i) => (c === null && i !== m.guesser ? [i] : []));
}

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 게임이 없어요');
  if (!actors(m).includes(seat)) throw new MoveError(m.phase === 'clue' ? (seat === m.guesser ? '이번엔 내가 맞히는 사람이에요' : '힌트를 이미 썼어요') : '지금은 맞히는 사람 차례예요');
  if (m.phase === 'clue') {
    if (move.type !== 'clue') throw new MoveError('힌트 한 단어를 써 주세요');
    const w = String(move.word ?? '').trim();
    if (!norm(w)) throw new MoveError('힌트를 써 주세요');
    if (/\s/.test(w)) throw new MoveError('한 단어만 쓸 수 있어요 (띄어쓰기 없이)');
    if (w.length > 12) throw new MoveError('12글자까지예요');
    m.clues[seat] = w;
    if (actors(m).length) return;
    // 모두 썼으면: 정답을 품은 힌트와 겹친 힌트를 지운다
    const live = m.clues.map((c, i) => (i === m.guesser ? null : c));
    live.forEach((c, i) => {
      if (c === null) return;
      if (leaksAnswer(c, m.word)) m.erased[i] = true;
      live.forEach((d, k) => {
        if (k !== i && d !== null && sameClue(c, d, m.config.dupes)) m.erased[i] = true;
      });
    });
    m.phase = 'guess';
    log(m, { type: 'clues', erased: m.erased.filter(Boolean).length, left: live.filter((c, i) => c !== null && !m.erased[i]).length });
    return;
  }
  // 맞히기
  let guess: string | null = null;
  if (move.type === 'guess') {
    guess = String(move.word ?? '').trim();
    if (!norm(guess)) throw new MoveError('정답을 써 주세요 (모르면 「넘기기」)');
  } else if (move.type !== 'pass') throw new MoveError('정답을 쓰거나 넘겨요');
  const ok = guess !== null && norm(guess) === norm(m.word);
  if (ok) m.score++;
  // 틀리면 다음 카드도 버림 (원작). 넘기면 그 카드만
  const lostNext = !ok && guess !== null && m.config.wrongCostsNext && m.card + 1 < m.deck.length;
  m.results.push({ card: m.card, guesser: m.guesser, word: m.word, clues: m.clues.flatMap((w, i) => (w === null || i === m.guesser ? [] : [{ seat: i, word: w, erased: m.erased[i] }])), guess, ok });
  log(m, { type: 'guess', seat, guess, word: m.word, ok, lostNext });
  m.card += lostNext ? 2 : 1;
  if (m.card >= m.deck.length) return finish(m);
  m.guesser = (m.guesser + 1) % m.players;
  startCard(m);
}

function finish(m: MatchState) {
  m.roundScores.push(Array(m.players).fill(m.score));
  log(m, { type: 'end', score: m.score });
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 게임이 끝나지 않았어요');
  m.round++;
  deal(m, (m.guesser + 1) % m.players);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}게임을 마쳤어요. 게임 수를 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = prev.roundScores.map((r) => [...r]);
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundScores) r.forEach((v, i) => (t[i] += v));
  return t;
}

/** 시간 초과·대신 진행: 힌트는 「?」로 빈 힌트 대신 넘김 표시, 맞히기는 넘기기 */
export function autoMove(m: MatchState, _seat: number): Move {
  return m.phase === 'clue' ? { type: 'clue', word: '…' } : { type: 'pass' };
}
