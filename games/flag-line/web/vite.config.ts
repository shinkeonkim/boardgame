import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('flag-line', { serverPort: 3013, devPort: 5185 }));
