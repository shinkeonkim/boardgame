import type { UserConfig, Plugin } from 'vite';
import type { GameMeta } from '@bg/core';
export declare function gameViteConfig(id: string, opts?: { serverPort?: number; devPort?: number; meta?: GameMeta }): UserConfig;
export declare function themeBootPlugin(): Plugin;
export declare function gameSeoPlugin(meta: GameMeta): Plugin;
