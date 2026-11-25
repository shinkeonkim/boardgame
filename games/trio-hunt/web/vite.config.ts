import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('trio-hunt', { serverPort: 3022, devPort: 5194, meta }));
