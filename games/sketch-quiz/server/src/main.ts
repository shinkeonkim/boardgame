import { createGameServer } from '@bg/server';
import { EXTRA_EMOTES, game } from '@bg/sketch-quiz-engine';

createGameServer({ game, extraEmotes: EXTRA_EMOTES });
