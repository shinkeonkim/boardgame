import type { GameMeta } from '@bg/core';

/** games/<id>/meta.ts 를 모두 모은다 — 게임 폴더를 추가하면 포털에 자동으로 나타난다 */
const modules = import.meta.glob<{ meta: GameMeta }>('../../../games/*/meta.ts', { eager: true });
export const GAMES: GameMeta[] = Object.values(modules)
  .map((m) => m.meta)
  .sort((a, b) => a.title.localeCompare(b.title));

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

export const playersText = (g: GameMeta) => (g.players.min === g.players.max ? `${g.players.min}명` : `${g.players.min}~${g.players.max}명`);
export const minutesText = (g: GameMeta) => (g.minutes.min === g.minutes.max ? `${g.minutes.min}분` : `${g.minutes.min}~${g.minutes.max}분`);
export const WEIGHT_LABELS = ['', '아주 쉬움', '쉬움', '보통', '어려움', '아주 어려움'];
export const weightText = (g: GameMeta) => WEIGHT_LABELS[Math.round(g.weight)] ?? '';
