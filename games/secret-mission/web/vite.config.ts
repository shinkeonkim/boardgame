import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('secret-mission', { serverPort: 3019, devPort: 5191, meta }));
