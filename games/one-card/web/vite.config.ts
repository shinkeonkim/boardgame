import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('one-card', { serverPort: 3020, devPort: 5192 }));
