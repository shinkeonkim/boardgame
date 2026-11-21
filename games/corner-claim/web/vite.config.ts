import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('corner-claim', { serverPort: 3016, devPort: 5188 }));
