import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('yacht', { serverPort: 3018, devPort: 5190 }));
