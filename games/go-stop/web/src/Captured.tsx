import type { HCard } from '@bg/go-stop-engine';
import { piCount } from '@bg/go-stop-engine';
import { HwatuCard } from './theme';

const GROUPS: { id: string; label: string; test: (c: HCard) => boolean }[] = [
  { id: 'gwang', label: '광', test: (c) => c.kind === 'gwang' },
  { id: 'animal', label: '열끗', test: (c) => c.kind === 'animal' },
  { id: 'ribbon', label: '띠', test: (c) => c.kind === 'ribbon' },
  { id: 'pi', label: '피', test: (c) => c.kind === 'pi' || c.kind === 'double' },
];

export type Stage = Record<string, { via?: string; delay?: number; land?: string; from?: string }>;

/** 먹은 카드: 종류별로 겹쳐 쌓기 (피는 장수, 쌍피는 2). stage: 방금 먹은 카드가 어떤 순서·경로로 들어오는지 */
export function Captured({ cards, w = 34, compact, flip, stage }: { cards: HCard[]; w?: number; compact?: boolean; flip?: boolean; stage?: Stage }) {
  return (
    <div className={`gs-captured ${compact ? 'compact' : ''}`}>
      {GROUPS.map((g) => {
        const list = cards.filter(g.test).sort((a, b) => a.month - b.month);
        const n = g.id === 'pi' ? piCount(list) : list.length;
        return (
          <div key={g.id} className={`gs-cap-group ${list.length ? '' : 'empty'}`}>
            <span className="gs-cap-label small">
              {g.label} <b>{n}</b>
            </span>
            {!compact && (
              <div className="gs-cap-stack" style={{ ['--w' as string]: `${w}px` }}>
                {list.map((c) =>
                  flip ? (
                    <span key={c.id} data-flip={c.id} data-flip-via={stage?.[c.id]?.via} data-flip-delay={stage?.[c.id]?.delay} data-flip-land={stage?.[c.id]?.land} data-flip-from={stage?.[c.id]?.from} className="gs-cap-card">
                      <HwatuCard card={c} w={w} />
                    </span>
                  ) : (
                    <HwatuCard key={c.id} card={c} w={w} />
                  ),
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
