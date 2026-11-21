import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('sealed-letter', { serverPort: 3009, devPort: 5181 }));
