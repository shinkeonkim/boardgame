/**
 * Sealed Letter 역할 초상 (자체 제작 SVG). 가로 60 × 세로 40 초상 칸.
 * 역할마다 옷·모자·소품·배경이 다르다: 첩자는 달밤의 챙 모자, 파수꾼은 성벽과 창, 점술가는 수정 구슬 …
 */
import type { Kind } from '@bg/sealed-letter-engine';
import { ArtDefs, Bust, PortraitBg, SKIN } from '@bg/ui';

function Scene({ kind, tone }: { kind: Kind; tone: string }) {
  switch (kind) {
    case 'spy': // 달밤, 챙 넓은 모자, 세운 깃
      return (
        <>
          <PortraitBg tone="#2c3550">
            <circle cx="48" cy="9" r="5" fill="#f6efd0" opacity="0.9" />
            <circle cx="46.2" cy="8" r="4.4" style={{ fill: 'color-mix(in srgb, #2c3550 70%, #1a1420)' }} />
            <path d="M0 40 V30 h6 v-5 h5 v7 h6 v-10 h5 v12" fill="#1a1f30" />
          </PortraitBg>
          <Bust robe="#3a3f52" skin={SKIN[1]} collar="#252836">
            <path d="M16 30 L22 25 L24 33 Z M44 30 L38 25 L36 33 Z" fill="#2a2d3c" />
            <path d="M20 12 q10 -7 20 0 l4 1.6 q-14 3 -28 0 z" fill="#1f2230" />
            <rect x="23" y="5.5" width="14" height="6.5" rx="2.5" fill="#1f2230" />
            <rect x="23" y="10" width="14" height="1.6" fill={tone} />
            <rect x="25.6" y="14.6" width="8.8" height="2.2" rx="1" fill="#14161f" />
          </Bust>
        </>
      );
    case 'watch': // 성벽, 철모, 창
      return (
        <>
          <PortraitBg tone="#5d6a2c">
            <path d="M0 40 V22 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 V40 Z" fill="#4a4436" opacity="0.7" />
            <path d="M40 40 V22 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 V40 Z" fill="#4a4436" opacity="0.7" />
          </PortraitBg>
          <line x1="49" y1="3" x2="49" y2="40" stroke="#6b4a2a" strokeWidth="1.6" />
          <path d="M49 1 l2.4 5 h-4.8 z" fill="#c9ccd4" />
          <Bust robe="#6b7a2e" skin={SKIN[2]} collar="#8a8f98">
            <path d="M21.5 13 q8.5 -10 17 0 z" fill="#8a8f98" />
            <path d="M19 13 h22 v1.6 h-22 z" fill="#6f747d" />
            <path d="M22 30 h16 v3 h-16 z" fill="#8a8f98" opacity="0.8" />
          </Bust>
        </>
      );
    case 'seer': // 별 무늬 두건, 수정 구슬
      return (
        <>
          <PortraitBg tone="#4a2f7a">
            {[[8, 8], [14, 18], [50, 6], [53, 20], [6, 28]].map(([x, y], i) => (
              <path key={i} d={`M${x} ${y - 2} l0.6 1.4 1.4 0.6 -1.4 0.6 -0.6 1.4 -0.6 -1.4 -1.4 -0.6 1.4 -0.6z`} fill="#f3e3ff" opacity="0.8" />
            ))}
          </PortraitBg>
          <Bust robe="#6a3fb0" skin={SKIN[0]} hair={<path d="M19 30 Q18 10 30 5 Q42 10 41 30 Z" fill="#4a2a86" />}>
            <path d="M22.5 14 Q23 6 30 6 Q37 6 37.5 14 Q34 9.5 30 9.5 Q26 9.5 22.5 14 Z" fill="#5a34a0" />
            <circle cx="30" cy="34" r="6" fill="#bfe6ff" opacity="0.9" />
            <circle cx="30" cy="34" r="6" fill="url(#art-glow)" />
            <ellipse cx="28" cy="32" rx="2" ry="1.2" fill="#fff" opacity="0.8" />
            <path d="M24 39.5 h12 l-1.5 -2 h-9 z" fill="#c9a24a" />
          </Bust>
        </>
      );
    case 'duelist': // 엇갈린 칼, 깃털 모자, 콧수염
      return (
        <>
          <PortraitBg tone="#7a3f22" />
          <g stroke="#d8dce4" strokeWidth="1.6" strokeLinecap="round">
            <line x1="6" y1="6" x2="52" y2="38" />
            <line x1="54" y1="6" x2="8" y2="38" />
          </g>
          <g fill="#c9a24a">
            <rect x="9.5" y="7" width="5" height="1.6" transform="rotate(35 12 8)" />
            <rect x="45.5" y="7" width="5" height="1.6" transform="rotate(-35 48 8)" />
          </g>
          <Bust robe="#a3522a" skin={SKIN[1]} collar="#f3e7d0">
            <path d="M21 11 q9 -6 18 0 l-1 2 h-16 z" fill="#3a2a22" />
            <path d="M36 9 q8 -8 10 -2 q-4 0 -8 4 z" fill="#e8d36a" />
            <path d="M26.6 18.4 q1.8 -1.2 3.4 0 q1.6 -1.2 3.4 0 q-1.6 1.3 -3.4 0.4 q-1.8 0.9 -3.4 -0.4 z" fill="#3a2418" />
          </Bust>
        </>
      );
    case 'shield': // 큰 둥근 방패
      return (
        <>
          <PortraitBg tone="#1f6e4a" />
          <Bust robe="#2a7a52" skin={SKIN[2]}>
            <path d="M21.5 13 q8.5 -9 17 0 v1.4 h-17 z" fill="#9aa1ab" />
            <circle cx="30" cy="35" r="10.5" fill="#c9a24a" />
            <circle cx="30" cy="35" r="8.8" fill="#2f9e6a" />
            <path d="M30 28 v14 M23 35 h14" stroke="#f3e7d0" strokeWidth="2" />
            <circle cx="30" cy="35" r="2" fill="#c9a24a" />
          </Bust>
        </>
      );
    case 'envoy': // 두루마리를 펼쳐 든 사절
      return (
        <>
          <PortraitBg tone="#2a5a9a">
            <path d="M4 8 h10 v6 h-10 z M46 6 h10 v8 h-10 z" fill="#f3e7d0" opacity="0.15" />
          </PortraitBg>
          <Bust robe="#3a7bd5" skin={SKIN[0]} collar="#f3e7d0">
            <path d="M22 11.5 q8 -7 16 0 q-2 -1.6 -8 -1.6 q-6 0 -8 1.6 z" fill="#1f3f72" />
            <ellipse cx="30" cy="9.2" rx="9" ry="2.6" fill="#1f3f72" />
            <rect x="17" y="30" width="26" height="9" rx="1" fill="#f6ecd2" />
            <rect x="15.5" y="29" width="3" height="11" rx="1.5" fill="#c9a24a" />
            <rect x="41.5" y="29" width="3" height="11" rx="1.5" fill="#c9a24a" />
            <path d="M21 33 h18 M21 35.5 h14" stroke="#8a7a5a" strokeWidth="0.7" />
            <circle cx="36" cy="37" r="1.6" fill="#c0392b" />
          </Bust>
        </>
      );
    case 'scribe': // 안경, 깃펜, 책
      return (
        <>
          <PortraitBg tone="#1a6f7a">
            <rect x="4" y="6" width="3" height="14" fill="#8a5a3a" opacity="0.6" />
            <rect x="8" y="9" width="3" height="11" fill="#5a7a3a" opacity="0.6" />
            <rect x="12" y="7" width="3" height="13" fill="#7a3a3a" opacity="0.6" />
          </PortraitBg>
          <Bust robe="#1fa3b4" skin={SKIN[0]} hair={<path d="M22.6 15 Q22 6 30 6.4 Q38 6 37.4 15 Q36 9.5 30 9.6 Q24 9.5 22.6 15 Z" fill="#8a8a8a" />}>
            <circle cx="27.4" cy="15.6" r="2.1" fill="none" stroke="#3a2a20" strokeWidth="0.6" />
            <circle cx="32.6" cy="15.6" r="2.1" fill="none" stroke="#3a2a20" strokeWidth="0.6" />
            <path d="M29.5 15.6 h1" stroke="#3a2a20" strokeWidth="0.6" />
            <path d="M18 33 h24 v7 h-24 z" fill="#7a3a2a" />
            <path d="M30 33 v7" stroke="#f3e7d0" strokeWidth="0.6" />
            <path d="M44 22 q4 6 -3 14 l-1 -1 q5 -7 4 -13 z" fill="#f3f3f3" />
          </Bust>
        </>
      );
    case 'chancellor': // 높은 관모, 관복, 맞바꾸는 화살
      return (
        <>
          <PortraitBg tone="#8a6512">
            <path d="M5 10 a7 7 0 0 1 12 -2" stroke="#f3e7d0" strokeWidth="1.2" fill="none" opacity="0.5" />
            <path d="M17 8 l-2.5 -0.5 1.2 2.2 z" fill="#f3e7d0" opacity="0.5" />
            <path d="M55 30 a7 7 0 0 1 -12 2" stroke="#f3e7d0" strokeWidth="1.2" fill="none" opacity="0.5" />
            <path d="M43 32 l2.5 0.5 -1.2 -2.2 z" fill="#f3e7d0" opacity="0.5" />
          </PortraitBg>
          <Bust robe="#7a1f2a" skin={SKIN[1]} collar="#d79a1e">
            <rect x="23" y="4" width="14" height="8" rx="2" fill="#1f1a1a" />
            <ellipse cx="21" cy="9" rx="3.6" ry="1.6" fill="#1f1a1a" />
            <ellipse cx="39" cy="9" rx="3.6" ry="1.6" fill="#1f1a1a" />
            <rect x="24" y="30" width="12" height="7" rx="1" fill="#d79a1e" />
            <rect x="26" y="32" width="8" height="3" fill="#7a1f2a" />
          </Bust>
        </>
      );
    case 'agent': // 가면, 세운 망토
      return (
        <>
          <PortraitBg tone="#6a1f4a">
            <path d="M0 40 Q30 20 60 40 Z" fill="#000" opacity="0.2" />
          </PortraitBg>
          <Bust robe="#2a1a2a" skin={SKIN[0]} hair={<path d="M21 22 Q20 6 30 6 Q40 6 39 22 Z" fill="#2a1a1a" />}>
            <path d="M14 32 L21 22 L25 33 Z M46 32 L39 22 L35 33 Z" fill="#4a1f3a" />
            <path d="M23.4 14 q3.3 -2 6.6 0 q3.3 -2 6.6 0 v3 q-3.3 2 -6.6 0 q-3.3 2 -6.6 0 z" fill={tone} />
            <circle cx="27.2" cy="15.6" r="1" fill="#1a1018" />
            <circle cx="32.8" cy="15.6" r="1" fill="#1a1018" />
          </Bust>
        </>
      );
    case 'queen': // 왕관, 긴 머리, 붉은 휘장
      return (
        <>
          <PortraitBg tone="#8a1f1f">
            <path d="M0 0 h10 q-4 20 0 40 h-10 z M60 0 h-10 q4 20 0 40 h10 z" fill="#5a0f14" opacity="0.8" />
            <path d="M0 0 h60 v3 q-30 4 -60 0 z" fill="#c9a24a" opacity="0.6" />
          </PortraitBg>
          <Bust robe="#b02a2a" skin={SKIN[0]} collar="#f3e7d0" hair={<path d="M21 30 Q19 8 30 7 Q41 8 39 30 Q35 22 30 22 Q25 22 21 30 Z" fill="#6a3a1a" />}>
            <path d="M23 9 l2 -5 2.5 3.5 2.5 -4.5 2.5 4.5 2.5 -3.5 2 5 z" fill="#e8c14a" stroke="#a67c1a" strokeWidth="0.5" />
            <circle cx="30" cy="5.6" r="0.9" fill="#c0392b" />
            <path d="M24 28 q6 4 12 0" stroke="#e8c14a" strokeWidth="1" fill="none" />
            <circle cx="30" cy="30.2" r="1.2" fill="#3a7bd5" />
          </Bust>
        </>
      );
  }
}

export function RoleArt({ kind, tone }: { kind: Kind; tone: string }) {
  return (
    <svg className="lcard-art" viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <ArtDefs />
      <Scene kind={kind} tone={tone} />
    </svg>
  );
}
