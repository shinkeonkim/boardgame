/**
 * 도미노 48장 (자체 구성 — 원작 목록을 옮기지 않음). 땅 6가지, 칸마다 왕관 0~3.
 * 흔한 땅(밀밭·숲)일수록 번호가 작고, 드문 땅·왕관이 많을수록 번호가 큼. 번호가 작은 도미노를 고르면 다음에 먼저 둠.
 */
export type Terrain = 'wheat' | 'forest' | 'water' | 'grass' | 'swamp' | 'mine';
export const TERRAINS: Terrain[] = ['wheat', 'forest', 'water', 'grass', 'swamp', 'mine'];

export interface Half {
  t: Terrain;
  crowns: number;
}
export interface Domino {
  id: number;
  a: Half;
  b: Half;
}

const h = (t: Terrain, crowns = 0): Half => ({ t, crowns });
const RAW: [Half, Half][] = [
  [h('wheat'), h('wheat')], [h('wheat'), h('wheat')], [h('forest'), h('forest')], [h('forest'), h('forest')],
  [h('forest'), h('forest')], [h('forest'), h('forest')], [h('water'), h('water')], [h('water'), h('water')],
  [h('water'), h('water')], [h('grass'), h('grass')], [h('grass'), h('grass')], [h('swamp'), h('swamp')],
  [h('wheat'), h('forest')], [h('wheat'), h('water')], [h('wheat'), h('grass')], [h('wheat'), h('swamp')],
  [h('forest'), h('water')], [h('forest'), h('grass')], [h('wheat', 1), h('forest')], [h('wheat', 1), h('water')],
  [h('wheat', 1), h('grass')], [h('wheat', 1), h('swamp')], [h('wheat', 1), h('mine')], [h('forest', 1), h('wheat')],
  [h('forest', 1), h('wheat')], [h('forest', 1), h('wheat')], [h('forest', 1), h('wheat')], [h('forest', 1), h('water')],
  [h('forest', 1), h('grass')], [h('water', 1), h('wheat')], [h('water', 1), h('wheat')], [h('water', 1), h('forest')],
  [h('water', 1), h('forest')], [h('water', 1), h('forest')], [h('water', 1), h('forest')], [h('wheat'), h('grass', 1)],
  [h('water'), h('grass', 1)], [h('wheat'), h('swamp', 1)], [h('grass'), h('swamp', 1)], [h('mine', 1), h('wheat')],
  [h('wheat'), h('grass', 2)], [h('water'), h('grass', 2)], [h('wheat'), h('swamp', 2)], [h('grass'), h('swamp', 2)],
  [h('mine', 2), h('wheat')], [h('swamp'), h('mine', 2)], [h('swamp'), h('mine', 2)], [h('wheat'), h('mine', 3)],
];
export const DOMINOES: Domino[] = RAW.map(([a, b], i) => ({ id: i + 1, a, b }));
