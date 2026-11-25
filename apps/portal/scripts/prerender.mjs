// 포털 빌드 뒤 실행: games/*/meta.ts 를 모아 prerender-lib.ts 를 esbuild 로 묶어 돌린다.
//   node apps/portal/scripts/prerender.mjs   (npm run build -w @bg/portal 이 자동으로 부름)
import { build } from 'esbuild';
import { readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const ids = readdirSync(join(root, 'games')).filter((d) => existsSync(join(root, 'games', d, 'meta.ts')));
const entry = [
  `import { prerender } from ${JSON.stringify(join(here, 'prerender-lib.ts'))};`,
  ...ids.map((id, i) => `import { meta as m${i} } from ${JSON.stringify(join(root, 'games', id, 'meta.ts'))};`),
  `const r = prerender([${ids.map((_, i) => `m${i}`).join(', ')}], ${JSON.stringify(join(root, 'apps/portal/dist'))});`,
  'console.log(`prerender: 페이지 ${r.pages}개 · 사이트맵 주소 ${r.urls}개`);',
].join('\n');
const out = join(here, '.prerender.mjs');
await build({ stdin: { contents: entry, resolveDir: here, loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'warning' });
try {
  await import(pathToFileURL(out).href);
} finally {
  rmSync(out, { force: true });
}
