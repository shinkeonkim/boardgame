import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import { AnyGameModule, BASE_EMOTES, EmoteDef, EmoteEvent, PausedInfo, RoomView, isRuleError } from '@bg/core';
import { Metrics, noMetrics } from './metrics';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** 모두 나간(접속자 0) 상태로 이만큼 아무 일도 없으면 방을 해제한다 (ROOM_IDLE_MINUTES, 기본 60분) */
export const IDLE_ROOM_MS = Math.max(1, Number(process.env.ROOM_IDLE_MINUTES ?? 60) || 60) * 60 * 1000;
/** 차례인 사람이 이만큼 끊겨 있으면 다른 플레이어가 대신 진행할 수 있다 */
export const NUDGE_AFTER_MS = 20_000;
const PW_FAIL_WINDOW_MS = 5 * 60 * 1000;
const PW_FAIL_LIMIT = 10;
export const MAX_ROOMS = Math.max(1, Number(process.env.MAX_ROOMS ?? 5) || 5);

const rng = () => randomInt(0, 2 ** 32) / 2 ** 32;

export interface Member {
  id: string;
  token: string;
  name: string;
  role: 'player' | 'spectator';
  /** 게임 중 좌석 번호 */
  seat: number | null;
  connections: number;
  disconnectedAt: number | null;
  /** 게임이 끝난 뒤 결과 화면에서 로비로 돌아왔는지 */
  backInLobby: boolean;
  /** 최근 감정 표현 보낸 시각들 (도배 방지) */
  emoteTimes: number[];
}

export interface Room<Config = unknown, Match = unknown> {
  code: string;
  password: { salt: Buffer; hash: Buffer } | null;
  hostId: string;
  config: Config;
  members: Member[];
  match: Match | null;
  /** 방장이 중지한 매치와 그때의 좌석(멤버 id) — 로비에서 설정을 바꾼 뒤 이어서 할 수 있다 */
  paused: { match: Match; seatIds: string[] } | null;
  turnDeadline: number | null;
  timer: NodeJS.Timeout | null;
  lastActive: number;
  failedPasswords: number[];
  /** 지금 매치를 시작한 시각 (지표: 게임 길이) */
  startedAt?: number;
}

/** 무중단 배포 때 이전 파드 → 새 파드로 넘기는 방 하나 (JSON) */
export interface RoomSnapshot {
  code: string;
  password: { salt: string; hash: string } | null;
  hostId: string;
  config: unknown;
  members: Member[];
  match: unknown;
  paused: Room['paused'];
  turnRemainingMs: number | null;
  idleMs: number;
}

/** 사용자에게 그대로 보여 줄 오류 */
export class RoomError extends Error {}

type Listener = (room: Room) => void;

/**
 * 방 관리. 게임 규칙은 GameModule에 맡기고, 여기서는 멀티플레이 공통 흐름만 다룬다:
 * 방 생성/입장(암호·토큰 재접속·관전), 방장 권한·승계, 로비 설정, 시작/다음 판/로비 복귀,
 * 턴 타이머·대신 진행, 중지/이어하기, 감정 표현, 유휴 방 정리, 무중단 배포 스냅샷.
 */
export class Rooms {
  rooms = new Map<string, Room>();
  readonly emotes: EmoteDef[];
  private emoteSeq = 0;

  constructor(
    readonly game: AnyGameModule,
    private onChange: Listener = () => {},
    private opts: { maxRooms?: number; extraEmotes?: EmoteDef[]; metrics?: Metrics } = {},
  ) {
    this.emotes = [...BASE_EMOTES, ...(opts.extraEmotes ?? [])];
    this.m = opts.metrics ?? noMetrics;
    const m = this.m;
    this.c = {
      created: m.counter('bg_rooms_created_total', '만들어진 방'),
      removed: m.counter('bg_rooms_removed_total', '없어진 방 (reason: closed=방장이 닫음, empty=모두 나감, idle=1시간 유휴)'),
      joins: m.counter('bg_joins_total', '방 입장 (kind: player|spectator|rejoin)'),
      joinFail: m.counter('bg_join_failures_total', '입장 실패 (reason: not_found|password|password_limit|full)'),
      started: m.counter('bg_matches_started_total', '시작한 게임 (players: 인원)'),
      finished: m.counter('bg_matches_finished_total', '끝까지 마친 게임 (players: 인원)'),
      rounds: m.counter('bg_rounds_finished_total', '끝난 판'),
      moves: m.counter('bg_moves_total', '둔 수'),
      rejected: m.counter('bg_moves_rejected_total', '규칙에 맞지 않아 거절된 수'),
      timeouts: m.counter('bg_auto_moves_total', '자동으로 둔 차례 (cause: timer=시간 초과, nudge=대신 진행)'),
      kicks: m.counter('bg_kicks_total', '방장이 내보낸 사람'),
      paused: m.counter('bg_matches_paused_total', '방장이 멈춘 게임'),
      resumed: m.counter('bg_matches_resumed_total', '이어서 한 게임'),
      emotes: m.counter('bg_emotes_total', '보낸 감정 표현 (emote: id)'),
      createRejected: m.counter('bg_room_create_rejected_total', '방이 가득 차서 만들지 못한 횟수'),
    };
    // 라벨 없는 카운터는 0으로 미리 내보내 Grafana에 "데이터 없음" 대신 0이 보이게
    for (const k of ['created', 'rounds', 'moves', 'rejected', 'kicks', 'paused', 'resumed', 'createRejected']) this.c[k]({}, 0);
    this.duration = m.histogram('bg_match_duration_seconds', '게임 하나(모든 판) 걸린 시간', [120, 300, 600, 900, 1200, 1800, 2700, 3600, 5400]);
  }
  private m: Metrics;
  private c: Record<string, (labels?: Record<string, string | number>, by?: number) => void>;
  private duration: (v: number, labels?: Record<string, string | number>) => void;

  get maxRooms() {
    return this.opts.maxRooms ?? MAX_ROOMS;
  }

  // ---------- 입장 ----------

  private newCode(): string {
    for (let i = 0; i < 1000; i++) {
      let code = '';
      for (let j = 0; j < 4; j++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
      if (!this.rooms.has(code)) return code;
    }
    throw new RoomError('지금은 방을 더 만들 수 없어요. 잠시 뒤 다시 시도해 주세요');
  }

  get(code: string): Room {
    const room = this.rooms.get(normalizeCode(code));
    if (!room) {
      this.c.joinFail({ reason: 'not_found' });
      throw new RoomError('방을 찾을 수 없어요. 방 코드를 다시 확인해 주세요');
    }
    return room;
  }

  create(name: string, password?: string): { room: Room; member: Member } {
    if (this.rooms.size >= this.maxRooms) this.sweep();
    if (this.rooms.size >= this.maxRooms) {
      this.c.createRejected();
      throw new RoomError(`지금은 방이 모두 찼어요(최대 ${this.maxRooms}개). 친구 방에 들어가거나 조금 뒤 다시 만들어 주세요`);
    }
    const member = makeMember(name, 'player');
    const room: Room = {
      code: this.newCode(),
      password: password ? hashPassword(password) : null,
      hostId: member.id,
      config: { ...this.game.defaultConfig },
      members: [member],
      match: null,
      paused: null,
      turnDeadline: null,
      timer: null,
      lastActive: Date.now(),
      failedPasswords: [],
    };
    this.rooms.set(room.code, room);
    this.c.created();
    this.c.joins({ kind: 'player' });
    return { room, member };
  }

  /** 토큰이 있으면 재접속, 없으면 새 참가 */
  join(code: string, opts: { name: string; password?: string; token?: string; spectator?: boolean }): { room: Room; member: Member } {
    const room = this.get(code);
    if (opts.token) {
      const existing = room.members.find((m) => m.token === opts.token);
      if (existing) {
        this.c.joins({ kind: 'rejoin' });
        return { room, member: existing };
      }
    }
    if (room.password) {
      const now = Date.now();
      room.failedPasswords = room.failedPasswords.filter((t) => now - t < PW_FAIL_WINDOW_MS);
      if (room.failedPasswords.length >= PW_FAIL_LIMIT) this.c.joinFail({ reason: 'password_limit' });
      if (room.failedPasswords.length >= PW_FAIL_LIMIT) throw new RoomError('암호를 여러 번 틀렸어요. 몇 분 뒤 다시 시도해 주세요');
      if (!checkPassword(room.password, opts.password ?? '')) {
        room.failedPasswords.push(now);
        this.c.joinFail({ reason: 'password' });
        throw new RoomError('암호가 달라요. 방장에게 암호를 다시 물어봐 주세요');
      }
    }
    const playerCount = room.members.filter((m) => m.role === 'player').length;
    const asPlayer = !opts.spectator && this.lobbyOpen(room) && playerCount < this.game.players.max;
    const member = makeMember(uniqueName(room, opts.name), asPlayer ? 'player' : 'spectator');
    member.backInLobby = true; // 끝난 매치 결과를 볼 필요 없이 바로 대기 로비로
    room.members.push(member);
    this.c.joins({ kind: member.role });
    this.touch(room);
    return { room, member };
  }

  connect(room: Room, member: Member) {
    member.connections++;
    member.disconnectedAt = null;
    this.touch(room);
  }

  disconnect(room: Room, member: Member) {
    member.connections = Math.max(0, member.connections - 1);
    if (member.connections === 0) member.disconnectedAt = Date.now();
    if (member.connections === 0 && !room.match && member.role === 'spectator') {
      room.members = room.members.filter((m) => m !== member); // 로비 관전자는 끊기면 정리
    }
    this.touch(room);
  }

  leave(room: Room, member: Member) {
    if (room.match && member.seat !== null && this.game.status(room.match) !== 'match-over') {
      throw new RoomError('게임이 끝나면 나갈 수 있어요. 창을 닫아도 다시 열면 이어서 할 수 있어요');
    }
    room.members = room.members.filter((m) => m !== member);
    if (room.members.length === 0) return this.remove(room, 'empty');
    this.ensureHost(room);
    this.touch(room);
  }

  // ---------- 로비 ----------

  /** 로비 조작(설정·인원·시작)이 가능한 상태: 게임이 없거나 매치가 끝난 뒤 */
  lobbyOpen(room: Room): boolean {
    return !room.match || this.game.status(room.match) === 'match-over';
  }

  /** 매치가 끝났는데 아직 결과 화면에 남아 있는 사람 */
  private inResults(room: Room, m: Member): boolean {
    return !!room.match && this.game.status(room.match) === 'match-over' && !m.backInLobby;
  }

  kick(room: Room, by: Member, targetId: string) {
    this.requireHost(room, by);
    if (!this.lobbyOpen(room)) throw new RoomError('게임이 끝난 뒤에 내보낼 수 있어요');
    if (targetId === by.id) throw new RoomError('나 자신은 내보낼 수 없어요');
    room.members = room.members.filter((m) => m.id !== targetId);
    this.c.kicks();
    this.touch(room);
  }

  setRole(room: Room, member: Member, role: Member['role']) {
    if (!this.lobbyOpen(room)) throw new RoomError('게임이 끝난 뒤에 바꿀 수 있어요');
    if (role === 'player' && member.role !== 'player') {
      const max = this.game.players.max;
      if (room.members.filter((m) => m.role === 'player').length >= max) throw new RoomError(`플레이어는 ${max}명까지 참여할 수 있어요`);
    }
    member.role = role;
    this.touch(room);
  }

  /** 로비에서 플레이어 순서 이동 */
  moveMember(room: Room, by: Member, targetId: string, dir: -1 | 1) {
    this.requireHost(room, by);
    if (!this.lobbyOpen(room)) throw new RoomError('게임이 끝난 뒤에 바꿀 수 있어요');
    const i = room.members.findIndex((m) => m.id === targetId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= room.members.length) return;
    [room.members[i], room.members[j]] = [room.members[j], room.members[i]];
    this.touch(room);
  }

  setConfig(room: Room, by: Member, input: object) {
    this.requireHost(room, by);
    if (!this.lobbyOpen(room)) throw new RoomError('규칙은 게임이 끝난 뒤에 바꿀 수 있어요. 방장은 게임을 멈추고 바꿀 수도 있어요');
    room.config = this.game.sanitizeConfig({ ...(room.config as object), ...input });
    this.touch(room);
  }

  setPassword(room: Room, by: Member, password: string | null) {
    this.requireHost(room, by);
    room.password = password ? hashPassword(password) : null;
    this.touch(room);
  }

  // ---------- 게임 진행 ----------

  /** force: 아직 결과 화면에 있는 사람을 기다리지 않고 시작 */
  start(room: Room, by: Member, force = false) {
    this.requireHost(room, by);
    if (!this.lobbyOpen(room)) throw new RoomError('이미 게임을 하고 있어요');
    const players = room.members.filter((m) => m.role === 'player');
    const waiting = players.filter((m) => m.connections > 0 && this.inResults(room, m) && m !== by);
    if (waiting.length && !force) throw new RoomError(`${waiting.map((m) => m.name).join(', ')} 님이 아직 결과를 보고 있어요. 기다리지 않으려면 지금 시작하기를 눌러 주세요`);
    const errors = this.startErrors(room.config, players.length);
    if (errors.length) throw new RoomError(errors[0]);
    room.members.forEach((m) => {
      m.backInLobby = false;
      m.seat = null;
    });
    players.forEach((m, i) => (m.seat = i));
    room.match = this.rule(() => this.game.newMatch(room.config, players.length, rng));
    room.startedAt = Date.now();
    this.c.started({ players: players.length });
    room.paused = null; // 새 게임을 시작하면 중지했던 게임은 버린다
    this.resetTimer(room);
    this.touch(room);
  }

  private startErrors(config: unknown, players: number): string[] {
    const { min } = this.game.players;
    const errors = this.game.validateConfig(config, Math.max(players, min));
    if (players < min) errors.push(`${min}명이 모이면 시작할 수 있어요`);
    return errors;
  }

  move(room: Room, member: Member, move: unknown) {
    const match = room.match;
    if (!match) throw new RoomError('아직 게임이 시작되지 않았어요');
    if (member.seat === null) throw new RoomError('관전 중에는 둘 수 없어요');
    if (!this.game.isMove(move)) throw new RoomError('처리할 수 없는 동작이에요. 화면을 새로고침해 주세요');
    const before = [this.game.turn(match), this.game.round(match), this.game.status(match)].join();
    try {
      this.rule(() => this.game.applyMove(match, member.seat!, move));
    } catch (e) {
      this.c.rejected();
      throw e;
    }
    this.c.moves();
    this.afterProgress(room, before);
    const after = [this.game.turn(match), this.game.round(match), this.game.status(match)].join();
    if (after !== before) this.resetTimer(room);
    this.touch(room);
  }

  /** 판·게임이 끝났는지 보고 지표를 남긴다 */
  private afterProgress(room: Room, before: string) {
    const match = room.match;
    if (!match) return;
    const status = this.game.status(match);
    if (before.endsWith(status)) return;
    if (status === 'round-over' || status === 'match-over') this.c.rounds();
    if (status === 'match-over') {
      const players = room.members.filter((m) => m.seat !== null).length;
      this.c.finished({ players });
      if (room.startedAt) this.duration((Date.now() - room.startedAt) / 1000);
    }
  }

  /** 다음 판 시작 또는 (매치 종료 후) 로비로. expect: 클라이언트가 본 판 번호(1부터)/상태 — 이미 진행됐으면 조용히 무시 */
  next(room: Room, by: Member, expect?: { round?: number; status?: string }) {
    const match = room.match;
    if (!match) {
      if (expect?.status === 'match-over') return;
      throw new RoomError('진행 중인 게임이 없어요');
    }
    const status = this.game.status(match);
    if (expect && ((expect.round !== undefined && expect.round !== this.game.round(match)) || (expect.status && expect.status !== status))) return;
    if (by.seat === null && by.id !== room.hostId) throw new RoomError('게임에 참여한 사람만 넘길 수 있어요');
    if (status === 'round-over') {
      this.rule(() => this.game.startNextRound(match, rng));
      this.resetTimer(room);
    } else if (status === 'match-over') {
      this.back(room, by);
      return;
    } else {
      throw new RoomError('아직 판이 끝나지 않았어요');
    }
    this.touch(room);
  }

  /** 매치가 끝난 뒤 각자 결과 화면에서 대기 로비로. 모두 돌아오면 끝난 매치를 정리 */
  back(room: Room, member: Member) {
    if (!room.match || this.game.status(room.match) !== 'match-over') return;
    member.backInLobby = true;
    const stillViewing = room.members.some((m) => m.connections > 0 && this.inResults(room, m));
    if (!stillViewing) {
      room.match = null;
      room.members.forEach((m) => {
        m.seat = null;
        m.backInLobby = false;
      });
      this.clearTimer(room);
    }
    this.touch(room);
  }

  /** 방장이 진행 중인 게임을 중지 → 모두 로비로. 로비에서 설정을 바꾼 뒤 resume으로 이어간다 */
  stop(room: Room, by: Member) {
    this.requireHost(room, by);
    const match = room.match;
    if (!match || this.game.status(match) === 'match-over') throw new RoomError('멈출 게임이 없어요');
    const seatIds: string[] = [];
    for (const m of room.members) if (m.seat !== null) seatIds[m.seat] = m.id;
    room.paused = { match, seatIds };
    room.match = null;
    this.c.paused();
    room.members.forEach((m) => {
      m.seat = null;
      m.backInLobby = false;
    });
    this.clearTimer(room);
    this.touch(room);
  }

  /** 중지했던 게임 이어서 하기: 설정이 같으면 하던 판 그대로, 바뀌었으면 끝난 판 점수를 이어 새 판 */
  resume(room: Room, by: Member) {
    this.requireHost(room, by);
    if (room.match) throw new RoomError('이미 게임을 하고 있어요');
    const blocked = this.resumeBlocked(room);
    if (blocked) throw new RoomError(blocked);
    const { match, seatIds } = room.paused!;
    room.match = sameConfig(this.game.config(match), room.config) ? match : this.rule(() => this.game.continueMatch(match, room.config, rng));
    room.members.forEach((m) => {
      const i = seatIds.indexOf(m.id);
      m.seat = i >= 0 ? i : null;
      m.backInLobby = false;
    });
    room.paused = null;
    this.c.resumed();
    this.resetTimer(room);
    this.touch(room);
  }

  private resumeBlocked(room: Room): string | null {
    const p = room.paused;
    if (!p) return '멈춘 게임이 없어요';
    const players = room.members.filter((m) => m.role === 'player');
    const missing = p.seatIds.filter((id) => !players.some((m) => m.id === id));
    const extra = players.filter((m) => !p.seatIds.includes(m.id));
    if (missing.length || extra.length) {
      const names = p.seatIds.map((id) => room.members.find((m) => m.id === id)?.name ?? '나간 사람');
      return `멈출 때 함께한 ${names.join(', ')} 님이 모두 있어야 이어서 할 수 있어요`;
    }
    if (sameConfig(this.game.config(p.match), room.config)) return null;
    const errors = this.game.validateConfig(room.config, p.seatIds.length);
    if (errors.length) return errors[0];
    const done = this.game.roundsDone(p.match);
    const rounds = (room.config as { rounds?: number }).rounds ?? 1;
    if (done >= rounds) return `벌써 ${done}판을 마쳤어요. 판 수를 ${done + 1}판 이상으로 늘리면 이어서 할 수 있어요`;
    return null;
  }

  private pausedInfo(room: Room): PausedInfo | null {
    const p = room.paused;
    if (!p) return null;
    const totals = this.game.totals(p.match);
    return {
      round: this.game.round(p.match),
      rounds: (this.game.config(p.match) as { rounds?: number }).rounds ?? 1,
      roundOver: this.game.status(p.match) === 'round-over',
      players: p.seatIds.map((id, i) => ({ name: room.members.find((m) => m.id === id)?.name ?? '나간 사람', total: totals[i] ?? 0 })),
      sameConfig: sameConfig(this.game.config(p.match), room.config),
      blocked: this.resumeBlocked(room),
    };
  }

  /** 감정 표현: 목록에 있는 것만, 1초에 1번 · 10초에 5번까지 */
  emote(room: Room, member: Member, id: unknown): EmoteEvent {
    const e = this.emotes.find((x) => x.id === id);
    if (!e) throw new RoomError('보낼 수 없는 감정 표현이에요');
    const now = Date.now();
    member.emoteTimes = member.emoteTimes.filter((t) => now - t < 10_000);
    const last = member.emoteTimes[member.emoteTimes.length - 1];
    if ((last !== undefined && now - last < 1000) || member.emoteTimes.length >= 5) throw new RoomError('감정 표현은 조금 천천히 보내 주세요');
    member.emoteTimes.push(now);
    this.c.emotes({ emote: e.id });
    this.emoteSeq = (this.emoteSeq + 1) % 1_000_000;
    return { from: member.id, name: member.name, seat: room.match ? member.seat : null, id: e.id, n: this.emoteSeq };
  }

  /** 방장이 방을 닫는다 — 모두 내보내고 방 해제 */
  close(room: Room, by: Member) {
    this.requireHost(room, by);
    this.remove(room, 'closed');
  }

  /** 끊긴 플레이어의 차례를 다른 플레이어가 대신 진행 */
  nudge(room: Room, by: Member) {
    const match = room.match;
    if (!match || this.game.status(match) !== 'playing') throw new RoomError('지금은 진행 중인 판이 없어요');
    if (by.seat === null) throw new RoomError('게임에 참여한 사람만 할 수 있어요');
    const wait = this.nudgeInMs(room);
    if (wait === null) throw new RoomError('차례인 사람이 접속해 있어요. 조금만 기다려 주세요');
    if (wait > 0) throw new RoomError(`${Math.ceil(wait / 1000)}초 뒤에 대신 진행할 수 있어요`);
    this.timeout(room, 'nudge');
  }

  nudgeInMs(room: Room, now = Date.now()): number | null {
    const match = room.match;
    if (!match || this.game.status(match) !== 'playing') return null;
    const cur = room.members.find((m) => m.seat === this.game.turn(match));
    if (!cur || cur.connections > 0 || cur.disconnectedAt === null) return null;
    return Math.max(0, NUDGE_AFTER_MS - (now - cur.disconnectedAt));
  }

  /** 시간 초과·대신 진행: 지금 차례인 사람의 차례가 넘어갈 때까지 자동으로 둔다 */
  timeout(room: Room, cause: 'timer' | 'nudge' = 'timer') {
    const match = room.match;
    if (!match || this.game.status(match) !== 'playing') return;
    this.c.timeouts({ cause });
    const before = [this.game.turn(match), this.game.round(match), this.game.status(match)].join();
    const turn = this.game.turn(match);
    for (let guard = 0; guard < 4 && this.game.status(match) === 'playing' && this.game.turn(match) === turn; guard++) {
      this.game.applyMove(match, turn, this.game.autoMove(match));
    }
    this.afterProgress(room, before);
    this.resetTimer(room);
    this.touch(room);
  }

  // ---------- 타이머 ----------

  /** ms를 주면 그만큼 남은 타이머로 (무중단 배포 때 이어받기) */
  private resetTimer(room: Room, ms?: number) {
    this.clearTimer(room);
    const sec = this.game.turnTimerSec(room.match ? this.game.config(room.match) : room.config);
    if (!room.match || this.game.status(room.match) !== 'playing' || sec <= 0) return;
    const wait = Math.max(0, ms ?? sec * 1000);
    room.turnDeadline = Date.now() + wait;
    room.timer = setTimeout(() => {
      room.timer = null;
      this.timeout(room);
      this.onChange(room);
    }, wait);
    room.timer.unref?.();
  }

  private clearTimer(room: Room) {
    if (room.timer) clearTimeout(room.timer);
    room.timer = null;
    room.turnDeadline = null;
  }

  /** 방을 넘겨준 뒤 종료를 기다리는 동안 턴 타이머 정지 (남은 시간은 turnDeadline에 남겨 둠) */
  freezeTimers() {
    for (const room of this.rooms.values()) {
      if (room.timer) clearTimeout(room.timer);
      room.timer = null;
    }
  }

  /** 넘기기가 무산됐을 때(새 파드가 못 뜸) 남은 시간으로 타이머 재개 */
  resumeTimers(now = Date.now()) {
    for (const room of this.rooms.values()) if (room.turnDeadline) this.resetTimer(room, room.turnDeadline - now);
  }

  // ---------- 무중단 배포: 방 상태 넘겨주기/받기 ----------

  exportAll(now = Date.now()): RoomSnapshot[] {
    return [...this.rooms.values()].map((r) => ({
      code: r.code,
      password: r.password ? { salt: r.password.salt.toString('base64'), hash: r.password.hash.toString('base64') } : null,
      hostId: r.hostId,
      config: r.config,
      members: r.members.map((m) => ({ ...m, connections: 0, emoteTimes: [] })),
      match: r.match,
      paused: r.paused,
      turnRemainingMs: r.turnDeadline ? Math.max(0, r.turnDeadline - now) : null,
      idleMs: now - r.lastActive,
    }));
  }

  /** 넘겨받은 방을 등록. 같은 코드가 이미 있으면 건너뜀. 접속은 모두 끊긴 것으로 시작 (곧 자동 재접속) */
  importAll(snapshots: unknown, now = Date.now()): { imported: number; skipped: number } {
    let imported = 0;
    let skipped = 0;
    if (!Array.isArray(snapshots)) throw new RoomError('잘못된 스냅샷');
    for (const s of snapshots as RoomSnapshot[]) {
      if (!s || typeof s.code !== 'string' || !Array.isArray(s.members) || this.rooms.has(s.code)) {
        skipped++;
        continue;
      }
      const room: Room = {
        code: s.code,
        password: s.password ? { salt: Buffer.from(s.password.salt, 'base64'), hash: Buffer.from(s.password.hash, 'base64') } : null,
        hostId: s.hostId,
        config: this.game.sanitizeConfig((s.config ?? {}) as object),
        members: s.members.map((m) => ({ ...m, connections: 0, disconnectedAt: m.disconnectedAt ?? now, emoteTimes: [] })),
        match: s.match ?? null,
        paused: s.paused ?? null,
        turnDeadline: null,
        timer: null,
        lastActive: now - Math.max(0, Number(s.idleMs) || 0),
        failedPasswords: [],
      };
      this.rooms.set(room.code, room);
      if (s.turnRemainingMs !== null && s.turnRemainingMs !== undefined) this.resetTimer(room, s.turnRemainingMs);
      imported++;
    }
    return { imported, skipped };
  }

  // ---------- 정리 ----------

  private ensureHost(room: Room) {
    const host = room.members.find((m) => m.id === room.hostId);
    if (host && host.connections > 0) return;
    const next = room.members.find((m) => m.connections > 0 && m.role === 'player') ?? room.members.find((m) => m.connections > 0);
    if (next) room.hostId = next.id;
    else if (!host && room.members[0]) room.hostId = room.members[0].id;
  }

  private requireHost(room: Room, m: Member) {
    // 방장이 접속해 있지 않으면 요청한 플레이어가 방장을 이어받는다
    const host = room.members.find((x) => x.id === room.hostId);
    if ((!host || host.connections === 0) && m.connections > 0 && m.role === 'player') room.hostId = m.id;
    if (room.hostId !== m.id) throw new RoomError('방장만 할 수 있어요');
  }

  private touch(room: Room) {
    room.lastActive = Date.now();
  }

  /** 게임 규칙 오류(RuleError)를 사용자용 RoomError로 */
  private rule<T>(fn: () => T): T {
    try {
      return fn();
    } catch (e) {
      if (isRuleError(e)) throw new RoomError(e.message);
      throw e;
    }
  }

  remove(room: Room, reason: 'closed' | 'empty' | 'idle' = 'closed') {
    this.clearTimer(room);
    if (this.rooms.delete(room.code)) this.c.removed({ reason });
  }

  /** 모두 나간 채(접속자 0) IDLE_ROOM_MS 동안 활동이 없는 방 해제 — 1분마다 + 방 생성 시 호출 */
  sweep(now = Date.now(), idleMs = IDLE_ROOM_MS) {
    for (const room of this.rooms.values()) {
      const anyone = room.members.some((m) => m.connections > 0);
      if (!anyone && now - room.lastActive > idleMs) this.remove(room, 'idle');
    }
  }

  view(room: Room, member: Member): RoomView {
    const players = room.members.filter((m) => m.role === 'player');
    const seats: string[] = [];
    for (const m of room.members) if (m.seat !== null) seats[m.seat] = m.name;
    const n = Math.max(players.length, this.game.players.min);
    const summary = this.game.lobbySummary(room.config, n);
    const showGame = room.match && !(this.game.status(room.match) === 'match-over' && member.backInLobby);
    return {
      code: room.code,
      hasPassword: !!room.password,
      you: member.id,
      hostId: room.hostId,
      members: room.members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        seat: m.seat,
        connected: m.connections > 0,
        inResults: this.inResults(room, m),
        awayMs: m.connections > 0 || m.disconnectedAt === null ? null : Date.now() - m.disconnectedAt,
        isHost: m.id === room.hostId,
      })),
      config: room.config,
      lobby: {
        playerCount: players.length,
        minPlayers: this.game.players.min,
        maxPlayers: this.game.players.max,
        summary: summary.text,
        warnings: summary.warnings,
        info: summary.info,
        errors: this.startErrors(room.config, players.length),
        inResults: room.members.filter((m) => m.role === 'player' && m.connections > 0 && this.inResults(room, m)).map((m) => m.name),
        paused: this.pausedInfo(room),
      },
      // 매치가 끝난 뒤 로비로 돌아온 사람에게는 게임 대신 대기 로비를 보여준다
      game: showGame ? this.game.viewFor(room.match, member.seat ?? -1) : null,
      seats,
      turnRemainingMs: room.turnDeadline ? Math.max(0, room.turnDeadline - Date.now()) : null,
      nudgeInMs: this.nudgeInMs(room),
    };
  }
}

function sameConfig(a: unknown, b: unknown): boolean {
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  return Object.keys(y).every((k) => x[k] === y[k]);
}

function makeMember(name: string, role: Member['role']): Member {
  return {
    id: randomBytes(6).toString('hex'),
    token: randomBytes(18).toString('base64url'),
    name: cleanName(name),
    role,
    seat: null,
    connections: 0,
    disconnectedAt: null,
    backInLobby: false,
    emoteTimes: [],
  };
}

export function cleanName(name: unknown): string {
  const s = typeof name === 'string' ? name.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 16) : '';
  return s || '플레이어';
}

function uniqueName(room: Room, name: string): string {
  const base = cleanName(name);
  let n = base;
  let i = 2;
  while (room.members.some((m) => m.name === n)) n = `${base}${i++}`;
  return n;
}

export function normalizeCode(code: unknown): string {
  return typeof code === 'string' ? code.trim().toUpperCase() : '';
}

function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return { salt, hash: scryptSync(pw.slice(0, 64), salt, 32) };
}

function checkPassword(p: { salt: Buffer; hash: Buffer }, pw: string): boolean {
  const h = scryptSync(String(pw).slice(0, 64), p.salt, 32);
  return timingSafeEqual(h, p.hash);
}
