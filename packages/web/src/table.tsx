/**
 * 게임 화면 공통 틀 (테이블 키트).
 *
 * Expedition Lines·Crown March 화면에서 게임마다 반복하던 부분을 모았다:
 *  - useTable: 차례 알림(스플래시·소리·진동·탭 제목), 남은 시간, 대신 진행, "지금은 안 돼요" 흔들기, 좌석별 감정 표현
 *  - TableTopBar: 판 수·방 코드·소리·멈추기·닫기·테마·게임 방법 (+ 게임 전용 버튼)
 *  - TableBanner: 차례 배너 + 타이머 + 대신 진행
 *  - SeatList: 2~10명 좌석 목록 (이름·봇·연결·점수·차례·말풍선 + 게임 전용 내용)
 *  - ResultSheet: 판/게임 결과 표 + 다음 판·대기실·판 다시 보기
 *  - TableLayout: 기기 화면에 고정된 [가운데 테이블 | 정보] (좁으면 위아래). 배치는 게임 기본값(layout) 또는 사용자가 꾸미기에서 고른 값
 * 새 게임은 이것들로 틀을 만들고 가운데 테이블과 손패만 그린다.
 */
import { useReplay } from './replay';
import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { EmoteEvent, RoomView } from '@bg/core';
import { EmoteBubble, EmoteButton, EmoteFeed, SkinButton, ThemeToggle, TurnBanner, TurnSplash, TurnTimer, useCountdown, useSkin, Icon, iconize, type TableLayoutKind } from '@bg/ui';
import { useFlip } from './motion';
import { fitZoom } from './fit';
export { fitZoom };
import type { Act } from './client';
import { GuideButton } from './Guide';
import { CloseRoomButton, StopGameButton } from './Lobby';
import { sound } from './sound';
import type { Fx } from './fx';
import { callout, noteActor, panOf, pulseSeat, shakeBoard, stamp, type StampTone } from './action-feed';

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
  /** 이번 단계는 큰 스플래시 없이 배너·소리만 (도전·막기처럼 남의 행동마다 짧게 열리는 대기 창) */
  quiet?: boolean;
}

export function useTable(view: RoomView, notify: (msg: string) => void, o: TableOptions) {
  const names = view.seats;
  // 관전자가 한 사람을 따라 보면(view.following) 그 사람 시점으로 그림 (조작은 App 이 막음)
  const me = view.members.find((m) => m.id === view.you)?.seat ?? view.following ?? -1;
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
    // 남의 차례는 배너·좌석 강조로 충분하다. 큰 스플래시는 판을 가리므로 내 차례에만 (봇은 1초마다 두기도 한다)
    if (!myTurn) {
      const n = names.length;
      if (!o.simultaneous && n > 2 && me >= 0 && (o.turn + 1) % n === me) sound.play('turn');
      return;
    }
    if (o.quiet) {
      sound.play('turn');
      return;
    }
    setSplash({ text: o.simultaneous ? '고를 차례!' : '내 차례!', sub: o.mySub ?? '', mine: true, k: Date.now() });
    sound.play('myTurn');
    const t = setTimeout(() => setSplash(null), 1300);
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
            {round}
            {rounds ? `/${rounds}` : ''}판
          </b>
        )}
        <span className="muted"> · {view.code}</span>
      </div>
      <div className="small right">
        <button className="btn ghost tiny" aria-label={muted ? '소리 켜기' : '소리 끄기'} onClick={() => sound.setMuted(!muted)}>
          <Icon name={muted ? 'bellOff' : 'bell'} />
        </button>
        {/* 넓은 화면: 한 줄로 · 좁은 화면: 「⋯」 안으로 */}
        <span className="tb-inline">
          {isHost && !over && <StopGameButton act={act} small />}
          {isHost && <CloseRoomButton act={act} small />}
          <ThemeToggle variant="icon" />
          <SkinButton />
        </span>
        <GuideButton className="btn ghost tiny" label="게임 방법" />
        {children}
        <details className="tb-more">
          <summary className="btn ghost tiny" aria-label="더 보기">
            ⋯
          </summary>
          <div className="tb-more-menu">
            {isHost && !over && <StopGameButton act={act} small />}
            {isHost && <CloseRoomButton act={act} small />}
            <span className="tb-more-row">
              <ThemeToggle variant="icon" />
              <SkinButton />
            </span>
          </div>
        </details>
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
          {icon} {iconize(title)}
        </>
      }
      hint={iconize(hint)}
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
            data-seat={r.seat}
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
                {m?.bot && (
                  <span className={`tag bot ${m.bot}`}>
                    <Icon name="bot" />
                  </span>
                )}
                {m && !m.connected && <span className="tag away-tag">연결 끊김</span>}
                {r.badge}
              </span>
              {r.score !== undefined && (
                <span className="seat-score" title={r.scoreLabel}>
                  {iconize(r.score)}
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
        <h2>{iconize(headline)}</h2>
        {sub && <p className="muted small">{iconize(sub)}</p>}
        <ReplayButton />
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
                      <td key={i}>{iconize(c)}</td>
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
export function useFitZoom(): number {
  const read = () => (typeof window === 'undefined' ? 1 : fitZoom(window.innerWidth, window.innerHeight));
  const [z, setZ] = useState(read);
  useEffect(() => {
    const on = () => setZ(read());
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);
  return z;
}

/** 판 영역 맞춤: 100%로 재 보고 넘치면 그만큼 줄임 (같은 프레임 안이라 깜빡이지 않음) */
const MIN_MAIN_FIT = 0.72;
function fitMain(main: HTMLElement | null, inner: HTMLElement | null) {
  if (!main || !inner) return;
  inner.style.zoom = '';
  const have = main.clientHeight;
  let z = 1;
  // 줄이면 판(남는 높이를 채우는 보드)이 다시 커질 수 있어 몇 번 다시 잰다
  for (let i = 0; i < 4 && have > 0; i++) {
    const need = main.scrollHeight;
    if (need <= have + 2 || z <= MIN_MAIN_FIT) break;
    z = Math.max(MIN_MAIN_FIT, Math.floor(z * (have / need) * 1000) / 1000);
    inner.style.zoom = String(z);
  }
  main.dataset.fit = String(z);
}

/**
 * layout: 이 게임에 어울리는 기본 배치 (꾸미기에서 사용자가 고르면 그걸 따름).
 *  right(기본) · left · bottom(가로로 긴 판) · focus(판만 화면 가득, 정보는 버튼 — 둘러앉는 카드 게임)
 */
export function TableLayout({ className = '', top, main, side, mine, splash, overlay, layout = 'right' }: { className?: string; top: ReactNode; main: ReactNode; side: ReactNode; mine?: boolean; splash?: Table['splash']; overlay?: ReactNode; layout?: TableLayoutKind }) {
  const zoom = useFitZoom();
  const pref = useSkin().layout;
  const kind = pref && pref !== 'auto' ? pref : layout;
  const root = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  // 판 영역에 다 안 들어가면(폰·폰 가로) 그 안의 내용을 넘친 만큼 줄여 스크롤 없이 보이게 (최소 72%).
  // 움직임(FLIP)이 위치를 재기 전에 맞춰야 하므로 useFlip보다 먼저.
  useLayoutEffect(() => fitMain(mainRef.current, innerRef.current));
  useEffect(() => {
    const m = mainRef.current;
    if (!m) return;
    const ro = new ResizeObserver(() => fitMain(mainRef.current, innerRef.current));
    ro.observe(m);
    return () => ro.disconnect();
  }, []);
  useFlip(root);
  // 낮은 가로 화면(휴대폰 눕힘)에서는 정보 패널을 접어 테이블을 넓게 (버튼으로 펼침)
  const [sideOpen, setSideOpen] = useState(false);
  return (
    <main ref={root} data-layout={kind} className={`page game table-game ${mine ? 'my-turn' : ''} ${sideOpen ? 'side-open' : ''} ${className}`} style={{ '--z': zoom } as CSSProperties}>
      {top}
      <div className="table-layout">
        <section className="table-main" ref={mainRef}>
          <div className="table-main-in" ref={innerRef}>
            {main}
          </div>
        </section>
        <aside className="table-side">{side}</aside>
      </div>
      <button className="side-toggle btn small" onClick={() => setSideOpen((x) => !x)} aria-expanded={sideOpen}>
        {sideOpen ? (
          <>
            정보 닫기 <Icon name="x" />
          </>
        ) : (
          <>
            <Icon name="users" /> 정보
          </>
        )}
      </button>
      <TurnSplash splash={splash ?? null} />
      {overlay}
    </main>
  );
}

/** 마지막 행동 한 줄 */
export function Ticker({ text }: { text: ReactNode }) {
  return (
    <div className="ticker small muted" aria-live="polite">
      {iconize(text) || ' '}
    </div>
  );
}

/** 접을 수 있는 규칙 요약 (넓고 높은 화면은 펼친 채, 좁거나 낮은 화면은 접힌 채 시작) */
export function SideNote({ title, className = '', children }: { title: ReactNode; className?: string; children: ReactNode }) {
  const [open] = useState(() => typeof matchMedia === 'undefined' || matchMedia('(min-width: 760px) and (min-aspect-ratio: 1/1) and (min-height: 620px)').matches);
  return (
    <details className={`panel small side-note ${className}`} open={open}>
      <summary>
        <b>{title}</b>
      </summary>
      <div className="side-note-body">{children}</div>
    </details>
  );
}

/** useLogSounds의 셋째 인자: 남이 둔 것을 「보이게」 */
export interface LogFeed<E> {
  /** 내 자리 (내 것은 말풍선·날아오기 없음, 소리만) */
  me?: number;
  /** 그 항목을 한 문장으로 (보통 Ticker에 쓰는 describe) → 그 사람 자리 옆 말풍선 */
  describe?: (e: E) => ReactNode;
  /** 누가 했는지 (기본: e.seat) */
  actor?: (e: E) => number | null | undefined;
  /** 큰 순간이면 판 가운데 도장 (쪽!, 공격 +2, 요트!) */
  stamp?: (e: E) => StampSpec | string | null | undefined | false;
}
export interface StampSpec {
  text: ReactNode;
  tone?: StampTone;
  /** 판 흔들기 세기 (0이면 안 흔듦) */
  shake?: number;
  /** 남이 한 것일 때만 */
  othersOnly?: boolean;
}

const seatOf = (e: unknown): number | null => {
  const s = (e as { seat?: unknown }).seat;
  return typeof s === 'number' ? s : null;
};

/**
 * 기록(log)에 새 항목이 생길 때마다 소리. pick이 그 항목에 맞는 효과음(들)을 고른다.
 * 처음 화면을 열었을 때(이미 쌓인 기록)는 울리지 않는다. 한 번에 여러 개 생기면 차례로 (최대 6개).
 * feed를 주면 남이 둔 것을 보여 준다: 자리 반짝 + 말풍선 + 새 카드가 그 자리에서 날아옴 + 소리가 그 자리 쪽에서.
 */
export function useLogSounds<E extends { n: number }>(log: E[], pick: (e: E) => Fx | Fx[] | null | undefined, feed: LogFeed<E> = {}) {
  const last = useRef<number | null>(null);
  const lastN = log.length ? log[log.length - 1].n : 0;
  const actorOf = (e: E) => (feed.actor ? feed.actor(e) : seatOf(e)) ?? null;
  // 렌더 중에 적어 둠: 이 렌더로 새로 생긴 카드·말은 그 사람 자리에서 날아온다 (useFlip)
  if (last.current !== null && lastN > last.current) {
    const fresh = log.filter((e) => e.n > last.current!);
    const who = fresh.map(actorOf).filter((s): s is number => s !== null && s !== feed.me);
    if (who.length) noteActor(who[who.length - 1]);
  }
  useEffect(() => {
    const prev = last.current;
    last.current = lastN;
    if (prev === null || lastN <= prev) return;
    const fresh = log.filter((e) => e.n > prev).slice(-6);
    const visible = typeof document === 'undefined' || !document.hidden;
    let at = 0; // 이 항목을 보여 줄 때 (초)
    for (const e of fresh) {
      const who = actorOf(e);
      const others = who !== null && feed.me !== undefined && who !== feed.me;
      const f = pick(e);
      let d = at;
      const pan = who !== null && who !== feed.me ? panOf(who) : 0;
      for (const name of f ? (Array.isArray(f) ? f : [f]) : []) {
        sound.fx(name, d, others ? { pan, gain: 0.85 } : { pan });
        d += 0.05;
      }
      if (visible) {
        const st = feed.stamp?.(e);
        const spec: StampSpec | null = !st ? null : typeof st === 'string' ? { text: st } : st;
        const text = others && feed.describe ? feed.describe(e) : null;
        const show = () => {
          if (others && who !== null) {
            pulseSeat(who);
            if (text) callout(who, text);
          }
          if (spec && (!spec.othersOnly || others)) {
            stamp(spec.text, spec.tone ?? 'hot');
            if (spec.shake) shakeBoard(spec.shake);
          }
        };
        if (at === 0) show();
        else window.setTimeout(show, at * 1000); // 다음 변화가 와도 취소하지 않음 (보여 줄 건 끝까지)
      }
      at += others || f ? 0.5 : 0.15;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastN]);
}

/** 값이 바뀔 때 소리 한 번 (기록이 없는 변화: 새 판의 주사위 굴림, 접시 넘기기 등) */
export function useChangeSound(key: unknown, fx: Fx | null, when = true) {
  const prev = useRef(key);
  useEffect(() => {
    if (prev.current !== key && when && fx) sound.fx(fx);
    prev.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** 결과 화면의 「처음부터 되감아 보기」 (이 기기에서 장면을 모아 둔 경우만 — 「판 다시 보기」(판 엿보기)와 다름) */
function ReplayButton() {
  const r = useReplay();
  if (!r) return null;
  return (
    <button type="button" className="btn small replay-open" onClick={r.open}>
      <Icon name="undo" /> 처음부터 되감아 보기 <span className="muted small">· {r.frames}장면</span>
    </button>
  );
}

