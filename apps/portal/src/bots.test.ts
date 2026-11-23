import { describe, expect, it } from 'vitest';
import type { GameMeta } from '@bg/core';

// 게임 소개(meta.bots)와 실제 엔진(GameModule.bots)이 「봇과 함께 / 사람끼리만」을 같게 말하는지
const metas = import.meta.glob<{ meta: GameMeta }>('../../../games/*/meta.ts', { eager: true });
const modules = import.meta.glob<Record<string, unknown>>('../../../games/*/engine/src/module.ts', { eager: true });

describe('봇 지원 표시', () => {
  it('소개와 엔진이 같은 말을 해요', () => {
    for (const [path, { meta }] of Object.entries(metas)) {
      const id = path.split('/games/')[1].split('/')[0];
      const mod = modules[`../../../games/${id}/engine/src/module.ts`];
      const game = Object.values(mod ?? {}).find((v) => v && typeof v === 'object' && 'applyMove' in (v as object)) as { bots?: boolean } | undefined;
      if (!game) continue;
      expect(meta.bots !== false, `${id}: meta.bots(${meta.bots}) ↔ 엔진 bots(${game.bots})`).toBe(game.bots !== false);
    }
  });
});
