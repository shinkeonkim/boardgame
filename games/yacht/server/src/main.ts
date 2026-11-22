import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/yacht-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
