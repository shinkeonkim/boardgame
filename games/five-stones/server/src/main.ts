import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/five-stones-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
