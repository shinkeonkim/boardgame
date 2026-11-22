/**
 * 화면 움직임 (FLIP). 게임은 움직일 요소에 data-flip="고유id"만 붙이면 된다.
 *  - 같은 id가 다른 자리로 옮겨 가면 → 이전 자리에서 새 자리로 미끄러지듯 이동
 *    (손패 → 줄, 은행 → 내 보석, 공장 → 작업대 …)
 *  - 처음 보이는 id → 살짝 커지며 나타남 (새로 뽑은 카드 등)
 *  - data-flip-enter="none"이면 나타남 효과 없음 (자주 생겼다 사라지는 표시용)
 * TableLayout이 화면 전체에 대해 한 번 건다. 모든 렌더 뒤에 위치를 재고, 스크롤·크기 변화는 다시 잰다.
 * prefers-reduced-motion이면 움직이지 않는다.
 */
import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';

type Snap = Map<string, DOMRect>;

function measure(root: HTMLElement): Snap {
  const out: Snap = new Map();
  root.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
    const id = el.dataset.flip;
    if (id) out.set(id, el.getBoundingClientRect());
  });
  return out;
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useFlip(root: RefObject<HTMLElement>) {
  const prev = useRef<Snap | null>(null);

  // 모든 렌더 뒤: 이전 위치와 비교해 움직임
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const before = prev.current;
    const now = measure(el);
    prev.current = now;
    if (!before || reduced()) return;
    el.querySelectorAll<HTMLElement>('[data-flip]').forEach((node) => {
      const id = node.dataset.flip!;
      const r = now.get(id);
      if (!r) return;
      const p = before.get(id);
      if (p) {
        const dx = p.left - r.left;
        const dy = p.top - r.top;
        if (Math.abs(dx) + Math.abs(dy) < 3) return;
        // 화면 맞춤 배율(zoom) 안에서는 transform 픽셀도 배율만큼 커지므로 되돌린다
        const scale = node.offsetWidth ? r.width / node.offsetWidth : 1;
        const s = scale > 0.2 ? scale : 1;
        const dist = Math.hypot(dx, dy);
        node.animate([{ transform: `translate(${dx / s}px, ${dy / s}px)`, zIndex: 5 }, { transform: 'translate(0, 0)', zIndex: 5 }], {
          duration: Math.min(560, 260 + dist * 0.35),
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        });
      } else if (node.dataset.flipEnter !== 'none') {
        node.animate([{ opacity: 0, transform: 'scale(0.7)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      }
    });
  });

  // 스크롤·화면 크기 변화로 위치가 바뀐 건 움직임이 아니다 → 다시 재 둔다
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;
    const remeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (root.current) prev.current = measure(root.current);
      });
    };
    el.addEventListener('scroll', remeasure, true);
    addEventListener('resize', remeasure);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', remeasure, true);
      removeEventListener('resize', remeasure);
    };
  }, [root]);
}
