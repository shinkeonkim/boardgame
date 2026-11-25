import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('pass-the-plate', { serverPort: 3011, devPort: 5183, meta }));
