import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/go-stop-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
