import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('orbit-tasks', { serverPort: 3027, devPort: 5199, meta }));
