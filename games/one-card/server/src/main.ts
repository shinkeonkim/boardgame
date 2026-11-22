import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/one-card-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
