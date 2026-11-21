// 배포 묶음 만들기: node scripts/bundle.mjs <portal|게임id>  →  out/<target>/{server.cjs, web/}
// Dockerfile이 이것만 실행해서 런타임 이미지에 복사한다 (서버는 의존성까지 한 파일로 번들됨)
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';

const target = process.argv[2];
if (!target) throw new Error('usage: node scripts/bundle.mjs <portal|game-id>');
const run = (...args) => execFileSync('npm', args, { stdio: 'inherit' });
const out = `out/${target}`;
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

if (target === 'portal') {
  run('run', 'build', '-w', '@bg/portal');
  cpSync('apps/portal/dist-server/server.cjs', `${out}/server.cjs`);
  cpSync('apps/portal/dist', `${out}/web`, { recursive: true });
} else {
  if (!existsSync(`games/${target}`)) throw new Error(`no such game: ${target}`);
  run('run', 'build', '-w', `@bg/${target}-web`, '-w', `@bg/${target}-server`);
  cpSync(`games/${target}/server/dist/server.cjs`, `${out}/server.cjs`);
  cpSync(`games/${target}/web/dist`, `${out}/web`, { recursive: true });
}
console.log(`bundled ${target} → ${out}`);
