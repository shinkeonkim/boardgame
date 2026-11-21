/**
 * 게임 하나가 플랫폼에 꽂히기 위해 구현하는 계약.
 *
 * 플랫폼(@bg/server, @bg/web)은 방·암호·관전·재접속·방장·턴 타이머·대신 진행·중지/이어하기·
 * 무중단 배포(상태 넘겨주기)·감정 표현을 모두 처리한다. 게임은 "규칙"만 순수 함수로 제공한다:
 * 설정 → 매치 생성 → 수 적용 → 플레이어별 뷰.
 *
 * - 모든 상태(Match)는 JSON으로 직렬화 가능해야 한다 (무중단 배포 때 그대로 다음 파드로 넘어간다).
 * - 난수는 rng 인자로만 받는다 (테스트 재현성). 매치 안에 난수 상태를 저장해도 된다.
 * - 규칙 위반은 RuleError(메시지는 사용자에게 그대로 보임)로 던진다.
 */

import type { Bot } from './bot';

/** 사용자에게 보여 줄 규칙 위반/설정 오류. 그 밖의 예외는 서버 오류로 취급한다 */
export class RuleError extends Error {
  readonly isRuleError = true;
}

export const isRuleError = (e: unknown): e is RuleError => !!e && typeof e === 'object' && (e as RuleError).isRuleError === true;

export type Rng = () => number;

export type MatchStatus = 'playing' | 'round-over' | 'match-over';

export interface LobbySummary {
  /** 로비 아래에 보이는 한 줄 요약 (예: "덱 60장 · 1인당 약 12턴") */
  text: string;
  /** 시작은 되지만 알려 줄 것 (예: "게임이 짧을 수 있어요") */
  warnings: string[];
  /** 게임 화면이 로비에서 쓰는 추가 숫자 (예: 빈 칸 수) */
  info: Record<string, number>;
}

export interface GameModule<Config extends object, Match, Move, View> {
  /** URL·저장소 키에 쓰는 식별자 (예: 'expedition-lines') */
  id: string;
  players: { min: number; max: number };
  defaultConfig: Config;
  /** 클라이언트가 보낸 부분 설정을 안전한 설정으로 (모르는 키·타입은 버림) */
  sanitizeConfig(input: Partial<Config>): Config;
  /** 시작할 수 없는 이유 목록 (빈 배열이면 시작 가능) */
  validateConfig(config: Config, players: number): string[];
  lobbySummary(config: Config, players: number): LobbySummary;
  /** 0이면 턴 제한 없음 */
  turnTimerSec(config: Config): number;
  /**
   * 지금 단계의 제한시간(초). 없으면 turnTimerSec. 끼어들기 게임에서 "도전할 사람?" 같은 짧은 대기 창에
   * 설정과 상관없이 시간을 두어 사람이 버튼을 안 눌러도 게임이 멈추지 않게 한다 (시간이 지나면 autoMove = 통과).
   */
  timerSec?(match: Match): number;

  newMatch(config: Config, players: number, rng: Rng): Match;
  /** 서버로 들어온 임의의 값이 이 게임의 수인지 (모양만 검사, 규칙 검사는 applyMove) */
  isMove(x: unknown): x is Move;
  applyMove(match: Match, seat: number, move: Move): void;
  /** 시간 초과·대신 진행 때 seat가 둘 수 (항상 합법이어야 함) */
  autoMove(match: Match, seat: number): Move;
  viewFor(match: Match, seat: number): View;

  status(match: Match): MatchStatus;
  /** 지금 차례인 좌석 (대표 한 명 — 화면 표시용) */
  turn(match: Match): number;
  /**
   * 지금 수를 둘 수 있는 좌석들. 없으면 [turn(match)].
   * 동시에 고르는 게임(모두가 카드 한 장씩)이나 끼어들기(도전·막기)는 여러 좌석을 돌려준다.
   * 플랫폼은 이 좌석들에 대해 타이머(시간 초과 → autoMove), 대신 진행, 봇 차례를 처리한다.
   */
  actors?(match: Match): number[];
  /** 봇 (없으면 autoMove로 두는 기본 봇). 봇 만드는 법: bot.ts */
  bot?: Bot<View, Move>;
  /** 1부터 시작하는 판 번호 */
  round(match: Match): number;
  config(match: Match): Config;
  /** 판별 누적 점수 (좌석 순) */
  totals(match: Match): number[];
  startNextRound(match: Match, rng: Rng): void;
  /** 방장이 중지한 매치를 바뀐 설정으로 이어가기 (끝난 판 점수 유지, 새 판 시작) */
  continueMatch(prev: Match, config: Config, rng: Rng): Match;
  /** 끝난 판 수 (중지 후 이어가기 판단용) */
  roundsDone(match: Match): number;
}

// 아무 게임이나 담는 그릇용 (플랫폼 내부)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameModule = GameModule<any, any, any, any>;
