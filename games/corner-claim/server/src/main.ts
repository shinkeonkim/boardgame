import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/corner-claim-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
