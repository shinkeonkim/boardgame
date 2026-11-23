import { DevCard, Noble } from './cards';
import { GameConfig } from './config';
import { LogEntry, MatchState, PlayerState, actors, bonuses, eligibleNobles, matchTotals, payment, pointsOf, tokenCount } from './game';

export type ReservedSeen = { card: DevCard; secret: boolean; tier: 1 | 2 | 3 } | { card: null; secret: true; tier: 1 | 2 | 3 };

export interface SeenPlayer {
  tokens: number[];
  bonuses: number[];
  points: number;
  cardCount: number;
  /** 내 예약 카드 (남의 것은 null — reservedSeen을 봄) */
  reserved: DevCard[] | null;
  reservedCount: number;
  /** 모두에게 보이는 예약 카드: 시장에서 예약 = 앞면, 더미에서 몰래 예약 = 뒷면(단계만). 내 것은 몰래 예약도 앞면 + secret */
  reservedSeen: ReservedSeen[];
  /** 가진 보석 합 (황금 포함) */
  tokenTotal: number;
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
  reservedSeen: p.reserved.map((c) => {
    const secret = !!p.blind?.includes(c.id);
    return secret && !mine ? { card: null, secret: true, tier: c.tier } : { card: c, secret, tier: c.tier };
  }),
  tokenTotal: tokenCount(p),
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
