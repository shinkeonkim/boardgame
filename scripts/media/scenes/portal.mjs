import { join } from 'node:path';
import { CURSOR_SCRIPT, MEDIA, ORIGIN, clickAt, glide, recorder, sleep, typeSlow } from '../lib.mjs';

export const T = 'portal';

/** 포털: 홈(라이트) → 다크로 전환 → 게임 찾기 필터 → 상세 → 바로 플레이 */
export async function desktop(browser, only) {
  if (only.length && !only.includes('portal')) return;
  const size = { width: 1280, height: 800 };
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2, locale: 'ko-KR', colorScheme: 'light' });
  await ctx.addInitScript(CURSOR_SCRIPT);
  const page = await ctx.newPage();
  await page.goto(`${ORIGIN}/`);
  await page.mouse.move(640, 300);
  await sleep(600);
  const rec = await recorder(page, T, 'tour', { width: size.width * 2 });
  await sleep(1800);
  await page.mouse.wheel(0, 520);
  await sleep(1400);
  await clickAt(page, '.ph-theme button:has-text("다크")');
  await sleep(1400);
  await page.mouse.wheel(0, -520);
  await sleep(900);
  await clickAt(page, '.hero-search input');
  await typeSlow(page, '팀전');
  await sleep(300);
  await clickAt(page, '.hero-search button');
  await sleep(1500);
  await clickAt(page, '.filters .segmented button:has-text("4명")');
  await sleep(1200);
  await clickAt(page, '.game-card .gc-title h3 a');
  await sleep(2200);
  await glide(page, '.gd-actions .btn.primary', 20);
  await sleep(800);
  await clickAt(page, '.ph-theme button:has-text("라이트")');
  await sleep(1200);
  await rec.stop();
  // README 표지
  await page.goto(`${ORIGIN}/`);
  await sleep(1200);
  await page.screenshot({ path: join(MEDIA, 'portal', 'home.png') });
  await ctx.close();
}
export async function mobile() {}
