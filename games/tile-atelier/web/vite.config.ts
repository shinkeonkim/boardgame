import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('tile-atelier', { serverPort: 3015, devPort: 5187, meta }));
