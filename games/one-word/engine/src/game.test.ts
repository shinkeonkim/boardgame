import { describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { MatchState, actors, applyMove, autoMove, leaksAnswer, newMatch, sameClue } from './game';
import { viewFor } from './view';

function setup(over = {}): MatchState {
  const m = newMatch({ ...CLASSIC, ...over }, 4, () => 0.3);
  m.guesser = 0;
  m.word = '고양이';
  m.deck[m.card] = '고양이';
  return m;
}

describe('힌트', () => {
  it('같은 힌트 판정: 똑같음 / 비슷함', () => {
    expect(sameClue('바다', '바다', 'exact')).toBe(true);
    expect(sameClue('바다', '바닷가', 'exact')).toBe(false);
    expect(sameClue('바다', '바닷가', 'similar')).toBe(true);
    expect(sameClue('물', '불', 'similar')).toBe(false);
    expect(leaksAnswer('고양이', '고양이')).toBe(true);
    expect(leaksAnswer('검은고양이', '고양이')).toBe(true);
  });
  it('모두 쓰면 겹친 힌트·정답을 품은 힌트가 지워지고, 맞히는 사람은 지워진 걸 못 봄', () => {
    const m = setup();
    expect(actors(m)).toEqual([1, 2, 3]);
    expect(viewFor(m, 0).word).toBeNull();
    applyMove(m, 1, { type: 'clue', word: '야옹' });
    expect(viewFor(m, 2).clues.find((c) => c.seat === 1)!.word).toBeNull(); // 쓰는 중엔 남의 힌트 비밀
    applyMove(m, 2, { type: 'clue', word: '야옹' });
    applyMove(m, 3, { type: 'clue', word: '집' });
    expect(m.phase).toBe('guess');
    expect(m.erased).toEqual([false, true, true, false]);
    const gv = viewFor(m, 0);
    expect(gv.clues.filter((c) => c.word).map((c) => c.word)).toEqual(['집']);
    expect(() => applyMove(m, 1, { type: 'guess', word: 'x' })).toThrow();
  });
  it('맞히면 1점, 틀리면 다음 카드도 잃음, 넘기면 그 카드만', () => {
    const m = setup();
    for (const s of [1, 2, 3]) applyMove(m, s, { type: 'clue', word: `힌트${s}` });
    applyMove(m, 0, { type: 'guess', word: ' 고양 이 ' });
    expect(m.score).toBe(1);
    expect(m.card).toBe(1);
    for (const s of actors(m)) applyMove(m, s, { type: 'clue', word: `가${s}` });
    applyMove(m, m.guesser, { type: 'guess', word: '틀린답' });
    expect(m.card).toBe(3);
    for (const s of actors(m)) applyMove(m, s, { type: 'clue', word: `나${s}` });
    applyMove(m, m.guesser, { type: 'pass' });
    expect(m.card).toBe(4);
  });
  it('띄어쓰기 있는 힌트는 안 돼요', () => {
    const m = setup();
    expect(() => applyMove(m, 1, { type: 'clue', word: '두 단어' })).toThrow('한 단어');
  });
  it('자동 진행만으로 끝까지', () => {
    const m = newMatch({ ...CLASSIC, cards: 6 }, 5, () => 0.9);
    let g = 0;
    while (m.status === 'playing' && g++ < 200) {
      const s = actors(m)[0];
      applyMove(m, s, autoMove(m, s));
    }
    expect(m.status).toBe('match-over');
  });
});
