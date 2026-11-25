import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('domain-tiles', { serverPort: 3029, devPort: 5201, meta }));
