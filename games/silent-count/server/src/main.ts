import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/silent-count-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
