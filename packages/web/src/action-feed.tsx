/**
 * 「상대가 뭘 했는지」 보여 주기 (모든 게임 공용). 게임 상태는 건드리지 않고 화면 위에 잠깐 겹쳐 그린다.
 *
 *  - 자리 강조: 방금 둔 사람의 자리([data-seat="N"])가 한 번 반짝인다
 *  - 말풍선: 그 자리 옆에 「무엇을 했는지」(게임의 describe 문장)가 1.6초 떠 있다. 자리가 화면에 없으면 판 위쪽 가운데
 *  - 날아오기: 이번 변화로 새로 생긴 카드·말(data-flip)은 그 사람 자리에서 날아온다 (useFlip이 takeActor로 읽음)
 *  - 도장: 쪽·뻑·공격·요트처럼 큰 순간은 판 가운데 큰 글씨가 쾅 찍힌다
 *  - 소리: 그 사람 자리 쪽(왼쪽·오른쪽)에서 들리고, 남의 손은 조금 작게
 * 여러 개가 한꺼번에 오면(봇 여럿, 다시 연결) 0.55초 간격으로 차례로 보여 준다.
 */
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { iconize, seatColor } from '@bg/ui';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── 날아오기: 방금 둔 사람 ──
let pending: { seat: number; at: number } | null = null;

/** 이번 렌더의 변화를 만든 사람 (useLogSounds가 렌더 중에 적어 둠) */
export function noteActor(seat: number) {
  pending = { seat, at: typeof performance !== 'undefined' ? performance.now() : Date.now() };
}

/** useFlip이 새로 생긴 요소를 띄울 때 한 번 읽는다 (0.7초 안에 적힌 것만) */
export function peekActor(): number | null {
  if (!pending) return null;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - pending.at > 700) {
    pending = null;
    return null;
  }
  return pending.seat;
}
export function clearActor() {
  pending = null;
}

/** 화면에 보이는 그 사람 자리 (게임마다 data-seat을 단 요소) */
export function seatAnchor(seat: number): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const list = document.querySelectorAll<HTMLElement>(`[data-seat="${seat}"]`);
  for (const el of list) {
    if (el.closest('.lobby')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

/** 자리의 좌우 위치 → 소리 방향 (-0.7 ~ 0.7) */
export function panOf(seat: number): number {
  const el = seatAnchor(seat);
  if (!el || typeof innerWidth === 'undefined') return 0;
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width / 2) / innerWidth;
  return Math.max(-0.7, Math.min(0.7, (x - 0.5) * 1.6));
}

function boardRect(): DOMRect | null {
  const el = document.querySelector('.table-main') ?? document.querySelector('main');
  return el ? el.getBoundingClientRect() : null;
}

/** 자리 반짝 */
export function pulseSeat(seat: number) {
  const el = seatAnchor(seat);
  if (!el) return;
  el.classList.remove('just-acted');
  void el.offsetWidth; // 애니메이션 다시 시작
  el.classList.add('just-acted');
  setTimeout(() => el.classList.remove('just-acted'), 1300);
}

// 같은 자리 말풍선은 하나만 (새 것이 오면 이전 것을 치운다)
const bubbles = new Map<number, () => void>();

/** 말풍선: 그 사람 자리 옆에 「무엇을 했는지」 */
export function callout(seat: number, content: ReactNode, o: { ms?: number } = {}) {
  if (typeof document === 'undefined' || content === null || content === undefined || content === '') return;
  bubbles.get(seat)?.();
  const host = document.createElement('div');
  host.className = 'act-callout';
  host.style.setProperty('--seat', seatColor(seat));
  host.setAttribute('role', 'status');
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<>{iconize(content)}</>);

  // 자리 옆에 붙이기 (자리가 위쪽이면 아래로, 아래쪽이면 위로) — 그려진 뒤 크기를 재서
  requestAnimationFrame(() => {
    if (!host.isConnected) return;
    const anchor = seatAnchor(seat);
    const hb = host.getBoundingClientRect();
    const vw = innerWidth;
    const vh = innerHeight;
    let x: number;
    let y: number;
    let dir: 'down' | 'up';
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      x = r.left + r.width / 2 - hb.width / 2;
      if (r.top + r.height / 2 < vh * 0.55) {
        y = Math.min(r.bottom + 8, vh - hb.height - 8);
        dir = 'down';
      } else {
        y = Math.max(8, r.top - hb.height - 8);
        dir = 'up';
      }
    } else {
      const b = boardRect();
      x = (b ? b.left + b.width / 2 : vw / 2) - hb.width / 2;
      y = (b ? b.top : 0) + 48;
      dir = 'down';
    }
    x = Math.max(8, Math.min(vw - hb.width - 8, x));
    host.style.left = `${x}px`;
    host.style.top = `${y}px`;
    host.dataset.dir = dir;
    host.classList.add('in');
  });

  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    bubbles.delete(seat);
    host.classList.remove('in');
    host.classList.add('out');
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 260);
  };
  bubbles.set(seat, close);
  setTimeout(close, o.ms ?? 1700);
}

export type StampTone = 'good' | 'bad' | 'hot' | 'info';

/** 도장: 판 가운데 큰 글씨 쾅 */
export function stamp(text: ReactNode, tone: StampTone = 'hot') {
  if (typeof document === 'undefined') return;
  const b = boardRect();
  const host = document.createElement('div');
  host.className = `act-stamp ${tone} ${reduced() ? 'still' : ''}`;
  if (b) {
    host.style.left = `${b.left + b.width / 2}px`;
    host.style.top = `${b.top + b.height * 0.42}px`;
  }
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<span>{iconize(text)}</span>);
  setTimeout(() => {
    root.unmount();
    host.remove();
  }, 1250);
}

/** 판 흔들림 (큰 공격·쪽 같은 순간). 화면 맞춤 배율 밖의 .table-main 전체를 살짝 */
export function shakeBoard(strength = 1) {
  if (reduced() || typeof document === 'undefined') return;
  const el = document.querySelector<HTMLElement>('.table-main');
  if (!el) return;
  const d = 5 * strength;
  el.animate(
    [{ transform: 'translate(0,0)' }, { transform: `translate(${-d}px, ${d / 2}px)` }, { transform: `translate(${d}px, ${-d / 2}px)` }, { transform: `translate(${-d / 2}px, 0)` }, { transform: 'translate(0,0)' }],
    { duration: 320, easing: 'ease-out' },
  );
}
