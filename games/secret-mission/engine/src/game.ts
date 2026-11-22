import { RuleError } from '@bg/core';
import { GameConfig, Role, TEAM_SIZES, failsNeeded, isSpy, rolesFor, validateConfig } from './config';

export class MoveError extends RuleError {}

export type Move = { type: 'team'; seats: number[] } | { type: 'vote'; approve: boolean } | { type: 'play'; success: boolean } | { type: 'hunt'; target: number };

export interface Proposal {
  mission: number;
  leader: number;
  team: number[];
  /** 투표가 끝나면 공개 (true = 찬성) */
  votes: boolean[];
  approved: boolean;
  /** 원정을 다녀왔으면 실패 카드 수 */
  fails: number | null;
}

export type LogEntry =
  | { n: number; type: 'team'; seat: number; team: number[] }
  | { n: number; type: 'vote'; approved: boolean; yes: number; no: number; rejects: number }
  | { n: number; type: 'mission'; mission: number; success: boolean; fails: number }
  | { n: number; type: 'hunt'; seat: number; target: number; hit: boolean }
  | { n: number; type: 'end'; winner: 'agents' | 'spies'; why: 'missions' | 'rejects' | 'hunt' };

export interface MatchState {
  config: GameConfig;
  players: number;
  round: number;
  status: 'playing' | 'round-over' | 'match-over';
  phase: 'team' | 'vote' | 'mission' | 'hunt';
  roles: Role[];
  leader: number;
  /** 지금 몇 번째 원정 (0~4) */
  mission: number;
  /** 원정 결과 (null = 아직) */
  results: (boolean | null)[];
  team: number[];
  votes: (boolean | null)[];
  plays: (boolean | null)[];
  /** 연속 부결 수 */
  rejects: number;
  history: Proposal[];
  winner: 'agents' | 'spies' | null;
  why: 'missions' | 'rejects' | 'hunt' | null;
  roundScores: number[][];
  log: LogEntry[];
  seq: number;
  rng: number;
}

function nextRandom(m: { rng: number }): number {
  let t = (m.rng = (m.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
type DistOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
function log(m: MatchState, e: DistOmit<LogEntry, 'n'>) {
  m.log.push({ ...(e as LogEntry), n: ++m.seq });
  if (m.log.length > 80) m.log.shift();
}

function deal(m: MatchState) {
  const roles = rolesFor(m.config, m.players);
  for (let i = roles.length - 1; i > 0; i--) {
    const k = Math.floor(nextRandom(m) * (i + 1));
    [roles[i], roles[k]] = [roles[k], roles[i]];
  }
  m.roles = roles;
  m.leader = Math.floor(nextRandom(m) * m.players);
  m.mission = 0;
  m.results = [null, null, null, null, null];
  m.phase = 'team';
  m.team = [];
  m.votes = Array(m.players).fill(null);
  m.plays = Array(m.players).fill(null);
  m.rejects = 0;
  m.history = [];
  m.winner = null;
  m.why = null;
  m.status = 'playing';
}

export function newMatch(c: GameConfig, players: number, rng: () => number = Math.random): MatchState {
  const errors = validateConfig(c, players);
  if (errors.length) throw new MoveError(errors[0]);
  const m = { config: c, players, round: 1, roundScores: [], log: [], seq: 0, rng: Math.floor(rng() * 4294967296) >>> 0 } as unknown as MatchState;
  deal(m);
  return m;
}

export const teamSize = (m: Pick<MatchState, 'players' | 'mission'>) => (TEAM_SIZES[m.players] ?? TEAM_SIZES[10])[m.mission];
export const hunterSeat = (m: Pick<MatchState, 'roles'>) => m.roles.indexOf('hunter');

export function actors(m: MatchState): number[] {
  if (m.status !== 'playing') return [];
  switch (m.phase) {
    case 'team':
      return [m.leader];
    case 'vote':
      return m.votes.flatMap((v, i) => (v === null ? [i] : []));
    case 'mission':
      return m.team.filter((s) => m.plays[s] === null);
    case 'hunt':
      return [hunterSeat(m)];
  }
}

const wins = (m: MatchState, v: boolean) => m.results.filter((r) => r === v).length;

export function applyMove(m: MatchState, seat: number, move: Move) {
  if (m.status !== 'playing') throw new MoveError('지금은 진행 중인 게임이 없어요');
  if (!actors(m).includes(seat)) throw new MoveError(m.phase === 'team' ? '원정대는 대장이 골라요' : m.phase === 'mission' ? '원정대원만 카드를 내요' : '지금은 내가 할 일이 없어요');
  switch (move.type) {
    case 'team': {
      if (m.phase !== 'team') throw new MoveError('지금은 원정대를 고를 때가 아니에요');
      const team = [...new Set(move.seats.map(Number))].filter((s) => Number.isInteger(s) && s >= 0 && s < m.players);
      if (team.length !== teamSize(m)) throw new MoveError(`이번 원정대는 ${teamSize(m)}명이에요`);
      m.team = team.sort((a, b) => a - b);
      m.votes = Array(m.players).fill(null);
      m.phase = 'vote';
      log(m, { type: 'team', seat, team: m.team });
      return;
    }
    case 'vote': {
      if (m.phase !== 'vote') throw new MoveError('지금은 투표할 때가 아니에요');
      m.votes[seat] = !!move.approve;
      if (m.votes.some((v) => v === null)) return;
      const yes = m.votes.filter(Boolean).length;
      const approved = yes > m.players / 2;
      m.history.push({ mission: m.mission, leader: m.leader, team: m.team, votes: m.votes as boolean[], approved, fails: null });
      if (approved) {
        m.rejects = 0;
        m.plays = Array(m.players).fill(null);
        m.phase = 'mission';
      } else {
        m.rejects++;
        if (m.rejects >= m.config.rejectLimit) {
          log(m, { type: 'vote', approved, yes, no: m.players - yes, rejects: m.rejects });
          return end(m, 'spies', 'rejects');
        }
        nextLeader(m);
      }
      log(m, { type: 'vote', approved, yes, no: m.players - yes, rejects: m.rejects });
      return;
    }
    case 'play': {
      if (m.phase !== 'mission') throw new MoveError('지금은 원정 카드를 낼 때가 아니에요');
      if (!move.success && !isSpy(m.roles[seat])) throw new MoveError('요원은 성공 카드만 낼 수 있어요');
      m.plays[seat] = !!move.success;
      if (m.team.some((s) => m.plays[s] === null)) return;
      const fails = m.team.filter((s) => m.plays[s] === false).length;
      const success = fails < failsNeeded(m.players, m.mission);
      m.results[m.mission] = success;
      m.history[m.history.length - 1].fails = fails;
      log(m, { type: 'mission', mission: m.mission, success, fails });
      if (wins(m, false) >= 3) return end(m, 'spies', 'missions');
      if (wins(m, true) >= 3) {
        if (m.config.seer && hunterSeat(m) >= 0) {
          m.phase = 'hunt';
          return;
        }
        return end(m, 'agents', 'missions');
      }
      m.mission++;
      nextLeader(m);
      return;
    }
    case 'hunt': {
      if (m.phase !== 'hunt') throw new MoveError('지금은 사냥할 때가 아니에요');
      const target = Number(move.target);
      // 사냥꾼은 외톨이 첩자를 모르므로 누구든(자신 빼고) 고를 수 있다 — 첩자를 고르면 「요원」이라고 거절하면 정보가 새어 나간다
      if (!Number.isInteger(target) || target < 0 || target >= m.players || target === seat) throw new MoveError('나 말고 한 명을 골라요');
      const hit = m.roles[target] === 'seer';
      log(m, { type: 'hunt', seat, target, hit });
      return end(m, hit ? 'spies' : 'agents', hit ? 'hunt' : 'missions');
    }
  }
}

function nextLeader(m: MatchState) {
  m.leader = (m.leader + 1) % m.players;
  m.team = [];
  m.phase = 'team';
}

function end(m: MatchState, winner: 'agents' | 'spies', why: 'missions' | 'rejects' | 'hunt') {
  m.winner = winner;
  m.why = why;
  m.roundScores.push(m.roles.map((r) => (isSpy(r) === (winner === 'spies') ? 1 : 0)));
  log(m, { type: 'end', winner, why });
  m.status = m.round >= m.config.rounds ? 'match-over' : 'round-over';
}

/** 이 사람이 처음부터 아는 것: 좌석별 표시 (spy = 첩자, seer = 예언자 후보) */
export function knowledge(m: Pick<MatchState, 'roles'>, me: number): ('spy' | 'seer' | null)[] {
  const r = m.roles[me];
  return m.roles.map((x, i) => {
    if (i === me) return null;
    if (isSpy(r) && r !== 'loner') return isSpy(x) && x !== 'loner' ? 'spy' : null;
    if (r === 'seer') return isSpy(x) && x !== 'shadow' ? 'spy' : null;
    if (r === 'guard') return x === 'seer' || x === 'falseSeer' ? 'seer' : null;
    return null;
  });
}

export function startNextRound(m: MatchState) {
  if (m.status !== 'round-over') throw new MoveError('아직 게임이 끝나지 않았어요');
  m.round++;
  deal(m);
}

export function continueMatch(prev: MatchState, config: GameConfig, rng: () => number = Math.random): MatchState {
  const done = prev.roundScores.length;
  if (done >= config.rounds) throw new MoveError(`벌써 ${done}게임을 마쳤어요. 게임 수를 ${done + 1} 이상으로 늘리면 이어서 할 수 있어요`);
  const m = newMatch(config, prev.players, rng);
  m.round = done + 1;
  m.roundScores = prev.roundScores.map((r) => [...r]);
  return m;
}

export function matchTotals(m: Pick<MatchState, 'roundScores' | 'players'>): number[] {
  const t = Array(m.players).fill(0);
  for (const r of m.roundScores) r.forEach((v, i) => (t[i] += v));
  return t;
}

/** 시간 초과·대신 진행: 대장은 자신+다음 사람들, 투표는 찬성, 원정은 성공, 사냥은 첫 요원 */
export function autoMove(m: MatchState, seat: number): Move {
  switch (m.phase) {
    case 'team':
      return { type: 'team', seats: Array.from({ length: teamSize(m) }, (_, k) => (seat + k) % m.players) };
    case 'vote':
      return { type: 'vote', approve: true };
    case 'mission':
      return { type: 'play', success: true };
    case 'hunt':
      return { type: 'hunt', target: m.roles.findIndex((r, i) => !isSpy(r) && i !== seat) };
  }
}
