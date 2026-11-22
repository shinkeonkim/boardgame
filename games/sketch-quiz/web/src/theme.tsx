import { useEffect, useRef } from 'react';
import { Stroke, decodePts } from '@bg/sketch-quiz-engine';

/** 그림판 비율 (가로 1000 × 세로 750 좌표) */
export const W = 1000;
export const H = 750;

export function drawStroke(ctx: CanvasRenderingContext2D, s: { c: string; w: number }, pts: number[], sx: number, sy: number) {
  if (pts.length < 2) return;
  ctx.strokeStyle = s.c;
  ctx.fillStyle = s.c;
  ctx.lineWidth = s.w * sx;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (pts.length === 2) {
    ctx.beginPath();
    ctx.arc(pts[0] * sx, (pts[1] * sy * W) / H, (s.w * sx) / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0] * sx, (pts[1] * sy * W) / H);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] * sx, (pts[i + 1] * sy * W) / H);
  ctx.stroke();
}

/** 읽기 전용 그림 (표지·시연용) */
export function Sketch({ strokes, className }: { strokes: Stroke[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(1, r.width * dpr);
    cv.height = Math.max(1, r.height * dpr);
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const sx = cv.width / W;
    for (const s of strokes) drawStroke(ctx, s, decodePts(s.p), sx, (cv.height / H) * (H / W));
  }, [strokes]);
  return <canvas ref={ref} className={`sq-canvas ${className ?? ''}`} aria-hidden />;
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#2c6fa8" />
      <rect x="9" y="12" width="46" height="36" rx="4" fill="#fffdf6" />
      <path d="M16 38 q6 -14 12 -4 t12 -6" stroke="#c0392b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="22" r="4" fill="#f1c40f" />
      <path d="M40 54 l14 -14 l4 4 l-14 14 z" fill="#f1a33a" />
      <path d="M40 54 l-3 7 l7 -3 z" fill="#3a2a1a" />
    </svg>
  );
}

/** 예시 그림 (집과 해) — 시연·표지 */
const enc = (xs: number[]) => {
  const B = '0123456789abcdefghijklmnopqrstuv';
  return xs.map((x) => B[x >> 5] + B[x & 31]).join('');
};
export const SAMPLE: Stroke[] = [
  { c: '#8b5a2b', w: 14, p: enc([250, 620, 250, 380, 520, 380, 520, 620, 250, 620]) },
  { c: '#c0392b', w: 14, p: enc([220, 400, 385, 230, 550, 400]) },
  { c: '#2980b9', w: 7, p: enc([300, 450, 360, 450, 360, 510, 300, 510, 300, 450]) },
  { c: '#1d1a16', w: 7, p: enc([420, 620, 420, 500, 480, 500, 480, 620]) },
  { c: '#f1c40f', w: 14, p: enc([828, 185, 823, 204, 809, 218, 790, 223, 771, 218, 757, 204, 752, 185, 757, 166, 771, 152, 790, 147, 809, 152, 823, 166, 828, 185]) },
  { c: '#f1c40f', w: 7, p: enc([790, 95, 790, 125]) },
  { c: '#f1c40f', w: 7, p: enc([880, 185, 850, 185]) },
  { c: '#f1c40f', w: 7, p: enc([700, 185, 730, 185]) },
  { c: '#f1c40f', w: 7, p: enc([855, 120, 835, 140]) },
  { c: '#f1c40f', w: 7, p: enc([725, 120, 745, 140]) },
  { c: '#27ae60', w: 14, p: enc([80, 650, 300, 640, 600, 655, 920, 640]) },
];
