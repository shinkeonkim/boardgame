import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

/**
 * basePath 아래의 정적 파일 + SPA 폴백(index.html).
 * Vite의 해시 파일(assets/)은 1년 캐시, 나머지(index.html 등)는 no-cache.
 * 처리했으면 true, basePath 밖의 요청이면 false.
 */
export function serveStatic(req: IncomingMessage, res: ServerResponse, opts: { dir: string; basePath: string }): boolean {
  const dir = resolve(opts.dir);
  const url = new URL(req.url ?? '/', 'http://x');
  const base = opts.basePath.replace(/\/$/, '');
  let path = decodeURIComponent(url.pathname);
  if (base) {
    if (path === base) {
      // /expedition-lines → /expedition-lines/ (상대 경로 자원이 맞게 풀리도록)
      res.writeHead(308, { location: `${base}/${url.search}` }).end();
      return true;
    }
    if (!path.startsWith(`${base}/`)) return false;
    path = path.slice(base.length);
  }
  let file = normalize(join(dir, path));
  // 미리 그린 페이지(/games/yacht → games/yacht/index.html)가 있으면 그것을 (검색엔진·미리보기용 head 가 들어 있음)
  if (file.startsWith(dir) && existsSync(file) && statSync(file).isDirectory() && existsSync(join(file, 'index.html'))) file = join(file, 'index.html');
  else if (file.startsWith(dir) && !extname(path) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (!file.startsWith(dir)) file = join(dir, 'index.html');
  else if (!existsSync(file) || statSync(file).isDirectory()) {
    // 확장자가 있는 파일(그림·스크립트 등)이 없으면 404 — 페이지 경로만 SPA로 돌려준다
    if (extname(path) && extname(path) !== '.html') {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
      return true;
    }
    file = join(dir, 'index.html');
  }
  if (!existsSync(file)) {
    res.writeHead(404).end('web build not found — run `npm run build`');
    return true;
  }
  const isAsset = file.includes(`${dir}/assets/`);
  const range = req.headers.range;
  const size = statSync(file).size;
  const type = MIME[extname(file)] ?? 'application/octet-stream';
  const cache = isAsset ? 'public, max-age=31536000, immutable' : extname(file) === '.mp4' ? 'public, max-age=86400' : 'no-cache';
  // 방 주소(/r/코드)·관리자 화면은 검색에 나오지 않게 (방은 금방 사라지고 남의 방이 노출됨)
  const noindex = /^\/r\//.test(path) || /^\/admin(\/|$)/.test(path);
  // 영상은 Range 요청(사파리 필수)을 지원
  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [a, b] = range.slice(6).split('-');
    const start = a ? Number(a) : 0;
    const end = b ? Math.min(Number(b), size - 1) : size - 1;
    res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1, 'cache-control': cache });
    createReadStream(file, { start, end }).pipe(res);
    return true;
  }
  res.writeHead(200, { 'content-type': type, 'cache-control': cache, 'accept-ranges': 'bytes', 'content-length': size, ...(noindex ? { 'x-robots-tag': 'noindex, nofollow' } : {}) });
  createReadStream(file).pipe(res);
  return true;
}
