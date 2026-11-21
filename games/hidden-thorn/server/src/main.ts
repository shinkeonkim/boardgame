import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/hidden-thorn-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
