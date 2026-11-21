import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('court-intrigue', { serverPort: 3010, devPort: 5182 }));
