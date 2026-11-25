// 새 게임 뼈대 만들기: 패키지·tsconfig·서버 입구·웹 입구·배포(kustomize)·릴리스 워크플로를 기존 게임에서 복사해 이름만 바꾼다.
//   node scripts/new-game.mjs <id> "<Title>" "<한국어 제목>"
// 규칙·화면(engine/src, web/src 의 Game·theme·guide 등)과 meta.ts 는 직접 쓴다 (.claude/skills/new-boardgame/SKILL.md 3~5절, 체크리스트 11절).
// 포트는 지금 쓰는 가장 큰 서버·개발 포트 + 1 (게임 수로 셈하면 겹쳤음). meta 를 vite 설정에 넘겨 검색용 head 도 만든다.
// 그다음: npm install (워크스페이스 연결) · oh-my-homelab 에 ArgoCD Application(boardgame-<id>) PR
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [id, title, ko] = process.argv.slice(2);
if (!id || !/^[a-z][a-z0-9-]+$/.test(id) || !title || !ko) throw new Error('usage: node scripts/new-game.mjs <id> "<Title>" "<한국어 제목>"');
if (existsSync(`games/${id}`)) throw new Error(`games/${id} 가 이미 있어요`);

const FROM = 'hidden-thorn';
// 다음 포트: 지금 쓰는 서버·개발 포트 중 가장 큰 것 + 1
const ports = readdirSync('games')
  .filter((g) => existsSync(`games/${g}/web/vite.config.ts`))
  .map((g) => readFileSync(`games/${g}/web/vite.config.ts`, 'utf8').match(/serverPort: (\d+), devPort: (\d+)/))
  .filter(Boolean)
  .map((m) => [Number(m[1]), Number(m[2])]);
const serverPort = Math.max(...ports.map((p) => p[0])) + 1;
const devPort = Math.max(...ports.map((p) => p[1])) + 1;

const swap = (s) => s.replaceAll(FROM, id).replaceAll('Hidden Thorn', title).replaceAll('숨은 가시', ko).replaceAll('3012', String(serverPort)).replaceAll('5184', String(devPort));
const files = [
  'engine/package.json',
  'engine/tsconfig.json',
  'server/package.json',
  'server/tsconfig.json',
  'server/src/main.ts',
  'web/package.json',
  'web/tsconfig.json',
  'web/index.html',
  'web/vite.config.ts',
  'web/src/main.tsx',
  'web/src/guide-entry.tsx',
  'deploy/deployment.yaml',
  'deploy/ingress.yaml',
  'deploy/kustomization.yaml',
  'deploy/namespace.yaml',
  'deploy/service.yaml',
  'deploy/servicemonitor.yaml',
];
for (const f of files) {
  const out = `games/${id}/${f}`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, swap(readFileSync(`games/${FROM}/${f}`, 'utf8')));
}
// 이미지 태그는 첫 릴리스가 채움
const kz = `games/${id}/deploy/kustomization.yaml`;
writeFileSync(kz, readFileSync(kz, 'utf8').replace(/newTag: .*/, 'newTag: latest'));
mkdirSync(`games/${id}/web/public`, { recursive: true });
mkdirSync(`games/${id}/engine/src`, { recursive: true });
mkdirSync(`games/${id}/web/src`, { recursive: true });
writeFileSync(`.github/workflows/release-${id}.yml`, swap(readFileSync(`.github/workflows/release-${FROM}.yml`, 'utf8')));
console.log(`games/${id} · 서버 ${serverPort} · 개발 ${devPort}`);
