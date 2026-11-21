/**
 * 숫자 잇기 봇.
 *  - 손에서 만들 수 있는 묶음(같은 색 연속·같은 숫자 다른 색)을 모두 찾고, 큰 것부터 겹치지 않게 고른다.
 *  - 처음 등록 전: 손 묶음 합이 기준 이상일 때만 낸다.
 *  - 등록 뒤(보통·어려움): 테이블 묶음 끝에 이어 붙이거나 무리에 더할 수 있는 타일도 붙인다.
 *  - 어려움: 조커는 아껴 두다가(남으면 30점 감점) 큰 묶음을 완성할 때만, 높은 숫자부터 털어 낸다.
 *  - 쉬움: 테이블에 붙이지 않고, 가끔 그냥 가져온다.
 */
import { BotContext, Bot } from '@bg/core';
import { Move } from './game';
import { Tile, analyze, arrange, isJoker, setValue } from './sets';
import { GameView } from './view';

function combos<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, pick: T[]) => {
    if (pick.length === k) return void out.push([...pick]);
    for (let i = start; i < arr.length; i++) rec(i + 1, [...pick, arr[i]]);
  };
  rec(0, []);
  return out;
}

function candidateMelds(hand: Tile[], maxN: number, colors: number, useJokers: number): Tile[][] {
  const jokers = hand.filter(isJoker).slice(0, useJokers);
  const real = hand.filter((t) => !isJoker(t));
  const out: Tile[][] = [];
  // 무리
  for (let n = 1; n <= maxN; n++) {
    const byColor = new Map<number, Tile>();
    for (const t of real) if (t.n === n && !byColor.has(t.color)) byColor.set(t.color, t);
    const ts = [...byColor.values()];
    for (let size = 3; size <= Math.min(4, colors); size++) {
      for (let j = 0; j <= Math.min(jokers.length, size - 1); j++) {
        if (ts.length < size - j) continue;
        for (const pick of combos(ts, size - j)) out.push([...pick, ...jokers.slice(0, j)]);
      }
    }
  }
  // 줄
  for (let col = 0; col < colors; col++) {
    const byN = new Map<number, Tile>();
    for (const t of real) if (t.color === col && !byN.has(t.n)) byN.set(t.n, t);
    for (let start = 1; start <= maxN; start++) {
      const seq: Tile[] = [];
      let usedJ = 0;
      for (let n = start; n <= maxN; n++) {
        const t = byN.get(n);
        if (t) seq.push(t);
        else if (usedJ < jokers.length) seq.push(jokers[usedJ++]);
        else break;
        if (seq.length >= 3 && !isJoker(seq[0])) out.push([...seq]);
      }
    }
  }
  return out.filter((s) => analyze(arrange(s, maxN, colors), maxN, colors));
}

function pickDisjoint(melds: Tile[][], score: (s: Tile[]) => number): Tile[][] {
  const sorted = [...melds].sort((a, b) => score(b) - score(a));
  const used = new Set<string>();
  const out: Tile[][] = [];
  for (const s of sorted) {
    if (s.some((t) => used.has(t.id))) continue;
    s.forEach((t) => used.add(t.id));
    out.push(s);
  }
  return out;
}

export const runsBot: Bot<GameView, Move> = {
  thinkMs: [900, 2200],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const c = v.config;
    const lv = ctx.level;
    const opened = v.opened[v.me];
    if (lv === 'easy' && ctx.rng() < 0.25) return { type: 'draw' };
    const jokerBudget = lv === 'hard' ? (v.hand.length <= 6 ? 4 : 1) : 4;
    const melds = candidateMelds(v.hand, c.maxNumber, c.colors, jokerBudget);
    const score = (s: Tile[]) => s.length * 10 + setValue(arrange(s, c.maxNumber, c.colors), c.maxNumber, c.colors) * (lv === 'hard' ? 0.3 : 0.1) - s.filter(isJoker).length * (lv === 'hard' ? 6 : 1);
    const chosen = pickDisjoint(melds, score).map((s) => arrange(s, c.maxNumber, c.colors));
    if (!opened) {
      const sum = chosen.reduce((a, s) => a + setValue(s, c.maxNumber, c.colors), 0);
      if (!chosen.length || sum < c.initialMeld) return { type: 'draw' };
      return { type: 'play', table: [...v.table.map((s) => s.map((t) => t.id)), ...chosen.map((s) => s.map((t) => t.id))] };
    }
    const table = v.table.map((s) => [...s]);
    const used = new Set(chosen.flat().map((t) => t.id));
    let rest = v.hand.filter((t) => !used.has(t.id));
    // 테이블에 이어 붙이기 (보통·어려움)
    if (lv !== 'easy') {
      let progress = true;
      while (progress) {
        progress = false;
        const order = lv === 'hard' ? [...rest].sort((a, b) => (isJoker(a) ? 1 : 0) - (isJoker(b) ? 1 : 0) || b.n - a.n) : rest;
        for (const t of order) {
          if (isJoker(t) && lv === 'hard' && rest.length > 2) continue;
          for (let i = 0; i < table.length; i++) {
            const tryAdd = arrange([...table[i], t], c.maxNumber, c.colors);
            if (analyze(tryAdd, c.maxNumber, c.colors)) {
              table[i] = tryAdd;
              rest = rest.filter((x) => x.id !== t.id);
              progress = true;
              break;
            }
          }
          if (progress) break;
        }
      }
    }
    const playedCount = v.hand.length - rest.length;
    if (!playedCount) return { type: 'draw' };
    return { type: 'play', table: [...table, ...chosen].map((s) => s.map((t) => t.id)) };
  },
};
