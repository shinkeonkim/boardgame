/**
 * 카드·칩 꾸미기 (스킨). 같은 도메인의 모든 게임이 한 설정을 공유한다 (localStorage 'bg:skin').
 *
 * 세 가지를 고른다:
 *  - 카드 뒷면  → CSS 변수 --card-back  (background 단축 속성 값 전체)
 *  - 카드 앞면 질감 → --card-tex  (색 위에 얹는 투명 무늬 한 겹)
 *  - 칩·토큰 질감 → --chip-tex  (색 위에 얹는 투명 무늬 한 겹)
 *
 * 게임 CSS는 이렇게 쓴다:
 *   .my-card.back { background: var(--card-back); }
 *   .my-card      { background: var(--card-tex), #fffdf6; }
 *   .my-chip      { background: var(--chip-tex), var(--chip-color); }
 *
 * 새 무늬 만들기: 아래 표에 { id, name, bg }를 하나 더하면 끝. 무늬는 CSS 그라디언트나
 * svgTile()로 만든 작은 SVG 타일로 그린다. 외부 이미지 파일 없이 코드만으로 만든다.
 * 사용자는 「내 이미지」로 카드 뒷면을 직접 올릴 수도 있다 (기기에만 저장).
 */

export interface Skin {
  id: string;
  name: string;
  /** background 단축 속성 값 */
  bg: string;
}

/** 작은 SVG 타일을 반복 배경으로 */
export function svgTile(w: number, h: number, body: string, bgColor?: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}") 0 0/${w}px ${h}px`;
  return bgColor ? `${url}, ${bgColor}` : url;
}

const NONE = 'linear-gradient(transparent, transparent)';

export const CARD_BACKS: Skin[] = [
  { id: 'plum', name: '자두 줄무늬', bg: 'repeating-linear-gradient(45deg, #3b3550 0 4px, #453e5d 4px 8px)' },
  {
    id: 'night',
    name: '밤하늘',
    bg: svgTile(
      28,
      28,
      "<circle cx='4' cy='5' r='1.1' fill='#fff' opacity='.75'/><circle cx='18' cy='12' r='.8' fill='#ffe9a8' opacity='.8'/><circle cx='9' cy='22' r='.7' fill='#fff' opacity='.6'/><path d='M22 22l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z' fill='#ffe9a8' opacity='.85'/>",
      'linear-gradient(160deg, #1d2547, #2c3466)',
    ),
  },
  {
    id: 'waves',
    name: '물결',
    bg: svgTile(24, 12, "<path d='M0 9 Q6 3 12 9 T24 9' fill='none' stroke='#a8e0d6' stroke-width='1.4' opacity='.55'/>", '#1d5c63'),
  },
  {
    id: 'lattice',
    name: '창살',
    bg: svgTile(
      20,
      20,
      "<rect x='0' y='0' width='20' height='20' fill='none' stroke='#e9c99a' stroke-width='1.6' opacity='.55'/><path d='M10 0v20M0 10h20' stroke='#e9c99a' stroke-width='.8' opacity='.35'/>",
      '#6b4a2f',
    ),
  },
  { id: 'checker', name: '바둑판', bg: 'repeating-conic-gradient(#2f5d3a 0 25%, #3a6e46 0 50%) 0 0/14px 14px' },
  { id: 'sunburst', name: '햇살', bg: 'repeating-conic-gradient(from 0deg at 50% 50%, #b5452b 0 9deg, #c75a33 9deg 18deg)' },
  { id: 'polka', name: '물방울', bg: 'radial-gradient(circle, #f4c9d2 18%, transparent 20%) 0 0/12px 12px, radial-gradient(circle, #f4c9d2 18%, transparent 20%) 6px 6px/12px 12px, #7a2340' },
  {
    id: 'clouds',
    name: '구름무늬',
    bg: svgTile(
      32,
      24,
      "<path d='M6 16a4 4 0 0 1 4-4 5 5 0 0 1 9 1 3.5 3.5 0 0 1 1 6.8H8a3 3 0 0 1-2-3.8z' fill='none' stroke='#c9c4f2' stroke-width='1.2' opacity='.6'/><path d='M22 6a2.5 2.5 0 0 1 4.5-.5 2 2 0 0 1 1.5 3.5h-5a1.8 1.8 0 0 1-1-3z' fill='none' stroke='#c9c4f2' stroke-width='1' opacity='.45'/>",
      '#3a3478',
    ),
  },
];

export const CARD_TEXTURES: Skin[] = [
  { id: 'plain', name: '민무늬', bg: NONE },
  { id: 'linen', name: '리넨', bg: 'repeating-linear-gradient(0deg, rgba(0,0,0,.035) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.03) 0 1px, transparent 1px 3px)' },
  {
    id: 'paper',
    name: '한지',
    bg: svgTile(
      80,
      80,
      "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35 0 0 0 0 .28 0 0 0 0 .2 0 0 0 .16 0'/></filter><rect width='80' height='80' filter='url(#n)'/>",
    ),
  },
  { id: 'dots', name: '점무늬', bg: 'radial-gradient(circle, rgba(0,0,0,.07) 1px, transparent 1.4px) 0 0/8px 8px' },
  { id: 'grid', name: '모눈', bg: 'linear-gradient(rgba(0,0,0,.045) 1px, transparent 1px) 0 0/10px 10px, linear-gradient(90deg, rgba(0,0,0,.045) 1px, transparent 1px) 0 0/10px 10px' },
];

export const CHIP_TEXTURES: Skin[] = [
  { id: 'gloss', name: '광택', bg: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,.5), rgba(255,255,255,0) 46%)' },
  { id: 'flat', name: '무광', bg: NONE },
  { id: 'ring', name: '테두리 고리', bg: 'radial-gradient(circle, transparent 0 54%, rgba(255,255,255,.4) 55% 63%, transparent 64%)' },
  {
    id: 'marble',
    name: '대리석',
    bg: svgTile(
      60,
      60,
      "<filter id='m'><feTurbulence type='turbulence' baseFrequency='.035' numOctaves='3'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 -.1'/></filter><rect width='60' height='60' filter='url(#m)'/>",
    ),
  },
  { id: 'wood', name: '나뭇결', bg: 'repeating-linear-gradient(100deg, rgba(0,0,0,.08) 0 1px, transparent 1px 5px, rgba(255,255,255,.07) 5px 6px, transparent 6px 9px)' },
];

export interface SkinChoice {
  back: string;
  tex: string;
  chip: string;
}

export const DEFAULT_SKIN: SkinChoice = { back: 'plum', tex: 'linen', chip: 'gloss' };
const KEY = 'bg:skin';
const CUSTOM_KEY = 'bg:skin:custom';
/** 「내 이미지」 뒷면 id */
export const CUSTOM_BACK = 'custom';

function store(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readSkin(): SkinChoice {
  try {
    const v = JSON.parse(store()?.getItem(KEY) ?? 'null');
    if (v && typeof v === 'object') return { ...DEFAULT_SKIN, ...v };
  } catch {
    /* 기본값 */
  }
  return { ...DEFAULT_SKIN };
}

export function readCustomBack(): string | null {
  try {
    return store()?.getItem(CUSTOM_KEY) ?? null;
  } catch {
    return null;
  }
}

const find = (list: Skin[], id: string) => list.find((s) => s.id === id) ?? list[0];

/** 고른 스킨의 CSS 변수 값 */
export function skinVars(c: SkinChoice, custom = readCustomBack()): Record<'--card-back' | '--card-tex' | '--chip-tex', string> {
  const back = c.back === CUSTOM_BACK && custom ? `url("${custom}") center/cover, #3b3550` : find(CARD_BACKS, c.back).bg;
  return { '--card-back': back, '--card-tex': find(CARD_TEXTURES, c.tex).bg, '--chip-tex': find(CHIP_TEXTURES, c.chip).bg };
}

const listeners = new Set<(c: SkinChoice) => void>();

/** 문서 루트에 CSS 변수로 적용 */
export function applySkin(c: SkinChoice = readSkin()) {
  if (typeof document === 'undefined') return;
  const vars = skinVars(c);
  for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
}

export function saveSkin(c: SkinChoice) {
  try {
    store()?.setItem(KEY, JSON.stringify(c));
  } catch {
    /* 저장 못 해도 이번 화면에는 적용 */
  }
  applySkin(c);
  listeners.forEach((f) => f(c));
}

/** 이미지 파일을 카드 비율(5:7)로 잘라 작게 줄여 저장 — 기기에만 남는다 */
export async function saveCustomBack(file: File): Promise<boolean> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const W = 250;
    const H = 350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const s = Math.max(W / img.width, H / img.height);
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    const data = canvas.toDataURL('image/jpeg', 0.82);
    store()?.setItem(CUSTOM_KEY, data);
    return true;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function onSkinChange(f: (c: SkinChoice) => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}
