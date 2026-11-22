import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/one-word-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
