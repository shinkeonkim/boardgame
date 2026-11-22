import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('one-word', { serverPort: 3021, devPort: 5193 }));
