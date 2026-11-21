/** 역할 (이름·문구 자체 제작, 효과는 원작 메커니즘) */
export type Role = 'treasurer' | 'assassin' | 'raider' | 'diplomat' | 'guard';

export const ROLES: Role[] = ['treasurer', 'assassin', 'raider', 'diplomat', 'guard'];

export const ROLE_DEFS: Record<Role, { name: string; icon: string; action: string; block: string; color: string }> = {
  treasurer: { name: '재무관', icon: '💰', action: '세금: 금화 3개', block: '남의 원조를 막아요', color: '#8a5cd0' },
  assassin: { name: '자객', icon: '🗡️', action: '암살: 금화를 내고 상대 영향력 하나 제거', block: '—', color: '#2b2b33' },
  raider: { name: '약탈자', icon: '🏴‍☠️', action: '약탈: 상대 금화 2개를 가져와요', block: '약탈을 막아요', color: '#3a7bd5' },
  diplomat: { name: '외교관', icon: '📜', action: '교환: 카드 2장을 보고 바꿔요', block: '약탈을 막아요', color: '#2f9e6a' },
  guard: { name: '호위 기사', icon: '🛡️', action: '—', block: '암살을 막아요', color: '#d0533f' },
};

/** 행동 */
export type ActionKind = 'income' | 'aid' | 'coup' | 'tax' | 'assassinate' | 'steal' | 'exchange';

export const ACTION_DEFS: Record<ActionKind, { name: string; role: Role | null; target: boolean; blockers: Role[]; text: string }> = {
  income: { name: '소득', role: null, target: false, blockers: [], text: '금화 1개 (막을 수 없음)' },
  aid: { name: '원조', role: null, target: false, blockers: ['treasurer'], text: '금화 2개 (재무관이 막을 수 있음)' },
  coup: { name: '쿠데타', role: null, target: true, blockers: [], text: '금화를 내고 상대 영향력 하나 제거 (막을 수 없음)' },
  tax: { name: '세금', role: 'treasurer', target: false, blockers: [], text: '재무관: 금화 3개' },
  assassinate: { name: '암살', role: 'assassin', target: true, blockers: ['guard'], text: '자객: 상대 영향력 하나 제거' },
  steal: { name: '약탈', role: 'raider', target: true, blockers: ['raider', 'diplomat'], text: '약탈자: 상대 금화 2개' },
  exchange: { name: '교환', role: 'diplomat', target: false, blockers: [], text: '외교관: 2장 뽑고 2장 돌려놓기' },
};
