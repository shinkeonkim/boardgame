/**
 * 화면을 「실제 손놀림 순서」대로 보여 주기.
 *
 * 서버는 한 동작의 결과(최종 상태)를 한 번에 보낸다. 그대로 그리면 카드가 이미 먹은 패에 들어가 있고
 * 점수도 바뀐 뒤에 움직임이 따라와서 어색하다. 게임은 stage(이전 상태, 다음 상태)로 「중간 장면」들을 만들어 주고,
 * 이 훅이 그 장면들을 차례로 보여 준 뒤 최종 상태로 넘어간다. 장면이 바뀔 때마다 useFlip이 카드를 옮긴다.
 *
 *   고스톱: [낸 카드가 바닥에 놓인 장면] → [더미 카드가 뒤집혀 놓인 장면] → 최종(먹은 카드가 쓸려 감)
 *
 * - 보여 주는 동안은 아무도 차례가 아닌 것으로 그린다 (내가 미리 누를 수 없게)
 * - 그 사이 새 상태가 오면 줄을 세우고, 많이 밀리면(3개 이상) 중간 장면 없이 따라잡는다
 * - 사람 목록·연결 상태 등 방 정보는 늘 최신 것을 쓴다
 */
import { useEffect, useRef, useState } from 'react';
import type { RoomView } from '@bg/core';

export interface Step<G> {
  game: G;
  /** 이 장면을 보여 줄 시간 */
  ms: number;
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useStagedView<G, C>(view: RoomView<G, C>, stage: (prev: G, next: G) => Step<G>[] | null | undefined): RoomView<G, C> {
  const [shown, setShown] = useState(view);
  const shownRef = useRef(view);
  const queue = useRef<RoomView<G, C>[]>([]);
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  const show = (v: RoomView<G, C>) => {
    shownRef.current = v;
    setShown(v);
  };

  const pump = () => {
    if (busy.current) return;
    const next = queue.current.shift();
    if (!next) return;
    const prev = shownRef.current;
    let steps: Step<G>[] = [];
    if (queue.current.length < 2 && !reduced() && prev.game && next.game) {
      try {
        steps = stageRef.current(prev.game, next.game) ?? [];
      } catch {
        steps = [];
      }
    }
    busy.current = true;
    let i = 0;
    const run = () => {
      if (i < steps.length) {
        const s = steps[i++];
        show({ ...next, game: s.game, actors: [] });
        timer.current = window.setTimeout(run, s.ms);
      } else {
        show(next);
        busy.current = false;
        pump();
      }
    };
    run();
  };

  useEffect(() => {
    if (view === shownRef.current) return;
    // 게임 밖(로비·결과) 변화나 게임이 새로 생긴 경우는 바로
    if (!view.game || !shownRef.current.game) {
      queue.current = [];
      window.clearTimeout(timer.current);
      busy.current = false;
      show(view);
      return;
    }
    queue.current.push(view);
    pump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // 방 정보(사람·연결·남은 시간)는 최신으로
  return shown === view ? view : { ...shown, members: view.members };
}

/** 트릭 게임(하트·궤도 임무)의 공통 모양 */
interface TrickView {
  round: number;
  me: number;
  hand: { id: string }[];
  handCounts: number[];
  trick: { seat: number; card: { id: string } }[];
  lastTrick: { plays: { seat: number; card: { id: string } }[]; winner: number } | null;
  log: { n: number; type: string }[];
}

/**
 * 트릭이 끝나는 순간: 서버는 「트릭 끝·가운데 비움」을 한 번에 보낸다.
 * 중간 장면으로 마지막 카드까지 가운데에 놓인 모습을 잠깐 보여 준 뒤, 최종 장면에서 이긴 사람 쪽으로 쓸려 간다.
 */
export function stageTrickEnd<G extends TrickView>(prev: G, next: G, ms = 1100): Step<G>[] | null {
  if (prev.round !== next.round || !next.lastTrick) return null;
  const lastN = prev.log.length ? prev.log[prev.log.length - 1].n : -1;
  const end = next.log.find((e) => e.n > lastN && e.type === 'trick');
  if (!end) return null;
  const plays = next.lastTrick.plays;
  const fresh = plays.filter((p) => !prev.trick.some((q) => q.card.id === p.card.id));
  const hand = prev.hand.filter((c) => !fresh.some((p) => p.seat === prev.me && p.card.id === c.id));
  const handCounts = prev.handCounts.map((n, s) => n - fresh.filter((p) => p.seat === s).length);
  return [{ game: { ...prev, trick: plays, lastTrick: prev.lastTrick, hand, handCounts, log: next.log.filter((e) => e.n < end.n) }, ms }];
}
