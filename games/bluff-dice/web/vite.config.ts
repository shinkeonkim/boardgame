import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('bluff-dice', { serverPort: 3007, devPort: 5179 }));
