import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/row-six-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
