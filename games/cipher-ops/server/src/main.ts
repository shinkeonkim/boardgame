import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/cipher-ops-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
