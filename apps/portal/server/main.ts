// 포털 서버: 정적 SPA(/, /games, /games/:id, /design, /admin) + 관리자 API(/admin/api, admin.ts) + 헬스체크. 게임 서버와 따로 배포된다.
import { createServer } from 'node:http';
import { join } from 'node:path';
import { serveStatic } from '@bg/server/static';
import { Metrics } from '@bg/server/metrics';
import { handleAdmin } from './admin';

const PORT = Number(process.env.PORT ?? 3000);
const DIR = process.env.STATIC_DIR ?? join(process.cwd(), 'web');

const metrics = new Metrics({ app: 'portal' });
const requests = metrics.counter('bg_portal_requests_total', '포털 요청 (kind: page|asset|cover|other, status)');
const METRICS_PORT = Number(process.env.METRICS_PORT ?? 9464) || 0;
if (METRICS_PORT) metrics.serve(METRICS_PORT);

const kindOf = (path: string) =>
  path.startsWith('/assets/') ? 'asset' : path.startsWith('/covers/') ? 'cover' : /\.[a-z0-9]+$/i.test(path) ? 'other' : 'page';

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://x').pathname;
  if (path === '/healthz' || path === '/readyz') return void res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
  res.on('finish', () => requests({ kind: kindOf(path), status: res.statusCode }));
  // 관리자 API (Cloudflare Access로 확인 → 게임 서버 내부 포트로 전달)
  if (handleAdmin(req, res, path)) return;
  serveStatic(req, res, { dir: DIR, basePath: '' });
}).listen(PORT, () => console.log(`portal listening on :${PORT} (static: ${DIR})`));
process.on('SIGTERM', () => process.exit(0));
