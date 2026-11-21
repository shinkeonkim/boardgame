import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/flag-line-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
