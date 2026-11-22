/**
 * Court Intrigue 역할 초상 (자체 제작 SVG). 가로 60 × 세로 40.
 * 재무관은 금화 더미와 저울, 자객은 두건과 단검, 약탈자는 돛과 삼각모, 외교관은 두루마리와 깃펜, 호위 기사는 투구와 방패.
 */
import type { Role } from '@bg/court-intrigue-engine';
import { ArtDefs, Bust, PortraitBg, SKIN } from '@bg/ui';

function Scene({ role }: { role: Role }) {
  switch (role) {
    case 'treasurer':
      return (
        <>
          <PortraitBg tone="#5a3a9a">
            <path d="M6 8 v10 M2 12 h8 M2 12 l-1.5 4 h3 z M10 12 l-1.5 4 h3 z" stroke="#e8c14a" strokeWidth="0.8" fill="none" opacity="0.7" />
          </PortraitBg>
          <Bust robe="#6a3fb0" skin={SKIN[0]} collar="#e8c14a">
            <path d="M22.5 11 q7.5 -6 15 0 l0.8 1.6 h-16.6 z" fill="#3a2470" />
            <circle cx="30" cy="7.4" r="1.4" fill="#e8c14a" />
          </Bust>
          {[[42, 36], [46, 35], [50, 36], [44, 32.5], [48, 32.5], [46, 29.5]].map(([x, y], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y} rx="3.2" ry="1.5" fill="#a67c1a" />
              <ellipse cx={x} cy={y - 0.5} rx="3.2" ry="1.5" fill="#e8c14a" />
            </g>
          ))}
        </>
      );
    case 'assassin':
      return (
        <>
          <PortraitBg tone="#20202a">
            <circle cx="46" cy="9" r="4" fill="#d8dce8" opacity="0.5" />
          </PortraitBg>
          <Bust robe="#1a1a22" skin={SKIN[1]} hair={<path d="M19 32 Q17 4 30 3 Q43 4 41 32 Z" fill="#2a2a36" />}>
            <path d="M22.6 16 Q22 6.6 30 6.4 Q38 6.6 37.4 16 Q34 10.5 30 10.5 Q26 10.5 22.6 16 Z" fill="#2a2a36" />
            <path d="M23.5 17.5 q6.5 3.5 13 0 v4.5 q-6.5 3 -13 0 z" fill="#3a3a48" />
            <circle cx="27.4" cy="15.6" r="0.8" fill="#e05050" />
            <circle cx="32.6" cy="15.6" r="0.8" fill="#e05050" />
          </Bust>
          <path d="M44 20 l3 -1 1 15 -2 1 z" fill="#d8dce4" />
          <rect x="43" y="33" width="6" height="1.6" rx="0.8" fill="#6b4a2a" transform="rotate(-4 46 34)" />
        </>
      );
    case 'raider':
      return (
        <>
          <PortraitBg tone="#1f4a7a">
            <path d="M0 34 q8 -3 15 0 t15 0 t15 0 t15 0 V40 H0 z" fill="#123058" />
            <path d="M48 6 v22 M48 7 q9 6 0 18 z" stroke="#6b4a2a" strokeWidth="0.8" fill="#f3ead6" />
            <path d="M47 28 h-6 l2 3 h8 l2 -3 z" fill="#5a3a22" />
          </PortraitBg>
          <Bust robe="#7a2a2a" skin={SKIN[2]} collar="#f3ead6">
            <path d="M18 12 q12 -10 24 0 q-6 -2 -12 -2 q-6 0 -12 2 z" fill="#1f1a1a" />
            <path d="M20 12 q10 -3 20 0 l-1 1.5 q-9 -2 -18 0 z" fill="#c9a24a" />
            <path d="M31.2 14.4 h3.8 v2.8 h-3.8 z" fill="#1a1414" />
            <path d="M24 14 l11 1" stroke="#1a1414" strokeWidth="0.5" />
          </Bust>
        </>
      );
    case 'diplomat':
      return (
        <>
          <PortraitBg tone="#1f6a48">
            <rect x="5" y="5" width="10" height="13" rx="5" fill="#f3e7d0" opacity="0.14" />
            <rect x="45" y="5" width="10" height="13" rx="5" fill="#f3e7d0" opacity="0.14" />
          </PortraitBg>
          <Bust robe="#2f9e6a" skin={SKIN[0]} collar="#f3e7d0" hair={<path d="M22.4 16 Q21.5 6 30 6 Q38.5 6 37.6 16 Q36 9 30 9 Q24 9 22.4 16 Z" fill="#5a3a22" />}>
            <rect x="18" y="31" width="20" height="8" rx="1" fill="#f6ecd2" />
            <path d="M21 34 h14 M21 36.5 h10" stroke="#8a7a5a" strokeWidth="0.6" />
            <path d="M40 22 q5 5 0 15 l-1 -0.6 q4 -6 1 -14 z" fill="#ffffff" />
            <circle cx="34" cy="37" r="1.5" fill="#c0392b" />
          </Bust>
        </>
      );
    case 'guard':
      return (
        <>
          <PortraitBg tone="#7a2a22">
            <path d="M0 0 h60 v6 h-60 z" fill="#000" opacity="0.15" />
          </PortraitBg>
          <Bust robe="#9a3a2a" skin={SKIN[1]}>
            <path d="M21.5 15 q0 -11 8.5 -11 q8.5 0 8.5 11 v2 h-3 v-3 h-11 v3 h-3 z" fill="#a9b0ba" />
            <path d="M30 4 v-2.6" stroke="#c0392b" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M29.4 4 v11" stroke="#7c838e" strokeWidth="1.2" />
            <path d="M16 26 h10 v8 q-5 6 -5 6 q0 0 -5 -6 z" fill="#c9a24a" />
            <path d="M17.5 27.5 h7 v6 q-3.5 4 -3.5 4 q0 0 -3.5 -4 z" fill="#d0533f" />
            <path d="M21 28 v9 M17.5 31 h7" stroke="#f3e7d0" strokeWidth="1" />
          </Bust>
        </>
      );
  }
}

export function RoleArt({ role }: { role: Role }) {
  return (
    <svg className="rcard-art" viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <ArtDefs />
      <Scene role={role} />
    </svg>
  );
}
