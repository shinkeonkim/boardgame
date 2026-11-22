// 봇끼리 두는 장면으로 표지·게임 방법 영상 만들기 (새 게임 공통):
//   npm run build && node scripts/media/bots-scene.mjs [게임id …]
//   → apps/portal/public/covers/<id>-play.jpg(게임 화면), games/<id>/web/public/guide/play.mp4, docs/media/<id>/gif/play.gif
// 방장(브라우저)은 관전자로 바꾸고 봇을 넣어 실제 게임을 그대로 녹화한다. 로컬 게이트웨이(npm run local)가 떠 있어야 한다.
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { CURSOR_SCRIPT, ORIGIN, ROOT, clipPath, findChromium, gif, recorder, run, sleep } from './lib.mjs';

/** 게임마다 봇 수 · 프리셋 · 녹화 길이(초) · 표지를 찍을 시점(초) */
const GAMES = {
  'row-six': { bots: 5, secs: 14, cover: 9 },
  'flare-signals': { bots: 3, secs: 16, cover: 12 },
  'cipher-ops': { bots: 4, secs: 18, cover: 14 },
  'bluff-dice': { bots: 4, secs: 16, cover: 10 },
  'number-vault': { bots: 3, secs: 16, cover: 12 },
  'sealed-letter': { bots: 4, secs: 14, cover: 4 },
  'court-intrigue': { bots: 4, secs: 16, cover: 12 },
  'pass-the-plate': { bots: 4, secs: 14, cover: 5 },
  'hidden-thorn': { bots: 4, secs: 16, cover: 12 },
  'flag-line': { bots: 2, secs: 18, cover: 15 },
  'gem-guild': { bots: 3, secs: 18, cover: 15 },
  'tile-atelier': { bots: 3, secs: 18, cover: 14 },
  'corner-claim': { bots: 4, secs: 18, cover: 16 },
  'number-runs': { bots: 3, secs: 18, cover: 15 },
  yacht: { bots: 3, secs: 16, cover: 9 },
  'secret-mission': { bots: 6, secs: 20, cover: 14 },
  'one-card': { bots: 3, secs: 16, cover: 8 },
  'one-word': { bots: 4, secs: 18, cover: 10 },
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(GAMES);
const browser = await chromium.launch({ executablePath: findChromium() });
try {
  for (const id of ids) {
    const conf = GAMES[id];
    if (!conf) continue;
    console.log(`▶ ${id}`);
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await page.addInitScript(CURSOR_SCRIPT);
    await page.goto(`${ORIGIN}/${id}/`);
    await page.fill('input[placeholder="예: 민지"]', '구경꾼');
    await page.click('button:has-text("방 만들기")');
    await page.waitForSelector('text=빈자리에 봇 넣기');
    await page.click('button:has-text("관전하기")');
    await page.waitForTimeout(300);
    const levels = ['보통', '어려움', '쉬움'];
    for (let i = 0; i < conf.bots; i++) {
      await page.click(`button.bot-btn:has-text("${levels[i % 3]}")`);
      await page.waitForTimeout(120);
    }
    await page.click('button:has-text("게임 시작하기")');
    await page.waitForSelector('.table-game', { timeout: 10_000 });
    await sleep(1500);
    const rec = await recorder(page, id, 'play', { width: 1920 });
    await sleep(conf.secs * 1000);
    await rec.stop();
    await page.close();
    // 표지 (포털 카드) · 게임 방법 영상 · README용 GIF
    const covers = join(ROOT, 'apps/portal/public/covers');
    mkdirSync(covers, { recursive: true });
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(conf.cover), '-i', clipPath(id, 'play'), '-frames:v', '1', '-vf', 'scale=1280:-1', '-q:v', '3', join(covers, `${id}-play.jpg`)]);
    const guide = join(ROOT, `games/${id}/web/public/guide`);
    mkdirSync(guide, { recursive: true });
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', clipPath(id, 'play'), '-vf', 'scale=960:-2:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(guide, 'play.mp4')]);
    await gif(id, 'play', 720, 8, 1);
    console.log(`  ✓ ${id}: ${existsSync(join(covers, `${id}-play.jpg`)) ? "게임 화면" : "게임 화면 없음"} · 영상 · GIF`);
  }
} finally {
  await browser.close();
}
process.exit(0);
