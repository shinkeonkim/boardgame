import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/orbit-tasks-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
