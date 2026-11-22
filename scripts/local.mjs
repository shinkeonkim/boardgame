// 운영과 같은 모양으로 로컬에서 띄우기 (빌드 후):
//   지표: 포털 http://localhost:9460/metrics, 게임 http://localhost:9461/metrics …
//   npm run build && npm run local   → http://localhost:8080
// 포털과 게임 서버를 각각 띄우고, 운영의 Traefik처럼 경로로 나눠 주는 작은 게이트웨이를 앞에 둔다.
//   /<게임id>/... → 그 게임 서버 (웹소켓 포함),  나머지 → 포털
import { spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { connect } from 'node:net';

const PORT = Number(process.env.PORT ?? 8080);
const games = readdirSync('games').filter((id) => existsSync(`games/${id}/server/dist/server.cjs`));
const routes = new Map();
const children = [];

function start(name, script, env) {
  const p = spawn('node', [script], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  p.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`));
  p.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`));
  children.push(p);
}

// 관리자 페이지(/admin): 로컬에서는 Cloudflare Access 없이(ADMIN_DEV), 게임 서버 내부 포트는 9461부터
const adminUrls = Object.fromEntries(games.map((id, i) => [id, `http://localhost:${9461 + i}`]));
start('portal', 'apps/portal/dist-server/server.cjs', { PORT: '3000', STATIC_DIR: 'apps/portal/dist', METRICS_PORT: '9460', ADMIN_DEV: '1', ADMIN_GAME_URLS: JSON.stringify(adminUrls) });
games.forEach((id, i) => {
  const port = 3101 + i;
  routes.set(id, port);
  start(id, `games/${id}/server/dist/server.cjs`, { PORT: String(port), STATIC_DIR: `games/${id}/web/dist`, MAX_ROOMS: '50', METRICS_PORT: String(9461 + i) });
});

const target = (url) => {
  const first = (url ?? '/').split('/')[1]?.split('?')[0];
  return routes.get(first) ?? 3000;
};

const gw = createServer((req, res) => {
  const up = request({ host: '127.0.0.1', port: target(req.url), path: req.url, method: req.method, headers: req.headers }, (r) => {
    res.writeHead(r.statusCode ?? 502, r.headers);
    r.pipe(res);
  });
  up.on('error', () => res.writeHead(502).end('upstream not ready'));
  req.pipe(up);
});
// 웹소켓(Socket.IO) 업그레이드는 TCP로 그대로 잇는다
gw.on('upgrade', (req, socket, head) => {
  const up = connect(target(req.url), '127.0.0.1', () => {
    up.write(`${req.method} ${req.url} HTTP/1.1\r\n${Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n')}\r\n\r\n`);
    up.write(head);
    socket.pipe(up).pipe(socket);
  });
  up.on('error', () => socket.destroy());
  socket.on('error', () => up.destroy());
});
gw.listen(PORT, () => console.log(`\n보드게임 로컬: http://localhost:${PORT}  (게임: ${games.map((g) => `/${g}/`).join(' ')})\n`));

const stop = () => {
  children.forEach((c) => c.kill('SIGTERM'));
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
