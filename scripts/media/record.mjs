// README·포털 표지·게임 방법 모달용 시연 영상/GIF를 실제 앱을 돌려 녹화한다.
//
//   npm run build && npm run media                     # 전부
//   npm run media -- crown-march                       # 한 게임(또는 portal)만
//   npm run media -- crown-march:play                  # 한 장면만
//
// 필요한 것: ffmpeg, 크롬(Playwright 크로미움 또는 PW_CHROMIUM=크롬 경로)
// 출력: docs/media/<target>/{clips,gif}, apps/portal/public/covers/<id>.webp, games/<id>/web/public/guide/*.mp4
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { MEDIA, ORIGIN, ROOT, clipPath, findChromium, gif, run, sleep } from './lib.mjs';

/** 대상별 GIF [너비, fps, 앞에서 건너뛸 초] (README에서 그려지도록 파일당 약 8MB 이하), 표지로 쓸 장면, 게임 방법 영상 */
const TARGETS = {
  portal: { gifs: { tour: [960, 12] } },
  'expedition-lines': {
    gifs: { intro: [960, 12], lobby: [960, 15], play: [780, 10, 1.5], discard: [960, 12], results: [820, 10, 3], mobile: [390, 12] },
    cover: ['play', 10],
    guide: { lobby: 'lobby', play: 'play', discard: 'discard', results: 'results' },
  },
  'crown-march': {
    gifs: { intro: [960, 12], lobby: [960, 12], play: [880, 10], knight: [960, 15], ending: [880, 10], mobile: [390, 12] },
    cover: ['play', 12],
    guide: { lobby: 'lobby', play: 'move', knight: 'knight', ending: 'end' },
  },
};

const args = process.argv.slice(2);
const targets = args.length ? [...new Set(args.map((a) => a.split(':')[0]))] : Object.keys(TARGETS);
const scenesFor = (t) => args.filter((a) => a.startsWith(`${t}:`)).map((a) => a.split(':')[1]);

// 운영처럼 경로로 나누는 로컬 게이트웨이
const gw = spawn('node', ['scripts/local.mjs'], { cwd: ROOT, env: { ...process.env, PORT: new URL(ORIGIN).port }, stdio: ['ignore', 'ignore', 'inherit'] });
for (let i = 0; i < 80; i++) {
  try {
    if ((await fetch(`${ORIGIN}/readyz`)).ok) break;
  } catch {}
  await sleep(150);
}
mkdirSync(join(MEDIA, 'portal'), { recursive: true });
const browser = await chromium.launch({ executablePath: findChromium() });
try {
  for (const t of targets) {
    const scene = await import(`./scenes/${t}.mjs`);
    console.log(`▶ ${t}`);
    await scene.desktop(browser, scenesFor(t));
    await scene.mobile(browser, scenesFor(t));
  }
} finally {
  await browser.close();
  gw.kill('SIGTERM');
}

console.log('GIF·표지·게임 방법 영상…');
for (const t of targets) {
  const conf = TARGETS[t];
  const only = scenesFor(t);
  await Promise.all(
    Object.entries(conf.gifs)
      .filter(([n]) => (!only.length || only.includes(n)) && existsSync(clipPath(t, n)))
      .map(([n, [w, fps, skip = 0]]) => gif(t, n, w, fps, skip)),
  );
  if (conf.cover && existsSync(clipPath(t, conf.cover[0]))) {
    const covers = join(ROOT, 'apps/portal/public/covers');
    mkdirSync(covers, { recursive: true });
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(conf.cover[1]), '-i', clipPath(t, conf.cover[0]), '-frames:v', '1', '-vf', 'scale=1280:-1', '-q:v', '82', join(covers, `${t}.webp`)]);
  }
  for (const [n, out] of Object.entries(conf.guide ?? {})) {
    if (!existsSync(clipPath(t, n)) || (only.length && !only.includes(n))) continue;
    const dir = join(ROOT, `games/${t}/web/public/guide`);
    mkdirSync(dir, { recursive: true });
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', clipPath(t, n), '-vf', 'scale=960:-2:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(dir, `${out}.mp4`)]);
  }
}
console.log('done', readdirSync(MEDIA));
process.exit(0);
