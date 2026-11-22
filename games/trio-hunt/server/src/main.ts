import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/trio-hunt-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
