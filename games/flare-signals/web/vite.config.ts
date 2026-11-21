import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('flare-signals', { serverPort: 3005, devPort: 5177 }));
