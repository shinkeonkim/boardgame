/**
 * 화면 움직임 (FLIP). 게임은 움직일 요소에 data-flip="고유id"만 붙이면 된다.
 *  - 같은 id가 다른 자리로 옮겨 가면 → 이전 자리에서 새 자리로 미끄러지듯 이동
 *    (손패 → 줄, 은행 → 내 보석, 공장 → 작업대 …)
 *  - 처음 보이는 id → 남이 둔 것이면 그 사람 자리에서 날아오고, 아니면 살며시 나타남
 *  - data-flip-enter="none"이면 나타남 효과 없음 (자주 생겼다 사라지는 표시용)
 * 실제 손놀림처럼 단계를 나눌 수 있다 (한 번의 상태 변화 안에서):
 *  - data-flip-via="id"   : 그 id가 「있던 자리」를 거쳐 간다 (화투: 손 → 맞춘 바닥 카드 위 → 먹은 패)
 *  - data-flip-delay="ms" : 그만큼 제자리에 머물렀다 움직인다 (먼저 친 카드가 내려앉은 뒤에 쓸어 감)
 *  - data-flip-land="slap": 내려앉을 때 살짝 눌렸다 펴짐 (내리치는 느낌, 번쩍임 없음)
 * TableLayout이 화면 전체에 대해 한 번 건다. 모든 렌더 뒤에 위치를 재고, 스크롤·크기 변화는 다시 잰다.
 * prefers-reduced-motion이면 움직이지 않는다.
 */
import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { clearActor, peekActor, peekMe, seatAnchor } from './action-feed';

/** 위치 + 그 카드가 속한 구역(손패·자리·가운데)의 위치. 구역째 밀려난 건 움직임이 아니다 */
interface Spot {
  r: DOMRect;
  scope: Element | null;
  sr: DOMRect | null;
  /** 배치상 위치(transform 제외): 들어 올림·부채꼴 회전 같은 겉모습 변화는 움직임이 아니다 */
  lx: number;
  ly: number;
}

/** offsetParent를 따라 더한 배치 위치 (transform·애니메이션의 영향 없음) */
function layoutXY(el: Element | null): [number, number] {
  let x = 0;
  let y = 0;
  let e = el as HTMLElement | null;
  while (e) {
    x += e.offsetLeft;
    y += e.offsetTop;
    e = e.offsetParent as HTMLElement | null;
  }
  return [x, y];
}
type Snap = Map<string, Spot> & { fit?: string };
const SCOPE = '[data-flip-scope], .hand-panel, [data-seat], .sr-center';

/** 새 요소가 날아올 출발점: data-flip-from="선택자"(예: 더미) > 방금 둔 사람 자리 */
function fromOf(node: HTMLElement, actor: number | null): Element | null {
  const sel = node.dataset.flipFrom;
  if (sel) {
    if (sel === 'none') return null;
    if (/^\d+$/.test(sel)) return seatAnchor(Number(sel));
    return document.querySelector(sel);
  }
  return actor === null ? null : seatAnchor(actor);
}

function measure(root: HTMLElement): Snap {
  const out: Snap = new Map();
  // 판 맞춤 배율(fitMain)이 바뀌면 모든 게 같이 줄거나 커진다 — 그건 움직임이 아님
  out.fit = root.querySelector<HTMLElement>('.table-main')?.dataset.fit ?? '';
  const scopes = new Map<Element, DOMRect>();
  root.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
    const id = el.dataset.flip;
    if (!id) return;
    const scope = el.parentElement?.closest(SCOPE) ?? null;
    let sr: DOMRect | null = null;
    if (scope) {
      sr = scopes.get(scope) ?? scope.getBoundingClientRect();
      scopes.set(scope, sr);
    }
    const [ex, ey] = layoutXY(el);
    const [sx, sy] = scope ? layoutXY(scope) : [0, 0];
    out.set(id, { r: el.getBoundingClientRect(), scope, sr, lx: ex - sx, ly: ey - sy });
  });
  return out;
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.22, 0.8, 0.28, 1)';

const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/**
 * 한 요소를 시작점(from) → (경유점 via) → 제자리로. 좌표는 화면 기준 중심점.
 * 크기는 시작 요소 크기에서 제 크기로 자연스럽게 (손패의 큰 카드가 먹은 패의 작은 카드가 되는 등).
 */
function travel(node: HTMLElement, r: DOMRect, from: DOMRect, o: { via?: DOMRect | null; delay?: number; land?: string | undefined; duration?: number; hidden?: boolean }) {
  const scale = node.offsetWidth ? r.width / node.offsetWidth : 1;
  const z = scale > 0.2 ? scale : 1; // 화면 맞춤 배율(zoom) 보정
  const c = center(r);
  const off = (p: DOMRect) => {
    const q = center(p);
    return { x: (q.x - c.x) / z, y: (q.y - c.y) / z, s: r.width ? Math.max(0.4, Math.min(2.2, p.width / r.width)) : 1 };
  };
  const a = off(from);
  const v = o.via ? off(o.via) : null;
  const dist = Math.hypot(a.x, a.y) + (v ? Math.hypot(a.x - v.x, a.y - v.y) : 0);
  const duration = o.duration ?? Math.min(720, 300 + dist * 0.4) + (v ? 260 : 0);
  const frames: Keyframe[] = [{ transform: `translate(${a.x}px, ${a.y}px) scale(${a.s})`, zIndex: 6, ...(o.hidden ? { opacity: 0 } : {}) }];
  // 나눠 받는 카드: 떠나기 전엔 보이지 않다가(아직 더미 속) 더미를 떠나는 순간부터 보임
  if (o.hidden) frames.push({ transform: `translate(${a.x}px, ${a.y}px) scale(${a.s})`, zIndex: 6, opacity: 1, offset: 0.06 });
  if (v) {
    // 경유점에 내려앉아 잠깐 머무름 (맞춘 카드 위에 탁 → 같이 쓸어 감)
    frames.push({ transform: `translate(${v.x}px, ${v.y - 2}px) scale(${v.s})`, zIndex: 6, offset: 0.38, easing: 'ease-in' });
    frames.push({ transform: `translate(${v.x}px, ${v.y}px) scale(${v.s * 0.98})`, zIndex: 6, offset: 0.46 });
    frames.push({ transform: `translate(${v.x}px, ${v.y}px) scale(${v.s})`, zIndex: 6, offset: 0.62, easing: EASE });
  }
  if (o.land === 'slap') {
    frames.push({ transform: 'translate(0, -3px) scale(1.02)', zIndex: 6, offset: 0.86, easing: 'ease-in' });
    frames.push({ transform: 'translate(0, 0) scale(0.985)', zIndex: 6, offset: 0.93 });
  }
  frames.push({ transform: 'translate(0, 0) scale(1)', zIndex: 6 });
  node.animate(frames, { duration, delay: o.delay ?? 0, easing: v || o.land ? 'linear' : EASE, fill: 'backwards' });
}

export function useFlip(root: RefObject<HTMLElement>) {
  const prev = useRef<Snap | null>(null);

  // 모든 렌더 뒤: 이전 위치와 비교해 움직임
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const before = prev.current;
    const now = measure(el);
    prev.current = now;
    const actor = peekActor();
    const dealOnMount = el.dataset.dealOnMount === '1';
    if ((!before && !dealOnMount) || reduced()) {
      clearActor();
      return;
    }
    // 더미 같은 곳에서 여러 장이 한꺼번에 나오면(나눠 주기) 자리를 번갈아 한 장씩, 차례로
    const dealt = new Map<HTMLElement, number>();
    {
      const groups = new Map<string, HTMLElement[]>();
      el.querySelectorAll<HTMLElement>('[data-flip][data-flip-from]').forEach((node) => {
        const sel = node.dataset.flipFrom;
        if (!sel || sel === 'none' || /^\d+$/.test(sel) || before?.has(node.dataset.flip!) || node.dataset.flipEnter === 'none') return;
        const g = (node.closest('[data-seat]') as HTMLElement | null)?.dataset.seat ?? '_';
        const key = `${sel}|${g}`;
        groups.set(key, [...(groups.get(key) ?? []), node]);
      });
      const list = [...groups.values()];
      const many = list.reduce((a, x) => a + x.length, 0) > 1;
      if (many) list.forEach((nodes, gi) => nodes.forEach((n, k) => dealt.set(n, Math.min(2400, (k * list.length + gi) * 85))));
    }
    el.querySelectorAll<HTMLElement>('[data-flip]').forEach((node) => {
      const id = node.dataset.flip!;
      const spot = now.get(id);
      if (!spot) return;
      const r = spot.r;
      const ps = before?.get(id);
      if (ps && before && before.fit !== now.fit) return;
      // 같은 구역 안에서 제자리면(구역째 밀려났을 뿐이면) 움직이지 않음 — 남의 손패가 늘어 내 손이 밀리는 경우 등
      if (ps && ps.scope && ps.scope === spot.scope && Math.abs(ps.lx - spot.lx) + Math.abs(ps.ly - spot.ly) < 3) return;
      const p = ps?.r;
      const viaId = node.dataset.flipVia;
      const via = viaId ? (before?.get(viaId)?.r ?? null) : null;
      const delay = (Number(node.dataset.flipDelay ?? 0) || 0) + (dealt.get(node) ?? 0);
      const land = node.dataset.flipLand;
      if (p) {
        if (Math.abs(p.left - r.left) + Math.abs(p.top - r.top) < 3) return;
        travel(node, r, p, { via, delay, land });
      } else if (node.dataset.flipEnter !== 'none') {
        // 처음 그리는 화면: 막 시작한 판(dealOnMount)에서 더미에서 나오는 카드만 움직임
        if (!before && !(dealOnMount && node.dataset.flipFrom)) return;
        // 남이 방금 둔 것: 그 사람 자리(또는 data-flip-from이 가리키는 곳)에서 날아온다
        const src = fromOf(node, actor);
        // 남이 한 동작이라도 「내 영역」(내 손패·내 먹은 패·아래 내 자리)에 새로 생긴 건 그 사람 자리에서 날아오지 않는다
        const me = peekMe();
        const mine = !node.dataset.flipFrom && !!node.closest(`.hand-panel, .sr-bottom, .gs-me${me !== null ? `, [data-seat="${me}"]` : ''}`);
        const own = (actor !== null && !node.dataset.flipFrom && !via && node.closest(`[data-seat="${actor}"]`)) || mine;
        if (src && !own) {
          const a = src.getBoundingClientRect();
          // 자리 상자는 카드보다 크므로 카드 크기로 줄여 가운데서 출발
          const w = Math.min(a.width, r.width);
          const h = Math.min(a.height, r.height);
          const start = new DOMRect(a.left + a.width / 2 - w / 2, a.top + a.height / 2 - h / 2, w, h);
          travel(node, r, start, { via, delay, land: land ?? (dealt.has(node) ? undefined : 'slap'), hidden: dealt.has(node) || delay > 0, duration: dealt.has(node) ? 420 : undefined });
        } else node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay, easing: 'ease-out', fill: 'backwards' });
      }
    });
    clearActor();
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
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 10}px) scale(1.02)`, opacity: 1, offset: 0.55 },
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
