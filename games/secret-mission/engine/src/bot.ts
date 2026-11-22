/**
 * 비밀 원정대 봇 — 자기 화면(view)만 본다.
 *  의심 점수: 실패한 원정의 대원은 실패 카드 수만큼 의심↑, 깨끗한 원정의 대원은 의심↓,
 *            실패한 원정에 찬성한 사람도 조금↑ (투표가 공개될 때). 내가 아는 첩자는 확실히 첩자.
 *  요원: 원정대 = 나 + 가장 덜 의심스러운 사람. 의심스러운 사람이 낀 원정대엔 반대 (단, 마지막 부결 직전엔 찬성).
 *  첩자: 원정대에 첩자 한 명만 끼게. 첩자가 낀 원정대엔 찬성, 아니면 반대 (마지막 부결 직전이면 반대해서 승리).
 *        원정에선 같은 편 첩자 중 좌석이 가장 앞인 사람만 실패 (실패 2장이 필요하면 모두). 어려움은 첫 원정에서 가끔 숨는다.
 *  사냥꾼: 첩자가 낀 원정대에 꾸준히 반대한 요원 = 예언자로 본다.
 */
import { Bot, BotContext, Scored, pickByLevel } from '@bg/core';
import { isSpy } from './config';
import { Move } from './game';
import { GameView } from './view';

function suspicion(v: GameView): number[] {
  const s = Array(v.players).fill(0);
  const iAmAgent = !!v.myRole && !isSpy(v.myRole);
  for (const h of v.history) {
    if (h.fails !== null) {
      // 내가 요원이면 나는 결백 → 실패 카드는 나를 뺀 대원들 몫
      const others = iAmAgent ? h.team.filter((t) => t !== v.me) : h.team;
      if (h.fails > 0) {
        for (const t of others) s[t] += (3 * h.fails) / Math.max(1, others.length);
        if (!h.team.includes(h.leader)) s[h.leader] += 0.8; // 첩자가 낀 원정대를 고른 대장도
      } else for (const t of h.team) s[t] -= 0.6;
      if (h.votes) h.votes.forEach((yes, i) => (s[i] += h.fails! > 0 ? (yes ? 0.5 : -0.3) : yes ? -0.15 : 0.2));
    }
  }
  v.known.forEach((k, i) => {
    if (k === 'spy') s[i] += 100;
  });
  if (v.me >= 0) s[v.me] = -100;
  return s;
}

function combos(n: number, k: number, limit = 400): number[][] {
  const out: number[][] = [];
  const go = (start: number, acc: number[]) => {
    if (out.length >= limit) return;
    if (acc.length === k) return void out.push([...acc]);
    for (let i = start; i < n; i++) go(i + 1, [...acc, i]);
  };
  go(0, []);
  return out;
}

export const missionBot: Bot<GameView, Move> = {
  thinkMs: [900, 2400],
  choose(ctx: BotContext<GameView>): Move {
    const v = ctx.view;
    const me = v.me;
    const spy = !!v.myRole && isSpy(v.myRole);
    const sus = suspicion(v);
    const mates = v.known.flatMap((k, i) => (k === 'spy' && spy ? [i] : []));
    const spySet = new Set(spy ? [me, ...mates] : v.known.flatMap((k, i) => (k === 'spy' ? [i] : [])));
    const hammer = v.rejects >= v.config.rejectLimit - 1;
    switch (v.phase) {
      case 'team': {
        const scored: Scored<Move>[] = combos(v.players, v.teamSize).map((team) => {
          let score = team.includes(me) ? 3 : 0;
          if (spy) {
            const n = team.filter((s) => spySet.has(s)).length;
            score += n === 1 ? 10 : n === 0 ? -10 : -4 * n;
            score -= team.reduce((a, s) => a + (spySet.has(s) ? 0 : Math.max(0, sus[s])), 0);
          } else score -= team.reduce((a, s) => a + Math.max(-1, sus[s]), 0);
          return { move: { type: 'team', seats: team }, score };
        });
        return pickByLevel(scored, ctx.level, ctx.rng);
      }
      case 'vote': {
        const team = v.team;
        let approve: boolean;
        if (spy) {
          const n = team.filter((s) => spySet.has(s)).length;
          approve = hammer ? false : n >= 1 || (v.mission === 0 && ctx.rng() < 0.5);
        } else {
          // 요원: 내가 빠진 원정대는 의심 (사람들이 실제로 쓰는 요령). 의심스러운 사람이 끼면 반대. 마지막 부결 직전엔 찬성
          const risk = team.reduce((a, s) => a + (s === me ? 0 : Math.max(0, sus[s])), 0);
          const withMe = team.includes(me);
          const trustedOnly = team.every((s) => s === me || sus[s] < -0.5);
          approve = hammer || (!team.some((s) => spySet.has(s)) && (withMe ? risk < 0.9 : trustedOnly || (ctx.level === 'easy' && risk < 1)));
        }
        const scored: Scored<Move>[] = [
          { move: { type: 'vote', approve }, score: 1 },
          { move: { type: 'vote', approve: !approve }, score: 0 },
        ];
        return pickByLevel(scored, ctx.level, ctx.rng);
      }
      case 'mission': {
        if (!spy) return { type: 'play', success: true };
        const onTeam = v.team.filter((s) => spySet.has(s));
        const lead = Math.min(...onTeam);
        let fail = v.failsNeeded >= 2 ? true : v.myRole === 'loner' ? ctx.rng() < 0.7 : me === lead;
        // 어려움: 첫 원정에 혼자 낀 첩자는 가끔 성공을 내 의심을 피함
        if (ctx.level === 'hard' && v.mission === 0 && v.team.length <= 2 && ctx.rng() < 0.5) fail = false;
        if (ctx.level === 'easy' && ctx.rng() < 0.2) fail = !fail;
        return { type: 'play', success: !fail };
      }
      case 'hunt': {
        // 첩자가 낀(나중에 실패한) 원정대에 반대한 횟수가 많을수록 예언자 같다
        const score = Array(v.players).fill(0);
        for (const h of v.history) {
          if (!h.votes) continue;
          const dirty = h.team.some((s) => spySet.has(s));
          h.votes.forEach((yes, i) => (score[i] += dirty ? (yes ? -1 : 1.2) : yes ? 0.3 : -0.3));
        }
        const cands: Scored<Move>[] = [];
        for (let i = 0; i < v.players; i++) if (!spySet.has(i) && i !== me) cands.push({ move: { type: 'hunt', target: i }, score: score[i] + ctx.rng() * 0.1 });
        return pickByLevel(cands, ctx.level, ctx.rng);
      }
    }
  },
};
