/**
 * 봇 시험장 (테스트용): 봇끼리 한 게임을 끝까지 두고 결과를 돌려준다.
 * 모든 게임 테스트에서 "봇이 늘 규칙에 맞게 두는지", "어려움이 쉬움을 이기는지"를 같은 방식으로 검사한다.
 */
import type { BotLevel } from './bot';
import type { AnyGameModule, Rng } from './module';

export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PlayOutResult {
  totals: number[];
  /** 봇이 규칙에 어긋난 수를 골라 autoMove로 대신한 횟수 (0이어야 함) */
  illegal: number;
  moves: number;
  match: unknown;
}

/** levels[i] = i번 좌석 봇 난이도. 판이 여러 개면 다음 판도 이어서 둔다 */
export function playOut(game: AnyGameModule, config: unknown, levels: BotLevel[], seed = 1, maxMoves = 20000): PlayOutResult {
  const rng = seeded(seed);
  const match = game.newMatch(config, levels.length, rng);
  let illegal = 0;
  let moves = 0;
  const errors: string[] = [];
  while (moves < maxMoves) {
    const status = game.status(match);
    if (status === 'match-over') break;
    if (status === 'round-over') {
      game.startNextRound(match, rng);
      continue;
    }
    const actors: number[] = game.actors?.(match) ?? [game.turn(match)];
    for (const seat of actors) {
      if (game.status(match) !== 'playing') break;
      const now: number[] = game.actors?.(match) ?? [game.turn(match)];
      if (!now.includes(seat)) continue;
      try {
        const move = game.bot ? game.bot.choose({ view: game.viewFor(match, seat), seat, level: levels[seat], rng }) : game.autoMove(match, seat);
        game.applyMove(match, seat, move);
      } catch (e) {
        illegal++;
        if (errors.length < 3) errors.push(String((e as Error).message));
        game.applyMove(match, seat, game.autoMove(match, seat));
      }
      moves++;
    }
  }
  if (game.status(match) !== 'match-over') throw new Error(`playOut: ${maxMoves}수 안에 끝나지 않음`);
  if (errors.length) (globalThis as { console?: { warn(...a: unknown[]): void } }).console?.warn('봇 규칙 위반 예:', errors);
  return { totals: game.totals(match), illegal, moves, match };
}

/**
 * 두 난이도 대결: 좌석을 번갈아 바꿔 가며 n판. a가 이긴 비율을 돌려준다.
 * lowerWins: 점수가 낮을수록 좋은 게임(벌점)일 때 true.
 */
export function duel(game: AnyGameModule, config: unknown, a: BotLevel, b: BotLevel, n = 20, opts: { players?: number; lowerWins?: boolean } = {}): number {
  const players = opts.players ?? 2;
  let wins = 0;
  let games = 0;
  for (let i = 0; i < n; i++) {
    const aSeat = i % players;
    const levels = Array.from({ length: players }, (_, s) => (s === aSeat ? a : b));
    const { totals } = playOut(game, config, levels, 1000 + i);
    const mine = totals[aSeat];
    const others = totals.filter((_, s) => s !== aSeat);
    const best = opts.lowerWins ? Math.min(...others) : Math.max(...others);
    if (opts.lowerWins ? mine < best : mine > best) wins++;
    else if (mine === best) wins += 0.5;
    games++;
  }
  return wins / games;
}
