import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/domain-tiles-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
