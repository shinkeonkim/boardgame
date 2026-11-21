/**
 * 개발 카드·귀족 (자체 설계 — 원작 카드 목록을 옮기지 않고 비용 틀을 색마다 돌려 만든다).
 * 단계별 장수(40·30·20)와 점수 범위는 원작 메커니즘에 맞춤.
 */
export type Gem = 0 | 1 | 2 | 3 | 4; // 다이아몬드·사파이어·에메랄드·루비·오닉스
export const GEMS: Gem[] = [0, 1, 2, 3, 4];
export const GOLD = 5;

export interface DevCard {
  id: string;
  tier: 1 | 2 | 3;
  bonus: Gem;
  points: number;
  /** 색별 비용 */
  cost: number[];
}

export interface Noble {
  id: string;
  points: number;
  /** 색별 필요한 보너스 수 */
  need: number[];
}

/** [점수, 비용 묶음(다른 색에 차례로 배정)] */
const T1: [number, number[]][] = [
  [0, [1, 1, 1, 1]],
  [0, [1, 2, 1, 1]],
  [0, [2, 2, 1]],
  [0, [1, 3, 1]],
  [0, [2, 1]],
  [0, [3]],
  [0, [2, 2]],
  [1, [4]],
];
const T2: [number, number[]][] = [
  [1, [3, 2, 2]],
  [1, [3, 3, 2]],
  [2, [4, 2, 1]],
  [2, [5, 3]],
  [2, [5]],
  [3, [6]],
];
const T3: [number, number[]][] = [
  [3, [3, 3, 5, 3]],
  [4, [7]],
  [4, [6, 3, 3]],
  [5, [7, 3]],
];

function build(tier: 1 | 2 | 3, templates: [number, number[]][]): DevCard[] {
  const out: DevCard[] = [];
  for (const bonus of GEMS) {
    const others = GEMS.filter((g) => g !== bonus);
    templates.forEach(([points, pattern], t) => {
      const cost = [0, 0, 0, 0, 0];
      // 템플릿·색마다 시작 위치를 바꿔 같은 모양이 겹치지 않게
      const shift = (t + bonus * 2) % others.length;
      pattern.forEach((n, i) => (cost[others[(i + shift) % others.length]] += n));
      // 4점짜리 단일색 카드(7)는 원작처럼 자기 색 3을 섞은 변형도 — 한 템플릿만
      if (tier === 3 && points === 4 && pattern.length === 1) {
        cost[bonus] = 0;
      }
      out.push({ id: `t${tier}-${bonus}-${t}`, tier, bonus, points, cost });
    });
  }
  return out;
}

export const CARDS: DevCard[] = [...build(1, T1), ...build(2, T2), ...build(3, T3)];

export const NOBLES: Noble[] = [
  ...GEMS.map((g) => {
    const need = [0, 0, 0, 0, 0];
    need[g] = 4;
    need[(g + 1) % 5] = 4;
    return { id: `n4-${g}`, points: 3, need };
  }),
  ...GEMS.map((g) => {
    const need = [0, 0, 0, 0, 0];
    need[g] = 3;
    need[(g + 2) % 5] = 3;
    need[(g + 3) % 5] = 3;
    return { id: `n3-${g}`, points: 3, need };
  }),
];
