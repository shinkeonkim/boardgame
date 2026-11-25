// 검색엔진·SNS 미리보기용 <head> 태그. 포털(빌드 뒤 미리 그린 HTML)과 게임 앱(Vite 플러그인)이 같이 쓴다.
// Vite 설정·빌드 스크립트가 Node로 바로 읽으므로 순수 JS (+ JSDoc 타입).
//
// 왜 빌드 때 넣나: 카카오톡·슬랙·X 같은 링크 미리보기 봇은 자바스크립트를 실행하지 않아서,
// SPA가 실행 중에 바꾸는 title·meta는 보지 못한다. 주소마다 HTML에 처음부터 들어 있어야 한다.

/** @typedef {import('@bg/core').GameMeta} GameMeta */

export const SITE = {
  origin: 'https://boardgame.shinkeonkim.com',
  name: '보드게임 테이블',
  /** 영어 검색·미리보기용 보조 이름 */
  nameEn: 'Boardgame Table',
  locale: 'ko_KR',
  description: '설치 없이 친구들과 각자 휴대폰으로 바로 즐기는 무료 온라인 보드게임 모음. 방을 만들고 QR·링크로 초대하면 끝, 사람이 모자라면 봇이 함께해요.',
  image: '/og/home.png',
  imageAlt: '보드게임 테이블: 친구들과 각자 휴대폰으로 즐기는 온라인 보드게임',
  themeColor: '#f3ede3',
};

/** HTML 속성·본문에 넣을 글자 이스케이프 */
export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 절대 주소 (이미지·canonical은 절대 주소여야 미리보기 봇이 읽음) */
export const abs = (path) => (/^https?:\/\//.test(path) ? path : `${SITE.origin}${path.startsWith('/') ? '' : '/'}${path}`);

/** JSON-LD (</script> 가 섞여도 스크립트가 끊기지 않게 < 를 이스케이프) */
export const ldJson = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

/**
 * @typedef {{
 *   title: string,
 *   description: string,
 *   path: string,
 *   image?: string,
 *   imageAlt?: string,
 *   imageSize?: [number, number],
 *   type?: 'website' | 'article',
 *   robots?: string,
 *   keywords?: string[],
 *   jsonLd?: object[],
 * }} PageSeo
 */

/** 한 페이지의 <head> 태그 묶음 (title 포함) */
export function headTags(/** @type {PageSeo} */ p) {
  const url = abs(p.path);
  const image = abs(p.image ?? SITE.image);
  const [w, h] = p.imageSize ?? (p.image ? [1280, 720] : [1200, 630]);
  const alt = p.imageAlt ?? SITE.imageAlt;
  const tags = [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<meta name="robots" content="${esc(p.robots ?? 'index, follow, max-image-preview:large')}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    p.keywords?.length ? `<meta name="keywords" content="${esc(p.keywords.join(', '))}" />` : '',
    `<meta property="og:type" content="${p.type ?? 'website'}" />`,
    `<meta property="og:site_name" content="${esc(SITE.name)}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:title" content="${esc(p.title)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="${w}" />`,
    `<meta property="og:image:height" content="${h}" />`,
    `<meta property="og:image:alt" content="${esc(alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(p.title)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<meta name="twitter:image:alt" content="${esc(alt)}" />`,
    ...(p.jsonLd ?? []).map(ldJson),
  ];
  return tags.filter(Boolean).join('\n    ');
}

/** index.html 의 기존 <title>·description 을 지우고 새 태그를 </head> 앞에 넣는다 */
export function injectHead(html, tags) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
    .replace('</head>', `    ${tags}\n  </head>`);
}

const playersText = (g) => (g.players.min === g.players.max ? `${g.players.min}명` : `${g.players.min}~${g.players.max}명`);
const minutesText = (g) => (g.minutes.min === g.minutes.max ? `${g.minutes.min}분` : `${g.minutes.min}~${g.minutes.max}분`);

/** 게임 한 줄 요약: 인원 · 시간 · 원작 */
export function gameFacts(/** @type {GameMeta} */ g) {
  return [playersText(g), minutesText(g), g.bots === false ? '사람끼리만' : '봇과 함께', g.original ? `원작 ${g.original.ko}` : ''].filter(Boolean).join(' · ');
}

/** 검색에 쓰이는 낱말: 한국어 이름·영문 이름·원작·장르 */
export function gameKeywords(/** @type {GameMeta} */ g, tagLabels = {}) {
  return [
    g.subtitle,
    g.title,
    `${g.subtitle} 온라인`,
    g.original ? `${g.original.ko} 온라인` : '',
    g.original?.en ?? '',
    ...g.tags.map((t) => tagLabels[t]).filter(Boolean),
    '온라인 보드게임',
    '무료 보드게임',
  ].filter(Boolean);
}

/** 게임을 schema.org 로 (VideoGame: 브라우저에서 바로 하는 게임) */
export function gameJsonLd(/** @type {GameMeta} */ g, tagLabels = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: `${g.subtitle} (${g.title})`,
    alternateName: g.title,
    description: g.description.join(' '),
    url: abs(`/${g.id}/`),
    image: abs(`/covers/${g.id}.jpg`),
    inLanguage: 'ko',
    genre: g.tags.map((t) => tagLabels[t]).filter(Boolean),
    gamePlatform: ['Web browser', 'Mobile web'],
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any (web browser)',
    playMode: g.players.max > 1 ? (g.players.min === 1 ? ['SinglePlayer', 'MultiPlayer'] : 'MultiPlayer') : 'SinglePlayer',
    numberOfPlayers: { '@type': 'QuantitativeValue', minValue: g.players.min, maxValue: g.players.max },
    timeRequired: `PT${g.minutes.max}M`,
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'KRW', availability: 'https://schema.org/InStock' },
    isAccessibleForFree: true,
    ...(g.original ? { isBasedOn: { '@type': 'Game', name: `${g.original.ko} (${g.original.en})`, author: g.original.by } } : {}),
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.origin },
  };
}

/** 게임 앱 첫 화면(/<id>/) */
export function gamePageSeo(/** @type {GameMeta} */ g, tagLabels = {}) {
  return /** @type {PageSeo} */ ({
    title: `${g.subtitle} 온라인 · ${g.title} | ${SITE.name}`,
    description: `${g.tagline}. ${gameFacts(g)}. 설치 없이 방을 만들고 친구를 초대해 휴대폰으로 바로 해요.`,
    path: `/${g.id}/`,
    image: `/covers/${g.id}.jpg`,
    imageAlt: `${g.subtitle} 게임 화면`,
    keywords: gameKeywords(g, tagLabels),
    jsonLd: [gameJsonLd(g, tagLabels)],
  });
}
