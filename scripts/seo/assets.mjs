// 검색·공유용 그림 만들기 (한 번 돌려서 결과를 저장소에 넣는다)
//   node scripts/seo/assets.mjs
//   → apps/portal/public/og/home.png (1200×630, 링크 미리보기)
//     apps/portal/public/icons/{icon-192,icon-512,icon-512-maskable,apple-touch-icon}.png
import { mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { findChromium } from '../media/lib.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const PUB = join(ROOT, 'apps/portal/public');
mkdirSync(join(PUB, 'og'), { recursive: true });
mkdirSync(join(PUB, 'icons'), { recursive: true });
const svg = readFileSync(join(PUB, 'favicon.svg'), 'utf8');
const b = await chromium.launch({ executablePath: findChromium() });

// 아이콘: maskable 은 안전 영역(가운데 80%) 안에 그림이 오도록 여백을 둠
for (const [name, size, pad, bg] of [
  ['icon-192', 192, 0, 'transparent'],
  ['icon-512', 512, 0, 'transparent'],
  ['icon-512-maskable', 512, 0.14, '#1b1a17'],
  ['apple-touch-icon', 180, 0.08, '#1b1a17'],
]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  const inner = Math.round(size * (1 - pad * 2));
  await p.setContent(`<html><body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${bg}">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body></html>`);
  await p.screenshot({ path: join(PUB, 'icons', `${name}.png`), omitBackground: bg === 'transparent' });
  await p.close();
}

// 대표 그림: 왼쪽 문구 + 오른쪽 게임 표지 모자이크
const covers = readdirSync(join(PUB, 'covers')).filter((f) => /^[a-z-]+\.jpg$/.test(f) && !f.includes('-play'));
const pick = ['gem-guild', 'yacht', 'expedition-lines', 'row-six', 'holdem', 'secret-mission', 'tile-atelier', 'one-card', 'crown-march']
  .map((id) => `${id}.jpg`)
  .filter((f) => covers.includes(f));
const count = readdirSync(join(ROOT, 'games')).filter((d) => existsSync(join(ROOT, 'games', d, 'meta.ts')) && readFileSync(join(ROOT, 'games', d, 'meta.ts'), 'utf8').includes("status: 'live'")).length;
const img = (f) => `data:image/jpeg;base64,${readFileSync(join(PUB, 'covers', f)).toString('base64')}`;
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.setContent(`<!doctype html><html><head><style>
  body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:'Apple SD Gothic Neo','Pretendard','Noto Sans KR',sans-serif;background:#f3ede3;color:#1b1a17}
  .wrap{display:grid;grid-template-columns:520px 1fr;height:100%}
  .copy{padding:64px 0 56px 64px;display:flex;flex-direction:column;justify-content:space-between;position:relative;z-index:2}
  .brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:28px}
  h1{font-size:54px;line-height:1.14;margin:0;letter-spacing:-0.03em;word-break:keep-all}
  h1 em{font-style:normal;color:#c4612a}
  p{font-size:25px;margin:18px 0 0;color:#5b5248;line-height:1.45}
  .chips{display:flex;gap:10px;flex-wrap:wrap}
  .chips span{background:#1b1a17;color:#f3ede3;border-radius:999px;padding:9px 18px;font-size:20px;font-weight:700}
  .mosaic{position:relative;transform:rotate(-8deg) translate(10px,-40px);display:grid;grid-template-columns:repeat(3,250px);gap:16px}
  .mosaic img{width:250px;height:141px;object-fit:cover;border-radius:16px;box-shadow:0 14px 30px rgba(60,40,20,.28);border:3px solid #fffaf1}
  .mosaic img:nth-child(3n+2){transform:translateY(40px)}
  .fade{position:absolute;inset:0;background:linear-gradient(90deg,#f3ede3 40%,rgba(243,237,227,0) 58%);z-index:1}
</style></head><body><div class="wrap"><div class="copy">
  <div class="brand">${svg.replace('<svg ', '<svg width="54" height="54" ')}보드게임 테이블</div>
  <div><h1>친구들과 각자 폰으로<br><em>같이 하는 보드게임</em></h1><p>설치·가입 없이 방을 만들고 QR로 초대해요.<br>사람이 모자라면 봇이 함께해요.</p></div>
  <div class="chips"><span>무료 ${count}종</span><span>2~8명</span><span>봇 대전</span></div>
</div><div style="position:relative;overflow:hidden"><div class="mosaic">${pick.map((f) => `<img src="${img(f)}">`).join('')}</div></div></div><div class="fade"></div></body></html>`);
await p.waitForTimeout(300);
await p.screenshot({ path: join(PUB, 'og/home.png') });
await b.close();
console.log('ok: og/home.png · icons/*.png');
