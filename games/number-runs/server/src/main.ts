import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/number-runs-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
