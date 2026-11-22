import type { Role } from '@bg/secret-mission-engine';
import { ArtDefs, Bust, PortraitBg, SKIN } from '@bg/ui';

export const ROLE_INFO: Record<Role, { name: string; side: 'agent' | 'spy'; tone: string; know: string; goal: string }> = {
  agent: { name: '요원', side: 'agent', tone: '#2f6fb0', know: '아무것도 몰라요. 투표와 원정 결과로 첩자를 찾아요.', goal: '원정 3번 성공' },
  seer: { name: '예언자', side: 'agent', tone: '#6a3fb0', know: '첩자를 알아요 (숨은 우두머리 빼고). 들키면 마지막에 사냥당해요.', goal: '원정 3번 성공 + 사냥꾼에게 들키지 않기' },
  guard: { name: '호위무사', side: 'agent', tone: '#2f8a5a', know: '예언자 후보가 보여요 (가짜 예언자가 섞일 수 있어요).', goal: '원정 3번 성공 + 예언자 지키기' },
  spy: { name: '첩자', side: 'spy', tone: '#a8322a', know: '다른 첩자를 알아요 (외톨이 첩자 빼고).', goal: '원정 3번 실패, 또는 원정대가 계속 부결되게' },
  hunter: { name: '그림자 사냥꾼', side: 'spy', tone: '#5a2a3a', know: '다른 첩자를 알아요. 요원이 이기면 마지막에 예언자를 맞혀요.', goal: '원정 3번 실패, 또는 예언자 사냥' },
  falseSeer: { name: '가짜 예언자', side: 'spy', tone: '#8a3a8a', know: '다른 첩자를 알아요. 호위무사에게 예언자처럼 보여요.', goal: '원정 3번 실패' },
  shadow: { name: '숨은 우두머리', side: 'spy', tone: '#3a2a4a', know: '다른 첩자를 알아요. 예언자에게 보이지 않아요.', goal: '원정 3번 실패' },
  loner: { name: '외톨이 첩자', side: 'spy', tone: '#6a4a2a', know: '다른 첩자를 몰라요 (그들도 나를 몰라요).', goal: '원정 3번 실패' },
};

/** 역할 초상 (가로 60 × 세로 40) */
export function RolePortrait({ role }: { role: Role }) {
  const r = ROLE_INFO[role];
  const body = (() => {
    switch (role) {
      case 'agent':
        return (
          <Bust robe="#3a4a62" skin={SKIN[0]} collar="#f3ead6">
            <path d="M21 12 q9 -7 18 0 l2 1.4 q-11 2 -22 0 z" fill="#5a4a3a" />
            <rect x="23.5" y="7" width="13" height="5.4" rx="2" fill="#5a4a3a" />
            <path d="M24 26 l6 9 6 -9" fill="none" stroke="#2a3446" strokeWidth="1.4" />
          </Bust>
        );
      case 'seer':
        return (
          <Bust robe="#6a3fb0" skin={SKIN[0]} hair={<path d="M19 30 Q18 9 30 5 Q42 9 41 30 Z" fill="#4a2a86" />}>
            <path d="M22.5 14 Q23 6 30 6 Q37 6 37.5 14 Q34 9.5 30 9.5 Q26 9.5 22.5 14 Z" fill="#5a34a0" />
            <circle cx="30" cy="34" r="5.4" fill="#bfe6ff" opacity="0.9" />
            <circle cx="30" cy="34" r="5.4" fill="url(#art-glow)" />
          </Bust>
        );
      case 'guard':
        return (
          <Bust robe="#2f8a5a" skin={SKIN[2]}>
            <path d="M21.5 15 q0 -11 8.5 -11 q8.5 0 8.5 11 v2 h-3 v-3 h-11 v3 h-3 z" fill="#a9b0ba" />
            <path d="M16 26 h10 v8 q-5 6 -5 6 q0 0 -5 -6 z" fill="#c9a24a" />
            <path d="M21 28 v9 M17.5 31 h7" stroke="#f3e7d0" strokeWidth="1" />
          </Bust>
        );
      case 'spy':
        return (
          <Bust robe="#2a1a1a" skin={SKIN[1]} collar="#1a1010">
            <path d="M20 12 q10 -7 20 0 l4 1.6 q-14 3 -28 0 z" fill="#1a1414" />
            <rect x="23" y="5.5" width="14" height="6.5" rx="2.5" fill="#1a1414" />
            <path d="M23.4 14 q3.3 -2 6.6 0 q3.3 -2 6.6 0 v3 q-3.3 2 -6.6 0 q-3.3 2 -6.6 0 z" fill="#a8322a" />
          </Bust>
        );
      case 'hunter':
        return (
          <Bust robe="#3a1f2a" skin={SKIN[1]} hair={<path d="M19 32 Q17 4 30 3 Q43 4 41 32 Z" fill="#2a1820" />}>
            <path d="M22.6 16 Q22 6.6 30 6.4 Q38 6.6 37.4 16 Q34 10.5 30 10.5 Q26 10.5 22.6 16 Z" fill="#2a1820" />
            <path d="M44 6 q8 16 0 32" fill="none" stroke="#8a5a32" strokeWidth="1.4" />
            <path d="M44 6 L44 38" stroke="#d8d0c0" strokeWidth="0.5" />
          </Bust>
        );
      case 'falseSeer':
        return (
          <Bust robe="#7a3a7a" skin={SKIN[0]} hair={<path d="M19 30 Q18 9 30 5 Q42 9 41 30 Z" fill="#5a2a5a" />}>
            <path d="M22.5 14 Q23 6 30 6 Q37 6 37.5 14 Q34 9.5 30 9.5 Q26 9.5 22.5 14 Z" fill="#6a2a6a" />
            <circle cx="30" cy="34" r="5.4" fill="#e0a0e8" opacity="0.8" />
            <path d="M27 32 l6 4 M33 32 l-6 4" stroke="#5a1a5a" strokeWidth="0.8" />
          </Bust>
        );
      case 'shadow':
        return (
          <Bust robe="#2a2236" skin={SKIN[3]} hair={<path d="M19 32 Q17 4 30 3 Q43 4 41 32 Z" fill="#1a1426" />}>
            <path d="M23 8 l2 -4 2.5 3 2.5 -4 2.5 4 2.5 -3 2 4 z" fill="#7a6a8a" />
            <path d="M23.5 17.5 q6.5 3.5 13 0 v4.5 q-6.5 3 -13 0 z" fill="#2a2236" />
          </Bust>
        );
      case 'loner':
        return (
          <Bust robe="#5a3a22" skin={SKIN[2]} collar="#3a2414">
            <path d="M20 12 q10 -8 20 0 z" fill="#3a2414" />
            <ellipse cx="32.6" cy="15.6" rx="2.6" ry="2" fill="#1a1010" />
            <path d="M23 13 l15 4" stroke="#1a1010" strokeWidth="0.6" />
          </Bust>
        );
    }
  })();
  return (
    <svg className="sm-portrait" viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <ArtDefs />
      <PortraitBg tone={r.tone}>{r.side === 'spy' ? <path d="M0 40 Q30 22 60 40 Z" fill="#000" opacity="0.25" /> : <circle cx="48" cy="8" r="4" fill="#fff4c0" opacity="0.5" />}</PortraitBg>
      {body}
    </svg>
  );
}

/** 역할 카드 (카드 키트 pc) */
export function RoleCard({ role, size = 'md' }: { role: Role; size?: 'sm' | 'md' }) {
  const r = ROLE_INFO[role];
  return (
    <div className={`sm-role pc light ${size} ${r.side}`} style={{ ['--tone' as string]: r.tone }} aria-label={`${r.name} (${r.side === 'spy' ? '첩자 편' : '요원 편'})`}>
      <RolePortrait role={role} />
      <b className="sm-role-name">{r.name}</b>
      <span className={`sm-side ${r.side}`}>{r.side === 'spy' ? '첩자 편' : '요원 편'}</span>
    </div>
  );
}

/** 찬성·반대 / 성공·실패 카드 */
export function TokenCard({ kind, onClick, disabled, selected }: { kind: 'yes' | 'no' | 'success' | 'fail'; onClick?: () => void; disabled?: boolean; selected?: boolean }) {
  const label = { yes: '찬성', no: '반대', success: '성공', fail: '실패' }[kind];
  const icon = { yes: '👍', no: '👎', success: '✔', fail: '✖' }[kind];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`sm-token pc ${kind} ${selected ? 'selected' : ''}`} onClick={onClick} disabled={onClick ? disabled : undefined} aria-label={label}>
      <span className="sm-token-icon" aria-hidden>
        {icon}
      </span>
      <b>{label}</b>
    </Tag>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#1f2a3a" />
      <circle cx="32" cy="34" r="18" fill="none" stroke="#c9a24a" strokeWidth="2.4" />
      <path d="M32 14 v8 M32 46 v8 M12 34 h8 M44 34 h8" stroke="#c9a24a" strokeWidth="2.4" />
      <path d="M20 30 q12 -10 24 0 l3 1.6 q-15 3 -30 0 z" fill="#0f141c" />
      <rect x="25" y="22" width="14" height="8" rx="3" fill="#0f141c" />
      <path d="M24 34 q4 -2.4 8 0 q4 -2.4 8 0 v3 q-4 2.4 -8 0 q-4 2.4 -8 0 z" fill="#a8322a" />
    </svg>
  );
}
