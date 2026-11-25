import { GameConfig, levelsFor } from './config';
import { LogEntry, MatchState, actors, matchTotals } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  levels: number;
  status: MatchState['status'];
  me: number;
  /** 내 카드 (작은 순) */
  hand: number[];
  handCounts: number[];
  /** 가운데 맨 위 카드 (없으면 0) */
  top: number;
  pile: number[];
  lives: number;
  stars: number;
  starVotes: boolean[];
  /** 마지막 카드가 나온 뒤 흐른 ms (봇 판단용) */
  sinceMs: number;
  /** 모두가 쥔 카드 수 합 */
  remaining: number;
  cleared: number;
  won: boolean;
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    levels: levelsFor(m.config, m.players),
    status: m.status,
    me,
    hand: me >= 0 ? m.hands[me] : [],
    handCounts: m.hands.map((h) => h.length),
    top: m.pile[m.pile.length - 1] ?? 0,
    pile: m.pile,
    lives: m.lives,
    stars: m.stars,
    starVotes: m.starVotes,
    sinceMs: Date.now() - m.lastAt,
    remaining: m.hands.reduce((a, h) => a + h.length, 0),
    cleared: m.cleared,
    won: m.won,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
