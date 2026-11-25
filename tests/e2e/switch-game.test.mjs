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

it('하우스룰 링크(?rules=)로 만든 방은 그 규칙으로 시작', { timeout: 60_000 }, async () => {
  const p = await (await browser.newContext()).newPage();
  const rules = Buffer.from(JSON.stringify({ rolls: 4, bonusAt: 70 })).toString('base64url');
  await p.goto(`${ORIGIN}/yacht/?rules=${rules}`);
  await p.waitForSelector('text=공유받은 하우스룰');
  await p.fill('input[placeholder="예: 민지"]', '규칙');
  await p.click('button:has-text("방 만들기")');
  await p.waitForSelector('text=방 코드');
  await p.waitForSelector('text=4번 굴리기');
  assert.match(await p.innerText('.start-bar'), /4번 굴리기 · 위쪽 70점/);
  // 규칙 링크 버튼이 있음
  assert.equal(await p.locator('button:has-text("규칙 링크")').count(), 1);
});

it('봇과 바로 연습하기: 쉬운 봇을 채우고 바로 시작', { timeout: 60_000 }, async () => {
  const p = await (await browser.newContext()).newPage();
  await p.goto(`${ORIGIN}/one-card/`);
  await p.fill('input[placeholder="예: 민지"]', '연습');
  await p.click('button:has-text("봇과 바로 연습하기")');
  await p.waitForSelector('.turn-banner', { timeout: 20_000 });
  assert.ok(await p.locator('.turn-banner').count());
});

it('포털 내 기록: 기록이 없으면 안내, 있으면 승률·게임별', { timeout: 60_000 }, async () => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${ORIGIN}/me`);
  await p.waitForSelector('text=아직 기록이 없어요');
  await p.evaluate(() =>
    localStorage.setItem(
      'bg:stats',
      JSON.stringify([
        { key: 'yacht:A:1', game: 'yacht', title: 'Yacht', at: Date.now(), players: 2, bots: 1, rank: 1, won: true, score: 200, lowerWins: false },
        { key: 'yacht:A:2', game: 'yacht', title: 'Yacht', at: Date.now(), players: 2, bots: 1, rank: 2, won: false, score: 150, lowerWins: false },
      ]),
    ),
  );
  await p.reload();
  await p.waitForSelector('.me-cards');
  assert.match(await p.innerText('.me-cards'), /50%/);
  assert.match(await p.innerText('.me-games'), /요트 다이스/);
});

it('판 다시 보기: 끝난 매치를 장면별로 재생 · 기기 전적에 기록', { timeout: 120_000 }, async () => {
  const p = await (await browser.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  await p.goto(`${ORIGIN}/yacht/`);
  await p.fill('input[placeholder="예: 민지"]', '혼자');
  await p.click('button:has-text("방 만들기")');
  await p.waitForSelector('text=방 코드');
  await p.click('button:has-text("게임 시작하기")');
  for (let i = 0; i < 12; i++) {
    await p.waitForSelector('.turn-banner.mine .tb-title');
    await p.locator('.ya-roll').focus();
    await p.keyboard.press('Enter');
    await p.waitForSelector('.ya-pick');
    await p.locator('.ya-pick').first().click();
    await p.waitForFunction((n) => document.querySelectorAll('.ya-card tbody td.done').length >= n, i + 1);
  }
  await p.waitForSelector('button:has-text("되감아 보기")', { timeout: 15_000 });
  await p.click('button:has-text("되감아 보기")');
  await p.waitForSelector('.replay-bar');
  await p.click('.replay-bar [aria-label="멈춤"]');
  await p.locator('.replay-bar input[type=range]').fill('0');
  assert.match(await p.innerText('.replay-count'), /^1\//);
  await p.click('.replay-bar [aria-label="다음 장면"]');
  assert.match(await p.innerText('.replay-count'), /^2\//);
  await p.click('.replay-bar button:has-text("닫기")');
  await p.waitForSelector('.replay-bar', { state: 'detached' });
  const stats = await p.evaluate(() => JSON.parse(localStorage.getItem('bg:stats') ?? '[]'));
  assert.equal(stats[0]?.game, 'yacht');
  assert.equal(stats[0]?.won, true);
});

it('관전자 따라 보기: 방장이 허락하면 한 사람 시점(손패)으로', { timeout: 90_000 }, async () => {
  const host = await (await browser.newContext()).newPage();
  const spec = await (await browser.newContext()).newPage();
  await host.goto(`${ORIGIN}/one-card/`);
  await host.fill('input[placeholder="예: 민지"]', '방장');
  await host.click('button:has-text("방 만들기")');
  await host.waitForURL(/\/r\/[A-Z0-9]+/);
  await host.click('button.bot-btn:has-text("보통")');
  await spec.goto(host.url());
  await spec.waitForSelector('text=초대받았어요');
  await spec.fill('input >> nth=0', '구경');
  await spec.click('button:has-text("관전하기")');
  await host.waitForSelector('text=관전 중: 구경');
  await host.click('text=관전자에게 패 보여 주기');
  await host.click('button:has-text("게임 시작하기")');
  await spec.waitForSelector('.follow-bar');
  const before = await spec.locator('.oc-hand-panel .oc-card').count();
  await spec.click('.follow-bar button:has-text("방장")');
  await spec.waitForSelector('.follow-bar.on');
  await spec.waitForFunction(() => document.querySelectorAll('.oc-hand-panel .oc-card').length > 0, null, { timeout: 10_000 });
  assert.equal(before, 0, '공개 화면에서는 남의 손패가 안 보임');
  await spec.click('.follow-bar button:has-text("공개 화면")');
  await spec.waitForSelector('.follow-bar:not(.on)');
});
