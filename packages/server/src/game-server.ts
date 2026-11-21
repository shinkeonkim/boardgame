import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { join, resolve } from 'node:path';
import { Server, Socket } from 'socket.io';
import { AnyGameModule, DRAIN_MESSAGE, EmoteDef, isBotLevel } from '@bg/core';
import { pullFromPeer, serveHandoff } from './handoff';
import { Metrics } from './metrics';
import { Member, Room, RoomError, Rooms, normalizeCode } from './rooms';
import { serveStatic } from './static';

export interface GameServerOptions {
  game: AnyGameModule;
  extraEmotes?: EmoteDef[];
  /** 기본: PORT 또는 3001 */
  port?: number;
  /** URL 접두사. 기본: BASE_PATH 또는 `/<game.id>` */
  basePath?: string;
  /** 웹 빌드 폴더. 기본: STATIC_DIR 또는 ./web */
  staticDir?: string;
}

function lanUrls(): string[] {
  const out: string[] = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list ?? []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  }
  // 집 공유기 대역을 먼저, Tailscale(100.64/10) 다음
  const rank = (ip: string) =>
    /^192\.168\./.test(ip) || /^10\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 0 : /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip) ? 1 : 2;
  return out.sort((a, b) => rank(a) - rank(b));
}

interface SocketData {
  code?: string;
  memberId?: string;
  failedJoins: number[];
}
type Ack = (r: { ok: true; [k: string]: unknown } | { ok: false; error: string }) => void;

/**
 * 게임 하나를 띄운다: 정적 웹 + Socket.IO + 방 관리 + 무중단 배포.
 *
 * 환경변수: PORT, BASE_PATH, STATIC_DIR, PUBLIC_URL(QR/공유 링크 주소), MAX_ROOMS, ROOM_IDLE_MINUTES,
 *          HANDOFF_PORT, HANDOFF_PEER, HANDOFF_SECRET, CORS_ORIGIN
 */
export function createGameServer(opts: GameServerOptions) {
  const PORT = opts.port ?? Number(process.env.PORT ?? 3001);
  const BASE = (opts.basePath ?? process.env.BASE_PATH ?? `/${opts.game.id}`).replace(/\/$/, '');
  const STATIC_DIR = resolve(opts.staticDir ?? process.env.STATIC_DIR ?? join(process.cwd(), 'web'));
  const PUBLIC_URL = process.env.PUBLIC_URL || null;
  const HANDOFF_PORT = Number(process.env.HANDOFF_PORT ?? 0) || 0;
  const HANDOFF_PEER = process.env.HANDOFF_PEER || null;
  const HANDOFF_SECRET = process.env.HANDOFF_SECRET || '';
  /** 이전 파드에게서 방을 넘겨받음(또는 없음 확인) */
  let ready = false;
  /** 방을 새 파드로 넘겨줬음 — 상태 변경 요청 거절, 곧 종료 */
  let draining = false;
  let shuttingDown = false;

  const http = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    const local = path.startsWith(`${BASE}/`) ? path.slice(BASE.length) : path;
    if (local === '/healthz') return void res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
    if (local === '/readyz') {
      const ok = ready && !draining;
      return void res.writeHead(ok ? 200 : 503, { 'content-type': 'text/plain' }).end(ok ? 'ready' : draining ? 'draining' : 'starting');
    }
    if (local === '/api/rooms') {
      // 첫 화면 「친구 방에 들어가기」 목록 (목록에 보이기를 끈 방·사람이 없는 방은 빠짐)
      return void res
        .writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
        .end(JSON.stringify({ rooms: draining ? [] : rooms.listing(), maxRooms: rooms.maxRooms, total: rooms.rooms.size }));
    }
    if (local === '/api/info') {
      return void res
        .writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify({ game: opts.game.id, basePath: BASE, publicUrl: PUBLIC_URL, lanHosts: lanUrls() }));
    }
    if (!serveStatic(req, res, { dir: STATIC_DIR, basePath: BASE })) {
      // 접두사 밖(로컬 단독 실행 등)이면 게임 경로로 보낸다
      res.writeHead(302, { location: `${BASE}/` }).end();
    }
  });
  const io = new Server(http, { path: `${BASE}/socket.io`, cors: { origin: process.env.CORS_ORIGIN ?? false } });
  const metrics = new Metrics({ game: opts.game.id });
  const rooms = new Rooms(opts.game, (room) => broadcast(room), {
    extraEmotes: opts.extraEmotes,
    metrics,
    onEmote: (room, e) => io.to(`r:${room.code}`).emit('emote', e),
  });
  const serverErrors = metrics.counter('bg_server_errors_total', '처리하지 못한 서버 오류');
  const handoffRooms = metrics.counter('bg_handoff_rooms_total', '무중단 배포로 넘겨준(out)/넘겨받은(in) 방');
  serverErrors({}, 0);
  handoffRooms({ direction: 'out' }, 0);
  handoffRooms({ direction: 'in' }, 0);
  metrics.onCollect(() => {
    const state = { lobby: 0, playing: 0, round_over: 0, match_over: 0, paused: 0 };
    const people = { player: { true: 0, false: 0 }, spectator: { true: 0, false: 0 } };
    const bySize: Record<number, number> = {};
    let withPassword = 0;
    let listed = 0;
    const bots = { easy: 0, normal: 0, hard: 0 };
    let longest = 0;
    for (const room of rooms.rooms.values()) {
      if (room.paused && !room.match) state.paused++;
      else if (!room.match) state.lobby++;
      else state[opts.game.status(room.match).replace('-', '_') as 'playing'] += 1;
      if (room.password) withPassword++;
      const players = room.members.filter((m) => m.role === 'player').length;
      bySize[players] = (bySize[players] ?? 0) + 1;
      for (const m of room.members) {
        if (m.bot) bots[m.bot]++;
        else people[m.role][String(m.connections > 0) as 'true']++;
      }
      if (room.listed) listed++;
      if (room.match && room.startedAt) longest = Math.max(longest, (Date.now() - room.startedAt) / 1000);
    }
    metrics.set('bg_rooms', '지금 있는 방 수', rooms.rooms.size);
    for (const [k, v] of Object.entries(state)) metrics.set('bg_rooms_by_state', '방 상태별 수 (lobby=대기실, playing=게임 중, round_over=판 결과, match_over=게임 결과, paused=멈춤)', v, { state: k });
    for (const [k, v] of Object.entries(bySize)) metrics.set('bg_rooms_by_players', '플레이어 수별 방 수', v, { players: k });
    for (const role of ['player', 'spectator'] as const)
      for (const c of ['true', 'false'] as const) metrics.set('bg_members', '방에 있는 사람 (role, connected)', people[role][c], { role, connected: c });
    metrics.set('bg_rooms_with_password', '암호가 걸린 방', withPassword);
    metrics.set('bg_rooms_listed', '첫 화면 목록에 보이는 방', listed);
    for (const [level, v] of Object.entries(bots)) metrics.set('bg_bots', '자리에 앉은 봇 (level)', v, { level });
    metrics.set('bg_room_capacity', '동시에 열 수 있는 방 수(MAX_ROOMS)', rooms.maxRooms);
    metrics.set('bg_longest_match_seconds', '지금 진행 중인 가장 긴 게임의 시간', longest);
    metrics.set('bg_sockets', '열린 소켓 연결', io.engine.clientsCount);
    metrics.set('bg_ready', '트래픽을 받을 준비가 됨(1)', ready && !draining ? 1 : 0);
    metrics.set('bg_draining', '무중단 배포로 방을 넘겨준 뒤 종료 대기 중(1)', draining ? 1 : 0);
  });
  const METRICS_PORT = Number(process.env.METRICS_PORT ?? 9464) || 0;
  if (METRICS_PORT) metrics.serve(METRICS_PORT);

  function broadcast(room: Room) {
    for (const m of room.members) io.to(`m:${room.code}:${m.id}`).emit('room', rooms.view(room, m));
    // 방에서 빠진 사람(강퇴·방 닫기)에게 알림
    io.in(`r:${room.code}`)
      .fetchSockets()
      .then((sockets) => {
        for (const s of sockets) {
          if (!room.members.some((m) => m.id === s.data.memberId) || !rooms.rooms.has(room.code)) {
            s.emit('kicked', rooms.rooms.has(room.code) ? '방장이 방에서 내보냈어요' : '방이 닫혔어요');
            s.leave(`r:${room.code}`);
            s.data.code = undefined;
          }
        }
      });
  }

  /** readOnly가 아니면 상태를 바꾸는 요청 — 배포로 방을 넘기는 중에는 막는다 */
  function handler<T>(socket: Socket, fn: (payload: T) => Record<string, unknown> | void, readOnly = false) {
    return (payload: T, ack?: Ack) => {
      try {
        if (draining && !readOnly) throw new RoomError(DRAIN_MESSAGE);
        const r = fn(payload ?? ({} as T));
        if (typeof ack === 'function') ack({ ok: true, ...(r ?? {}) });
      } catch (e) {
        const msg = e instanceof RoomError ? e.message : '문제가 생겼어요. 잠시 뒤 다시 시도해 주세요';
        if (!(e instanceof RoomError)) {
          console.error(e);
          serverErrors();
        }
        if (typeof ack === 'function') ack({ ok: false, error: msg });
        else socket.emit('error-message', msg);
      }
    };
  }

  function current(socket: Socket): { room: Room; member: Member } {
    const { code, memberId } = socket.data as SocketData;
    if (!code) throw new RoomError('방에 들어가 있지 않아요. 방 코드로 다시 들어와 주세요');
    const room = rooms.get(code);
    const member = room.members.find((m) => m.id === memberId);
    if (!member) throw new RoomError('방에서 나왔어요. 방 코드로 다시 들어올 수 있어요');
    return { room, member };
  }

  function attach(socket: Socket, room: Room, member: Member) {
    detach(socket);
    socket.data.code = room.code;
    socket.data.memberId = member.id;
    socket.join(`r:${room.code}`);
    socket.join(`m:${room.code}:${member.id}`);
    rooms.connect(room, member);
  }

  function detach(socket: Socket) {
    const { code, memberId } = socket.data as SocketData;
    if (!code) return;
    socket.leave(`r:${code}`);
    socket.leave(`m:${code}:${memberId}`);
    socket.data.code = undefined;
    const room = rooms.rooms.get(code);
    const member = room?.members.find((m) => m.id === memberId);
    if (room && member) {
      rooms.disconnect(room, member);
      broadcast(room);
    }
  }

  io.on('connection', (socket) => {
    (socket.data as SocketData).failedJoins = [];

    socket.on(
      'create',
      handler<{ name: string; password?: string }>(socket, ({ name, password }) => {
        const { room, member } = rooms.create(name, typeof password === 'string' ? password : undefined);
        attach(socket, room, member);
        broadcast(room);
        return { code: room.code, token: member.token };
      }),
    );

    socket.on(
      'join',
      handler<{ code: string; name: string; password?: string; token?: string; spectator?: boolean }>(
        socket,
        (p) => {
          if (draining) {
            // 교체 중에는 기존 참가자의 재접속만 받는다 (상태가 바뀌지 않음)
            const known = typeof p.token === 'string' && rooms.rooms.get(normalizeCode(p.code))?.members.some((m) => m.token === p.token);
            if (!known) throw new RoomError(DRAIN_MESSAGE);
          }
          const data = socket.data as SocketData;
          const now = Date.now();
          data.failedJoins = data.failedJoins.filter((t) => now - t < 60_000);
          if (data.failedJoins.length >= 10) throw new RoomError('여러 번 실패했어요. 잠시 뒤 다시 시도해 주세요');
          try {
            const { room, member } = rooms.join(normalizeCode(p.code), {
              name: p.name,
              password: typeof p.password === 'string' ? p.password : undefined,
              token: typeof p.token === 'string' ? p.token : undefined,
              spectator: !!p.spectator,
            });
            attach(socket, room, member);
            broadcast(room);
            return { code: room.code, token: member.token };
          } catch (e) {
            data.failedJoins.push(now);
            throw e;
          }
        },
        true,
      ),
    );

    /** 입장 전에 방 존재/암호 여부 확인 */
    socket.on(
      'peek',
      handler<{ code: string }>(
        socket,
        ({ code }) => {
          const room = rooms.get(normalizeCode(code));
          return { code: room.code, hasPassword: !!room.password, inGame: !!room.match, players: room.members.filter((m) => m.role === 'player').length };
        },
        true,
      ),
    );

    const act = <T>(name: string, fn: (room: Room, member: Member, p: T) => void) =>
      socket.on(
        name,
        handler<T>(socket, (p) => {
          const { room, member } = current(socket);
          fn(room, member, p);
          if (rooms.rooms.has(room.code)) broadcast(room);
          else io.in(`r:${room.code}`).emit('kicked', '방장이 방을 닫았어요');
        }),
      );

    act<{ config: object }>('config', (r, m, p) => rooms.setConfig(r, m, p.config && typeof p.config === 'object' ? p.config : {}));
    act<{ password: string | null }>('password', (r, m, p) => rooms.setPassword(r, m, typeof p.password === 'string' && p.password ? p.password : null));
    act<{ role: 'player' | 'spectator' }>('role', (r, m, p) => rooms.setRole(r, m, p.role === 'spectator' ? 'spectator' : 'player'));
    act<{ id: string; dir: -1 | 1 }>('reorder', (r, m, p) => rooms.moveMember(r, m, String(p.id), p.dir === -1 ? -1 : 1));
    act<{ id: string }>('kick', (r, m, p) => rooms.kick(r, m, String(p.id)));
    act<{ force?: boolean }>('start', (r, m, p) => rooms.start(r, m, p.force === true));
    act('back', (r, m) => rooms.back(r, m));
    act('close', (r, m) => rooms.close(r, m));
    act<{ move: unknown }>('move', (r, m, p) => rooms.move(r, m, p.move));
    act<{ round?: number; status?: string }>('next', (r, m, p) =>
      rooms.next(r, m, { round: typeof p.round === 'number' ? p.round : undefined, status: typeof p.status === 'string' ? p.status : undefined }),
    );
    act('nudge', (r, m) => rooms.nudge(r, m));
    act<{ level: string }>('addBot', (r, m, p) => void rooms.addBot(r, m, isBotLevel(p.level) ? p.level : 'normal'));
    act<{ id: string; level: string }>('botLevel', (r, m, p) => rooms.setBotLevel(r, m, String(p.id), isBotLevel(p.level) ? p.level : 'normal'));
    act<{ listed: boolean }>('listed', (r, m, p) => rooms.setListed(r, m, p.listed !== false));
    act('stop', (r, m) => rooms.stop(r, m));
    act('resume', (r, m) => rooms.resume(r, m));

    socket.on(
      'emote',
      handler<{ id: string }>(
        socket,
        (p) => {
          const { room, member } = current(socket);
          io.to(`r:${room.code}`).emit('emote', rooms.emote(room, member, p.id));
        },
        true,
      ),
    );

    socket.on(
      'leave',
      handler(socket, () => {
        const { room, member } = current(socket);
        rooms.leave(room, member);
        socket.leave(`r:${room.code}`);
        socket.leave(`m:${room.code}:${member.id}`);
        socket.data.code = undefined;
        if (rooms.rooms.has(room.code)) broadcast(room);
      }),
    );

    socket.on('disconnect', () => detach(socket));
  });

  const sweeper = setInterval(() => rooms.sweep(), 60_000);
  sweeper.unref();

  // 내부 전용 포트: 새 파드가 방 상태를 받아 간다 → 이 파드는 draining (곧 SIGTERM)
  if (HANDOFF_PORT) {
    serveHandoff(HANDOFF_PORT, HANDOFF_SECRET, () => {
      draining = true;
      rooms.freezeTimers();
      const snap = rooms.exportAll();
      handoffRooms({ direction: 'out' }, snap.length);
      console.log(`handoff: 방 ${snap.length}개를 새 파드로 넘김 — 종료 대기`);
      // 보통은 곧 SIGTERM이 온다. 새 파드가 뜨지 못해 안 오면 다시 진행을 받는다
      setTimeout(() => {
        if (shuttingDown) return;
        draining = false;
        rooms.resumeTimers();
        console.log('handoff: 종료되지 않아 다시 진행을 받음');
      }, 60_000).unref();
      return { game: opts.game.id, rooms: snap };
    });
  }

  function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    draining = true;
    console.log(`${signal}: 연결을 끊고 종료 (클라이언트는 새 파드로 자동 재접속)`);
    // 서버가 socket.disconnect()하면 클라이언트가 재접속하지 않으므로 전송 계층을 닫는다
    io.engine.close();
    http.close();
    setTimeout(() => process.exit(0), 1000).unref();
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  http.listen(PORT, async () => {
    console.log(`${opts.game.id} listening on :${PORT}${BASE}/ (static: ${STATIC_DIR})`);
    if (HANDOFF_PEER) {
      const body = await pullFromPeer<{ game?: string; rooms: unknown }>(HANDOFF_PEER, HANDOFF_SECRET);
      if (body && body.game && body.game !== opts.game.id) console.log(`handoff: 다른 게임(${body.game})의 상태라 무시`);
      else if (body) {
        const { imported } = rooms.importAll(body.rooms);
        handoffRooms({ direction: 'in' }, imported);
        console.log(`handoff: 이전 파드에서 방 ${imported}개를 넘겨받음`);
      }
    }
    ready = true;
  });

  return { http, io, rooms };
}
