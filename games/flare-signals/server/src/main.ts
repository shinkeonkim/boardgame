import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/flare-signals-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
