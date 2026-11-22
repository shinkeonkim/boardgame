// 끌어다 놓기 E2E — 끌기를 쓰는 모든 게임을 실제 브라우저로 끌어 본다 (마우스·터치 × 넓은·폰·가로 짧은 화면).
//   npm run build && npm run test:e2e            (이미 띄운 서버를 쓰려면 E2E_ORIGIN=http://localhost:8099)
//   E2E_GAMES=corner-claim E2E_VIEWS=phone E2E_INPUTS=touch npm run test:e2e   ← 일부만
// 확인하는 것:
//   1) 레이아웃이 흔들리지 않음 — 끄는 동안 판·손패 영역의 크기가 1px 넘게 바뀌거나, 페이지에 스크롤이 새로 생기면 실패
//   2) 손에 든 조각(고스트)·미리보기가 포인터를 따라옴
//   3) 놓으면 실제로 수가 둬짐 (또는 안 되는 이유가 보임) · 페이지 오류 없음
import { spawn } from 'node:child_process';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../..', import.meta.url).pathname;
const PORT = 8190 + Math.floor(Math.random() * 300);
let ORIGIN = process.env.E2E_ORIGIN ?? `http://localhost:${PORT}`;
const pick = (env, all) => (process.env[env] ? process.env[env].split(',') : all);

const VIEWS = {
  wide: { width: 1366, height: 800 },
  phone: { width: 390, height: 844 },
  short: { width: 844, height: 390 },
};

/**
 * 게임마다: 봇 수 · 끌 것(source) · 놓을 곳(targets, 차례로 시도해 「놓을 수 있음」 표시가 뜨는 곳) ·
 * 흔들리면 안 되는 영역(stable) · 고스트(ghost) · 둬졌는지(done)
 */
const GAMES = {
  'corner-claim': {
    bots: 3,
    // 큰 조각 중 귀퉁이에 놓을 수 있는 것 (+ 모양은 귀퉁이를 못 덮음): 일자 4칸
    source: '.cc-pieces .piece >> nth=4',
    targets: ['.cc-cell.anchor', '.cc-cell.start'],
    valid: '.cc-shadow.ok',
    stable: ['.cc-board', '.cc-tray', '.table-side'],
    ghost: ['.cc-ghost', '.cc-shadow'],
    done: async (p, before) => (await p.locator('.cc-pieces .piece').count()) < before.count,
    count: (p) => p.locator('.cc-pieces .piece').count(),
  },
  'crown-march': {
    bots: 1,
    source: '.hand-area .hand > * >> nth=0',
    targets: ['.board-frame'],
    valid: '.drag-ghost.on-target',
    stable: ['.board-frame', '.hand-area'],
    ghost: ['.drag-ghost'],
    done: async (p, before) => (await p.locator('.hand-area .hand > *').count()) !== before.count || (await p.locator('.table-game.my-turn').count()) === 0,
    count: (p) => p.locator('.hand-area .hand > *').count(),
  },
  'expedition-lines': {
    bots: 1,
    source: '.hand-area .hand > * >> nth=0',
    targets: ['[data-drop^="play-"]', '[data-drop^="discard-"]'],
    valid: '.drag-ghost.on-target',
    stable: ['.hand-area', '.table-side'],
    ghost: ['.drag-ghost'],
    done: async (p, before) => (await p.locator('.hand-area .hand > *').count()) < before.count,
    count: (p) => p.locator('.hand-area .hand > *').count(),
  },
  'number-runs': {
    bots: 1,
    source: '.nr-hand > * >> nth=0',
    targets: ['[data-drop="new"]'],
    valid: null,
    stable: ['.hand-panel', '.table-side'],
    ghost: ['.nr-ghost'],
    done: async (p, before) => (await p.locator('.nr-hand > *').count()) < before.count,
    count: (p) => p.locator('.nr-hand > *').count(),
  },
  'sketch-quiz': {
    // 봇 없는 게임: 손님 한 명이 초대 링크로 들어옴
    bots: 0,
    guests: 1,
    prepare: async (p) => {
      await p.waitForSelector('.sq-option', { timeout: 15_000 });
      await p.click('.sq-option >> nth=0');
      await p.waitForSelector('.sq-canvas.drawing');
    },
    // 그림판 안에서 긋기
    source: '.sq-canvas.drawing',
    targets: ['.sq-canvas.drawing'],
    valid: null,
    stable: ['.sq-canvas', '.table-side'],
    ghost: [],
    done: async (p) => p.evaluate(() => document.querySelector('.sq-board') !== null),
    count: async () => 0,
  },
};

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

/** 초대 링크로 손님 입장 (봇을 넣을 수 없는 게임) — 브라우저를 닫을 때 함께 닫힘 */
async function joinGuest(url, name) {
  const g = await (await browser.newContext()).newPage();
  await g.goto(url);
  try {
    await g.waitForSelector('text=초대받았어요', { timeout: 10_000 });
  } catch (e) {
    mkdirSync(join(ROOT, 'out/e2e'), { recursive: true });
    await g.screenshot({ path: join(ROOT, 'out/e2e/guest-join.png') });
    throw new Error(`손님 입장 화면이 안 떠요 (${url}): ${(await g.innerText('body')).slice(0, 200)}`);
  }
  await g.fill('input >> nth=0', name);
  await g.click('button:text-is("들어가기")');
  await g.waitForSelector('text=게임 시작', { timeout: 10_000 }).catch(() => {});
  return g;
}

/** 방을 만들고 봇(또는 손님)을 넣어 시작, 내 차례까지 기다림 */
async function openGame(id, view, touch) {
  const conf = GAMES[id];
  const ctx = await browser.newContext({ viewport: VIEWS[view], hasTouch: touch, isMobile: false });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${ORIGIN}/${id}/`);
  await page.fill('input[placeholder="예: 민지"]', '테스터');
  await page.click('button:has-text("방 만들기")');
  await page.waitForSelector('text=방 코드');
  for (let i = 0; i < conf.bots; i++) {
    await page.click('button.bot-btn:has-text("쉬움")');
    await page.waitForTimeout(120);
  }
  if (conf.guests) await page.waitForURL(/\/r\/[A-Z0-9]+/);
  for (let i = 0; i < (conf.guests ?? 0); i++) await joinGuest(page.url(), `손님${i + 1}`);
  // 손님 입장이 반영돼 시작 버튼이 켜질 때까지
  await page.waitForSelector('button:has-text("게임 시작하기"):not([disabled])', { timeout: 15_000 });
  await page.click('button:has-text("게임 시작하기")');
  // 내 차례 = 차례 띠가 「내 차례」 모양 (모든 게임 공통)
  await page.waitForSelector('.turn-banner', { timeout: 15_000 });
  await page.waitForSelector('.turn-banner.mine', { timeout: 40_000 });
  // 「내 차례!」 알림이 사라질 때까지
  await page.waitForTimeout(1600);
  if (conf.prepare) await conf.prepare(page);
  return { page, errors, ctx };
}

/** 포인터 조작: 마우스 또는 터치 (CDP 터치 이벤트 → pointerType 'touch') */
async function pointer(page, touch) {
  if (!touch) return { down: (x, y) => page.mouse.move(x, y).then(() => page.mouse.down()), move: (x, y) => page.mouse.move(x, y), up: () => page.mouse.up() };
  const cdp = await page.context().newCDPSession(page);
  let last = [0, 0];
  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  return {
    down: async (x, y) => ((last = [x, y]), send('touchStart', [{ x, y }])),
    move: async (x, y) => ((last = [x, y]), send('touchMove', [{ x, y }])),
    up: async () => send('touchEnd', []),
  };
}

/** 지켜볼 영역들의 크기 + 페이지 스크롤 크기 */
const measure = (page, sels) =>
  page.evaluate((sels) => {
    const out = {};
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) {
        const r = el.getBoundingClientRect();
        out[s] = [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10, Math.round(r.top * 10) / 10];
      }
    }
    const se = document.scrollingElement;
    out['(page scroll)'] = [se.scrollWidth - se.clientWidth > 1 ? 1 : 0, 0, 0];
    return out;
  }, sels);

const ghostNear = (page, sels, x, y, slack) =>
  page.evaluate(
    ({ sels, x, y, slack }) => {
      for (const s of sels) {
        const el = document.querySelector(s);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        return x >= r.left - slack && x <= r.right + slack && y >= r.top - slack && y <= r.bottom + slack ? null : `${s} ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)} ↔ 포인터 ${Math.round(x)},${Math.round(y)}`;
      }
      return sels.length ? '고스트가 안 보임' : null;
    },
    { sels, x, y, slack },
  );

async function center(page, sel) {
  const b = await page.locator(sel).first().boundingBox();
  return b && [b.x + b.width / 2, b.y + b.height / 2];
}

async function dragOnce(id, view, inputKind) {
  const conf = GAMES[id];
  const touch = inputKind === 'touch';
  const { page, errors, ctx } = await openGame(id, view, touch);
  try {
    const base = await measure(page, conf.stable);
    const count = await conf.count(page);
    const src = await page.locator(conf.source).first().boundingBox();
    assert.ok(src, `${id}: 끌 것(${conf.source})이 안 보여요`);
    const from = id === 'sketch-quiz' ? [src.x + src.width * 0.2, src.y + src.height * 0.3] : [src.x + src.width / 2, src.y + src.height / 2];
    const p = await pointer(page, touch);
    const shake = [];
    const lost = [];
    const check = async (x, y, label) => {
      const now = await measure(page, conf.stable);
      // 크기와 위치(top) 모두: 크기가 그대로여도 위 띠가 늘어 판이 밀려 내려가면 흔들림
      for (const [k, [w, h, y]] of Object.entries(base)) {
        const [w2, h2, y2] = now[k] ?? [0, 0, 0];
        if (Math.abs(w2 - w) > 1 || Math.abs(h2 - h) > 1) shake.push(`${label}: ${k} 크기 ${w}×${h} → ${w2}×${h2}`);
        else if (Math.abs(y2 - y) > 1) shake.push(`${label}: ${k} 위치 y ${y} → ${y2}`);
      }
      // 손가락은 조각이 가리지 않게 위로 들어 올림 → 여유를 크게
      const miss = await ghostNear(page, conf.ghost, x, y, touch ? 140 : 70);
      if (miss) lost.push(`${label}: ${miss}`);
    };
    await p.down(...from);
    // 놓을 곳 찾기: 후보마다 가 보고 「놓을 수 있음」 표시가 뜨면 거기서 놓는다
    let to = null;
    let step = 0;
    const glide = async (a, b, n = 12) => {
      for (let i = 1; i <= n; i++) {
        const x = a[0] + ((b[0] - a[0]) * i) / n;
        const y = a[1] + ((b[1] - a[1]) * i) / n;
        await p.move(x, y);
        await page.waitForTimeout(16);
        if (i % 3 === 0 && i > 2) await check(x, y, `이동 ${++step}`);
      }
    };
    let at = from;
    for (const t of conf.targets) {
      const cands = await page.locator(t).all();
      for (const c of cands.slice(0, 8)) {
        const b = await c.boundingBox();
        if (!b) continue;
        const goal = [b.x + b.width / 2, b.y + b.height / 2 + (touch && id === 'corner-claim' ? b.height * 1.8 : 0)];
        if (id === 'sketch-quiz') goal.splice(0, 2, b.x + b.width * 0.7, b.y + b.height * 0.6);
        await glide(at, goal);
        at = goal;
        await page.waitForTimeout(60);
        if (!conf.valid || (await page.locator(conf.valid).count())) {
          to = goal;
          break;
        }
      }
      if (to) break;
    }
    // 판 위에서 이리저리 (흔들림이 잘 드러나는 구간)
    if (to) {
      await glide(to, [to[0] + 40, to[1] - 30], 6);
      await glide([to[0] + 40, to[1] - 30], to, 6);
    }
    await p.up();
    await page.waitForTimeout(1500);
    const moved = to ? await conf.done(page, { count }) : false;
    const warned = await page.locator('.toast, .warn, [role="alert"]').count();
    const note = to ? '' : await page.evaluate(() => (document.querySelector('.cc-note') ?? document.querySelector('.tb-hint'))?.textContent ?? '');
    if (!to || shake.length || lost.length) {
      // 실패 장면을 남김: out/e2e/<게임>-<화면>-<입력>.png (놓기 직전 상태를 다시 만들어 찍음)
      mkdirSync(join(ROOT, 'out/e2e'), { recursive: true });
      await p.down(...from);
      await p.move(from[0] + 20, from[1] - 40);
      await p.move(...(at ?? from));
      await page.waitForTimeout(100);
      await page.screenshot({ path: join(ROOT, `out/e2e/${id}-${view}-${inputKind}.png`) });
      await p.up();
    }
    return { shake, lost, to: !!to, moved, warned, errors, note };
  } finally {
    await ctx.close();
  }
}

for (const id of pick('E2E_GAMES', Object.keys(GAMES))) {
  describe(`끌어다 놓기 · ${id}`, () => {
    for (const view of pick('E2E_VIEWS', Object.keys(VIEWS)))
      for (const inputKind of pick('E2E_INPUTS', ['mouse', 'touch'])) {
        it(`${view} · ${inputKind}`, { timeout: 120_000 }, async () => {
          const r = await dragOnce(id, view, inputKind);
          assert.deepEqual(r.errors, [], '페이지 오류');
          assert.deepEqual(r.shake, [], '끄는 동안 레이아웃이 흔들려요');
          assert.deepEqual(r.lost, [], '고스트가 포인터를 놓쳐요');
          assert.ok(r.to, `놓을 수 있는 곳을 못 찾았어요 (놓을 수 있음 표시가 안 뜸) — ${r.note}`);
          assert.ok(r.moved || r.warned, '놓았는데 아무 일도 안 일어나요');
        });
      }
  });
}
