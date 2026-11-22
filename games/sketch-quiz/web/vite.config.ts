import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('sketch-quiz', { serverPort: 3024, devPort: 5196 }));
