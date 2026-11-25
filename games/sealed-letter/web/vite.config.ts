import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('sealed-letter', { serverPort: 3009, devPort: 5181, meta }));
