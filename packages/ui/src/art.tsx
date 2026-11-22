/**
 * 카드 일러스트 도우미 (SVG, 그림 파일 없음).
 * 역할 카드(인물)는 <Bust>로 머리·어깨를 그리고, 게임이 모자·소품·배경을 얹는다.
 * 좌표계: 가로 60 × 세로 40 (초상 칸). 카드 위쪽 칸에 preserveAspectRatio="xMidYMid slice"로 채운다.
 */
import { ReactNode } from 'react';

export const SKIN = ['#f1c9a5', '#e0ac85', '#c98e63', '#a8704a'];

/** 머리 + 목 + 어깨(옷). hair는 뒷머리(머리 뒤에 그림), children은 앞(모자·소품) */
export function Bust({ robe, skin = SKIN[0], hair, collar, children, cx = 30 }: { robe: string; skin?: string; hair?: ReactNode; collar?: string; children?: ReactNode; cx?: number }) {
  return (
    <g transform={`translate(${cx - 30} 0)`}>
      {hair}
      {/* 어깨·옷 */}
      <path d="M11 40 C11 30 19 25.5 30 25.5 C41 25.5 49 30 49 40 Z" fill={robe} />
      <path d="M11 40 C11 30 19 25.5 30 25.5 C41 25.5 49 30 49 40 Z" fill="url(#art-shade)" opacity="0.5" />
      {collar && <path d="M24 26 L30 33 L36 26 C34 25.4 32 25.2 30 25.2 C28 25.2 26 25.4 24 26 Z" fill={collar} />}
      {/* 목 */}
      <rect x="27" y="20" width="6" height="7" rx="2" fill={skin} />
      <path d="M27 24 h6 v2.5 c-2 1 -4 1 -6 0 z" fill="#000" opacity="0.12" />
      {/* 머리 */}
      <ellipse cx="30" cy="15.5" rx="6.6" ry="7.6" fill={skin} />
      {/* 볼 그림자 · 눈 */}
      <ellipse cx="30" cy="18" rx="6.4" ry="5" fill="#000" opacity="0.05" />
      <circle cx="27.4" cy="15.6" r="0.75" fill="#2a2018" />
      <circle cx="32.6" cy="15.6" r="0.75" fill="#2a2018" />
      <path d="M28.4 19.6 q1.6 0.9 3.2 0" stroke="#7a4a32" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      {children}
    </g>
  );
}

/** 초상 칸 공통 정의: 옷 그늘, 뒤쪽 빛 */
export function ArtDefs() {
  return (
    <defs>
      <linearGradient id="art-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.35" />
        <stop offset="0.45" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.4" />
      </linearGradient>
      <radialGradient id="art-glow" cx="0.5" cy="0.45" r="0.6">
        <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** 초상 칸 배경: 색 그라디언트 + 뒤쪽 빛 + 아래 바닥 그늘 */
export function PortraitBg({ tone, children }: { tone: string; children?: ReactNode }) {
  return (
    <>
      <rect width="60" height="40" style={{ fill: `color-mix(in srgb, ${tone} 70%, #1a1420)` }} />
      <rect width="60" height="40" fill="url(#art-glow)" />
      {children}
    </>
  );
}
