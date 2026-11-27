/**
 * 화투 48장: 12달 × 4장. kind: gwang(광) · animal(열끗) · ribbon(띠) · pi(피) · double(쌍피).
 * ribbon 은 set 으로 홍단(red) · 청단(blue) · 초단(grass) · 그 밖(plain).
 * 그림은 web 이 직접 그린다 (전통 화투 구도를 따라 SVG로 새로 그림: hwatu-art.tsx).
 */
export type Kind = 'gwang' | 'animal' | 'ribbon' | 'pi' | 'double';
export interface HCard {
  id: string;
  month: number;
  kind: Kind;
  ribbon?: 'red' | 'blue' | 'grass' | 'plain';
  /** 고도리 새 (2·4·8월 열끗) */
  bird?: boolean;
  /** 비광 (12월 광) */
  rain?: boolean;
}

const C = (month: number, i: number, kind: Kind, extra: Partial<HCard> = {}): HCard => ({ id: `${month}-${i}`, month, kind, ...extra });

export const DECK: HCard[] = [
  C(1, 0, 'gwang'), C(1, 1, 'ribbon', { ribbon: 'red' }), C(1, 2, 'pi'), C(1, 3, 'pi'),
  C(2, 0, 'animal', { bird: true }), C(2, 1, 'ribbon', { ribbon: 'red' }), C(2, 2, 'pi'), C(2, 3, 'pi'),
  C(3, 0, 'gwang'), C(3, 1, 'ribbon', { ribbon: 'red' }), C(3, 2, 'pi'), C(3, 3, 'pi'),
  C(4, 0, 'animal', { bird: true }), C(4, 1, 'ribbon', { ribbon: 'grass' }), C(4, 2, 'pi'), C(4, 3, 'pi'),
  C(5, 0, 'animal'), C(5, 1, 'ribbon', { ribbon: 'grass' }), C(5, 2, 'pi'), C(5, 3, 'pi'),
  C(6, 0, 'animal'), C(6, 1, 'ribbon', { ribbon: 'blue' }), C(6, 2, 'pi'), C(6, 3, 'pi'),
  C(7, 0, 'animal'), C(7, 1, 'ribbon', { ribbon: 'grass' }), C(7, 2, 'pi'), C(7, 3, 'pi'),
  C(8, 0, 'gwang'), C(8, 1, 'animal', { bird: true }), C(8, 2, 'pi'), C(8, 3, 'pi'),
  C(9, 0, 'animal'), C(9, 1, 'ribbon', { ribbon: 'blue' }), C(9, 2, 'pi'), C(9, 3, 'pi'),
  C(10, 0, 'animal'), C(10, 1, 'ribbon', { ribbon: 'blue' }), C(10, 2, 'pi'), C(10, 3, 'pi'),
  C(11, 0, 'gwang'), C(11, 1, 'double'), C(11, 2, 'pi'), C(11, 3, 'pi'),
  C(12, 0, 'gwang', { rain: true }), C(12, 1, 'animal'), C(12, 2, 'ribbon', { ribbon: 'plain' }), C(12, 3, 'double'),
];

export const MONTH_NAMES = ['', '송학', '매조', '벚꽃', '흑싸리', '난초', '모란', '홍싸리', '공산', '국화', '단풍', '오동', '비'];

/** 피 장수 (쌍피는 2) */
export const piCount = (cards: HCard[]) => cards.reduce((a, c) => a + (c.kind === 'pi' ? 1 : c.kind === 'double' ? 2 : 0), 0);

export interface ScoreLine {
  label: string;
  points: number;
}

/** 먹은 카드로 점수 계산 (항목별) */
export function scoreCards(cards: HCard[]): { total: number; lines: ScoreLine[] } {
  const lines: ScoreLine[] = [];
  const gw = cards.filter((c) => c.kind === 'gwang');
  const rain = gw.some((c) => c.rain);
  if (gw.length === 5) lines.push({ label: '오광', points: 15 });
  else if (gw.length === 4) lines.push({ label: '사광', points: 4 });
  else if (gw.length === 3) lines.push({ label: rain ? '비삼광' : '삼광', points: rain ? 2 : 3 });
  const animals = cards.filter((c) => c.kind === 'animal');
  if (animals.filter((c) => c.bird).length === 3) lines.push({ label: '고도리', points: 5 });
  if (animals.length >= 5) lines.push({ label: `열끗 ${animals.length}장`, points: animals.length - 4 });
  const ribbons = cards.filter((c) => c.kind === 'ribbon');
  for (const [set, label] of [
    ['red', '홍단'],
    ['blue', '청단'],
    ['grass', '초단'],
  ] as const)
    if (ribbons.filter((c) => c.ribbon === set).length === 3) lines.push({ label, points: 3 });
  if (ribbons.length >= 5) lines.push({ label: `띠 ${ribbons.length}장`, points: ribbons.length - 4 });
  const pi = piCount(cards);
  if (pi >= 10) lines.push({ label: `피 ${pi}장`, points: pi - 9 });
  return { total: lines.reduce((a, l) => a + l.points, 0), lines };
}
