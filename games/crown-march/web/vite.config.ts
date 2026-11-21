import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('crown-march', { serverPort: 3002, devPort: 5174 }));
