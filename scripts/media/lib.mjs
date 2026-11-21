// 시연 녹화 공통 도구 — scripts/media/record.mjs 와 scenes/*.mjs 가 쓴다
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(new URL('../../packages/web/package.json', import.meta.url));
const { io } = require('socket.io-client');

export const ROOT = new URL('../../', import.meta.url).pathname;
export const MEDIA = join(ROOT, 'docs/media');
export const FPS = 30;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** 로컬 게이트웨이 주소 (record.mjs가 띄움) */
export const ORIGIN = `http://localhost:${process.env.MEDIA_PORT ?? 8099}`;

/** 게임 서버에 붙는 Socket.IO 클라이언트 (봇·그림자 소켓) */
export function gameSocket(gameId) {
  return io(ORIGIN, { path: `/${gameId}/socket.io`, transports: ['websocket'] });
}

/** 클립 저장 위치: docs/media/<target>/clips/<name>.mp4 */
export function clipPath(target, name) {
  const dir = join(MEDIA, target, 'clips');
  mkdirSync(dir, { recursive: true });
  return join(dir, `${name}.mp4`);
}

export function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}


export function findChromium() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  const def = chromium.executablePath();
  if (existsSync(def)) return undefined;
  // 설치된 Playwright 버전과 캐시된 브라우저 리비전이 다르면 캐시에서 가장 최신 것을 쓴다
  const cache = join(process.env.HOME ?? '', 'Library/Caches/ms-playwright');
  const revs = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1])) : [];
  for (const r of revs) {
    for (const p of [
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
      'chrome-linux/chrome',
    ]) {
      const full = join(cache, r, p);
      if (existsSync(full)) return full;
    }
  }
  return undefined;
}


/**
 * 녹화기: 2배 픽셀 스크린샷을 쉬지 않고 찍고(약 15fps), 찍은 시각으로 길이를 복원한다.
 * (CDP screencast는 기기 배율을 무시하고 CSS 픽셀 크기로만 보내 글자가 흐려져서 쓰지 않는다)
 */
export async function recorder(page, target, name, { width }) {
  const dir = join(tmpdir(), `bg-media-${target}-${name}-${process.pid}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const vp = page.viewportSize();
  const scale = width / vp.width;
  const frames = [];
  let running = true;
  const loop = (async () => {
    while (running && !page.isClosed()) {
      const t = Date.now() / 1000;
      try {
        const { data } = await cdp.send('Page.captureScreenshot', {
          format: 'jpeg',
          quality: 92,
          optimizeForSpeed: true,
          clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale },
        });
        const file = join(dir, `${String(frames.length).padStart(5, '0')}.jpg`);
        writeFileSync(file, Buffer.from(data, 'base64'));
        frames.push({ file, t });
      } catch {
        await sleep(30); // 페이지 이동 중
      }
    }
  })();
  const started = Date.now() / 1000;
  return {
    async stop() {
      const end = Date.now() / 1000;
      running = false;
      await loop;
      await cdp.detach();
      if (!frames.length) throw new Error(`no frames for ${name}`);
      // ffconcat: 각 프레임을 다음 프레임 시각까지 유지
      const lines = ['ffconcat version 1.0'];
      frames.forEach((f, i) => {
        const next = frames[i + 1]?.t ?? end;
        const from = i === 0 ? Math.min(f.t, started) : f.t;
        lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, next - from).toFixed(4)}`);
      });
      lines.push(`file '${frames[frames.length - 1].file}'`);
      const list = join(dir, 'list.txt');
      writeFileSync(list, lines.join('\n'));
      const mp4 = clipPath(target, name);
      await run('ffmpeg', [
        '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
        '-vf', `fps=${FPS},scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos`,
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        mp4,
      ]);
      rmSync(dir, { recursive: true, force: true });
      console.log(`  ${name}: ${(end - started).toFixed(1)}s, ${frames.length} frames → ${mp4}`);
      return mp4;
    },
  };
}


export async function gif(target, name, width, fps = 15, skip = 0) {
  // 글자가 뭉개지지 않게: 256색 팔레트 + sierra 디더 (예전: 128색·bayer·12fps·720px)
  const filters = `fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`;
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(skip), '-i', clipPath(target, name), '-lavfi', filters, '-loop', '0', (mkdirSync(join(MEDIA, target, 'gif'), { recursive: true }), join(MEDIA, target, 'gif', `${name}.gif`))]);
}


/** 헤드리스에는 마우스 커서가 안 보이므로 가짜 커서와 탭 표시를 그린다 */
export const CURSOR_SCRIPT = `
  addEventListener('DOMContentLoaded', () => {
    const touch = matchMedia('(pointer: coarse)').matches;
    const c = document.createElement('div');
    c.id = '__cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);transition:opacity .2s;' + (touch ? 'display:none' : '');
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.6-3.6 6.9z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const style = document.createElement('style');
    style.textContent = '@keyframes __tap{from{transform:translate(-50%,-50%) scale(.3);opacity:.7}to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}' +
      '.__tap{position:fixed;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(30,30,30,.35);pointer-events:none;z-index:2147483646;animation:__tap .45s ease-out forwards}';
    document.head.appendChild(style);
    addEventListener('pointermove', (e) => { c.style.transform = 'translate(' + (e.clientX - 3) + 'px,' + (e.clientY - 2) + 'px)'; }, true);
    addEventListener('pointerdown', (e) => {
      const t = document.createElement('div');
      t.className = '__tap'; t.style.left = e.clientX + 'px'; t.style.top = e.clientY + 'px';
      document.body.appendChild(t); setTimeout(() => t.remove(), 500);
    }, true);
  });
  try { localStorage.setItem('bg:mute', '1'); } catch {}
`;


export async function center(page, selector) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`not visible: ${selector}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
export async function glide(page, selector, steps = 18) {
  const p = await center(page, selector);
  await page.mouse.move(p.x, p.y, { steps });
  return p;
}
export async function clickAt(page, selector, pause = 250) {
  await glide(page, selector);
  await sleep(pause);
  await page.mouse.down();
  await sleep(60);
  await page.mouse.up();
}
export async function typeSlow(page, text) {
  for (const ch of text) {
    await page.keyboard.type(ch);
    await sleep(110);
  }
}
export async function waitFor(fn, timeout = 30_000, label = 'condition') {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await fn()) return;
    await sleep(50);
  }
  throw new Error(`timeout waiting for ${label}`);
}
