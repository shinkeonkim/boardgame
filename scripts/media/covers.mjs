// 포털 표지(키 아트) 촬영: 게임마다 /<id>/?cover 화면(client.Cover)을 1280×720으로 찍는다.
//   npm run build && npm run local (다른 창) → node scripts/media/covers.mjs [게임id …]
//   → apps/portal/public/covers/<id>.jpg   (게임 화면 캡처는 bots-scene.mjs가 covers/<id>-play.jpg로)
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { ORIGIN, ROOT, findChromium, run } from './lib.mjs';

const all = readdirSync(join(ROOT, 'games')).filter((g) => !g.startsWith('.'));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : all;
const out = join(ROOT, 'apps/portal/public/covers');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: findChromium() });
for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  await page.goto(`${ORIGIN}/${id}/?cover`);
  if (!(await page.locator('.cover-frame').count())) {
    console.log(`- ${id}: 표지 구성(client.Cover) 없음`);
    await page.close();
    continue;
  }
  await page.waitForTimeout(600);
  const png = join(out, `${id}.png`);
  await page.screenshot({ path: png });
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-vf', 'scale=1280:-1', '-q:v', '3', join(out, `${id}.jpg`)]);
  await run('rm', [png]);
  console.log(`✓ ${id}`);
  await page.close();
}
await browser.close();
process.exit(0);
