import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('corner-claim', { serverPort: 3016, devPort: 5188, meta }));
