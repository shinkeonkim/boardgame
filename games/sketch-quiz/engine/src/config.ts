export interface GameConfig {
  /** 한 사람이 그리는 횟수 */
  rounds: number;
  /** 그리는 시간 (초) */
  drawSec: number;
  /** 고를 단어 수 */
  choices: number;
  /** 단어 묶음 */
  pack: 'all' | 'nature' | 'daily' | 'fantasy' | 'custom';
  /** 방장이 넣은 단어 (쉼표·줄바꿈으로 구분, pack이 custom일 때) */
  customWords: string;
  /** 초성·글자 힌트 */
  hints: boolean;
}

export const LIMITS = {
  rounds: [1, 3],
  drawSec: [30, 150],
  choices: [1, 4],
  players: [2, 10],
} as const;

export const CLASSIC: GameConfig = { rounds: 1, drawSec: 80, choices: 3, pack: 'all', customWords: '', hints: true };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '기본', description: '한 명씩 한 번 · 80초 · 단어 3개 중 고르기 · 초성 힌트', config: CLASSIC },
  { id: 'long', label: '두 바퀴', description: '한 사람이 두 번씩 그려요', config: { ...CLASSIC, rounds: 2 } },
  { id: 'speed', label: '스피드', description: '45초 · 바로 정해진 단어', config: { ...CLASSIC, drawSec: 45, choices: 1 } },
  { id: 'hard', label: '힌트 없이', description: '초성·글자 힌트 없음 · 100초', config: { ...CLASSIC, hints: false, drawSec: 100 } },
  { id: 'nature', label: '자연·동물', description: '자연과 동물 단어만', config: { ...CLASSIC, pack: 'nature' } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

/** 방장 단어 목록: 2~12자, 중복 제거, 최대 300개 */
export function parseCustom(text: string): string[] {
  const out = new Set<string>();
  for (const w of String(text ?? '').split(/[,\n]/)) {
    const t = w.trim().replace(/\s+/g, ' ');
    if (t.length >= 1 && t.length <= 12) out.add(t);
    if (out.size >= 300) break;
  }
  return [...out];
}

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  return {
    rounds: clamp(c.rounds, LIMITS.rounds, 1),
    drawSec: clamp(c.drawSec, LIMITS.drawSec, 80),
    choices: clamp(c.choices, LIMITS.choices, 3),
    pack: (['all', 'nature', 'daily', 'fantasy', 'custom'] as const).includes(c.pack) ? c.pack : 'all',
    customWords: String(c.customWords ?? '').slice(0, 3000),
    hints: c.hints !== false,
  };
}

export function validateConfig(c: GameConfig): string[] {
  if (c.pack === 'custom' && parseCustom(c.customWords).length < 5) return ['직접 넣은 단어가 5개 이상 있어야 해요'];
  return [];
}
