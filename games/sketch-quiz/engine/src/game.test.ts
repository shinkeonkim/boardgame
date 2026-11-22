import { beforeEach, describe, expect, it } from 'vitest';
import { CLASSIC } from './config';
import { MatchState, actors, applyMove, clock, decodePts, encodePts, newMatch } from './game';
import { viewFor } from './view';

let now = 1_000_000;
beforeEach(() => {
  now = 1_000_000;
  clock.now = () => now;
});

const start = (players = 3, c = CLASSIC): MatchState => newMatch(c, players, () => 0.3);

describe('그림 퀴즈', () => {
  it('점 인코딩', () => {
    const xs = [0, 1, 31, 32, 500, 999, 1000];
    expect(decodePts(encodePts(xs))).toEqual(xs);
  });
  it('단어는 그리는 사람만, 맞히면 맞힌 사람도', () => {
    const m = start();
    expect(viewFor(m, m.drawer).options).toHaveLength(3);
    expect(viewFor(m, (m.drawer + 1) % 3).options).toBeNull();
    applyMove(m, m.drawer, { type: 'pick', idx: 1 });
    const g = (m.drawer + 1) % 3;
    expect(viewFor(m, g).word).toBeNull();
    applyMove(m, g, { type: 'guess', text: ` ${m.word} ` });
    expect(viewFor(m, g).word).toBe(m.word);
    expect(m.guessPts[g]).toBe(10);
    expect(() => applyMove(m, g, { type: 'guess', text: 'x' })).toThrow('이미 맞혔어요');
  });
  it('답을 품은 오답은 가려서 남김 · 모두 맞히면 공개', () => {
    const m = start();
    applyMove(m, m.drawer, { type: 'pick', idx: 0 });
    const [a, b] = [1, 2].map((k) => (m.drawer + k) % 3);
    applyMove(m, a, { type: 'guess', text: `${m.word}요` });
    const last = m.log[m.log.length - 1];
    expect(last.type === 'guess' && last.text).not.toContain(m.word);
    applyMove(m, a, { type: 'guess', text: m.word });
    applyMove(m, b, { type: 'guess', text: m.word });
    expect(m.phase).toBe('reveal');
    expect(m.drawPts[m.drawer]).toBe(3 * 2 + 2);
    expect(m.guessPts[b]).toBe(8);
  });
  it('힌트: 35% 지나면 초성, 65% 지나면 한 글자', () => {
    const m = start(3, { ...CLASSIC, drawSec: 100 });
    applyMove(m, m.drawer, { type: 'pick', idx: 0 });
    const g = (m.drawer + 1) % 3;
    expect(viewFor(m, g).slots.every((s) => s.cho === null && (s.ch === null || s.ch === ' '))).toBe(true);
    now += 40_000;
    expect(viewFor(m, g).slots.some((s) => s.cho)).toBe(true);
    now += 30_000;
    if ([...m.word].filter((c) => c !== ' ').length >= 2) expect(viewFor(m, g).slots.some((s) => s.ch && s.ch !== ' ')).toBe(true);
  });
  it('그리기: 그리는 사람만 · 이어 그리기 · 되돌리기', () => {
    const m = start();
    applyMove(m, m.drawer, { type: 'pick', idx: 0 });
    expect(() => applyMove(m, (m.drawer + 1) % 3, { type: 'stroke', c: '#1d1a16', w: 7, p: [1, 2, 3, 4] })).toThrow();
    applyMove(m, m.drawer, { type: 'stroke', c: '#c0392b', w: 7, p: [10, 10, 20, 20] });
    applyMove(m, m.drawer, { type: 'stroke', c: '#c0392b', w: 7, p: [30, 30], cont: true });
    expect(decodePts(m.strokes[0].p)).toEqual([10, 10, 20, 20, 30, 30]);
    applyMove(m, m.drawer, { type: 'undo' });
    expect(m.strokes).toHaveLength(0);
    expect(m.points).toBe(0);
  });
  it('시간 초과: 맞히는 사람이 일찍 보내면 포기, 시간이 지나면 공개 → 다음 사람', () => {
    const m = start();
    applyMove(m, m.drawer, { type: 'pick', idx: 0 });
    const d = m.drawer;
    const g = (d + 1) % 3;
    applyMove(m, g, { type: 'timeup' });
    expect(m.phase).toBe('draw');
    expect(actors(m)).not.toContain(g);
    now = m.deadline;
    applyMove(m, (d + 2) % 3, { type: 'timeup' });
    expect(m.phase).toBe('reveal');
    for (const s of actors(m)) applyMove(m, s, { type: 'next' });
    expect(m.drawer).toBe((d + 1) % 3);
  });
  it('모두 그리면 끝 (그리는 사람이 넘기면 다음 사람)', () => {
    const m = start(3);
    let guard = 0;
    while (m.status === 'playing' && guard++ < 100) {
      if (m.phase === 'reveal') for (const s of actors(m)) applyMove(m, s, { type: 'next' });
      else applyMove(m, m.drawer, { type: 'skip' });
    }
    expect(m.status).toBe('match-over');
    expect(m.log.filter((e) => e.type === 'skip')).toHaveLength(3);
  });
});
