// 모든 워크스페이스(packages/*, games/*/*, apps/*)의 tsconfig로 타입 검사
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dirs = [];
const sub = (p) => (existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => join(p, d.name)) : []);
dirs.push(...sub('packages'), ...sub('apps'));
for (const g of sub('games')) dirs.push(...sub(g));
let failed = 0;
for (const d of dirs.filter((d) => existsSync(join(d, 'tsconfig.json')))) {
  try {
    execFileSync('npx', ['tsc', '-p', d], { stdio: 'inherit' });
    console.log(`✓ ${d}`);
  } catch {
    failed++;
    console.log(`✗ ${d}`);
  }
}
process.exit(failed ? 1 : 0);
