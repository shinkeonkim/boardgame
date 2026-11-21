import { GameConfig, layout } from './config';
import { ClueRec, Key, LogEntry, MatchState, Team, actors, isSpymaster, matchTotals, operatives, remaining, teamOf } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  me: number;
  myTeam: Team | null;
  /** 내가 팀장이면 true (정답 지도를 봄) */
  spymaster: boolean;
  words: string[];
  /** 공개된 카드는 모두, 팀장(과 판이 끝난 뒤)은 전부 보임. 나머지는 null */
  key: (Key | null)[];
  revealed: (number | null)[];
  team: Team;
  starter: Team;
  phase: MatchState['phase'];
  clue: ClueRec | null;
  guessesLeft: number;
  clues: ClueRec[];
  spymasters: [number, number];
  operatives: [number[], number[]];
  remaining: [number, number];
  totalCards: [number, number];
  /** 우리 팀 요원 표시 (상대 팀 것은 안 보임) */
  marks: Record<number, number[]>;
  winners: Team[];
  winReason: MatchState['winReason'];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const spy = me >= 0 && isSpymaster(m, me);
  const over = m.status !== 'playing';
  const l = layout(m.config);
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    me,
    myTeam: me >= 0 ? teamOf(me) : null,
    spymaster: spy,
    words: m.words,
    key: m.key.map((k, i) => (spy || over || m.revealed[i] !== null || me < 0 ? (me < 0 && !over && m.revealed[i] === null ? null : k) : null)),
    revealed: m.revealed,
    team: m.team,
    starter: m.starter,
    phase: m.phase,
    clue: m.clue,
    guessesLeft: m.guessesLeft,
    clues: m.clues,
    spymasters: m.spymasters,
    operatives: [operatives(m, 0), operatives(m, 1)],
    remaining: [remaining(m, 0), remaining(m, 1)],
    totalCards: [m.starter === 0 ? l.first : l.second, m.starter === 1 ? l.first : l.second],
    marks: me >= 0 && teamOf(me) === m.team ? m.marks : {},
    winners: m.winners,
    winReason: m.winReason,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
