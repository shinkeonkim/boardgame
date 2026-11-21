import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('number-runs', { serverPort: 3017, devPort: 5189 }));
