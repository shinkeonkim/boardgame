import { describe, expect, it } from 'vitest';
import type { GameMeta } from '@bg/core';
import { TAG_LABELS } from '@bg/core';
import { abs, gameJsonLd, gamePageSeo, headTags, injectHead, ldJson } from './seo.js';

const meta = {
  id: 'demo',
  title: 'Demo "Game"',
  subtitle: '데모 <게임>',
  tagline: '한 줄 소개',
  description: ['첫 문단', '둘째 문단'],
  players: { min: 2, max: 4 },
  minutes: { min: 10, max: 20 },
  weight: 2,
  tags: ['card', 'party'],
  inspiredBy: '',
  original: { ko: '원작', en: 'Original', by: '누군가' },
  accent: '#000',
  icon: '',
  status: 'live',
  addedAt: '2026-11-25',
  highlights: [],
  customizable: [],
} as GameMeta;

describe('SEO 태그', () => {
  it('제목·설명의 특수문자를 이스케이프', () => {
    const tags = headTags(gamePageSeo(meta, TAG_LABELS));
    expect(tags).toContain('<title>데모 &lt;게임&gt; 온라인 · Demo &quot;Game&quot; | 보드게임 테이블</title>');
    expect(tags).not.toContain('<게임>');
  });
  it('canonical·대표 그림은 절대 주소', () => {
    const tags = headTags(gamePageSeo(meta));
    expect(tags).toContain('<link rel="canonical" href="https://boardgame.shinkeonkim.com/demo/" />');
    expect(tags).toContain('content="https://boardgame.shinkeonkim.com/covers/demo.jpg"');
    expect(abs('https://x.y/z')).toBe('https://x.y/z');
  });
  it('JSON-LD: 인원·무료·원작, </script> 가 섞여도 안전', () => {
    const ld = gameJsonLd(meta, TAG_LABELS) as Record<string, any>;
    expect(ld.numberOfPlayers).toMatchObject({ minValue: 2, maxValue: 4 });
    expect(ld.offers.price).toBe(0);
    expect(ld.isBasedOn.name).toContain('원작');
    expect(ld.genre).toEqual(['카드', '파티']);
    expect(ldJson({ a: '</script><script>alert(1)</script>' })).not.toMatch(/<\/script><script>/);
  });
  it('기존 title·description 을 바꿔 끼움', () => {
    const html = '<html><head><title>old</title><meta name="description" content="old" /></head><body></body></html>';
    const out = injectHead(html, '<title>new</title>');
    expect(out).not.toContain('old');
    expect(out.match(/<title>/g)).toHaveLength(1);
  });
});
