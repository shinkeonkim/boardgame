import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/bluff-dice-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
