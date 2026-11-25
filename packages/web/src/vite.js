// 게임 웹 공용 Vite 설정 (Vite가 Node로 직접 읽으므로 순수 JS)
import react from '@vitejs/plugin-react';
import { THEME_BOOT_SCRIPT } from '@bg/ui/theme-boot';
// Node 가 이 파일을 바로 읽으므로 TS 인 @bg/core 대신 JSON 표만 가져온다
import TAG_LABELS from '@bg/core/tag-labels.json' with { type: 'json' };
import { esc, gameFacts, gamePageSeo, headTags, injectHead, SITE } from './seo.js';

/**
 * /<id>/ 아래에서 서비스, 개발 서버는 게임 서버로 소켓·API 프록시,
 * index.html에 테마 깜빡임 방지 스크립트 주입.
 * opts.meta 를 주면 검색엔진·링크 미리보기용 <head>(제목·설명·대표 그림·JSON-LD)를 index.html 에 넣는다.
 * @param {string} id
 * @param {{ serverPort?: number, devPort?: number, meta?: import('@bg/core').GameMeta }} [opts]
 * @returns {import('vite').UserConfig}
 */
export function gameViteConfig(id, opts = {}) {
  const target = `http://localhost:${opts.serverPort ?? 3001}`;
  return {
    base: `/${id}/`,
    plugins: [react(), themeBootPlugin(), ...(opts.meta ? [gameSeoPlugin(opts.meta)] : [])],
    server: {
      port: opts.devPort ?? 5173,
      proxy: {
        [`/${id}/socket.io`]: { target, ws: true },
        [`/${id}/api`]: target,
      },
    },
  };
}

/** index.html <head> 맨 앞에 테마 스크립트 */
export function themeBootPlugin() {
  return { name: 'bg-theme-boot', transformIndexHtml: (html) => html.replace('<head>', `<head><script>${THEME_BOOT_SCRIPT}</script>`) };
}

/**
 * 게임 첫 화면의 <head> 와 <noscript> 소개 (자바스크립트를 안 돌리는 미리보기 봇·검색엔진용).
 * 방 주소(/<id>/r/코드)도 같은 index.html 을 쓰지만 canonical 이 /<id>/ 를 가리키고,
 * 서버가 X-Robots-Tag: noindex 를 붙인다 (packages/server/src/static.ts).
 * @param {import('@bg/core').GameMeta} meta
 */
export function gameSeoPlugin(meta) {
  return {
    name: 'bg-game-seo',
    transformIndexHtml(html) {
      const tags = headTags(gamePageSeo(meta, TAG_LABELS));
      const intro = [
        `<h1>${esc(meta.subtitle)} (${esc(meta.title)})</h1>`,
        `<p>${esc(meta.tagline)}</p>`,
        `<p>${esc(gameFacts(meta))}</p>`,
        ...meta.description.map((d) => `<p>${esc(d)}</p>`),
        `<p><a href="/games/${meta.id}">게임 소개 보기</a> · <a href="/">${esc(SITE.name)}의 다른 게임</a></p>`,
        '<p>이 게임은 자바스크립트를 켜야 할 수 있어요.</p>',
      ].join('');
      return injectHead(html, tags).replace('<div id="root"></div>', `<div id="root"></div>\n    <noscript>${intro}</noscript>`);
    },
  };
}
