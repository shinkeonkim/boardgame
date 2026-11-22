/**
 * 관리자 API — 게임 서버의 내부 포트(METRICS_PORT, 기본 9464)에서만 연다. Ingress·터널에는 연결하지 않는다.
 * 클러스터 안에서는 NetworkPolicy가 Prometheus(monitoring)와 포털(boardgame-portal)만 이 포트에 들어오게 한다.
 * 포털이 Cloudflare Access로 관리자를 확인한 뒤 여기로 전달한다. ADMIN_TOKEN을 주면 x-admin-token 헤더도 확인한다.
 *
 *   GET  /admin/state                         → AdminGameState (방 목록·공지·점검 모드)
 *   POST /admin/rooms/<code>/close            → 방 닫기 (모두에게 「관리자가 방을 닫았어요」)
 *   POST /admin/rooms/<code>/kick {memberId}  → 한 사람 내보내기
 *   POST /admin/notice {text|null}            → 모든 방에 띠 공지 (null이면 지움)
 *   POST /admin/maintenance {on}              → 점검 모드 (새 방 막기)
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import type { AdminGameState } from '@bg/core';
import { RoomError, Rooms } from './rooms';

export interface AdminHooks {
  game: string;
  rooms: Rooms;
  sockets: () => number;
  /** 공지·점검이 바뀌면 모든 방에 새 화면 보내기 */
  broadcastAll: () => void;
  /** 닫힌 방 사람들에게 알리기 */
  closed: (code: string, reason: string) => void;
  /** 한 방 다시 보내기 */
  refresh: (code: string) => void;
}

const started = Date.now();

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > 8192) reject(new RoomError('요청이 너무 커요'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new RoomError('JSON이 아니에요'));
      }
    });
    req.on('error', reject);
  });
}

const send = (res: ServerResponse, status: number, body: unknown) =>
  void res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }).end(JSON.stringify(body));

function tokenOk(req: IncomingMessage): boolean {
  const want = process.env.ADMIN_TOKEN;
  if (!want) return true;
  const got = String(req.headers['x-admin-token'] ?? '');
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** 처리했으면 true (메트릭 서버의 다른 경로와 함께 씀) */
export function adminHandler(h: AdminHooks) {
  return (req: IncomingMessage, res: ServerResponse): boolean => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    if (!path.startsWith('/admin/')) return false;
    if (process.env.ADMIN_API === 'off') return void send(res, 404, { error: 'off' }), true;
    if (!tokenOk(req)) return void send(res, 401, { error: '관리자 토큰이 맞지 않아요' }), true;
    (async () => {
      try {
        if (req.method === 'GET' && path === '/admin/state') {
          const state: AdminGameState = {
            game: h.game,
            rooms: h.rooms.adminRooms(),
            maxRooms: h.rooms.maxRooms,
            notice: h.rooms.notice,
            maintenance: h.rooms.maintenance,
            sockets: h.sockets(),
            uptimeSec: Math.round((Date.now() - started) / 1000),
          };
          return send(res, 200, state);
        }
        if (req.method !== 'POST') return send(res, 405, { error: 'POST만 돼요' });
        const body = await readJson(req);
        let m: RegExpMatchArray | null;
        if ((m = path.match(/^\/admin\/rooms\/([A-Za-z0-9]{3,8})\/close$/))) {
          const room = h.rooms.adminClose(m[1]);
          h.closed(room.code, '관리자가 방을 닫았어요');
          console.log(`admin: 방 ${room.code} 닫음`);
          return send(res, 200, { ok: true });
        }
        if ((m = path.match(/^\/admin\/rooms\/([A-Za-z0-9]{3,8})\/kick$/))) {
          const room = h.rooms.adminKick(m[1], String(body.memberId ?? ''));
          if (h.rooms.rooms.has(room.code)) h.refresh(room.code);
          else h.closed(room.code, '관리자가 방을 닫았어요');
          console.log(`admin: 방 ${room.code}에서 내보냄`);
          return send(res, 200, { ok: true });
        }
        if (path === '/admin/notice') {
          const text = typeof body.text === 'string' ? body.text.trim().slice(0, 200) : '';
          h.rooms.notice = text || null;
          h.broadcastAll();
          console.log(`admin: 공지 ${h.rooms.notice ? `「${h.rooms.notice}」` : '지움'}`);
          return send(res, 200, { ok: true, notice: h.rooms.notice });
        }
        if (path === '/admin/maintenance') {
          h.rooms.maintenance = body.on === true;
          h.broadcastAll();
          console.log(`admin: 점검 모드 ${h.rooms.maintenance ? '켬' : '끔'}`);
          return send(res, 200, { ok: true, maintenance: h.rooms.maintenance });
        }
        return send(res, 404, { error: '없는 관리 기능이에요' });
      } catch (e) {
        if (e instanceof RoomError) return send(res, 400, { error: e.message });
        console.error(e);
        return send(res, 500, { error: '서버 오류' });
      }
    })();
    return true;
  };
}
