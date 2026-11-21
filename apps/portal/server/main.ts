// 포털 서버: 정적 SPA(/, /games, /games/:id, /design) + 헬스체크. 게임 서버와 따로 배포된다.
import { createServer } from 'node:http';
import { join } from 'node:path';
import { serveStatic } from '@bg/server/static';

const PORT = Number(process.env.PORT ?? 3000);
const DIR = process.env.STATIC_DIR ?? join(process.cwd(), 'web');

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://x').pathname;
  if (path === '/healthz' || path === '/readyz') return void res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
  serveStatic(req, res, { dir: DIR, basePath: '' });
}).listen(PORT, () => console.log(`portal listening on :${PORT} (static: ${DIR})`));
process.on('SIGTERM', () => process.exit(0));
