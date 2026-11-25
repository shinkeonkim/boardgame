/**
 * 기기 전적: 매치가 끝나면 이 기기에 한 줄씩 기록 (가입 없음, 서버에 보내지 않음).
 * 모든 게임·포털이 같은 도메인이라 localStorage 'bg:stats' 하나를 함께 본다 (포털 /me 에서 모아 보여 줌).
 */
import type { MatchOutcome } from '@bg/core';

export interface MatchRecord {
  /** 게임 id·방 코드·매치 번호 — 같은 매치를 두 번 세지 않게 */
  key: string;
  game: string;
  title: string;
  /** 끝난 때 (ms) */
  at: number;
  players: number;
  bots: number;
  /** 1부터, 같은 점수는 같은 등수 */
  rank: number;
  won: boolean;
  score: number;
  lowerWins: boolean;
}

const KEY = 'bg:stats';
const MAX = 500;

export function readStats(): MatchRecord[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** 끝난 매치를 기록 (이미 있으면 그대로). 기록했으면 true */
export function recordOutcome(game: string, title: string, code: string, seat: number, o: MatchOutcome | null): boolean {
  if (!o || o.status !== 'match-over' || seat < 0 || seat >= o.totals.length) return false;
  const key = `${game}:${code}:${o.id}`;
  const list = readStats();
  if (list.some((r) => r.key === key)) return false;
  const mine = o.totals[seat];
  const better = o.totals.filter((v) => (o.lowerWins ? v < mine : v > mine)).length;
  const rec: MatchRecord = {
    key,
    game,
    title,
    at: Date.now(),
    players: o.totals.length,
    bots: o.bots.filter(Boolean).length,
    rank: better + 1,
    won: better === 0,
    score: mine,
    lowerWins: o.lowerWins,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify([rec, ...list].slice(0, MAX)));
  } catch {
    return false;
  }
  return true;
}

export interface StatsSummary {
  played: number;
  wins: number;
  winRate: number;
  /** 게임별: 판 수·승 수, 판 수 많은 순 */
  byGame: { game: string; title: string; played: number; wins: number }[];
  /** 연속 승 (가장 최근부터) */
  streak: number;
  /** 사람끼리(봇 없이) 한 판 수 */
  withFriends: number;
}

export function summarize(list: MatchRecord[] = readStats()): StatsSummary {
  const by = new Map<string, { game: string; title: string; played: number; wins: number }>();
  for (const r of list) {
    const g = by.get(r.game) ?? { game: r.game, title: r.title, played: 0, wins: 0 };
    g.played++;
    if (r.won) g.wins++;
    by.set(r.game, g);
  }
  let streak = 0;
  for (const r of list) {
    if (!r.won) break;
    streak++;
  }
  const wins = list.filter((r) => r.won).length;
  return {
    played: list.length,
    wins,
    winRate: list.length ? wins / list.length : 0,
    byGame: [...by.values()].sort((a, b) => b.played - a.played || b.wins - a.wins),
    streak,
    withFriends: list.filter((r) => r.bots === 0 && r.players > 1).length,
  };
}
