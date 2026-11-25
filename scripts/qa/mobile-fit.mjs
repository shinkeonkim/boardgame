// 휴대폰에서 중요한 정보가 스크롤 없이 보이는지 (게임마다 플레이어로 앉아 내 차례 화면을 잰다)
//   node scripts/qa/mobile-fit.mjs [게임id …]      (로컬 서버 필요: PORT=8099 npm run local) · QA_SHOTS=<폴더> 면 화면도 저장
// 보는 것: 내 손패(·조각 줄)가 화면 안에 다 보이나 · 차례 띠가 보이나 · 판 영역이 넘쳐 스크롤해야 하나
import { chromium } from 'playwright';
import { findChromium } from '../media/lib.mjs';

const ORIGIN = process.env.QA_ORIGIN ?? `http://localhost:${process.env.MEDIA_PORT ?? 8099}`;
const PHONES = { 'iPhone 15': { width: 393, height: 852 }, '작은 폰': { width: 360, height: 740 }, '폰 가로': { width: 844, height: 390 } };
const BOTS = {
  'expedition-lines': 1, 'crown-march': 1, 'row-six': 3, 'flare-signals': 2, 'cipher-ops': 3, 'bluff-dice': 3, 'number-vault': 2,
  'sealed-letter': 3, 'court-intrigue': 3, 'pass-the-plate': 3, 'hidden-thorn': 3, 'flag-line': 1, 'gem-guild': 2, 'tile-atelier': 2,
  'corner-claim': 3, 'number-runs': 2, yacht: 2, 'secret-mission': 5, 'one-card': 3, 'one-word': 3, 'trio-hunt': 3, holdem: 4, 'five-stones': 1, hearts: 3, 'orbit-tasks': 3, 'silent-count': 2,
};
/** 내 손패·조각 줄 (게임마다 이름이 달라서 차례로 찾음) */
const HAND = ['.hand-panel', '.hand-area', '.cc-tray', '.th-seat.mine', '.ya-tray', '.hd-actions', '.oc-hand-panel'];

function measure(handSels) {
  const H = innerHeight;
  const W = innerWidth;
  /** 요소가 실제로 보이는 비율 (화면과 스크롤 상자들에 잘린 만큼 뺌) */
  const visibleRatio = (el) => {
    let r = el.getBoundingClientRect();
    if (!r.height) return 0;
    let top = Math.max(r.top, 0);
    let bottom = Math.min(r.bottom, H);
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a).overflowY;
      if (o === 'visible') continue;
      const ar = a.getBoundingClientRect();
      top = Math.max(top, ar.top);
      bottom = Math.min(bottom, ar.bottom);
    }
    return Math.max(0, bottom - top) / Math.min(r.height, H);
  };
  const out = [];
  const hand = handSels.map((s) => document.querySelector(s)).find((e) => e && e.getBoundingClientRect().height > 0);
  if (hand) {
    const v = visibleRatio(hand);
    if (v < 0.9) out.push(`내 손패가 ${Math.round(v * 100)}%만 보여요 (스크롤해야 다 보임)`);
  }
  const banner = document.querySelector('.turn-banner');
  if (banner && visibleRatio(banner) < 0.9) out.push('차례 띠가 가려지거나 화면 밖');
  const main = document.querySelector('.table-main, .game-scroll');
  if (main && main.scrollHeight > main.clientHeight + 24) out.push(`판 영역이 넘쳐요: ${main.scrollHeight - main.clientHeight}px 스크롤`);
  const se = document.scrollingElement;
  if (se.scrollHeight > H + 4) out.push(`페이지가 길어요: ${se.scrollHeight - H}px 스크롤`);
  // 주요 버튼(놓기·내기·굴리기 등)이 화면 밖
  for (const b of document.querySelectorAll('.hand-panel .btn.primary, .action-row .btn.primary, .ya-roll, .actions .btn.primary')) {
    if (b.getBoundingClientRect().height && visibleRatio(b) < 0.9) {
      out.push(`버튼이 화면 밖: 「${b.textContent.trim().slice(0, 12)}」`);
      break;
    }
  }
  return out;
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(BOTS);
const browser = await chromium.launch({ executablePath: findChromium() });
let bad = 0;
for (const id of ids) {
  for (const [label, vp] of Object.entries(PHONES)) {
    const page = await browser.newPage({ viewport: vp, hasTouch: true });
    let issues;
    try {
      await page.goto(`${ORIGIN}/${id}/`);
      await page.fill('input[placeholder="예: 민지"]', '나');
      await page.click('button:has-text("방 만들기")');
      await page.waitForSelector('text=방 코드');
      for (let i = 0; i < BOTS[id]; i++) {
        await page.click('button.bot-btn:has-text("보통")');
        await page.waitForTimeout(80);
      }
      await page.click('button:has-text("게임 시작하기")');
      await page.waitForSelector('.turn-banner.mine', { timeout: 120_000 });
      await page.waitForTimeout(2500);
      issues = await page.evaluate(measure, HAND);
      if (process.env.QA_SHOTS) await page.screenshot({ path: `${process.env.QA_SHOTS}/fit-${id}-${label.replace(/\s/g, '')}.png` });
    } catch (e) {
      issues = [`확인 못 함: ${e.message.split('\n')[0]}`];
    }
    if (issues.length) bad++;
    console.log(`${issues.length ? '✗' : '✓'} ${id} · ${label}${issues.length ? '\n    ' + issues.join('\n    ') : ''}`);
    await page.close();
  }
}
await browser.close();
console.log(`\n문제 ${bad}개`);
