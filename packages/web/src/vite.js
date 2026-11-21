// 게임 웹 공용 Vite 설정 (Vite가 Node로 직접 읽으므로 순수 JS)
import react from '@vitejs/plugin-react';
import { THEME_BOOT_SCRIPT } from '@bg/ui/theme-boot';

/**
 * /<id>/ 아래에서 서비스, 개발 서버는 게임 서버로 소켓·API 프록시,
 * index.html에 테마 깜빡임 방지 스크립트 주입.
 * @param {string} id
 * @param {{ serverPort?: number, devPort?: number }} [opts]
 * @returns {import('vite').UserConfig}
 */
export function gameViteConfig(id, opts = {}) {
  const target = `http://localhost:${opts.serverPort ?? 3001}`;
  return {
    base: `/${id}/`,
    plugins: [react(), themeBootPlugin()],
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
