import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, crownMarch } from '@bg/crown-march-engine';

createGameServer({ game: crownMarch, extraEmotes: EXTRA_EMOTES });
