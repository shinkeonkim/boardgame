// 모든 게임을 실제로 끝까지 돌려 보며 화면 문제를 찾는다.
//   기본: 봇끼리 두고 방장은 관전 · QA_MODE=player: 방장도 플레이어로 앉아, 내 차례에 누를 수 있는 카드·버튼을 마구 눌러 봄(몽키 테스트)
//   npm run build && PORT=8099 npm run local   (다른 창)
//   node scripts/qa/playthrough.mjs [게임id …]          → out/playthrough/<id>-<화면>.jpg (장면 모음) + 문제 목록
// 2초마다 찍으며 자동으로 보는 것:
//   · 가로 스크롤이 생김 · 화면 밖으로 삐져나간 요소 · 말줄임 없이 잘린 글자 · 페이지 오류
//   · 차례 띠·테이블 영역의 크기가 들쭉날쭉 (같은 화면에서 높이가 바뀌면 판이 출렁임)
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { findChromium } from '../media/lib.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = join(ROOT, 'out/playthrough');
mkdirSync(OUT, { recursive: true });
const ORIGIN = process.env.QA_ORIGIN ?? `http://localhost:${process.env.MEDIA_PORT ?? 8099}`;
const SECS = Number(process.env.QA_SECS ?? 70);
const CONCURRENCY = Number(process.env.QA_PARALLEL ?? 4);
const PLAYER = process.env.QA_MODE === 'player';
/** 내 차례에 눌러 볼 것들 (위에서부터 있으면 하나 골라 누름) */
const POKE = [
  '.row-line.pickable',
  '.hand-panel .can',
  '.hand-panel button.pc:not([disabled])',
  '.hand-area .hand > *:not(.blocked)',
  '.hand-panel .hand-row > *',
  '.cc-cell.anchor',
  '.hand-panel button.btn.primary:not([disabled])',
  '.hand-area button.btn.primary:not([disabled])',
  'main button.btn.primary:not([disabled])',
  'main button.pc:not([disabled])',
  '.deck.drawable',
  'main button.btn:not([disabled]):not(.ghost)',
];
async function poke(page) {
  if (!(await page.locator('.turn-banner.mine').count())) return;
  for (const sel of POKE) {
    const l = page.locator(sel);
    const n = await l.count();
    if (!n) continue;
    await l.nth(Math.floor(Math.random() * n)).click({ force: true, timeout: 800 }).catch(() => {});
    await page.waitForTimeout(250);
    // 고른 다음 누를 확인 버튼이 생겼으면 누름
    const ok = page.locator('.hand-panel button.btn.primary:not([disabled]), .hand-area button.btn.primary:not([disabled]), .actions button.btn.primary:not([disabled])');
    if (await ok.count()) await ok.first().click({ force: true, timeout: 800 }).catch(() => {});
    return;
  }
}

/** 봇 수 (그 게임을 보기 좋은 인원) — 봇이 없는 게임은 뺌 */
const BOTS = {
  'expedition-lines': 2, 'crown-march': 2, 'row-six': 4, 'flare-signals': 3, 'cipher-ops': 4, 'bluff-dice': 4,
  'number-vault': 3, 'sealed-letter': 4, 'court-intrigue': 4, 'pass-the-plate': 4, 'hidden-thorn': 4, 'flag-line': 2,
  'gem-guild': 3, 'tile-atelier': 3, 'corner-claim': 4, 'number-runs': 3, yacht: 3, 'secret-mission': 6,
  'one-card': 4, 'one-word': 4, 'trio-hunt': 4, holdem: 5,
};
const VIEWS = { wide: { width: 1366, height: 800 }, phone: { width: 390, height: 844 } };

/** 화면 검사 (페이지 안에서) */
function inspect() {
  const W = innerWidth;
  const out = [];
  const name = (el) => {
    const c = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return `${el.tagName.toLowerCase()}${c ? '.' + c : ''}`;
  };
  const se = document.scrollingElement;
  if (se.scrollWidth > W + 1) out.push(`가로 스크롤 생김 (${se.scrollWidth}px > ${W}px)`);
  const root = document.querySelector('.page') ?? document.body;
  for (const el of root.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.position === 'fixed') continue;
    // 화면 밖으로 나감 (스크롤·잘라 내기 상자 안이면 괜찮음)
    if (r.right > W + 2 || r.left < -2) {
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const o = getComputedStyle(a).overflowX;
        if (o !== 'visible') {
          const ar = a.getBoundingClientRect();
          if (ar.right <= W + 2 && ar.left >= -2) clipped = true;
          break;
        }
      }
      if (!clipped) out.push(`화면 밖으로 나감: ${name(el)} (${Math.round(r.left)}~${Math.round(r.right)}px)`);
    }
    // 말줄임 없이 잘린 글자 (글자만 든 요소)
    if (el.children.length === 0 && el.textContent.trim() && (cs.overflow === 'hidden' || cs.overflowX === 'hidden') && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2)
      out.push(`글자 잘림: ${name(el)} 「${el.textContent.trim().slice(0, 16)}」`);
  }
  const box = (s) => {
    const e = document.querySelector(s);
    return e ? Math.round(e.getBoundingClientRect().height) : null;
  };
  return { issues: [...new Set(out)].slice(0, 6), banner: box('.turn-banner'), main: box('.table-main') ?? box('main'), over: !!document.querySelector('.overlay .sheet, .result-sheet') };
}

async function run(browser, id, view) {
  const ctx = await browser.newContext({ viewport: VIEWS[view] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/favicon|404/.test(m.text()) && errors.push(m.text().slice(0, 140)));
  const found = new Map();
  const shots = [];
  try {
    await page.goto(`${ORIGIN}/${id}/`);
    await page.fill('input[placeholder="예: 민지"]', PLAYER ? '나' : '관전자');
    await page.click('button:has-text("방 만들기")');
    await page.waitForSelector('text=방 코드');
    if (!PLAYER) {
      await page.click('button:has-text("관전하기")');
      await page.waitForTimeout(300);
    }
    for (let i = 0; i < BOTS[id] - (PLAYER ? 1 : 0); i++) {
      await page.click(`button.bot-btn:has-text("${['보통', '어려움', '쉬움'][i % 3]}")`);
      await page.waitForTimeout(100);
    }
    await page.click('button:has-text("게임 시작하기")');
    await page.waitForSelector('.turn-banner', { timeout: 15_000 });
    const bannerHeights = new Set();
    const end = Date.now() + SECS * 1000;
    let k = 0;
    while (Date.now() < end) {
      if (PLAYER) {
        // 2초 동안 내 차례면 눌러 봄
        const until = Date.now() + 2000;
        while (Date.now() < until) {
          await poke(page);
          await page.waitForTimeout(400);
        }
      } else await page.waitForTimeout(2000);
      const r = await page.evaluate(inspect);
      for (const s of r.issues) found.set(s, (found.get(s) ?? 0) + 1);
      if (r.banner) bannerHeights.add(r.banner);
      if (k++ % 3 === 0 && shots.length < 8) shots.push(await page.screenshot({ type: 'jpeg', quality: 70 }));
      if (r.over) {
        shots.push(await page.screenshot({ type: 'jpeg', quality: 70 }));
        break;
      }
    }
    if (bannerHeights.size > 2) found.set(`차례 띠 높이가 들쭉날쭉: ${[...bannerHeights].join(', ')}px`, 1);
  } catch (e) {
    found.set(`진행 실패: ${e.message.split('\n')[0]}`, 1);
  }
  for (const e of errors) found.set(`페이지 오류: ${e}`, 1);
  await ctx.close();
  return { id, view, found, shots };
}

/** 장면 모음 한 장 (ffmpeg 없이: 브라우저로 이어 붙임) */
async function sheet(browser, res) {
  if (!res.shots.length) return;
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const imgs = res.shots.map((b) => `<img src="data:image/jpeg;base64,${b.toString('base64')}">`).join('');
  const w = res.view === 'phone' ? 190 : 390;
  await page.setContent(`<body style="margin:0;background:#222;display:flex;flex-wrap:wrap;align-items:flex-start;gap:4px;width:${w * 4 + 12}px">${imgs.replace(/<img /g, `<img style="width:${w}px;height:auto" `)}</body>`);
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(OUT, `${res.id}-${res.view}${PLAYER ? '-player' : ''}.jpg`), type: 'jpeg', quality: 80, fullPage: true });
  await page.close();
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(BOTS);
const jobs = ids.flatMap((id) => Object.keys(VIEWS).map((v) => [id, v]));
const browser = await chromium.launch({ executablePath: findChromium() });
const results = [];
let next = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) {
      const [id, v] = jobs[next++];
      const r = await run(browser, id, v);
      await sheet(browser, r);
      results.push(r);
      console.log(`${r.found.size ? '✗' : '✓'} ${id} · ${v}${r.found.size ? '\n    ' + [...r.found.keys()].join('\n    ') : ''}`);
    }
  }),
);
await browser.close();
const bad = results.filter((r) => r.found.size).length;
console.log(`\n${results.length}개 중 문제 ${bad}개 · 장면 모음: ${OUT}`);
