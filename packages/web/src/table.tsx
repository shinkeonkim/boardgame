/**
 * 게임 화면 공통 틀 (테이블 키트).
 *
 * Expedition Lines·Crown March 화면에서 게임마다 반복하던 부분을 모았다:
 *  - useTable: 차례 알림(스플래시·소리·진동·탭 제목), 남은 시간, 대신 진행, "지금은 안 돼요" 흔들기, 좌석별 감정 표현
 *  - TableTopBar: 판 수·방 코드·소리·멈추기·닫기·테마·게임 방법 (+ 게임 전용 버튼)
 *  - TableBanner: 차례 배너 + 타이머 + 대신 진행
 *  - SeatList: 2~10명 좌석 목록 (이름·봇·연결·점수·차례·말풍선 + 게임 전용 내용)
 *  - ResultSheet: 판/게임 결과 표 + 다음 판·대기실·판 다시 보기
 *  - TableLayout: 기기 화면에 고정된 [가운데 테이블 | 오른쪽 정보] (좁으면 위아래)
 * 새 게임은 이것들로 틀을 만들고 가운데 테이블과 손패만 그린다.
 */
import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import type { EmoteEvent, RoomView } from '@bg/core';
import { EmoteBubble, EmoteButton, EmoteFeed, ThemeToggle, TurnBanner, TurnSplash, TurnTimer, useCountdown } from '@bg/ui';
import type { Act } from './client';
import { GuideButton } from './Guide';
import { CloseRoomButton, StopGameButton } from './Lobby';
import { sound } from './sound';

export interface TableOptions {
  /** 탭 제목 (게임 이름) */
  title: string;
  /** 대표 차례 좌석 (동시 진행이면 아무나, 스플래시·배너에 씀) */
  turn: number;
  /** 진행 중인지 */
  playing: boolean;
  /** 내 차례 스플래시 아래 문구 */
  mySub?: string;
  /** 동시 진행 게임: 차례가 "모두"로 바뀌는 단계마다 스플래시 (기본: 좌석이 바뀔 때만) */
  simultaneous?: boolean;
  /** 같은 좌석이 연속으로 할 때도 스플래시를 다시 띄울 키 (예: 판 번호·단계) */
  stepKey?: string | number;
}

export function useTable(view: RoomView, notify: (msg: string) => void, o: TableOptions) {
  const names = view.seats;
  const me = view.members.find((m) => m.id === view.you)?.seat ?? -1;
  const actors = view.actors;
  const myTurn = o.playing && me >= 0 && actors.includes(me);
  const turnName = names[o.turn] ?? '';
  const turnDeadline = useMemo(() => (view.turnRemainingMs !== null ? Date.now() + view.turnRemainingMs : null), [view]);
  const nudgeDeadline = useMemo(() => (view.nudgeInMs !== null ? Date.now() + view.nudgeInMs : null), [view]);
  const secs = useCountdown(turnDeadline);
  const nudgeLeft = useCountdown(nudgeDeadline);
  const [shake, setShake] = useState(0);
  const warn = (msg: string) => {
    notify(msg);
    setShake((n) => n + 1);
  };
  const waitingMsg = me < 0 ? '관전 중에는 둘 수 없어요' : o.simultaneous ? '이번에는 이미 골랐어요. 다른 사람을 기다려 주세요' : `지금은 ${turnName} 님의 차례예요`;

  // 내 차례: 진동 + 다른 탭이면 탭 제목
  useEffect(() => {
    if (!myTurn) return;
    try {
      navigator.vibrate?.(60);
    } catch {
      /* 지원 안 함 */
    }
    if (document.hidden) document.title = `● 내 차례 — ${o.title}`;
    const restore = () => {
      if (!document.hidden) document.title = o.title;
    };
    document.addEventListener('visibilitychange', restore);
    return () => {
      document.removeEventListener('visibilitychange', restore);
      document.title = o.title;
    };
  }, [myTurn, o.title]);

  // 차례 전환 스플래시 + 알림음
  const [splash, setSplash] = useState<{ text: string; sub: string; mine: boolean; k: number } | null>(null);
  const key = o.simultaneous ? `${o.stepKey ?? ''}-${myTurn}` : `${o.stepKey ?? ''}-${o.turn}`;
  const last = useRef(key);
  useEffect(() => {
    if (key === last.current || !o.playing) {
      last.current = key;
      return;
    }
    last.current = key;
    if (o.simultaneous && !myTurn) return;
    const mine = myTurn;
    const n = names.length;
    setSplash({
      text: mine ? (o.simultaneous ? '고를 차례!' : '내 차례!') : `${turnName} 님 차례`,
      sub: mine ? o.mySub ?? '' : n > 2 && me >= 0 && (o.turn + 1) % n === me ? '다음은 내 차례예요' : '',
      mine,
      k: Date.now(),
    });
    sound.play(mine ? 'myTurn' : 'turn');
    const t = setTimeout(() => setSplash(null), mine ? 1400 : 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, o.playing]);

  return {
    me,
    names,
    actors,
    myTurn,
    turnName,
    secs,
    nudgeLeft: view.nudgeInMs !== null ? nudgeLeft : null,
    shake,
    warn,
    waitingMsg,
    splash,
    isHost: view.hostId === view.you,
    /** 차례인 사람이 끊겼는지 (봇 제외) */
    away: (seat: number) => {
      const m = view.members.find((x) => x.seat === seat);
      return !!m && !m.connected;
    },
    botLevel: (seat: number) => view.members.find((x) => x.seat === seat)?.bot ?? null,
  };
}

export type Table = ReturnType<typeof useTable>;

/** 좌석별 최근 감정 표현 */
export function emotesBySeat(emotes: EmoteEvent[]) {
  const bySeat = new Map<number, EmoteEvent>();
  for (const e of emotes) if (e.seat !== null) bySeat.set(e.seat, e);
  return { bySeat, seatless: emotes.filter((e) => e.seat === null) };
}

function useMuted() {
  const [muted, setMuted] = useState(sound.muted);
  useEffect(() => {
    const off = sound.subscribe(setMuted);
    return () => {
      off();
    };
  }, []);
  return muted;
}

/** 게임 화면 위 막대 */
export function TableTopBar({ view, act, round, rounds, over, children }: { view: RoomView; act: Act; round?: number; rounds?: number; over?: boolean; children?: ReactNode }) {
  const muted = useMuted();
  const isHost = view.hostId === view.you;
  return (
    <header className="topbar compact">
      <div className="small">
        {round !== undefined && (
          <b>
            {round}/{rounds ?? 1}판
          </b>
        )}
        <span className="muted"> · {view.code}</span>
      </div>
      <div className="small right">
        <button className="btn ghost tiny" aria-label={muted ? '소리 켜기' : '소리 끄기'} onClick={() => sound.setMuted(!muted)}>
          {muted ? '🔕' : '🔔'}
        </button>
        {isHost && !over && <StopGameButton act={act} small />}
        {isHost && <CloseRoomButton act={act} small />}
        <ThemeToggle variant="icon" />
        <GuideButton className="btn ghost tiny" label="게임 방법" />
        {children}
      </div>
    </header>
  );
}

/** 차례 배너 (+ 타이머·대신 진행) */
export function TableBanner({
  t,
  act,
  title,
  hint,
  icon,
  steps,
  style,
  footer,
}: {
  t: Table;
  act: Act;
  title: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  /** 오른쪽에 함께 보일 것 (단계 표시 등) */
  steps?: ReactNode;
  style?: CSSProperties;
  footer?: ReactNode;
}) {
  const awayActor = t.actors.some((s) => t.away(s));
  return (
    <TurnBanner
      mine={t.myTurn}
      away={awayActor && !t.myTurn}
      style={style}
      shake={t.shake}
      shakeKey={t.actors.join('.')}
      title={
        <>
          {icon} {title}
        </>
      }
      hint={hint}
      footer={footer}
      side={
        <>
          {steps}
          <TurnTimer secs={t.secs} />
          {t.nudgeLeft !== null && t.me >= 0 && (
            <button className="btn tiny" disabled={t.nudgeLeft > 0} onClick={() => act('nudge')} title="연결이 끊긴 사람 대신 자동으로 둬요">
              대신 진행{t.nudgeLeft > 0 ? ` (${t.nudgeLeft}초)` : ''}
            </button>
          )}
        </>
      }
    />
  );
}

/** 사람이 읽기 좋은 "누가 하고 있는지" 문구 */
export function waitingText(t: Table, verb = '고르는 중'): string {
  const others = t.actors.filter((s) => s !== t.me);
  if (!others.length) return '';
  const names = others.map((s) => t.names[s]);
  return names.length <= 2 ? `${names.join(', ')} 님이 ${verb}이에요` : `${names.slice(0, 2).join(', ')} 님 외 ${names.length - 2}명이 ${verb}이에요`;
}

export interface SeatRow {
  seat: number;
  /** 오른쪽 숫자 (점수·남은 개수 등) */
  score?: ReactNode;
  scoreLabel?: string;
  /** 이름 아래 게임 전용 내용 (손패 뒷면·칩·상태) */
  children?: ReactNode;
  /** 이름 옆 작은 표시 (예: "탈락", "골랐어요 ✓") */
  badge?: ReactNode;
  dim?: boolean;
  /** 같은 팀 등 색 */
  accent?: string;
}

/** 좌석 목록: 나부터 차례대로. 5명 이상이면 촘촘하게 */
export function SeatList({ t, view, rows, emotes, onSeat, className = '' }: { t: Table; view: RoomView; rows: SeatRow[]; emotes: EmoteEvent[]; onSeat?: (seat: number) => void; className?: string }) {
  const { bySeat } = emotesBySeat(emotes);
  const n = rows.length;
  const ordered = t.me >= 0 ? [...rows].sort((a, b) => ((a.seat - t.me + n) % n) - ((b.seat - t.me + n) % n)) : rows;
  return (
    <section className={`seat-list ${n >= 5 ? 'dense' : ''} ${className}`} aria-label="플레이어">
      {ordered.map((r) => {
        const m = view.members.find((x) => x.seat === r.seat);
        const active = t.actors.includes(r.seat);
        return (
          <div
            key={r.seat}
            className={`seat-row ${active ? 'active' : ''} ${r.seat === t.me ? 'mine' : ''} ${r.dim ? 'dim' : ''} ${onSeat ? 'clickable' : ''}`}
            style={r.accent ? ({ ['--seat' as string]: r.accent } as CSSProperties) : undefined}
            onClick={onSeat ? () => onSeat(r.seat) : undefined}
          >
            <div className="seat-head">
              <span className="seat-name">
                <EmoteBubble e={bySeat.get(r.seat)} />
                {active && <span className="pulse" aria-hidden />}
                <b>{t.names[r.seat]}</b>
                {r.seat === t.me && <span className="tag mine">나</span>}
                {m?.bot && <span className={`tag bot ${m.bot}`}>🤖</span>}
                {m && !m.connected && <span className="tag away-tag">연결 끊김</span>}
                {r.badge}
              </span>
              {r.score !== undefined && (
                <span className="seat-score" title={r.scoreLabel}>
                  {r.score}
                </span>
              )}
            </div>
            {r.children && <div className="seat-body">{r.children}</div>}
          </div>
        );
      })}
    </section>
  );
}

/** 관전자 감정 표현 + 내 감정 표현 버튼 */
export function TableEmotes({ emotes, onEmote, small }: { emotes: EmoteEvent[]; onEmote: (id: string) => void; small?: boolean }) {
  const { seatless } = emotesBySeat(emotes);
  return (
    <>
      <EmoteFeed items={seatless} />
      <EmoteButton onSend={onEmote} small={small} />
    </>
  );
}

export interface ResultRow {
  seat: number;
  rank: number;
  cells: ReactNode[];
  total: ReactNode;
}

/** 판/게임 결과 (오버레이) */
export function ResultSheet({
  view,
  act,
  onLeave,
  onPeek,
  headline,
  sub,
  columns,
  rows,
  matchOver,
  round,
  status,
  note,
  children,
}: {
  view: RoomView;
  act: Act;
  onLeave: () => void;
  onPeek?: () => void;
  headline: ReactNode;
  sub?: ReactNode;
  columns: string[];
  rows: ResultRow[];
  matchOver: boolean;
  round: number;
  status: string;
  note?: ReactNode;
  children?: ReactNode;
}) {
  const names = view.seats;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="결과">
      <div className="panel sheet">
        <h2>{headline}</h2>
        {sub && <p className="muted small">{sub}</p>}
        {children}
        <div className="table-wrap">
          <table className="scores">
            <thead>
              <tr>
                <th />
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
                <th>합계</th>
              </tr>
            </thead>
            <tbody>
              {[...rows]
                .sort((a, b) => a.rank - b.rank || a.seat - b.seat)
                .map((r, idx) => (
                  <tr key={r.seat} style={{ ['--r' as string]: idx }}>
                    <th className="left nowrap">
                      <span className="rank">{r.rank}</span> {names[r.seat]}
                    </th>
                    {r.cells.map((c, i) => (
                      <td key={i}>{c}</td>
                    ))}
                    <td>
                      <b>{r.total}</b>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {note && <p className="small">{note}</p>}
        <div className="row">
          <button className="btn primary grow" onClick={() => (matchOver ? act('back') : act('next', { round, status }))}>
            {matchOver ? '대기실로 돌아가기' : '다음 판 시작하기'}
          </button>
          {onPeek && (
            <button className="btn" onClick={onPeek}>
              판 다시 보기
            </button>
          )}
          {matchOver && (
            <button className="btn ghost" onClick={onLeave}>
              나가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 결과 화면을 잠깐 닫고 판을 다시 보기 */
export function usePeek(resetKey: unknown) {
  const [peek, setPeek] = useState(false);
  useEffect(() => setPeek(false), [resetKey]);
  return [peek, setPeek] as const;
}

/** 순위 매기기 (높은 점수가 1등, lowerWins면 낮은 점수가 1등) */
export function rankOf(totals: number[], lowerWins = false): number[] {
  return totals.map((v) => 1 + totals.filter((o) => (lowerWins ? o < v : o > v)).length);
}

/** "○○ 님이 이겼어요!" (동점이면 함께) */
export function winnerHeadline(names: string[], ranks: number[]): string {
  const top = ranks.flatMap((r, i) => (r === 1 ? [names[i]] : []));
  if (top.length === ranks.length && ranks.length > 1) return '비겼어요!';
  return `${top.join(', ')} 님이 이겼어요!`;
}

/** 기기 화면 고정 틀: 위 막대·배너, 가운데 테이블(남은 공간), 오른쪽(좁으면 아래) 정보 패널 */
export function TableLayout({ className = '', top, main, side, mine, splash, overlay }: { className?: string; top: ReactNode; main: ReactNode; side: ReactNode; mine?: boolean; splash?: Table['splash']; overlay?: ReactNode }) {
  return (
    <main className={`page game table-game ${mine ? 'my-turn' : ''} ${className}`}>
      {top}
      <div className="table-layout">
        <section className="table-main">{main}</section>
        <aside className="table-side">{side}</aside>
      </div>
      <TurnSplash splash={splash ?? null} />
      {overlay}
    </main>
  );
}

/** 마지막 행동 한 줄 */
export function Ticker({ text }: { text: ReactNode }) {
  return (
    <div className="ticker small muted" aria-live="polite">
      {text || ' '}
    </div>
  );
}
