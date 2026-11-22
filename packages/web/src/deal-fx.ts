/**
 * 카드 섞기·나눠 주기 연출 (모든 카드 게임 공용). DOM 위에 잠깐 겹쳐 그리고 사라지는 장식 — 게임 상태는 건드리지 않는다.
 *
 *   useDealFx(`${g.round}`)                         판이 바뀔 때마다: 테이블 가운데서 섞고 → 자리마다 나눠 줌
 *   useDealFx(key, { per: 2, seats: '.hd-seat', hand: '.hd-actions', origin: '.hd-board' })   레이아웃이 다른 게임
 *
 * 기본 대상: 좌석 줄(.seat-row[data-seat]) + 내 손패(.hand-panel). 카드 뒷면은 지금 꾸미기(--card-back)를 따른다.
 */
import { useEffect, useRef } from 'react';
import { sound } from './sound';

export interface DealFxOptions {
  /** 자리마다 날릴 카드 수 (보이는 장수 — 실제 손패 수가 아니어도 됨, 최대 4) */
  per?: number;
  /** 섞는 곳 (기본: 테이블 가운데) */
  origin?: string;
  /** 받는 자리 (기본: 좌석 줄) */
  seats?: string;
  /** 내 손패 (기본: .hand-panel) — 마지막에 내 쪽으로 몇 장 더 */
  hand?: string | null;
  /** 처음 화면을 열었을 때도 재생 (예: 게임 시작 직후 첫 판) */
  initial?: boolean;
  /** 섞기 생략 (나눠 주기만) */
  noShuffle?: boolean;
}

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const W = 46;
const H = 64;

function makeCard(x: number, y: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pc back deal-fx-card';
  Object.assign(el.style, {
    position: 'fixed',
    left: `${x - W / 2}px`,
    top: `${y - H / 2}px`,
    width: `${W}px`,
    height: `${H}px`,
    borderRadius: '6px',
    zIndex: '70',
    pointerEvents: 'none',
    ['--w' as string]: `${W}px`,
  });
  document.body.appendChild(el);
  return el;
}

const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** 한 번 재생 (훅 없이도 부를 수 있음). 끝나는 시간(ms)을 돌려줌 */
export function playShuffleDeal(o: DealFxOptions = {}): number {
  if (reduced() || typeof document === 'undefined') return 0;
  const originEl = document.querySelector(o.origin ?? '.table-main') ?? document.querySelector('main');
  if (!originEl) return 0;
  const c = center(originEl);
  const seatEls = [...document.querySelectorAll(o.seats ?? '.seat-row[data-seat]')].filter((e) => e.getBoundingClientRect().width > 0);
  const handEl = o.hand === null ? null : document.querySelector(o.hand ?? '.hand-panel');
  const per = Math.max(1, Math.min(4, o.per ?? 2));
  let t = 0;

  // 1) 섞기: 두 더미로 갈라 → 엇갈려 떨어지며 합쳐짐 → 반듯하게
  if (!o.noShuffle) {
    const n = 12;
    const cards = Array.from({ length: n }, () => makeCard(c.x, c.y));
    cards.forEach((el, i) => {
      const left = i % 2 === 0;
      const side = left ? -1 : 1;
      const k = Math.floor(i / 2);
      const a = el.animate(
        [
          { transform: `translate(0, ${-k * 0.6}px)`, offset: 0 },
          { transform: `translate(${side * 34}px, ${-k * 0.8}px) rotate(${side * 9}deg)`, offset: 0.35 },
          { transform: `translate(${side * 30}px, ${-k * 0.8 - 10}px) rotate(${side * 14}deg)`, offset: 0.5 },
          { transform: `translate(${side * 4}px, ${-i * 0.5}px) rotate(${side * 2}deg)`, offset: 0.78 + (i / n) * 0.12 },
          { transform: `translate(0, ${-i * 0.5}px)`, offset: 1 },
        ],
        { duration: 900, easing: 'cubic-bezier(0.3, 0.7, 0.3, 1)', fill: 'forwards' },
      );
      a.onfinish = () => el.remove();
    });
    sound.fx('shuffle');
    t = 900;
  }

  // 2) 나눠 주기: 자리를 돌며 한 장씩
  const targets: Element[] = [];
  for (let r = 0; r < per; r++) for (const s of seatEls) targets.push(s);
  if (handEl) for (let r = 0; r < Math.min(per, 2); r++) targets.push(handEl);
  const step = Math.max(45, Math.min(110, 1300 / Math.max(1, targets.length)));
  targets.forEach((target, i) => {
    const d = center(target);
    const el = makeCard(c.x, c.y);
    el.style.opacity = '0';
    const spin = ((i * 47) % 30) - 15;
    const anim = el.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(${(d.x - c.x) * 0.55}px, ${(d.y - c.y) * 0.55 - 26}px) rotate(${spin * 2}deg) scale(1.02)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${d.x - c.x}px, ${d.y - c.y}px) rotate(${spin}deg) scale(0.55)`, opacity: 0 },
      ],
      { duration: 420, delay: t + i * step, easing: 'cubic-bezier(0.25, 0.8, 0.35, 1)', fill: 'both' },
    );
    anim.onfinish = () => {
      el.remove();
      // 받은 자리가 톡
      (target as HTMLElement).animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }], { duration: 220 });
    };
    if (i % 2 === 0) sound.fx('deal', (t + i * step) / 1000);
  });
  return t + targets.length * step + 420;
}

/** key가 바뀔 때마다(새 판·새 핸드) 섞고 나눠 줌. 처음 열 때는 initial일 때만 */
export function useDealFx(key: string | number | null | undefined, o: DealFxOptions = {}) {
  const last = useRef<typeof key>(o.initial ? undefined : key);
  const opts = useRef(o);
  opts.current = o;
  useEffect(() => {
    if (key === null || key === undefined || key === last.current) return;
    last.current = key;
    // 새 판 화면이 그려진 뒤 (자리 위치를 재려고)
    const id = requestAnimationFrame(() => playShuffleDeal(opts.current));
    return () => cancelAnimationFrame(id);
  }, [key]);
}
