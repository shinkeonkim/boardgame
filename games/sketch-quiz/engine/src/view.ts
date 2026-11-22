import { GameConfig } from './config';
import { LogEntry, MatchState, Stroke, actors, choseong, hintFor, matchTotals, totalTurns } from './game';

export interface GameView {
  config: GameConfig;
  players: number;
  round: number;
  status: MatchState['status'];
  phase: MatchState['phase'];
  me: number;
  drawer: number;
  turnNo: number;
  totalTurns: number;
  /** 그리는 사람에게만 보기 */
  options: string[] | null;
  /** 그리는 사람·맞힌 사람·공개 때만 */
  word: string | null;
  /** 힌트 칸: 아는 글자 / 초성 / null */
  slots: { ch: string | null; cho: string | null }[];
  strokes: Stroke[];
  solved: number[];
  passed: number[];
  deadline: number;
  startedAt: number;
  ready: boolean[];
  guessPts: number[];
  drawPts: number[];
  roundScores: number[][];
  totals: number[];
  winners: number[];
  actors: number[];
  log: LogEntry[];
}

export function viewFor(m: MatchState, me: number): GameView {
  const knows = m.status !== 'playing' || m.phase === 'reveal' || me === m.drawer || m.solved.includes(me);
  const h = hintFor(m);
  const chars = [...m.word];
  return {
    config: { ...m.config, customWords: m.config.pack === 'custom' ? `${m.config.customWords.split(/[,\n]/).filter((x) => x.trim()).length}개` : '' },
    players: m.players,
    round: m.round,
    status: m.status,
    phase: m.phase,
    me,
    drawer: m.drawer,
    turnNo: m.turnNo,
    totalTurns: totalTurns(m),
    options: me === m.drawer && m.phase === 'pick' ? m.options : null,
    word: knows ? m.word : null,
    slots: chars.map((ch, i) => (knows ? { ch, cho: null } : ch === ' ' ? { ch: ' ', cho: null } : { ch: h.slots[i], cho: h.cho ? choseong(ch) : null })),
    strokes: m.strokes,
    solved: m.solved,
    passed: m.passed ?? [],
    deadline: m.deadline,
    startedAt: m.startedAt,
    ready: m.ready,
    guessPts: m.guessPts,
    drawPts: m.drawPts,
    roundScores: m.roundScores,
    totals: matchTotals(m),
    winners: m.winners,
    actors: actors(m),
    log: m.log.slice(-60),
  };
}
