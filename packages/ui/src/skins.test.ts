import { describe, expect, it } from 'vitest';
import { CARD_BACKS, CARD_TEXTURES, CHIP_TEXTURES, DEFAULT_SKIN, TABLE_MATS, skinVars, svgTile } from './skins';

describe('카드·칩 꾸미기', () => {
  it('id가 겹치지 않는다', () => {
    for (const list of [CARD_BACKS, CARD_TEXTURES, CHIP_TEXTURES, TABLE_MATS]) expect(new Set(list.map((s) => s.id)).size).toBe(list.length);
  });
  it('기본값이 목록에 있다', () => {
    expect(CARD_BACKS.some((s) => s.id === DEFAULT_SKIN.back)).toBe(true);
    expect(CARD_TEXTURES.some((s) => s.id === DEFAULT_SKIN.tex)).toBe(true);
    expect(CHIP_TEXTURES.some((s) => s.id === DEFAULT_SKIN.chip)).toBe(true);
    expect(TABLE_MATS.some((s) => s.id === DEFAULT_SKIN.table)).toBe(true);
  });
  it('SVG 타일은 data URL로 안전하게 인코딩된다 (# · 따옴표 없음)', () => {
    const v = svgTile(10, 10, "<circle cx='5' cy='5' r='2' fill='#fff'/>", '#123');
    const url = v.slice(0, v.indexOf(')'));
    expect(url).not.toMatch(/[#']/);
    expect(v).toMatch(/0 0\/10px 10px, #123$/);
  });
  it('모르는 id는 첫 번째 무늬로', () => {
    const vars = skinVars({ back: 'nope', tex: 'nope', chip: 'nope', table: 'nope', layout: 'auto' }, null);
    expect(vars['--table-tex']).toBe(TABLE_MATS[0].bg);
    expect(vars['--card-back']).toBe(CARD_BACKS[0].bg);
    expect(vars['--card-tex']).toBe(CARD_TEXTURES[0].bg);
    expect(vars['--chip-tex']).toBe(CHIP_TEXTURES[0].bg);
  });
  it('내 이미지 뒷면은 저장된 그림으로 (없으면 기본 무늬)', () => {
    expect(skinVars({ ...DEFAULT_SKIN, back: 'custom' }, 'data:image/jpeg;base64,AAA')['--card-back']).toContain('data:image/jpeg;base64,AAA');
    expect(skinVars({ ...DEFAULT_SKIN, back: 'custom' }, null)['--card-back']).toBe(CARD_BACKS[0].bg);
  });
});
