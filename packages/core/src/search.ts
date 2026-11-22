import type { GameMeta } from './catalog';

export interface GameQuery {
  /** 제목·부제·소개·태그 이름에서 찾을 말 (띄어쓰기로 여러 개 = 모두 포함) */
  q?: string;
  /** 이 인원으로 할 수 있는 게임 */
  players?: number;
  /** 최대 플레이 시간(분) — 최소 시간이 이 안에 드는 게임 */
  maxMinutes?: number;
  /** 무게 범위 */
  weight?: 'light' | 'medium' | 'heavy';
  /** 모두 가진 게임 */
  tags?: string[];
  sort?: 'recommended' | 'new' | 'title' | 'short';
  /** 준비 중인 게임도 포함 */
  includeSoon?: boolean;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');

/** 포털의 게임 찾기: 필터 → 정렬. tagLabels는 한국어 태그 이름으로도 검색되게 */
export function searchGames(games: GameMeta[], query: GameQuery, tagLabels: Record<string, string> = {}): GameMeta[] {
  const words = (query.q ?? '').split(/\s+/).map(norm).filter(Boolean);
  const out = games.filter((g) => {
    if (!query.includeSoon && g.status !== 'live') return false;
    if (query.players && (query.players < g.players.min || query.players > g.players.max)) return false;
    if (query.maxMinutes && g.minutes.min > query.maxMinutes) return false;
    if (query.weight === 'light' && g.weight > 2) return false;
    if (query.weight === 'medium' && (g.weight < 2 || g.weight > 3.5)) return false;
    if (query.weight === 'heavy' && g.weight < 3.5) return false;
    if (query.tags?.length && !query.tags.every((t) => g.tags.includes(t))) return false;
    if (words.length) {
      const hay = norm([g.title, g.subtitle, g.tagline, g.inspiredBy, g.original?.ko ?? '', g.original?.en ?? '', ...g.description, ...g.tags, ...g.tags.map((t) => tagLabels[t] ?? '')].join(' '));
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  const sort = query.sort ?? 'recommended';
  return out.sort((a, b) => {
    if (sort === 'new') return b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title);
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'short') return a.minutes.min - b.minutes.min || a.title.localeCompare(b.title);
    // 추천: 플레이 가능 먼저, 그다음 최신
    return (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1) || b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title);
  });
}
