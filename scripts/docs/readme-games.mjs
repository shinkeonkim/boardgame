// README의 게임 표·미리보기를 games/*/meta.ts 에서 다시 만든다 (게임을 추가하면 이것만 돌리면 됨):
//   node scripts/docs/readme-games.mjs        → README.md 의 <!-- games:start --> … <!-- games:end -->, <!-- gallery:start --> … 교체
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;
const SITE = 'https://boardgame.shinkeonkim.com';

const games = [];
for (const id of readdirSync(join(ROOT, 'games'))) {
  const metaPath = join(ROOT, 'games', id, 'meta.ts');
  if (!existsSync(metaPath)) continue;
  const { meta } = await import(metaPath); // Node가 타입만 지우고 읽음
  if (meta.status !== 'live') continue;
  const mod = join(ROOT, 'games', id, 'engine/src/module.ts');
  const noBots = existsSync(mod) && /\bbots:\s*false/.test(readFileSync(mod, 'utf8'));
  games.push({ ...meta, noBots, gif: existsSync(join(ROOT, 'docs/media', id, 'gif/play.gif')) });
}

/** 큰 갈래: 먼저 맞는 것 하나 */
const GROUPS = [
  ['주사위', (g) => g.tags.includes('dice')],
  ['단어 · 그림', (g) => g.tags.some((t) => ['word', 'drawing'].includes(t))],
  ['블러핑 · 추리', (g) => g.tags.some((t) => ['bluffing', 'deduction'].includes(t))],
  ['전략 · 퍼즐', (g) => g.tags.some((t) => ['tile-placement', 'spatial', 'pattern', 'grid-movement', 'engine-building'].includes(t))],
  ['카드', () => true],
];
const groupOf = (g) => GROUPS.find(([, f]) => f(g))[0];
const range = (a, b) => (a === b ? `${a}` : `${a}~${b}`);
const players = (g) => (g.id === 'flag-line' ? '2·4(팀)' : range(g.players.min, g.players.max));

let table = '';
for (const [name] of GROUPS) {
  const list = games.filter((g) => groupOf(g) === name).sort((a, b) => a.title.localeCompare(b.title));
  if (!list.length) continue;
  table += `\n**${name}**\n\n| 게임 | 원작 | 인원 | 시간 | 봇 | 한 줄 소개 |\n|---|---|---|---|---|---|\n`;
  for (const g of list)
    table += `| [${g.title} · ${g.subtitle}](${SITE}/games/${g.id}) | ${g.original?.ko ?? '—'} | ${players(g)} | ${range(g.minutes.min, g.minutes.max)}분 | ${g.noBots ? '사람끼리' : '○'} | ${g.tagline} |\n`;
}
table += `\n모두 ${games.length}종. 규칙 메커니즘은 고전 보드게임에서 빌려 왔고, 이름·그림·화면은 직접 만들었다 (원작 이름은 팬 제작 표시로만 쓴다).\n`;

const withGif = games.filter((g) => g.gif && !['expedition-lines', 'crown-march'].includes(g.id)).sort((a, b) => a.title.localeCompare(b.title));
let gallery = '\n| | |\n|---|---|\n';
for (let i = 0; i < withGif.length; i += 2) {
  const cell = (g) => (g ? `**${g.title} · ${g.subtitle}**<br><img src="docs/media/${g.id}/gif/play.gif" alt="${g.title} 플레이" width="420">` : '');
  gallery += `| ${cell(withGif[i])} | ${cell(withGif[i + 1])} |\n`;
}

let readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const put = (key, body) => {
  const re = new RegExp(`<!-- ${key}:start -->[\\s\\S]*?<!-- ${key}:end -->`);
  if (!re.test(readme)) throw new Error(`README에 <!-- ${key}:start --> 표시가 없어요`);
  readme = readme.replace(re, `<!-- ${key}:start -->\n${body}\n<!-- ${key}:end -->`);
};
put('games', table);
put('gallery', gallery);
writeFileSync(join(ROOT, 'README.md'), readme);
console.log(`README: 게임 ${games.length}종, 미리보기 ${withGif.length}개`);
