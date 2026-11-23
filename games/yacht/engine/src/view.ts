import { Cat, GameConfig, catsFor } from './config';
import { Card, LogEntry, MatchState, actors, cardTotal, matchTotals, scoreFor, upperSum } from './game';

export interface SeatView {
  dice: number[];
  held: boolean[];
  /** 남길 주사위를 이번 굴림 뒤에 골랐나 */
  picked: boolean;
  rolled: number;
  card: Card;
  yachtBonus: number;
  upper: number;
  total: number;
}

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  me: number;
  turn: number;
  step: number;
  cats: Cat[];
  /** 주사위·점수표는 모두 공개 */
  seats: SeatView[];
  /** 내 지금 주사위로 각 빈 칸에 적을 점수 (안 굴렸으면 빈 객체) */
  preview: Partial<Record<Cat, number>>;
  winners: number[];
  roundScores: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const cats = catsFor(m.config);
  const mine = me >= 0 ? m.seats[me] : null;
  const preview: Partial<Record<Cat, number>> = {};
  if (mine && mine.rolled > 0) for (const c of cats) if (mine.card[c] === undefined) preview[c] = scoreFor(m.config, c, mine.dice);
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    me,
    turn: m.turn,
    step: m.step,
    cats,
    seats: m.seats.map((s) => ({ dice: s.dice, held: s.held, picked: !!s.picked, rolled: s.rolled, card: s.card, yachtBonus: s.yachtBonus, upper: upperSum(s.card), total: cardTotal(m.config, s) })),
    preview,
    winners: m.winners,
    roundScores: m.roundScores,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-30),
  };
}
