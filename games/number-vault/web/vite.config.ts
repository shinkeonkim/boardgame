import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('number-vault', { serverPort: 3008, devPort: 5180 }));
