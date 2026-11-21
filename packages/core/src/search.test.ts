import { describe, expect, it } from 'vitest';
import type { GameMeta } from './catalog';
import { TAG_LABELS } from './catalog';
import { searchGames } from './search';

const g = (id: string, over: Partial<GameMeta>): GameMeta => ({
  id,
  title: id,
  subtitle: '',
  tagline: '',
  description: [],
  players: { min: 2, max: 4 },
  minutes: { min: 20, max: 30 },
  weight: 2,
  tags: [],
  inspiredBy: '',
  accent: '#000',
  icon: '',
  status: 'live',
  addedAt: '2026-01-01',
  highlights: [],
  customizable: [],
  ...over,
});

const games = [
  g('cards', { title: 'Card Trip', tags: ['card'], minutes: { min: 15, max: 20 }, addedAt: '2026-02-01' }),
  g('stones', { title: 'Stone Field', tags: ['abstract', 'area-control'], players: { min: 2, max: 2 }, weight: 3 }),
  g('later', { title: 'Later', status: 'soon' }),
];

describe('searchGames', () => {
  it('준비 중인 게임은 기본적으로 숨김', () => {
    expect(searchGames(games, {}).map((x) => x.id)).toEqual(['cards', 'stones']);
    expect(searchGames(games, { includeSoon: true })).toHaveLength(3);
  });
  it('인원·시간·무게·태그 필터', () => {
    expect(searchGames(games, { players: 3 }).map((x) => x.id)).toEqual(['cards']);
    expect(searchGames(games, { maxMinutes: 15 }).map((x) => x.id)).toEqual(['cards']);
    expect(searchGames(games, { weight: 'medium' }).map((x) => x.id)).toEqual(['cards', 'stones']);
    expect(searchGames(games, { tags: ['abstract', 'area-control'] }).map((x) => x.id)).toEqual(['stones']);
  });
  it('검색어는 대소문자·띄어쓰기 무시, 한국어 태그 이름으로도', () => {
    expect(searchGames(games, { q: 'stonefield' }).map((x) => x.id)).toEqual(['stones']);
    expect(searchGames(games, { q: '추상' }, TAG_LABELS).map((x) => x.id)).toEqual(['stones']);
    expect(searchGames(games, { q: '없는말' })).toEqual([]);
  });
  it('정렬', () => {
    expect(searchGames(games, { sort: 'new' })[0].id).toBe('cards');
    expect(searchGames(games, { sort: 'title' }).map((x) => x.title)).toEqual(['Card Trip', 'Stone Field']);
    expect(searchGames(games, { sort: 'short' })[0].id).toBe('cards');
  });
});
