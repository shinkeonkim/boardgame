import { describe, expect, it } from 'vitest';
import { CLASSIC, layout, parseCustom, validateConfig } from './config';
import { MatchState, applyMove, clueProblem, newMatch, operatives } from './game';
import { viewFor } from './view';
import { game } from './module';
import { CLUE_TAGS, WORDS } from './words';

const m4 = (over = {}): MatchState => newMatch({ ...CLASSIC, ...over }, 4, () => 0.25);
const idxOf = (m: MatchState, k: unknown) => m.key.findIndex((x, i) => x === k && m.revealed[i] === null);

describe('설정·단어', () => {
  it('원작 배분 9·8·7·1, 4×4·6×6', () => {
    expect(layout(CLASSIC)).toMatchObject({ total: 25, first: 9, second: 8, neutral: 7, assassins: 1 });
    expect(layout({ ...CLASSIC, size: 4 })).toMatchObject({ total: 16, first: 6, second: 5 });
    expect(layout({ ...CLASSIC, size: 6, assassins: 2 }).neutral).toBeGreaterThan(0);
  });
  it('단어 중복 없음, 태그는 보드 단어와 겹치지 않음', () => {
    expect(new Set(WORDS.map((w) => w.word)).size).toBe(WORDS.length);
    const words = new Set(WORDS.map((w) => w.word));
    expect(CLUE_TAGS.some((t) => words.has(t))).toBe(false);
  });
  it('방장 단어: 쉼표·줄바꿈, 공백 제거, 중복 제거', () => {
    expect(parseCustom('사과, 바나나\n사과 , 우 주')).toEqual(['사과', '바나나', '우주']);
  });
  it('4명 미만은 시작 불가', () => {
    expect(validateConfig(CLASSIC, 3)[0]).toMatch('4명');
  });
});

describe('진행', () => {
  it('팀장 → 힌트, 요원 → 맞히기 (숫자+1번까지)', () => {
    const m = m4();
    const team = m.team;
    const spy = m.spymasters[team];
    expect(game.actors!(m)).toEqual([spy]);
    expect(() => applyMove(m, operatives(m, team)[0], { type: 'clue', word: '하늘', count: 2 })).toThrow('팀장만');
    applyMove(m, spy, { type: 'clue', word: '우주선', count: 1 });
    expect(m.guessesLeft).toBe(2);
    expect(game.actors!(m)).toEqual(operatives(m, team));
    const op = operatives(m, team)[0];
    applyMove(m, op, { type: 'guess', index: idxOf(m, team) });
    applyMove(m, op, { type: 'guess', index: idxOf(m, team) });
    expect(m.team).toBe(1 - team); // 2번 맞히고 끝
  });

  it('보드에 있는 단어나 겹치는 단어는 힌트로 못 줌', () => {
    const m = m4();
    expect(clueProblem(m, m.words[0])).toMatch('보드에 있는');
    expect(clueProblem(m, `${m.words[0]}들`)).toMatch('겹치는');
    expect(clueProblem(m, '두 단어')).toMatch('띄어쓰기');
  });

  it('상대 카드·중립을 고르면 차례가 넘어가고, 암살자는 바로 패배', () => {
    const m = m4();
    const team = m.team;
    applyMove(m, m.spymasters[team], { type: 'clue', word: '시험', count: 3 });
    applyMove(m, operatives(m, team)[0], { type: 'guess', index: idxOf(m, 'N') });
    expect(m.team).toBe(1 - team);
    const other = m.team;
    applyMove(m, m.spymasters[other], { type: 'clue', word: '시험', count: 1 });
    applyMove(m, operatives(m, other)[0], { type: 'guess', index: idxOf(m, 'X') });
    expect(m.status).toBe('match-over');
    expect(m.winners).toEqual([1 - other]);
    expect(m.winReason).toBe('assassin');
  });

  it('자기 카드를 다 찾으면 승리, 판 수 = 이긴 판', () => {
    const m = m4({ rounds: 3 });
    const team = m.team;
    applyMove(m, m.spymasters[team], { type: 'clue', word: '시험', count: 99 });
    while (m.status === 'playing') applyMove(m, operatives(m, team)[0], { type: 'guess', index: idxOf(m, team) });
    expect(m.status).toBe('round-over');
    expect(game.totals(m).filter((x) => x === 1)).toHaveLength(2);
  });

  it('요원에게는 정답 지도가 안 보이고 팀장에게는 보임', () => {
    const m = m4();
    const spy = m.spymasters[0];
    const op = operatives(m, 0)[0];
    expect(viewFor(m, spy).key.every((k) => k !== null)).toBe(true);
    expect(viewFor(m, op).key.every((k) => k === null)).toBe(true);
    expect(viewFor(m, -1).key.every((k) => k === null)).toBe(true);
  });

  it('판마다 팀장이 돌아가요 (6명)', () => {
    const m = newMatch({ ...CLASSIC, rounds: 3 }, 6, () => 0.4);
    const first = [...m.spymasters];
    m.status = 'round-over';
    m.winners.push(0);
    game.startNextRound(m, () => 0.1);
    expect(m.spymasters).not.toEqual(first);
  });
});
