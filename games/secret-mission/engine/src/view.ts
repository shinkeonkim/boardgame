import { GameConfig, Role, failsNeeded, isSpy } from './config';
import { LogEntry, MatchState, Proposal, actors, knowledge, matchTotals, teamSize } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  me: number;
  /** 내 역할 (관전자는 null). 게임이 끝나면 roles로 모두 공개 */
  myRole: Role | null;
  /** 내가 아는 것 (좌석별) */
  known: ('spy' | 'seer' | null)[];
  /** 끝난 뒤에만 */
  roles: Role[] | null;
  leader: number;
  turn: number;
  mission: number;
  teamSize: number;
  failsNeeded: number;
  results: (boolean | null)[];
  team: number[];
  /** 투표 중: 누가 이미 냈는지만 (찬반은 끝나야 공개) */
  voted: boolean[];
  myVote: boolean | null;
  /** 원정 중: 누가 냈는지만 */
  played: boolean[];
  myPlay: boolean | null;
  rejects: number;
  /** 지난 제안 (익명 투표면 찬반 대신 수만) */
  history: (Omit<Proposal, 'votes'> & { votes: boolean[] | null; yes: number })[];
  winner: MatchState['winner'];
  why: MatchState['why'];
  spyCount: number;
  roundScores: number[][];
  totals: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const over = m.status !== 'playing';
  return {
    config: m.config,
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    me,
    myRole: me >= 0 ? m.roles[me] : null,
    known: me >= 0 ? knowledge(m, me) : Array(m.players).fill(null),
    roles: over ? m.roles : null,
    leader: m.leader,
    turn: m.phase === 'hunt' ? m.roles.indexOf('hunter') : m.leader,
    mission: m.mission,
    teamSize: teamSize(m),
    failsNeeded: failsNeeded(m.players, m.mission),
    results: m.results,
    team: m.team,
    voted: m.votes.map((v) => v !== null),
    myVote: me >= 0 ? m.votes[me] : null,
    played: m.plays.map((v) => v !== null),
    myPlay: me >= 0 ? m.plays[me] : null,
    rejects: m.rejects,
    history: m.history.map((h) => ({ ...h, votes: m.config.voteReveal === 'names' || over ? h.votes : null, yes: h.votes.filter(Boolean).length })),
    winner: m.winner,
    why: m.why,
    spyCount: m.roles.filter(isSpy).length,
    roundScores: m.roundScores,
    totals: matchTotals(m),
    actors: actors(m),
    log: m.log.slice(-40),
  };
}
