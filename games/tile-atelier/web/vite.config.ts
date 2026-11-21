import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('tile-atelier', { serverPort: 3015, devPort: 5187 }));
