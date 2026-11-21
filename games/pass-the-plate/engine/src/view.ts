import { GameConfig, handSizeFor } from './config';
import { Card, MatchState, Played, RoundScore, actors, hasChopsticks, matchTotals, scoreRound } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  turn: number;
  handSize: number;
  me: number;
  hand: Card[];
  handCounts: number[];
  myPick: { cardId: string; second?: string } | null;
  picked: boolean[];
  tableaus: (Played[] | null)[];
  puddings: number[];
  /** 지금까지 판 점수 미리보기 (앞에 놓인 카드 기준) */
  preview: RoundScore[];
  revealed: MatchState['revealed'];
  roundScores: RoundScore[][];
  puddingScore: number[] | null;
  canChopsticks: boolean;
  totals: number[];
  actors: number[];
  /** 넘기는 방향 (1=왼쪽, -1=오른쪽) */
  dir: 1 | -1;
}

export function viewFor(m: MatchState, me: number): GameView {
  const show = (s: number) => m.config.showTableaus || s === me || m.status !== 'playing';
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    turn: m.turn,
    handSize: handSizeFor(m.config, m.players),
    me,
    hand: me >= 0 ? m.hands[me] : [],
    handCounts: m.hands.map((h) => h.length),
    myPick: me >= 0 ? m.picks[me] : null,
    picked: m.picks.map((p) => p !== null),
    tableaus: m.tableaus.map((t, s) => (show(s) ? t : null)),
    puddings: m.puddings,
    preview: scoreRound(m.tableaus),
    revealed: m.revealed,
    roundScores: m.roundScores,
    puddingScore: m.puddingScore,
    canChopsticks: me >= 0 && hasChopsticks(m.tableaus[me]) && m.hands[me].length >= 2,
    totals: matchTotals(m),
    actors: actors(m),
    dir: m.config.pass === 'alternate' && m.round % 2 === 0 ? -1 : 1,
  };
}
