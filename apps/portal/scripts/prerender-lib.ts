/**
 * 포털 빌드 뒤 주소마다 HTML 을 미리 그린다 (prerender.mjs 가 esbuild 로 묶어 실행).
 *  - dist/index.html            홈
 *  - dist/games/index.html      게임 찾기
 *  - dist/games/<id>/index.html 게임 소개
 *  - dist/design · dist/admin   검색 제외(noindex)
 *  - dist/sitemap.xml · robots.txt · site.webmanifest
 * 화면은 그대로 React 가 그리고, 여기서는 <head>(제목·설명·대표 그림·JSON-LD)와
 * 자바스크립트를 안 돌리는 봇을 위한 <noscript> 소개만 채운다. 서버(static.ts)가 디렉터리의 index.html 을 먼저 준다.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GameMeta } from '@bg/core';
import TAG_LABELS from '../../../packages/core/src/tag-labels.json';
import { SITE, abs, esc, gameFacts, gameJsonLd, gameKeywords, headTags, injectHead, type PageSeo } from '../../../packages/web/src/seo.js';

const ORIGINAL_NOTE = '원작의 규칙을 바탕으로 이름·그림·화면을 직접 만든 팬 제작 버전이에요. 원작 및 권리자와는 관계가 없어요.';

function page(template: string, seo: PageSeo, noscript: string): string {
  return injectHead(template, headTags(seo)).replace('<div id="root"></div>', `<div id="root"></div>\n    <noscript>${noscript}</noscript>`);
}

function write(dir: string, rel: string, body: string) {
  const file = join(dir, rel);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, body);
}

const gameLink = (g: GameMeta) => `<li><a href="/games/${g.id}">${esc(g.subtitle)} (${esc(g.title)})</a>: ${esc(g.tagline)} · ${esc(gameFacts(g))}</li>`;

export function prerender(games: GameMeta[], distDir: string) {
  const template = readFileSync(join(distDir, 'index.html'), 'utf8');
  const live = games.filter((g) => g.status === 'live').sort((a, b) => a.subtitle.localeCompare(b.subtitle, 'ko'));
  const count = live.length;

  // 홈
  const homeTitle = `${SITE.name} · 친구들과 휴대폰으로 하는 무료 온라인 보드게임 ${count}종`;
  write(
    distDir,
    'index.html',
    page(
      template,
      {
        title: homeTitle,
        description: SITE.description,
        path: '/',
        keywords: ['온라인 보드게임', '무료 보드게임', '모바일 보드게임', '친구랑 하는 게임', '파티 게임', ...live.slice(0, 12).map((g) => g.subtitle)],
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE.name,
            alternateName: SITE.nameEn,
            url: abs('/'),
            inLanguage: 'ko',
            description: SITE.description,
            potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${abs('/games')}?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${SITE.name} 게임 목록`,
            numberOfItems: count,
            itemListElement: live.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/games/${g.id}`), name: `${g.subtitle} (${g.title})` })),
          },
        ],
      },
      `<h1>${esc(SITE.name)}</h1><p>${esc(SITE.description)}</p><h2>게임 ${count}종</h2><ul>${live.map(gameLink).join('')}</ul><p><a href="/games">게임 찾기</a></p>`,
    ),
  );

  // 게임 찾기
  write(
    distDir,
    'games/index.html',
    page(
      template,
      {
        title: `게임 찾기 · 인원·시간·장르로 고르는 온라인 보드게임 ${count}종 | ${SITE.name}`,
        description: `2명부터 여럿이까지, 10분 게임부터 전략 게임까지. 인원·시간·난이도·장르로 오늘 할 보드게임을 골라요. 모두 무료, 설치 없이 휴대폰으로.`,
        path: '/games',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: '게임 찾기',
            url: abs('/games'),
            inLanguage: 'ko',
            mainEntity: { '@type': 'ItemList', itemListElement: live.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/games/${g.id}`), name: g.subtitle })) },
          },
          breadcrumbs([['홈', '/'], ['게임 찾기', '/games']]),
        ],
      },
      `<h1>게임 찾기</h1><ul>${live.map(gameLink).join('')}</ul>`,
    ),
  );

  // 게임 소개
  for (const g of live) {
    const labels = g.tags.map((t) => (TAG_LABELS as Record<string, string>)[t]).filter(Boolean);
    write(
      distDir,
      `games/${g.id}/index.html`,
      page(
        template,
        {
          title: `${g.subtitle} (${g.title}) 규칙·인원·하는 법 | ${SITE.name}`,
          description: `${g.tagline}. ${gameFacts(g)}. ${g.description[0] ?? ''}`.slice(0, 300),
          path: `/games/${g.id}`,
          image: `/covers/${g.id}.jpg`,
          imageAlt: `${g.subtitle} 게임 화면`,
          keywords: gameKeywords(g, TAG_LABELS as Record<string, string>),
          jsonLd: [gameJsonLd(g, TAG_LABELS as Record<string, string>), breadcrumbs([['홈', '/'], ['게임 찾기', '/games'], [g.subtitle, `/games/${g.id}`]])],
        },
        [
          `<h1>${esc(g.subtitle)} (${esc(g.title)})</h1>`,
          `<p>${esc(g.tagline)}</p>`,
          `<p>${esc(gameFacts(g))}${labels.length ? ` · ${esc(labels.join(', '))}` : ''}</p>`,
          ...g.description.map((d) => `<p>${esc(d)}</p>`),
          g.highlights.length ? `<h2>이런 점이 재밌어요</h2><ul>${g.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : '',
          g.customizable.length ? `<h2>바꿀 수 있는 규칙</h2><ul>${g.customizable.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : '',
          g.original ? `<p>원작: ${esc(`${g.original.ko} (${g.original.en} · ${g.original.by})`)}. ${esc(ORIGINAL_NOTE)}</p>` : '',
          `<p><a href="/${g.id}/">지금 플레이하기</a> · <a href="/games">다른 게임 찾기</a></p>`,
        ].join(''),
      ),
    );
  }

  // 검색에 나오지 않아도 되는 화면
  for (const [rel, title] of [
    ['design/index.html', '디자인 시스템'],
    ['admin/index.html', '관리자'],
  ] as const) {
    write(distDir, rel, page(template, { title: `${title} · ${SITE.name}`, description: SITE.description, path: `/${rel.split('/')[0]}`, robots: 'noindex, nofollow' }, ''));
  }

  // 사이트맵: 포털 페이지 + 각 게임 앱 첫 화면
  const today = new Date().toISOString().slice(0, 10);
  const urls: { loc: string; lastmod: string; priority: string; changefreq: string }[] = [
    { loc: abs('/'), lastmod: today, priority: '1.0', changefreq: 'weekly' },
    { loc: abs('/games'), lastmod: today, priority: '0.9', changefreq: 'weekly' },
    ...live.flatMap((g) => [
      { loc: abs(`/games/${g.id}`), lastmod: g.addedAt, priority: '0.8', changefreq: 'monthly' },
      { loc: abs(`/${g.id}/`), lastmod: g.addedAt, priority: '0.7', changefreq: 'monthly' },
    ]),
  ];
  write(
    distDir,
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls
      .map((u) => {
        const id = live.find((g) => u.loc.endsWith(`/games/${g.id}`))?.id;
        const img = id ? `\n    <image:image><image:loc>${abs(`/covers/${id}.jpg`)}</image:loc></image:image>` : '';
        return `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>${img}\n  </url>`;
      })
      .join('\n')}\n</urlset>\n`,
  );
  write(
    distDir,
    'robots.txt',
    ['# 보드게임 테이블', 'User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /admin/', '# 방 주소는 금방 사라지고 남의 방이라 검색에서 뺀다', 'Disallow: /*/r/', '', `Sitemap: ${abs('/sitemap.xml')}`, ''].join('\n'),
  );
  write(
    distDir,
    'site.webmanifest',
    JSON.stringify(
      {
        name: SITE.name,
        short_name: '보드게임',
        description: SITE.description,
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: SITE.themeColor,
        theme_color: SITE.themeColor,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      null,
      2,
    ),
  );
  return { pages: live.length + 4, urls: urls.length };
}

function breadcrumbs(items: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
  };
}
