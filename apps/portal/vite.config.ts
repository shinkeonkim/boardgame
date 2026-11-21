import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { THEME_BOOT_SCRIPT } from '@bg/ui/theme-boot';

// 포털은 도메인 루트(/)에서 서비스. 게임은 각자 /<id>/ 에서 따로 배포된다.
export default defineConfig({
  plugins: [react(), { name: 'bg-theme-boot', transformIndexHtml: (html) => html.replace('<head>', `<head><script>${THEME_BOOT_SCRIPT}</script>`) }],
  server: { port: 5170 },
});
