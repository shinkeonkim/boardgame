/**
 * 포털의 관리자 API (/admin/api/*). Cloudflare Access로 관리자를 확인한 뒤, 각 게임 서버의 내부 포트(관리자 API, 9464)로 전달하고
 * Prometheus에서 통계를 모아 준다. 화면은 포털 SPA의 /admin 페이지.
 *
 * 환경변수: ADMIN_GAME_URL (기본 http://{id}.boardgame-{id}.svc.cluster.local:9464 — {id}가 게임 id로 바뀜),
 *          ADMIN_GAME_URLS (JSON {id: url} — 로컬에서 포트가 다를 때), ADMIN_TOKEN (게임 서버에 같이 줬다면),
 *          PROMETHEUS_URL (기본 http://prometheus-operated.monitoring.svc:9090)
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { checkAdmin } from './access';

const send = (res: ServerResponse, status: number, body: unknown) =>
  void res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }).end(JSON.stringify(body));

function gameUrl(id: string): string {
  try {
    const map = JSON.parse(process.env.ADMIN_GAME_URLS ?? '{}') as Record<string, string>;
    if (map[id]) return map[id];
  } catch {
    /* 무시 */
  }
  return (process.env.ADMIN_GAME_URL ?? 'http://{id}.boardgame-{id}.svc.cluster.local:9464').replaceAll('{id}', id);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > 8192) reject(new Error('too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function toGame(id: string, path: string, init: { method: string; body?: string }) {
  const r = await fetch(`${gameUrl(id)}${path}`, {
    method: init.method,
    body: init.body,
    headers: { 'content-type': 'application/json', ...(process.env.ADMIN_TOKEN ? { 'x-admin-token': process.env.ADMIN_TOKEN } : {}) },
    signal: AbortSignal.timeout(4000),
  });
  return { status: r.status, body: await r.json().catch(() => ({ error: `게임 서버 응답 ${r.status}` })) };
}

/** Prometheus 즉시 질의 → {라벨값: 숫자} */
async function prom(query: string, by = 'game'): Promise<Record<string, number>> {
  const base = process.env.PROMETHEUS_URL ?? 'http://prometheus-operated.monitoring.svc:9090';
  const r = await fetch(`${base}/api/v1/query?query=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(4000) });
  const d = (await r.json()) as { data?: { result?: { metric: Record<string, string>; value: [number, string] }[] } };
  const out: Record<string, number> = {};
  for (const x of d.data?.result ?? []) out[x.metric[by] ?? 'all'] = Number(x.value[1]) || 0;
  return out;
}
async function promRange(query: string, hours: number): Promise<number[]> {
  const base = process.env.PROMETHEUS_URL ?? 'http://prometheus-operated.monitoring.svc:9090';
  const end = Math.floor(Date.now() / 1000);
  const r = await fetch(`${base}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${end - hours * 3600}&end=${end}&step=3600`, { signal: AbortSignal.timeout(4000) });
  const d = (await r.json()) as { data?: { result?: { values: [number, string][] }[] } };
  return (d.data?.result?.[0]?.values ?? []).map((v) => Math.round(Number(v[1]) || 0));
}

async function stats() {
  const [started, finished, rooms, people, durSum, durCount, hourly] = await Promise.all([
    prom('sum by (game) (increase(bg_matches_started_total[24h]))'),
    prom('sum by (game) (increase(bg_matches_finished_total[24h]))'),
    prom('sum by (game) (bg_rooms)'),
    prom('sum by (game) (bg_members{connected="true"})'),
    prom('sum(increase(bg_match_duration_seconds_sum[24h]))', 'none'),
    prom('sum(increase(bg_match_duration_seconds_count[24h]))', 'none'),
    promRange('sum(increase(bg_matches_started_total[1h]))', 24),
  ]);
  const total = (o: Record<string, number>) => Math.round(Object.values(o).reduce((a, b) => a + b, 0));
  const avgMin = durCount.all ? durSum.all / durCount.all / 60 : null;
  const top = Object.entries(started)
    .map(([game, n]) => ({ game, started: Math.round(n), finished: Math.round(finished[game] ?? 0) }))
    .filter((x) => x.started > 0)
    .sort((a, b) => b.started - a.started)
    .slice(0, 8);
  return { started24h: total(started), finished24h: total(finished), roomsNow: total(rooms), peopleNow: total(people), avgMinutes: avgMin, top, hourly };
}

/** /admin/api/* 처리 (처리했으면 true) */
export function handleAdmin(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (!path.startsWith('/admin/api/')) return false;
  (async () => {
    const who = await checkAdmin(req);
    if (!who.ok) return send(res, who.status, { error: who.error });
    // 다른 사이트에서 몰래 보내는 요청 막기: 바꾸는 요청에는 우리 화면만 붙이는 헤더가 있어야 함 (교차 출처면 사전 요청에서 막힘)
    if (req.method !== 'GET' && req.headers['x-bg-admin'] !== '1') return send(res, 403, { error: '관리자 화면에서만 할 수 있어요' });
    const sub = path.slice('/admin/api'.length);
    try {
      if (sub === '/me') return send(res, 200, { email: who.email });
      if (sub === '/stats') return send(res, 200, await stats().catch((e) => ({ error: `Prometheus에 닿지 못했어요 (${e instanceof Error ? e.message : e})` })));
      const m = sub.match(/^\/games\/([a-z0-9-]{2,40})(\/.*)$/);
      if (!m) return send(res, 404, { error: '없는 관리 기능이에요' });
      const [, id, rest] = m;
      const allowed = req.method === 'GET' ? rest === '/state' : /^\/(rooms\/[A-Za-z0-9]{3,8}\/(close|kick)|notice|maintenance)$/.test(rest);
      if (!allowed) return send(res, 404, { error: '없는 관리 기능이에요' });
      const body = req.method === 'GET' ? undefined : await readBody(req);
      const r = await toGame(id, `/admin${rest}`, { method: req.method ?? 'GET', body });
      if (req.method !== 'GET') console.log(`admin(${who.email}): ${id} ${rest}`);
      return send(res, r.status, r.body);
    } catch (e) {
      return send(res, 502, { error: `게임 서버에 닿지 못했어요 (${e instanceof Error ? e.message : e})` });
    }
  })();
  return true;
}
