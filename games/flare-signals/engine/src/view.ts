import { GameConfig, copiesOf, maxScore } from './config';
import { Card, Clue, HandCard, LogEntry, MatchState, chopIndex, matchTotals, score, touchesColor } from './game';

/** 내 손패 카드: 색·숫자는 모름(null), 힌트 정보만 */
export interface SeenCard {
  id: string;
  color: number | null;
  value: number | null;
  clue: Clue;
}

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  turn: number;
  turnCount: number;
  /** 관전자면 -1 */
  me: number;
  /** 좌석별 손패 (내 것은 가려짐, 관전자는 모두 보임) */
  hands: SeenCard[][];
  piles: number[];
  discard: Card[];
  deckCount: number;
  hints: number;
  fuses: number;
  finalTurns: number | null;
  endReason: MatchState['endReason'];
  score: number;
  maxScore: number;
  roundScores: number[];
  totals: number[];
  /** 좌석별 버릴 차례 카드 위치 */
  chops: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const over = m.status !== 'playing';
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    turn: m.turn,
    turnCount: m.turnCount,
    me,
    hands: m.hands.map((h, seat) => h.map((card) => (seat === me && !over ? { id: card.id, color: null, value: null, clue: card.clue } : card))),
    piles: m.piles,
    discard: m.discard,
    deckCount: m.deck.length,
    hints: m.hints,
    fuses: m.fuses,
    finalTurns: m.finalTurns,
    endReason: m.endReason,
    score: score(m),
    maxScore: maxScore(m.config),
    roundScores: m.roundScores,
    totals: matchTotals(m),
    chops: m.hands.map((h) => chopIndex(h as HandCard[])),
    log: m.log.slice(-30),
  };
}

/** 힌트와 맞는 색인지 */
export function colorFits(c: GameConfig, clue: Clue, color: number): boolean {
  const probe = { id: '', color, value: 1 };
  if (clue.colors.some((k) => !touchesColor(c, probe, k))) return false;
  if (clue.notColors.some((k) => touchesColor(c, probe, k))) return false;
  return true;
}

export function valueFits(clue: Clue, value: number): boolean {
  if (clue.value !== null && clue.value !== value) return false;
  return !clue.notValues.includes(value);
}

/**
 * seat가 볼 때 자기 카드(cardIndex)가 될 수 있는 (색, 숫자)와 남은 장수.
 * 남은 장수 = 전체 − 쌓인 것 − 버린 것 − 내가 볼 수 있는 남의 손패.
 */
export function possibilities(v: Pick<GameView, 'config' | 'hands' | 'piles' | 'discard'>, seat: number, clue: Clue): { color: number; value: number; count: number }[] {
  const c = v.config;
  const seen = new Map<string, number>();
  const add = (color: number, value: number) => seen.set(`${color}-${value}`, (seen.get(`${color}-${value}`) ?? 0) + 1);
  v.piles.forEach((top, color) => {
    for (let k = 1; k <= top; k++) add(color, k);
  });
  for (const d of v.discard) add(d.color, d.value);
  v.hands.forEach((h, s) => {
    if (s === seat) return;
    for (const card of h) if (card.color !== null && card.value !== null) add(card.color, card.value);
  });
  const out: { color: number; value: number; count: number }[] = [];
  for (let color = 0; color < c.colors; color++) {
    if (!colorFits(c, clue, color)) continue;
    for (let value = 1; value <= 5; value++) {
      if (!valueFits(clue, value)) continue;
      const left = copiesOf(c, color, value) - (seen.get(`${color}-${value}`) ?? 0);
      if (left > 0) out.push({ color, value, count: left });
    }
  }
  return out;
}

export { score };
