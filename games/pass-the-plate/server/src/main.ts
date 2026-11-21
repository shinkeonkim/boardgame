import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/pass-the-plate-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
