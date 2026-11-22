// 다른 게임으로 바꾸기 E2E — 방장·손님·봇이 있는 Yacht 방에서 One Card로 옮기면 모두 새 방에 같은 이름으로, 방장은 그대로 방장, 봇도 따라옴.
//   npm run build && npm run test:e2e   (E2E_ORIGIN=http://localhost:8099 로 이미 띄운 서버 사용 가능)
import { spawn } from 'node:child_process';
import { after, before, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../..', import.meta.url).pathname;
const PORT = 8500 + Math.floor(Math.random() * 300);
const ORIGIN = process.env.E2E_ORIGIN ?? `http://localhost:${PORT}`;

function findChromium() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  const base = join(homedir(), 'Library/Caches/ms-playwright');
  if (!existsSync(base)) return undefined;
  for (const d of readdirSync(base).filter((x) => x.startsWith('chromium-')).sort().reverse()) {
    const mac = join(base, d, 'chrome-mac-arm64');
    if (existsSync(mac)) {
      const app = readdirSync(mac).find((x) => x.endsWith('.app'));
      if (app) {
        const bin = join(mac, app, 'Contents/MacOS');
        return join(bin, readdirSync(bin)[0]);
      }
    }
  }
  return undefined;
}

let server;
let browser;
before(async () => {
  if (!process.env.E2E_ORIGIN) {
    server = spawn('node', ['scripts/local.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(`${ORIGIN}/corner-claim/`)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  browser = await chromium.launch({ executablePath: findChromium() });
});
after(async () => {
  await browser?.close();
  server?.kill();
});


it('Yacht → One Card: 방장·손님·봇이 함께 옮김', { timeout: 120_000 }, async () => {
  const host = await (await browser.newContext()).newPage();
  const guest = await (await browser.newContext()).newPage();
  const errors = [];
  for (const p of [host, guest]) p.on('pageerror', (e) => errors.push(e.message));
  await host.goto(`${ORIGIN}/yacht/`);
  await host.fill('input[placeholder="예: 민지"]', '방장님');
  await host.click('button:has-text("방 만들기")');
  await host.waitForURL(/\/r\/[A-Z0-9]+/);
  await host.click('button.bot-btn:has-text("보통")');
  await guest.goto(host.url());
  await guest.waitForSelector('text=초대받았어요');
  await guest.fill('input >> nth=0', '손님');
  await guest.click('button:text-is("들어가기")');
  await host.waitForSelector('text=손님');

  await host.click('button:has-text("다른 게임으로 바꾸기")');
  await host.click('.switch-item:has-text("One Card")');
  // 모두 새 게임 방으로
  for (const p of [host, guest]) await p.waitForURL(/\/one-card\/r\/[A-Z0-9]+$/, { timeout: 20_000 });
  assert.equal(new URL(host.url()).pathname, new URL(guest.url()).pathname, '같은 방');
  for (const p of [host, guest]) await p.waitForSelector('text=방 코드', { timeout: 15_000 });
  await host.waitForSelector('text=손님', { timeout: 10_000 });
  const body = await host.innerText('body');
  assert.match(body, /방장님/);
  assert.match(body, /보통/, '봇도 같은 난이도로');
  // 방장은 그대로 방장 (시작 버튼은 방장에게만)
  assert.equal(await host.locator('button:has-text("게임 시작하기")').count(), 1);
  assert.equal(await guest.locator('button:has-text("게임 시작하기")').count(), 0);
  assert.deepEqual(errors, []);
});
