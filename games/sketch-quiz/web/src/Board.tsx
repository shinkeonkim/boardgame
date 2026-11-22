import { PointerEvent, useEffect, useRef, useState } from 'react';
import { Move, PALETTE, SIZES, Stroke, decodePts } from '@bg/sketch-quiz-engine';
import { H, W, drawStroke } from './theme';

/**
 * 그림판. 그리는 사람이면 손가락·마우스로 그리고, 0.15초마다 이어진 조각을 보낸다.
 * 서버에서 온 선을 다 그린 뒤, 아직 안 보낸 내 선을 위에 덧그린다 (끊김 없이 보이게).
 */
export function Board({ strokes, canDraw, send }: { strokes: Stroke[]; canDraw: boolean; send: (m: Move) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(PALETTE[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const live = useRef<{ pts: number[]; sent: number; started: boolean; c: string; w: number } | null>(null);
  const timer = useRef<number | null>(null);

  const paint = () => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#fffdf6';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const sx = cv.width / W;
    const sy = cv.height / W;
    for (const s of strokes) drawStroke(ctx, s, decodePts(s.p), sx, sy);
    const l = live.current;
    if (l) drawStroke(ctx, l, l.pts, sx, sy);
  };

  // 크기 맞추기
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const fit = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
      paint();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    return () => ro.disconnect();
  }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(paint, [strokes]); // eslint-disable-line react-hooks/exhaustive-deps

  const flush = () => {
    const l = live.current;
    if (!l || l.pts.length <= l.sent) return;
    // 이어 보낼 때는 앞 조각의 마지막 점부터 이어지게
    const chunk = l.pts.slice(l.sent);
    send({ type: 'stroke', c: l.c, w: l.w, p: chunk, cont: l.started });
    l.started = true;
    l.sent = l.pts.length;
  };
  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * W), Math.round(((e.clientY - r.top) / r.height) * H)].map((x) => Math.max(0, Math.min(W, x)));
  };
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    live.current = { pts: point(e), sent: 0, started: false, c: eraser ? '#ffffff' : color, w: eraser ? Math.max(14, size * 2) : size };
    paint();
    timer.current = window.setInterval(flush, 150);
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const l = live.current;
    if (!l) return;
    const [x, y] = point(e);
    const px = l.pts[l.pts.length - 2];
    const py = l.pts[l.pts.length - 1];
    // 너무 가까운 점은 버림 (보내는 양 줄이기)
    if (Math.hypot(x - px, y - py) < 5) return;
    l.pts.push(x, y);
    paint();
  };
  const up = () => {
    if (!live.current) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    flush();
    live.current = null;
  };
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  return (
    <div className="sq-board">
      <canvas
        ref={ref}
        className={`sq-canvas ${canDraw ? 'drawing' : ''}`}
        style={{ aspectRatio: `${W} / ${H}` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label={canDraw ? '그림판 — 그려요' : '그림'}
      />
      {canDraw && (
        <div className="sq-tools" role="toolbar" aria-label="그리기 도구">
          <span className="sq-colors">
            {PALETTE.filter((c) => c !== '#ffffff').map((c) => (
              <button key={c} className={`sq-color ${!eraser && color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => (setColor(c), setEraser(false))} aria-label={`색 ${c}`} />
            ))}
          </span>
          <span className="sq-sizes">
            {SIZES.map((s) => (
              <button key={s} className={`sq-size ${size === s ? 'on' : ''}`} onClick={() => setSize(s)} aria-label={`굵기 ${s}`}>
                <i style={{ width: Math.max(4, s * 0.8), height: Math.max(4, s * 0.8) }} />
              </button>
            ))}
          </span>
          <span className="row tight">
            <button className={`btn tiny ${eraser ? 'primary' : ''}`} onClick={() => setEraser((x) => !x)}>
              🧽 지우개
            </button>
            <button className="btn tiny" onClick={() => send({ type: 'undo' })} disabled={!strokes.length}>
              ↶ 되돌리기
            </button>
            <button className="btn tiny" onClick={() => send({ type: 'clear' })} disabled={!strokes.length}>
              🗑 모두 지우기
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
