import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';

export default defineConfig(gameViteConfig('gem-guild', { serverPort: 3014, devPort: 5186 }));
