import { GameConfig } from './config';
import { LogEntry, MatchState, Result, actors, matchTotals } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  me: number;
  guesser: number;
  /** 맞히는 사람에게는 null */
  word: string | null;
  card: number;
  deckSize: number;
  score: number;
  /** 힌트: 쓰는 중엔 누가 썼는지만(내 것은 보임), 맞히기 단계엔 지워지지 않은 것만 맞히는 사람에게 */
  clues: { seat: number; word: string | null; done: boolean; erased: boolean }[];
  results: Result[];
  roundScores: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const guesser = me === m.guesser;
  const over = m.status !== 'playing';
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    me,
    guesser: m.guesser,
    word: guesser && !over ? null : m.word,
    card: m.card,
    deckSize: m.deck.length,
    score: m.score,
    clues: m.clues.flatMap((w, i) => {
      if (i === m.guesser) return [];
      const done = w !== null;
      // 쓰는 중: 남의 힌트는 비밀 (맞히는 사람은 물론, 다른 힌트 쓰는 사람도 — 서로 맞추지 못하게)
      if (m.phase === 'clue') return [{ seat: i, word: i === me ? w : null, done, erased: false }];
      // 맞히기: 맞히는 사람은 지워진 힌트를 못 봄, 다른 사람은 다 봄
      if (guesser && m.erased[i]) return [{ seat: i, word: null, done, erased: true }];
      return [{ seat: i, word: w, done, erased: m.erased[i] }];
    }),
    results: m.results,
    roundScores: m.roundScores,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-30),
  };
}
