import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/court-intrigue-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
