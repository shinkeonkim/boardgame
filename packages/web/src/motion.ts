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

/**
 * 고유 id가 없는 것(공장의 타일, 불꽃 더미 등)을 「날려 보내는」 움직임.
 * 도착한 요소(to)의 모양을 복제해 문서 맨 위(배율 밖)에 띄우고 from 자리에서 to 자리로 보낸다.
 * count개면 조금씩 늦게 차례로. 끝나면 복제본은 지운다.
 */
export function flyClone(
  from: Element | DOMRect | null | undefined,
  to: Element | null | undefined,
  opts: { count?: number; delay?: number; duration?: number; /** 도착 요소 대신 이 요소의 모양으로 날림 (도착 칸 가운데에 내려앉음) */ like?: Element | null } = {},
) {
  if (!from || !to || reduced() || typeof document === 'undefined') return;
  const a = from instanceof Element ? from.getBoundingClientRect() : from;
  const look = (opts.like ?? to) as HTMLElement;
  const tb = to.getBoundingClientRect();
  const lb = look.getBoundingClientRect();
  if (!tb.width || !a.width || !lb.width) return;
  // 모양 요소 크기로, 도착 칸 가운데에
  const b = opts.like ? new DOMRect(tb.left + tb.width / 2 - lb.width / 2, tb.top + tb.height / 2 - lb.height / 2, lb.width, lb.height) : tb;
  const n = Math.max(1, Math.min(opts.count ?? 1, 6));
  for (let i = 0; i < n; i++) {
    const ghost = look.cloneNode(true) as HTMLElement;
    ghost.removeAttribute('data-flip');
    Object.assign(ghost.style, {
      position: 'fixed',
      left: `${b.left}px`,
      top: `${b.top}px`,
      width: `${b.width}px`,
      height: `${b.height}px`,
      margin: '0',
      zIndex: '60',
      pointerEvents: 'none',
      boxSizing: 'border-box',
      animation: 'none',
    });
    // 배율(zoom) 안의 크기 그대로 보이게: 복제본은 배율 밖이므로 원래 글자·테두리 크기를 배율만큼 키운다
    const z = look.offsetWidth ? lb.width / look.offsetWidth : 1;
    if (Math.abs(z - 1) > 0.02) ghost.style.zoom = String(z);
    if (Math.abs(z - 1) > 0.02) Object.assign(ghost.style, { left: `${b.left / z}px`, top: `${b.top / z}px`, width: `${b.width / z}px`, height: `${b.height / z}px` });
    document.body.appendChild(ghost);
    const dx = (a.left + a.width / 2 - (b.left + b.width / 2)) / z + (i - (n - 1) / 2) * 6;
    const dy = (a.top + a.height / 2 - (b.top + b.height / 2)) / z;
    const anim = ghost.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(0.9)`, opacity: 0.95 },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 24}px) scale(1.1)`, opacity: 1, offset: 0.55 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      ],
      { duration: opts.duration ?? 520, delay: (opts.delay ?? 0) + i * 70, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)', fill: 'backwards' },
    );
    // 날아가는 동안 진짜 도착 요소는 잠깐 숨긴다 (두 개로 보이지 않게)
    const target = to as HTMLElement;
    if (i === 0 && !opts.like) target.style.visibility = 'hidden';
    anim.onfinish = anim.oncancel = () => {
      ghost.remove();
      if (i === n - 1 && !opts.like) target.style.visibility = '';
    };
  }
}
