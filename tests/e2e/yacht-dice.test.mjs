// Yacht 주사위 E2E — 두 사람이 같은 방에서:
//  1) 꾹 눌러 흔들면 보는 사람 화면에도 흔들리고, 떼면 굴러가고, 멈춘 3D 주사위의 윗면이 서버 눈과 같다 (굴리는 사람·보는 사람 모두)
//  2) 남기기를 누르면 보는 사람 화면에도 바로 남김 표시가 뜬다
//  3) 굴러가는 도중에 남기고 다시 굴려도, 남긴 주사위의 눈이 바뀌어 보이지 않는다 (예전 버그)
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
        if ((await fetch(`${ORIGIN}/yacht/`)).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  browser = await chromium.launch({ executablePath: findChromium(), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
});
after(async () => {
  await browser?.close();
  server?.kill();
});

/** 서버 눈(aria-label)과 화면 윗면(data-top)이 같아질 때까지 */
async function settled(page, label) {
  await page.waitForFunction(
    () => {
      const t = document.querySelector('.ya-tray3d');
      if (!t) return false;
      const want = t.getAttribute('aria-label').replace('주사위 ', '').replace(/\s/g, '');
      return t.dataset.top === want;
    },
    null,
    { timeout: 12_000 },
  ).catch(async () => {
    const got = await page.evaluate(() => {
      const t = document.querySelector('.ya-tray3d');
      return `${t?.getAttribute('aria-label')} / 화면 ${t?.dataset.top}`;
    });
    assert.fail(`${label}: 화면 윗면이 서버 눈과 달라요 — ${got}`);
  });
}

it('흔들어 굴리기 · 남기기 실시간 · 남긴 주사위 눈 유지', { timeout: 120_000 }, async () => {
  const a = await (await browser.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const b = await (await browser.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const errors = [];
  for (const p of [a, b]) p.on('pageerror', (e) => errors.push(e.message));
  await a.goto(`${ORIGIN}/yacht/`);
  await a.fill('input[placeholder="예: 민지"]', '가');
  await a.click('button:has-text("방 만들기")');
  await a.waitForURL(/\/r\/[A-Z0-9]+/);
  await b.goto(a.url());
  await b.waitForSelector('text=초대받았어요');
  await b.fill('input >> nth=0', '손님');
  await b.click('button:text-is("들어가기")');
  await a.waitForSelector('text=손님');
  await a.click('button:has-text("게임 시작하기")');
  await a.waitForSelector('.ya-tray3d');
  await b.waitForSelector('.ya-tray3d');
  await a.waitForTimeout(1200);
  const [me, other] = (await a.locator('.turn-banner.mine').count()) ? [a, b] : [b, a];

  // 1) 꾹 눌러 흔들기 → 떼면 굴림
  const btn = me.locator('.ya-roll');
  const box = await btn.boundingBox();
  await me.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await me.mouse.down();
  await me.waitForTimeout(500);
  assert.ok(await btn.evaluate((el) => el.classList.contains('shaking')), '누르는 동안 흔들려야 해요');
  // 보는 사람 화면에도 「흔드는 중」
  await other.waitForSelector('.ya-shaking-tag', { timeout: 5000 });
  await me.mouse.up();
  await me.waitForFunction(() => !document.querySelector('.ya-roll')?.classList.contains('shaking'), null, { timeout: 5000 });
  await other.waitForSelector('.ya-shaking-tag', { state: 'detached', timeout: 5000 });
  await settled(me, '굴린 사람');
  await settled(other, '보는 사람');

  // 2) 남기기 → 보는 사람에게 바로
  await me.locator('.sr-only button').nth(0).evaluate((el) => el.click());
  await me.locator('.sr-only button').nth(2).evaluate((el) => el.click());
  await other.waitForFunction(() => document.querySelector('.ya-tray3d')?.dataset.held === '10100', null, { timeout: 5000 });

  // 3) 굴러가는 도중에 남기고 다시 굴림 (키보드 Enter = 바로 굴림)
  await btn.focus();
  await me.keyboard.press('Enter');
  await me.waitForTimeout(250);
  await me.locator('.sr-only button').nth(1).evaluate((el) => el.click()).catch(() => {});
  await me.waitForTimeout(100);
  if ((await btn.isEnabled()) && (await btn.textContent()).includes('남음')) {
    await btn.focus();
    await me.keyboard.press('Enter');
  }
  await settled(me, '굴린 사람 (도중에 다시)');
  await settled(other, '보는 사람 (도중에 다시)');
  assert.deepEqual(errors, []);
});

it('봇이 빠르게 남기고 다시 굴려도, 보는 화면의 눈이 서버와 같다', { timeout: 150_000 }, async () => {
  const p = await (await browser.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${ORIGIN}/yacht/`);
  await p.fill('input[placeholder="예: 민지"]', '가');
  await p.click('button:has-text("방 만들기")');
  await p.waitForURL(/\/r\/[A-Z0-9]+/);
  await p.click('button.bot-btn:has-text("어려움")');
  await p.click('button:has-text("게임 시작하기")');
  await p.waitForSelector('.ya-tray3d');
  let botTurns = 0;
  let checks = 0;
  const bad = [];
  const until = Date.now() + 100_000;
  while (botTurns < 3 && Date.now() < until) {
    if (await p.locator('.turn-banner.mine').count()) {
      // 내 차례: 바로 굴리고 아무 칸에 적기
      await p.locator('.ya-roll').focus();
      await p.keyboard.press('Enter');
      await p.waitForSelector('.ya-pick', { timeout: 10_000 });
      await p.locator('.ya-pick').first().click();
      await p.waitForSelector('.turn-banner:not(.mine)', { timeout: 10_000 });
      botTurns++;
      continue;
    }
    // 봇 차례: 굴림(눈 바뀜)을 기다렸다가, 다음 굴림 전까지(최대 6초) 화면 윗면이 서버 눈과 같아지는지
    const r = await p.evaluate(async () => {
      const t = () => document.querySelector('.ya-tray3d');
      const want = () => t()?.getAttribute('aria-label').replace('주사위 ', '').replace(/\s/g, '');
      const mineNow = () => !!document.querySelector('.turn-banner.mine');
      const before = want();
      let end = Date.now() + 8000;
      while (want() === before) {
        if (mineNow() || Date.now() > end) return { ok: true, skip: true };
        await new Promise((r) => setTimeout(r, 50));
      }
      const target = want();
      end = Date.now() + 6000;
      while (Date.now() < end) {
        if (want() !== target) return { ok: true, skip: true };
        if (t()?.dataset.top === target) return { ok: true };
        await new Promise((r) => setTimeout(r, 50));
      }
      return { ok: false, want: target, got: t()?.dataset.top, held: t()?.dataset.held };
    });
    if (!r.skip) checks++;
    if (!r.ok) bad.push(r);
  }
  assert.ok(botTurns >= 2, '봇 차례를 충분히 봤어요');
  assert.ok(checks >= 2, `확인 ${checks}번`);
  assert.deepEqual(bad, [], '화면 윗면 = 서버 눈');
  assert.deepEqual(errors, []);
});
