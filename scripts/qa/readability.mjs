// 숫자·글자 가독성 검사: 게임마다 봇과 한 판을 시작해 화면의 숫자 표시를 하나씩 재 본다.
//   npm run build && npm run local  (다른 창)
//   node scripts/qa/readability.mjs [게임id …]
// 잡는 것:
//   - 글자색과 그 자리의 배경(실제 화면 픽셀에서 가장 많은 색) 대비가 3:1 미만 → 칩·그림 위에 얹은 숫자가 묻힘
//   - 실제 화면 크기가 10px 미만인 글자
// 그림(SVG·그라디언트) 위 글자도 픽셀로 재므로 CSS 값만 보는 검사보다 정확하다.
// 어두운 외곽선(text-shadow 2겹 이상, 진한 색)이 있는 글자는 그림 위에서도 읽히므로 대비 검사를 건너뛴다.
// 누를 수 없는 버튼(disabled)도 건너뛴다.
import { readdirSync } from 'node:fs';
import { PNG } from 'pngjs';
import { chromium } from 'playwright';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:8099';
const ALL = readdirSync(new URL('../../games/', import.meta.url)).filter((g) => !g.startsWith('.'));
const BOTS = { 'cipher-ops': 3, 'flag-line': 1, 'crown-march': 1, 'expedition-lines': 1, 'secret-mission': 6 };
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
let total = 0;
for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
  try {
    await page.goto(`${ORIGIN}/${id}/`);
    await page.fill('input[placeholder="예: 민지"]', '검사');
    await page.click('button:has-text("방 만들기")');
    await page.waitForSelector('text=빈자리에 봇 넣기');
    for (let i = 0; i < (BOTS[id] ?? 2); i++) {
      await page.click('button.bot-btn:has-text("보통")');
      await page.waitForTimeout(120);
    }
    await page.click('button:has-text("게임 시작하기")');
    await page.waitForSelector('.page.game', { timeout: 10000 });
    await page.waitForTimeout(4000);
    // 숫자가 들어 있는 글자 요소 (자기 글자 노드 기준) — 위치·글자색·실제 크기
    const items = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.querySelector('.page.game'), NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = n.textContent.trim();
        if (!/\d/.test(text) || text.length > 12) continue;
        const el = n.parentElement;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
        if (el.closest('button:disabled')) continue;
        // 진한 외곽선: rgba(…, 0.5 이상) 그림자가 두 겹 이상
        // 외곽선: 글자색과 밝기가 크게 다른 진한(불투명도 0.5 이상) 그림자가 두 겹 이상
        const ink = cs.color.match(/[\d.]+/g).map(Number);
        const halo = (cs.textShadow.match(/rgba?\(\s*\d+,\s*\d+,\s*\d+(?:,\s*([\d.]+))?\)/g) ?? []).filter((c) => {
          const v = c.match(/[\d.]+/g).map(Number);
          return Math.abs(v[0] + v[1] + v[2] - (ink[0] + ink[1] + ink[2])) > 380 && (v[3] ?? 1) >= 0.5;
        }).length >= 2;
        const range = document.createRange();
        range.selectNodeContents(n);
        const r = range.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
        // 실제 화면 글자 크기 = 글자 상자 높이 기준
        const m = cs.color.match(/[\d.]+/g).map(Number);
        out.push({ text, x: r.left, y: r.top, w: r.width, h: r.height, color: m.slice(0, 3), px: r.height * 0.78, halo, cls: `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`, path: el.closest('[class]')?.className?.toString().slice(0, 40) });
      }
      return out;
    });
    const png = PNG.sync.read(await page.screenshot());
    const at = (x, y) => {
      const i = (Math.min(png.height - 1, Math.max(0, y)) * png.width + Math.min(png.width - 1, Math.max(0, x))) * 4;
      return [png.data[i], png.data[i + 1], png.data[i + 2]];
    };
    const problems = [];
    for (const it of items) {
      // 글자 상자 안 픽셀 중 글자색과 거리가 먼 것들의 최빈색 = 배경
      const counts = new Map();
      for (let y = Math.round(it.y); y < it.y + it.h; y += 1)
        for (let x = Math.round(it.x); x < it.x + it.w; x += 1) {
          const p = at(x, y);
          const d = Math.abs(p[0] - it.color[0]) + Math.abs(p[1] - it.color[1]) + Math.abs(p[2] - it.color[2]);
          if (d < 90) continue;
          const k = p.map((v) => v >> 4).join(',');
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      if (!top) continue;
      const bg = top[0].split(',').map((v) => Number(v) * 16 + 8);
      const cr = contrast(it.color, bg);
      if ((cr < 3 && !it.halo) || it.px < 10) problems.push({ ...it, cr: Math.round(cr * 10) / 10 });
    }
    // 같은 요소 종류는 한 번만
    const seen = new Set();
    const uniq = problems.filter((p) => !seen.has(p.cls) && seen.add(p.cls));
    total += uniq.length;
    console.log(`${uniq.length ? '✗' : '✓'} ${id}${uniq.length ? `: ${uniq.length}종` : ''}`);
    for (const p of uniq) console.log(`    「${p.text}」 ${p.cls} — 대비 ${p.cr}:1${p.px < 10 ? ` · 글자 ${p.px.toFixed(1)}px` : ''}`);
  } catch (e) {
    console.log(`! ${id} ${e.message.split('\n')[0]}`);
  }
  await page.close();
}
await browser.close();
console.log(total ? `\n가독성 문제 ${total}종` : '\n문제 없음');
process.exit(0);
