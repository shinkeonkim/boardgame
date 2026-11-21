import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('row-six', { serverPort: 3004, devPort: 5176 }));
