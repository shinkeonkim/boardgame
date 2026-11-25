import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('hidden-thorn', { serverPort: 3012, devPort: 5184, meta }));
