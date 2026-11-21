// 임시 QA: node scripts/media/_qa.mjs <gameId> <outDir> [bots] [preset]
import { chromium } from 'playwright';
const [id, OUT, nBots = '3', preset = ''] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()));
await page.goto(`http://localhost:8080/${id}/`);
await page.screenshot({ path: `${OUT}/${id}-home.png` });
await page.fill('input[placeholder="예: 민지"]', 'QA');
await page.click('button:has-text("방 만들기")');
await page.waitForSelector('text=빈자리에 봇 넣기');
const lv = ['쉬움', '보통', '어려움'];
for (let i = 0; i < Number(nBots); i++) { await page.click(`button.bot-btn:has-text("${lv[i % 3]}")`); await page.waitForTimeout(150); }
if (preset) { await page.click(`button.chip:has-text("${preset}")`); await page.waitForTimeout(200); }
await page.screenshot({ path: `${OUT}/${id}-lobby.png`, fullPage: true });
await page.click('button:has-text("게임 시작하기")');
await page.waitForSelector('.table-game, .page.game', { timeout: 10000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/${id}-game.png` });
export { browser, page, OUT, id };
