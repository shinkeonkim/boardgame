import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('bluff-dice', { serverPort: 3007, devPort: 5179, meta }));
