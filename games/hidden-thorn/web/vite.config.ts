import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('hidden-thorn', { serverPort: 3012, devPort: 5184 }));
