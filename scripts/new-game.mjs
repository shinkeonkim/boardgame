// 새 게임 뼈대 만들기: node scripts/new-game.mjs <id> "<Title>" "<한국어 이름>" [devPort]
//   → games/<id>/{engine,server,web,deploy} 패키지·설정·배포 매니페스트 + release 워크플로.
//   규칙(engine/src)·화면(web/src)·meta.ts는 직접 채운다 (SKILL.md 3~5절).
// 셸에서 매니페스트를 만들 때 생긴 `$id:latest` 함정(SKILL 10절)을 피하려고 Node로 만든다.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [id, title, ko, devPortArg] = process.argv.slice(2);
if (!id || !/^[a-z][a-z0-9-]+$/.test(id) || !title || !ko) {
  console.error('사용법: node scripts/new-game.mjs <id> "<Title>" "<한국어 이름>" [devPort]');
  process.exit(1);
}
const root = new URL('../', import.meta.url).pathname;
const dir = join(root, 'games', id);
if (existsSync(dir)) {
  console.error(`이미 있어요: games/${id}`);
  process.exit(1);
}
const games = readdirSync(join(root, 'games'));
const devPort = Number(devPortArg ?? 5173 + games.length + 1);
const serverPort = 3001 + games.length + 1;

const files = {};
const tpl = (path) => readFileSync(join(root, 'games/crown-march', path), 'utf8').replaceAll('crown-march', id).replaceAll('Crown March', title);

files['engine/package.json'] = tpl('engine/package.json');
files['engine/tsconfig.json'] = tpl('engine/tsconfig.json');
files['server/package.json'] = tpl('server/package.json').replace('PORT=3002', `PORT=${serverPort}`);
files['server/tsconfig.json'] = tpl('server/tsconfig.json');
files['server/src/main.ts'] = `import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/${id}-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
`;
files['web/package.json'] = tpl('web/package.json');
files['web/tsconfig.json'] = tpl('web/tsconfig.json');
files['web/vite.config.ts'] = `import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('${id}', { serverPort: ${serverPort}, devPort: ${devPort} }));
`;
files['web/index.html'] = tpl('web/index.html').replace(/<title>.*<\/title>/, `<title>${title} · ${ko}</title>`);
files['web/src/main.tsx'] = tpl('web/src/main.tsx');
files['web/src/guide-entry.tsx'] = tpl('web/src/guide-entry.tsx');
for (const f of readdirSync(join(root, 'games/crown-march/deploy'))) {
  let s = tpl(`deploy/${f}`);
  if (f === 'kustomization.yaml') s = s.replace(/newTag: .*/, 'newTag: latest');
  files[`deploy/${f}`] = s;
}
for (const [p, s] of Object.entries(files)) {
  const full = join(dir, p);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, s);
}
mkdirSync(join(dir, 'engine/src'), { recursive: true });
mkdirSync(join(dir, 'web/public/guide'), { recursive: true });
const wf = readFileSync(join(root, '.github/workflows/release-crown-march.yml'), 'utf8').replaceAll('crown-march', id);
writeFileSync(join(root, `.github/workflows/release-${id}.yml`), wf);
console.log(`games/${id} 뼈대를 만들었어요 (dev ${devPort}, server ${serverPort}).
다음: engine/src(config·game·view·bot·module·index·테스트) → web/src(client·ConfigPanel·Game·Demo·guide·game.css) → meta.ts
      → favicon(web/favicon.svg, web/public/favicon.svg) → npm install → oh-my-homelab PR`);
