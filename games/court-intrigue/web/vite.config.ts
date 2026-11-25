import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('court-intrigue', { serverPort: 3010, devPort: 5182, meta }));
