import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serveStatic } from './static';

let dir: string;
let server: Server;
let base: string;
const get = (path: string) => fetch(`${base}${path}`, { redirect: 'manual' });

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'bg-static-'));
  writeFileSync(join(dir, 'index.html'), 'SPA');
  mkdirSync(join(dir, 'games/yacht'), { recursive: true });
  writeFileSync(join(dir, 'games/yacht/index.html'), 'YACHT');
  writeFileSync(join(dir, 'sitemap.xml'), '<urlset/>');
  server = createServer((req, res) => {
    const url = req.url ?? '/';
    if (url.startsWith('/yacht')) serveStatic(req, res, { dir, basePath: '/yacht' });
    else serveStatic(req, res, { dir, basePath: '' });
  });
  await new Promise<void>((r) => server.listen(0, r));
  base = `http://localhost:${(server.address() as { port: number }).port}`;
});
afterAll(() => {
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('정적 파일 · SEO', () => {
  it('미리 그린 페이지가 있으면 그 HTML (없으면 SPA)', async () => {
    expect(await (await get('/games/yacht')).text()).toBe('YACHT');
    expect(await (await get('/games/yacht/')).text()).toBe('YACHT');
    expect(await (await get('/games/nope')).text()).toBe('SPA');
  });
  it('사이트맵은 XML로', async () => {
    const r = await get('/sitemap.xml');
    expect(r.headers.get('content-type')).toContain('application/xml');
  });
  it('방 주소·관리자 화면은 검색에서 빠짐 (X-Robots-Tag)', async () => {
    expect((await get('/yacht/r/ABCD')).headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect((await get('/admin')).headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect((await get('/yacht/')).headers.get('x-robots-tag')).toBeNull();
    expect((await get('/')).headers.get('x-robots-tag')).toBeNull();
  });
});
