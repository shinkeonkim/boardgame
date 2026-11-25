import { defineConfig } from 'vite';
import { gameViteConfig } from '@bg/web/vite';
import { meta } from '../meta';

export default defineConfig(gameViteConfig('gem-guild', { serverPort: 3014, devPort: 5186, meta }));
