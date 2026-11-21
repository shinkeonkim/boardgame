import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('expedition-lines', { serverPort: 3001, devPort: 5173 }));
