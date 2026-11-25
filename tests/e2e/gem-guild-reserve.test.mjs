// Gem Guild 예약 카드 공개 E2E — 시장에서 예약한 카드는 상대 화면에 앞면, 더미에서 몰래 예약한 카드는 뒷면(단계만).
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
        if ((await fetch(`${ORIGIN}/gem-guild/`)).ok) break;
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

it('시장 예약 = 앞면, 몰래 예약 = 상대에게 뒷면 · 나에게는 앞면 + 자물쇠', { timeout: 90_000 }, async () => {
  const a = await (await browser.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const b = await (await browser.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const errors = [];
  for (const p of [a, b]) p.on('pageerror', (e) => errors.push(e.message));
  await a.goto(`${ORIGIN}/gem-guild/`);
  await a.fill('input[placeholder="예: 민지"]', '가');
  await a.click('button:has-text("방 만들기")');
  await a.waitForURL(/\/r\/[A-Z0-9]+/);
  await b.goto(a.url());
  await b.waitForSelector('text=초대받았어요');
  await b.fill('input >> nth=0', '손님');
  await b.click('button:text-is("들어가기")');
  await a.waitForSelector('text=손님');
  await a.click('button:has-text("게임 시작하기")');
  await a.waitForSelector('.gg-market');
  await b.waitForSelector('.gg-market');
  await a.waitForTimeout(800);
  const [me, other] = (await a.locator('.turn-banner.mine').count()) ? [a, b] : [b, a];

  // 1) 더미에서 몰래 예약
  await me.click('.gg-deck >> nth=1');
  await other.waitForSelector('.turn-banner.mine');
  // 상대: 보석 가져오기
  const gems = other.locator('.gg-bank-row button.gem:not([disabled])');
  for (let k = 0; k < 3; k++) await gems.nth(k).click();
  await other.click('button:has-text("가져오기")');
  await me.waitForSelector('.turn-banner.mine');
  // 2) 시장에서 예약
  const marketId = await me.locator('.gg-market .devcard >> nth=0').getAttribute('aria-label');
  await me.click('.gg-market .devcard >> nth=0');
  await me.click('button:has-text("예약하기")');
  await other.waitForSelector('.turn-banner.mine');

  // 상대 화면: 뒷면 1장(2단계) + 앞면 1장
  await other.waitForSelector('.gg-hold-res .devcard-back');
  assert.equal(await other.locator('.gg-hold-res .devcard-back').count(), 1, '몰래 예약은 뒷면 1장');
  assert.match(await other.locator('.gg-hold-res .devcard-back').getAttribute('aria-label'), /2단계/);
  assert.equal(await other.locator(`.gg-hold-res .devcard[aria-label="${marketId}"]`).count(), 1, '시장 예약은 앞면');
  // 내 화면: 둘 다 앞면, 몰래 예약에는 자물쇠
  // 내 화면은 상대보다 한 박자 늦게 갱신될 수 있어 기다림
  await me.waitForFunction(() => document.querySelectorAll('.gg-reserved .devcard').length === 2, null, { timeout: 5000 }).catch(() => {});
  assert.equal(await me.locator('.gg-reserved .devcard').count(), 2);
  assert.equal(await me.locator('.gg-reserved .devcard .devcard-secret').count(), 1);
  assert.equal(await me.locator('.devcard-back').count(), 0, '내 화면에는 뒷면이 없음');
  await other.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/gg-other.png` : '/dev/null' }).catch(() => {});
  assert.deepEqual(errors, []);
});
