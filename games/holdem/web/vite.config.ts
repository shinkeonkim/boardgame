import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('holdem', { serverPort: 3023, devPort: 5195 }));
