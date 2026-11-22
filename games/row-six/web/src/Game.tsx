import { useEffect, useMemo, useState } from 'react';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry } from '@bg/row-six-engine';
import { AlertBanner, SeatDot, seatColor } from '@bg/ui';
import {
  GameScreenProps,
  ResultSheet,
  SeatList,
  TableBanner,
  TableEmotes,
  TableLayout,
  TableTopBar,
  Ticker,
  rankOf,
  usePeek,
  useTable,
  waitingText,
} from '@bg/web';
import { CardBack, NumberCard, Penalty } from './theme';

type View = RoomView<GameView, GameConfig>;

function describe(e: LogEntry | undefined, names: string[]): string {
  if (!e) return '모두 카드 한 장씩 골라 주세요';
  if (e.type === 'reveal') return `공개! ${e.cards.map((c) => `${names[c.seat]} ${c.card}`).join(' · ')}`;
  if (e.type === 'round') return `${e.round}판이 끝났어요`;
  const who = names[e.seat];
  if (e.low) return `${who} 님이 가장 작은 ${e.card}을 내서 ${e.row + 1}번 줄을 가져갔어요 (벌점 ${e.penalty})`;
  if (e.took.length) return `${who} 님의 ${e.card}이 ${e.row + 1}번 줄의 ${e.took.length + 1}번째라 줄을 가져갔어요 (벌점 ${e.penalty})`;
  return `${who} 님의 ${e.card}이 ${e.row + 1}번 줄에 놓였어요`;
}

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const flat = c.penalty === 'flat';
  const t = useTable(view, notify, {
    title: 'Row Six',
    turn: g.chooser ?? g.actors[0] ?? 0,
    playing: g.status === 'playing',
    simultaneous: g.phase === 'pick',
    stepKey: `${g.round}-${g.turn}-${g.phase}`,
    mySub: g.phase === 'take' ? '가져갈 줄을 골라 주세요' : '모두 고르면 한꺼번에 공개돼요',
  });
  const names = t.names;
  const me = t.me;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [hover, setHover] = useState<number | null>(null);
  const picking = g.status === 'playing' && g.phase === 'pick' && me >= 0;
  const choosing = g.status === 'playing' && g.phase === 'take' && g.chooser === me;
  const canPick = picking && (g.myPick === null || c.allowChange);
  const focus = hover ?? g.myPick;
  const focusPreview = focus !== null ? g.preview[focus] : undefined;

  /** 이번 차례에 놓인 카드 → 강조 */
  const fresh = useMemo(() => new Set(g.placed.map((p) => p.card)), [g.placed]);
  const placedBy = useMemo(() => new Map(g.placed.map((p) => [p.card, p.seat])), [g.placed]);

  const pick = async (card: number) => {
    if (g.status !== 'playing') return;
    if (me < 0) return t.warn('관전 중에는 고를 수 없어요');
    if (g.phase === 'take') return t.warn(g.chooser === me ? '먼저 가져갈 줄을 골라 주세요' : `${names[g.chooser!]} 님이 줄을 고르는 중이에요`);
    if (g.myPick !== null && !c.allowChange) return t.warn('이미 골랐어요. 모두 고르면 공개돼요');
    if (g.myPick === card) return;
    await act('move', { move: { type: 'pick', card } });
  };
  const take = (row: number) => {
    if (!choosing) return;
    act('move', { move: { type: 'take', row } });
  };

  // 키보드: 숫자 키로 줄 고르기
  useEffect(() => {
    if (!choosing) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= g.rows.length) take(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choosing, g.rows.length]);

  // ---------- 배너 ----------
  let title: string;
  let hint: string;
  if (g.phase === 'take') {
    const low = g.queue[0];
    if (choosing) {
      title = '가져갈 줄을 골라 주세요';
      hint = `내 ${low?.card}이 모든 줄 끝보다 작아요. 고른 줄의 카드를 가져가고 ${low?.card}이 새 줄의 첫 카드가 돼요`;
    } else {
      title = `${names[g.chooser!]} 님이 가져갈 줄을 고르는 중이에요`;
      hint = `가장 작은 ${low?.card}을 냈어요 · 나머지 카드는 그다음에 놓여요`;
    }
  } else if (me < 0) {
    title = '모두 카드를 고르는 중이에요';
    hint = `${g.picked.filter(Boolean).length}/${g.players}명 골랐어요 · 관전 중`;
  } else if (g.myPick === null) {
    title = `${g.turn}번째 카드를 골라 주세요`;
    hint = '모두 고르면 한꺼번에 공개되고, 작은 카드부터 줄에 놓여요';
  } else {
    title = `${g.myPick}을 골랐어요`;
    hint = `${waitingText(t)}${c.allowChange ? ' · 공개 전에는 다른 카드로 바꿀 수 있어요' : ''}`;
  }

  // 판 끝 경고: 목표 벌점 근처
  const danger = c.endMode === 'target' ? g.totals.map((x, i) => ({ seat: i, left: c.target - x })).filter((x) => x.left <= 12).sort((a, b) => a.left - b.left) : [];

  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals, true);

  return (
    <TableLayout
      mine={t.myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.endMode === 'rounds' ? c.rounds : undefined} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && (
            <TableBanner
              t={t}
              act={act}
              title={title}
              hint={hint}
              steps={
                <span className="small muted nowrap">
                  {g.turn}/{c.handSize}장째
                </span>
              }
            />
          )}
        </>
      }
      main={
        <>
          <section className={`rows ${choosing ? 'choosing' : ''}`} style={{ ['--limit' as string]: c.rowLimit }} aria-label="줄">
            {g.rows.map((row, i) => {
              const target = focus !== null && focusPreview?.row === i;
              const willTake = target && focusPreview?.take;
              return (
                <div
                  key={i}
                  className={`row-line ${target ? 'target' : ''} ${willTake ? 'will-take' : ''} ${choosing ? 'pickable' : ''}`}
                  onClick={choosing ? () => take(i) : undefined}
                  role={choosing ? 'button' : undefined}
                  aria-label={`${i + 1}번 줄, 벌점 ${g.rowPenalties[i]}${choosing ? ', 눌러서 가져가기' : ''}`}
                >
                  <span className="row-label">
                    <b>{i + 1}</b>
                    <Penalty v={g.rowPenalties[i]} />
                  </span>
                  <div className="row-cards">
                    {Array.from({ length: c.rowLimit }, (_, k) => {
                      const n = row[k];
                      if (n === undefined) return <span key={`e${k}`} className="slot" />;
                      const by = placedBy.get(n);
                      return (
                        <NumberCard
                          key={n}
                          n={n}
                          flip={`c${n}`}
                          flat={flat}
                          size="md"
                          className={fresh.has(n) ? 'fresh' : ''}
                          style={by !== undefined ? { ['--by' as string]: seatColor(by) } : undefined}
                        />
                      );
                    })}
                    <span className="slot danger" title={`${c.rowLimit + 1}번째 카드는 줄을 가져가요`}>
                      {willTake && focus !== null ? <NumberCard n={focus} flat={flat} size="md" className="ghost" /> : <span>✋</span>}
                    </span>
                  </div>
                  {choosing && <span className="take-hint">이 줄 가져가기 · 벌점 {g.rowPenalties[i]}</span>}
                </div>
              );
            })}
          </section>

          {(g.queue.length > 0 || g.placed.length > 0) && (
            <section className="reveal" aria-label="공개된 카드">
              <span className="small muted">이번 공개</span>
              {[...g.placed.map((p) => ({ seat: p.seat, card: p.card, done: true, took: p.took.length > 0, pen: p.penalty })), ...g.queue.map((q) => ({ ...q, done: false, took: false, pen: 0 }))]
                .sort((a, b) => a.card - b.card)
                .map((x) => (
                  <span key={x.card} className={`reveal-item ${x.done ? 'done' : 'waiting'} ${x.took ? 'took' : ''}`}>
                    <NumberCard n={x.card} flat={flat} size="sm" flip={x.done ? undefined : `c${x.card}`} />
                    <span className="reveal-who">
                      <SeatDot seat={x.seat} size={12} /> {names[x.seat]}
                      {x.took && <b className="took-pen"> +{x.pen}</b>}
                    </span>
                  </span>
                ))}
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1], names)} />
          {me >= 0 && g.status === 'playing' && (
            <section className="hand-panel" aria-label="내 카드">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 카드 {g.hand.length}장
                </span>
                {focus !== null && focusPreview && (
                  <span className={`preview-note ${focusPreview.take ? 'bad' : 'ok'}`}>
                    {focusPreview.row < 0
                      ? `${focus}: 가장 작아요 → 줄 하나를 가져가요 (가장 가벼운 줄 벌점 ${focusPreview.penalty})`
                      : focusPreview.take
                        ? `${focus}: ${focusPreview.row + 1}번 줄이 꽉 차 있어 벌점 ${focusPreview.penalty}`
                        : `${focus}: 지금은 ${focusPreview.row + 1}번 줄로 가요 (다른 카드가 먼저 들어오면 바뀔 수 있어요)`}
                  </span>
                )}
              </div>
              <div className="hand-row">
                {g.hand.map((n) => {
                  const pv = g.preview[n];
                  return (
                    <NumberCard
                      key={n}
                      n={n}
                      flip={`c${n}`}
                      flat={flat}
                      size="lg"
                      className={`${g.myPick === n ? 'picked' : ''} ${pv?.take ? 'risky' : ''} ${canPick ? 'can' : ''}`}
                      onClick={() => pick(n)}
                      title={pv?.take ? (pv.row < 0 ? '가장 작은 카드라 줄을 가져가요' : `${pv.row + 1}번 줄을 가져가요`) : undefined}
                      ariaLabel={`${n} 내기`}
                      disabled={!picking}
                    />
                  );
                })}
              </div>
              <div className="small muted center">
                {g.phase === 'take' ? '줄을 고르는 동안 잠깐 기다려요' : g.myPick === null ? '카드를 누르면 바로 골라져요' : c.allowChange ? '다른 카드를 누르면 바꿀 수 있어요' : '공개를 기다리는 중'}
              </div>
            </section>
          )}
        </>
      }
      side={
        <>
          {danger.length > 0 && g.status === 'playing' && (
            <AlertBanner
              icon="⚠️"
              title={`${names[danger[0].seat]} 님이 ${c.target}점까지 ${Math.max(0, danger[0].left)}점`}
              critical={danger[0].left <= 5}
              compactKey={danger[0].left}
              sub="이번 판이 끝나면 게임이 끝날 수 있어요"
            />
          )}
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.picked.map((pk, seat) => ({
              seat,
              accent: seatColor(seat),
              score: <Penalty v={g.totals[seat] + (g.status === 'playing' ? g.penalties[seat] ?? 0 : 0)} />,
              scoreLabel: '누적 벌점 (이번 판 포함)',
              badge:
                g.status === 'playing' && g.phase === 'pick' ? (
                  <span className={`tag ${pk ? 'ready' : ''}`}>{pk ? '골랐어요 ✓' : '고르는 중…'}</span>
                ) : g.chooser === seat ? (
                  <span className="tag results">줄 고르는 중</span>
                ) : null,
              children: (
                <>
                  <span className="mini-hand" aria-label={`카드 ${g.handCounts[seat]}장`}>
                    {Array.from({ length: Math.min(g.handCounts[seat], 12) }, (_, i) => (
                      <CardBack key={i} size="xs" />
                    ))}
                  </span>
                  <span className="muted small">
                    이번 판 {g.penalties[seat] === null ? '비공개' : `벌점 ${g.penalties[seat]}`} · 가져간 카드 {g.takenCounts[seat]}장
                  </span>
                  {c.teams && <span className="tag">{Math.floor(seat / 2) + 1}팀</span>}
                </>
              ),
            }))}
          />
          <p className="small muted rule-note">
            작은 카드부터 놓여요 · 줄의 {c.rowLimit + 1}번째가 되면 그 줄을 가져가요 · 벌점이 적을수록 이겨요
            {c.endMode === 'target' ? ` · 누군가 ${c.target}점이 넘으면 끝` : ''}
          </p>
        </>
      }
      overlay={
        g.status !== 'playing' &&
        (peek ? (
          <button className="btn primary peek-btn" onClick={() => setPeek(false)}>
            점수 보기
          </button>
        ) : (
          <ResultSheet
            view={view}
            act={act}
            onLeave={onLeave}
            onPeek={() => setPeek(true)}
            matchOver={matchOver}
            round={g.round}
            status={g.status}
            headline={
              matchOver
                ? ranks.filter((r) => r === 1).length === g.players
                  ? '비겼어요!'
                  : `${ranks.flatMap((r, i) => (r === 1 ? [names[i]] : [])).join(', ')} 님이 이겼어요!`
                : `${g.round}판 결과`
            }
            sub={
              matchOver
                ? c.endMode === 'target' && g.totals.some((x) => x >= c.target)
                  ? `누군가 ${c.target}점을 넘어서 끝났어요 · 벌점이 가장 적은 사람이 이겨요`
                  : '벌점이 가장 적은 사람이 이겨요'
                : `아직 ${c.endMode === 'target' ? `${c.target}점을 넘은 사람이 없어요` : `${c.rounds - g.round}판 남았어요`}`
            }
            columns={g.roundScores.length > 1 ? g.roundScores.map((_, i) => `${i + 1}판`) : ['이번 판']}
            rows={g.totals.map((total, seat) => ({
              seat,
              rank: ranks[seat],
              cells: g.roundScores.map((r) => r[seat]),
              total,
            }))}
            note={c.teams ? '팀전: 같은 팀 두 사람의 벌점을 더해요' : undefined}
          />
        ))
      }
    />
  );
}
