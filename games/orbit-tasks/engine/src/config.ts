export interface GameConfig {
  /** 첫 임무의 과제 수 */
  tasks: number;
  /** 성공하면 다음 임무에 과제를 하나 더 */
  climb: boolean;
  /** 순서 표시가 붙는 과제 수 (1번·2번… 순서대로 해내야 함) */
  ordered: number;
  /** 임무마다 한 번, 손패 한 장을 「가장 높음·가장 낮음·하나뿐」으로 알려 주기 */
  signals: boolean;
  /** 임무를 몇 번 시도하나 (실패해도 한 번으로 셈) */
  attempts: number;
  turnTimerSec: number;
}

export const LIMITS = {
  tasks: [1, 8],
  ordered: [0, 3],
  attempts: [1, 12],
  turnTimerSec: [0, 120],
  players: [3, 5],
} as const;

export const CLASSIC: GameConfig = { tasks: 1, climb: true, ordered: 0, signals: true, attempts: 6, turnTimerSec: 0 };

export interface Preset {
  id: string;
  label: string;
  description: string;
  config: GameConfig;
}

export const PRESETS: Preset[] = [
  { id: 'classic', label: '처음부터', description: '과제 1개부터, 성공할 때마다 하나씩 늘려 6번 도전', config: CLASSIC },
  { id: 'mid', label: '중간부터', description: '과제 3개 · 순서 표시 1개로 시작', config: { ...CLASSIC, tasks: 3, ordered: 1 } },
  { id: 'hard', label: '어렵게', description: '과제 5개 · 순서 표시 2개 · 신호 없음', config: { ...CLASSIC, tasks: 5, ordered: 2, signals: false } },
  { id: 'long', label: '긴 항해', description: '12번 도전해서 어디까지 가나', config: { ...CLASSIC, attempts: 12 } },
];

const clamp = (v: unknown, [lo, hi]: readonly [number, number], d: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};

export function sanitizeConfig(input: Partial<GameConfig>): GameConfig {
  const c = { ...CLASSIC, ...input };
  const tasks = clamp(c.tasks, LIMITS.tasks, 1);
  return {
    tasks,
    climb: c.climb !== false,
    ordered: Math.min(tasks, clamp(c.ordered, LIMITS.ordered, 0)),
    signals: c.signals !== false,
    attempts: clamp(c.attempts, LIMITS.attempts, 6),
    turnTimerSec: clamp(c.turnTimerSec, LIMITS.turnTimerSec, 0),
  };
}

export function validateConfig(_c: GameConfig, players: number): string[] {
  return players < 3 ? ['궤도 임무는 3명부터 할 수 있어요'] : [];
}
