/**
 * 요리 카드 (이름·그림 자체 제작, 점수 방식은 원작 메커니즘).
 *   김밥(1·2·3줄) — 줄 수가 가장 많으면 6, 둘째 3
 *   튀김 — 2개마다 5
 *   회 — 3개마다 10
 *   만두 — 1·2·3·4·5개에 1·3·6·10·15
 *   초밥(달걀 1·연어 2·오징어 3) — 앞에 깐 겨자 위에 올리면 ×3
 *   겨자 — 다음 초밥 ×3
 *   젓가락 — 나중에 한 번에 2장 (젓가락은 손패로 돌아감)
 *   푸딩 — 게임 끝에 가장 많으면 +6, 가장 적으면 −6
 */
export type Dish = 'maki1' | 'maki2' | 'maki3' | 'tempura' | 'sashimi' | 'dumpling' | 'egg' | 'salmon' | 'squid' | 'wasabi' | 'chopsticks' | 'pudding';

export const DISH: Record<Dish, { name: string; icon: string; group: Group; copies: number; hint: string }> = {
  maki1: { name: '김밥 1줄', icon: '🍙', group: 'maki', copies: 6, hint: '김밥 줄 수 1등 6점, 2등 3점' },
  maki2: { name: '김밥 2줄', icon: '🍙', group: 'maki', copies: 12, hint: '김밥 줄 수 1등 6점, 2등 3점' },
  maki3: { name: '김밥 3줄', icon: '🍙', group: 'maki', copies: 8, hint: '김밥 줄 수 1등 6점, 2등 3점' },
  tempura: { name: '튀김', icon: '🍤', group: 'tempura', copies: 14, hint: '2개마다 5점' },
  sashimi: { name: '회', icon: '🐟', group: 'sashimi', copies: 14, hint: '3개마다 10점' },
  dumpling: { name: '만두', icon: '🥟', group: 'dumpling', copies: 14, hint: '1·3·6·10·15점' },
  egg: { name: '달걀 초밥', icon: '🍳', group: 'nigiri', copies: 5, hint: '1점 (겨자 위면 3점)' },
  salmon: { name: '연어 초밥', icon: '🍣', group: 'nigiri', copies: 10, hint: '2점 (겨자 위면 6점)' },
  squid: { name: '오징어 초밥', icon: '🦑', group: 'nigiri', copies: 5, hint: '3점 (겨자 위면 9점)' },
  wasabi: { name: '겨자', icon: '🌿', group: 'wasabi', copies: 6, hint: '다음 초밥 점수 ×3' },
  chopsticks: { name: '젓가락', icon: '🥢', group: 'chopsticks', copies: 4, hint: '나중 차례에 2장 고르기' },
  pudding: { name: '푸딩', icon: '🍮', group: 'pudding', copies: 10, hint: '게임 끝: 가장 많으면 +6, 가장 적으면 −6' },
};

export type Group = 'maki' | 'tempura' | 'sashimi' | 'dumpling' | 'nigiri' | 'wasabi' | 'chopsticks' | 'pudding';
export const GROUPS: { id: Group; name: string }[] = [
  { id: 'maki', name: '김밥' },
  { id: 'tempura', name: '튀김' },
  { id: 'sashimi', name: '회' },
  { id: 'dumpling', name: '만두' },
  { id: 'nigiri', name: '초밥' },
  { id: 'wasabi', name: '겨자' },
  { id: 'chopsticks', name: '젓가락' },
  { id: 'pudding', name: '푸딩' },
];

export const MAKI_ROLLS: Partial<Record<Dish, number>> = { maki1: 1, maki2: 2, maki3: 3 };
export const NIGIRI: Partial<Record<Dish, number>> = { egg: 1, salmon: 2, squid: 3 };
export const DUMPLING_SCORE = [0, 1, 3, 6, 10, 15];
