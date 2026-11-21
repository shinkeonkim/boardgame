import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('cipher-ops', { serverPort: 3006, devPort: 5178 }));
