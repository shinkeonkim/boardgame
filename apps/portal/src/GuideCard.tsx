import { ComponentType, useEffect, useState } from 'react';
import type { GameMeta } from '@bg/core';
import { AssetBaseContext, GuideSections, type GuideDef } from '@bg/web/guide-kit';

/** 게임 폴더의 guide-entry.tsx(게임 방법 + 그 게임 CSS)를 필요할 때만 불러온다 */
const entries = import.meta.glob<{ guide: GuideDef; Globals?: ComponentType }>('../../../games/*/web/src/guide-entry.tsx');

/** 게임 상세 페이지 안의 게임 방법 — 게임 안 모달과 같은 내용을 페이지에 바로 펼친다 */
export function GuideCard({ game }: { game: GameMeta }) {
  const [mod, setMod] = useState<{ guide: GuideDef; Globals?: ComponentType } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const load = entries[`../../../games/${game.id}/web/src/guide-entry.tsx`];
    if (!load) return setFailed(true);
    load()
      .then(setMod)
      .catch(() => setFailed(true));
  }, [game.id]);
  if (failed) return null;
  return (
    <section className="panel guide-card" id="how-to-play" aria-labelledby="how-to-play-title">
      <div className="guide-card-head">
        <h2 id="how-to-play-title">게임 방법</h2>
        {mod && <span className="muted small">{mod.guide.subtitle}</span>}
      </div>
      {mod ? (
        <AssetBaseContext.Provider value={`/${game.id}`}>
          {mod.Globals && <mod.Globals />}
          <GuideSections sections={mod.guide.sections} stickyTop={57} />
        </AssetBaseContext.Provider>
      ) : (
        <p className="muted">게임 방법을 불러오고 있어요…</p>
      )}
    </section>
  );
}
