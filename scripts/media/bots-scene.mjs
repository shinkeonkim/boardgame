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
  'trio-hunt': { bots: 3, secs: 16, cover: 9 },
  holdem: { bots: 5, secs: 18, cover: 10 },
  'five-stones': { bots: 2, secs: 18, cover: 15 },
  hearts: { bots: 4, secs: 18, cover: 12 },
  // 봇이 없는 게임: 방장이 그리고, 손님(guests)이 초대 링크로 들어와 맞힌다 (play: 녹화하는 동안 두는 수)
  'sketch-quiz': { bots: 0, guests: 2, secs: 20, cover: 13, play: drawHouse },
};

/** 그림 퀴즈: 단어를 고르고 집과 해를 마우스로 그린다. 손님들은 틀린 답을 몇 번 던지다 맞힌다 */
async function drawHouse(page, guests) {
  await page.waitForSelector('.sq-option', { timeout: 15_000 });
  await page.click('.sq-option >> nth=0');
  await page.waitForSelector('.sq-canvas.drawing');
  const box = await page.locator('.sq-canvas.drawing').boundingBox();
  const at = (x, y) => [box.x + (x / 1000) * box.width, box.y + (y / 750) * box.height];
  const line = async (pts, color) => {
    if (color) await page.click(`.sq-color[aria-label="색 ${color}"]`);
    await page.mouse.move(...at(pts[0], pts[1]));
    await page.mouse.down();
    for (let i = 2; i < pts.length; i += 2) await page.mouse.move(...at(pts[i], pts[i + 1]), { steps: 8 });
    await page.mouse.up();
    await sleep(150);
  };
  await line([250, 620, 250, 380, 520, 380, 520, 620, 250, 620], '#8b5a2b');
  await line([220, 400, 385, 230, 550, 400], '#c0392b');
  await line([300, 450, 360, 450, 360, 510, 300, 510, 300, 450], '#2980b9');
  await line([420, 620, 420, 500, 480, 500, 480, 620], '#1d1a16');
  await line([760, 170, 800, 150, 820, 190, 780, 210, 760, 170], '#f1c40f');
  await line([780, 90, 780, 120], '#f1c40f');
  await line([700, 180, 730, 180], '#f1c40f');
  await line([870, 180, 840, 180], '#f1c40f');
  await line([80, 650, 300, 640, 600, 655, 920, 640], '#27ae60');
  const word = (await page.innerText('body')).match(/「(.+?)」를 그려요/)?.[1];
  const tries = [['상자', '건물'], ['학교']];
  for (let k = 0; k < 2; k++)
    for (const [i, gp] of guests.entries()) {
      const t = tries[i]?.[k];
      if (t) await gp.fill('.sq-guess input', t).then(() => gp.press('.sq-guess input', 'Enter')).catch(() => {});
      await sleep(700);
    }
  for (const gp of guests) {
    if (word) await gp.fill('.sq-guess input', word).then(() => gp.press('.sq-guess input', 'Enter')).catch(() => {});
    await sleep(900);
  }
}

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
    await page.waitForSelector('text=방 코드');
    if (!conf.play) {
      await page.click('button:has-text("관전하기")');
      await page.waitForTimeout(300);
    }
    const guests = [];
    if (conf.guests) await page.waitForURL(/\/r\/[A-Z0-9]+/);
    for (let i = 0; i < (conf.guests ?? 0); i++) {
      const gp = await browser.newPage({ viewport: { width: 900, height: 800 } });
      await gp.goto(page.url());
      await gp.waitForSelector('text=초대받았어요');
      await gp.fill('input >> nth=0', ['민지', '도윤', '서연'][i]);
      await gp.click('button:text-is("들어가기")');
      await gp.waitForTimeout(400);
      guests.push(gp);
    }
    const levels = ['보통', '어려움', '쉬움'];
    for (let i = 0; i < conf.bots; i++) {
      await page.click(`button.bot-btn:has-text("${levels[i % 3]}")`);
      await page.waitForTimeout(120);
    }
    // 손님 입장이 반영돼 시작 버튼이 켜질 때까지
  await page.waitForSelector('button:has-text("게임 시작하기"):not([disabled])', { timeout: 15_000 });
  await page.click('button:has-text("게임 시작하기")');
    await page.waitForSelector('.table-game', { timeout: 10_000 });
    await sleep(1500);
    const rec = await recorder(page, id, 'play', { width: 1920 });
    const playing = conf.play ? conf.play(page, guests).catch((e) => console.log('  play 실패', e.message)) : null;
    await sleep(conf.secs * 1000);
    await playing;
    await rec.stop();
    await page.close();
    for (const gp of guests) await gp.close();
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
