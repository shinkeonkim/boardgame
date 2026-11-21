/**
 * 카드 정의 (이름·문구는 자체 제작, 효과는 원작 메커니즘).
 * 확장판은 첩자(0)·서기관(6)이 추가되고 재상·밀정·여왕 숫자가 하나씩 올라간다.
 */
export type Kind = 'spy' | 'watch' | 'seer' | 'duelist' | 'shield' | 'envoy' | 'scribe' | 'chancellor' | 'agent' | 'queen';

export interface CardDef {
  kind: Kind;
  name: string;
  /** 한 줄 효과 */
  text: string;
  icon: string;
  needsTarget: boolean;
  /** 나 자신도 지목할 수 있는지 (사절) */
  self: boolean;
}

export const CARD_DEFS: Record<Kind, CardDef> = {
  spy: { kind: 'spy', name: '첩자', text: '판이 끝날 때 첩자를 낸(버린) 사람이 나 혼자면 인장 +1', icon: '🕶️', needsTarget: false, self: false },
  watch: { kind: 'watch', name: '파수꾼', text: '상대 한 명의 카드를 맞히면(파수꾼 제외) 그 사람은 탈락', icon: '🗡️', needsTarget: true, self: false },
  seer: { kind: 'seer', name: '점술가', text: '상대 한 명의 카드를 몰래 봐요', icon: '🔮', needsTarget: true, self: false },
  duelist: { kind: 'duelist', name: '결투사', text: '상대와 몰래 카드를 비교해 숫자가 낮은 쪽이 탈락', icon: '⚔️', needsTarget: true, self: false },
  shield: { kind: 'shield', name: '방패병', text: '내 다음 차례까지 아무도 나를 지목할 수 없어요', icon: '🛡️', needsTarget: false, self: false },
  envoy: { kind: 'envoy', name: '사절', text: '한 명(나 포함)이 카드를 버리고 새로 뽑아요', icon: '📜', needsTarget: true, self: true },
  scribe: { kind: 'scribe', name: '서기관', text: '2장을 더 뽑아 3장 중 1장만 남기고 2장은 더미 밑으로', icon: '🪶', needsTarget: false, self: false },
  chancellor: { kind: 'chancellor', name: '재상', text: '상대 한 명과 카드를 맞바꿔요', icon: '🔄', needsTarget: true, self: false },
  agent: { kind: 'agent', name: '밀정', text: '재상이나 사절과 함께 들고 있으면 반드시 이 카드를 내야 해요', icon: '🎭', needsTarget: false, self: false },
  queen: { kind: 'queen', name: '여왕', text: '이 카드를 내거나 버리게 되면 탈락', icon: '👑', needsTarget: false, self: false },
};

/** 판본별 숫자와 장수 */
export function deckSpec(edition: 'classic' | 'extended'): { kind: Kind; value: number; copies: number }[] {
  if (edition === 'classic')
    return [
      { kind: 'watch', value: 1, copies: 5 },
      { kind: 'seer', value: 2, copies: 2 },
      { kind: 'duelist', value: 3, copies: 2 },
      { kind: 'shield', value: 4, copies: 2 },
      { kind: 'envoy', value: 5, copies: 2 },
      { kind: 'chancellor', value: 6, copies: 1 },
      { kind: 'agent', value: 7, copies: 1 },
      { kind: 'queen', value: 8, copies: 1 },
    ];
  return [
    { kind: 'spy', value: 0, copies: 2 },
    { kind: 'watch', value: 1, copies: 6 },
    { kind: 'seer', value: 2, copies: 2 },
    { kind: 'duelist', value: 3, copies: 2 },
    { kind: 'shield', value: 4, copies: 2 },
    { kind: 'envoy', value: 5, copies: 2 },
    { kind: 'scribe', value: 6, copies: 2 },
    { kind: 'chancellor', value: 7, copies: 1 },
    { kind: 'agent', value: 8, copies: 1 },
    { kind: 'queen', value: 9, copies: 1 },
  ];
}

export const valueOf = (edition: 'classic' | 'extended', kind: Kind) => deckSpec(edition).find((s) => s.kind === kind)?.value ?? 0;
