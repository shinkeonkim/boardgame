import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, expeditionLines } from '@bg/expedition-lines-engine';

createGameServer({ game: expeditionLines, extraEmotes: EXTRA_EMOTES });
