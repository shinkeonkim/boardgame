import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('cipher-ops', { serverPort: 3006, devPort: 5178, meta }));
