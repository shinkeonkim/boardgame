import { DevCard, Noble } from './cards';
import { GameConfig } from './config';
import { LogEntry, MatchState, PlayerState, actors, bonuses, eligibleNobles, matchTotals, payment, pointsOf, tokenCount } from './game';

export interface SeenPlayer {
  tokens: number[];
  bonuses: number[];
  points: number;
  cardCount: number;
  /** 남의 예약 카드는 개수만 (내 것은 카드까지) */
  reserved: DevCard[] | null;
  reservedCount: number;
  nobles: Noble[];
}

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  turn: number;
  me: number;
  bank: number[];
  market: DevCard[][];
  deckCounts: number[];
  nobles: Noble[];
  seats: SeenPlayer[];
  /** 내가 지금 살 수 있는 카드 id */
  affordable: string[];
  eligibleNobles: Noble[];
  over: number;
  finalRound: boolean;
  winners: number[];
  roundTotals: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

const see = (p: PlayerState, mine: boolean): SeenPlayer => ({
  tokens: p.tokens,
  bonuses: bonuses(p),
  points: pointsOf(p),
  cardCount: p.cards.length,
  reserved: mine ? p.reserved : null,
  reservedCount: p.reserved.length,
  nobles: p.nobles,
});

export function viewFor(m: MatchState, me: number): GameView {
  const mine = me >= 0 ? m.me[me] : null;
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    turn: m.turn,
    me,
    bank: m.bank,
    market: m.market,
    deckCounts: m.decks.map((d) => d.length),
    nobles: m.nobles,
    seats: m.me.map((p, i) => see(p, i === me || m.status !== 'playing')),
    affordable: mine ? [...m.market.flat(), ...mine.reserved].filter((c) => payment(mine, c)).map((c) => c.id) : [],
    eligibleNobles: me >= 0 && m.phase === 'noble' && m.turn === me ? eligibleNobles(m, me) : [],
    over: mine ? Math.max(0, tokenCount(mine) - m.config.tokenLimit) : 0,
    finalRound: m.finalRound,
    winners: m.winners,
    roundTotals: m.roundTotals,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-30),
  };
}
