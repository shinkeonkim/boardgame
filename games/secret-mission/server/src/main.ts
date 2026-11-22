import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/secret-mission-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
