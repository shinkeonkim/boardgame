import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/sealed-letter-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
