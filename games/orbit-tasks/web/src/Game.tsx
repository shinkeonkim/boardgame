import { useEffect, useRef, useState } from 'react';
import type { RoomView } from '@bg/core';
import { Card, GameConfig, GameView, LogEntry } from '@bg/orbit-tasks-engine';
import { EmoteBubble, Icon, SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, useLogSounds, usePeek, useTable, useStagedView, stageTrickEnd, SeatRing } from '@bg/web';
import { SIGNAL_TEXT, SignalMark, SpaceCard, cardName } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view: raw, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  // 트릭이 끝나면: 모두의 카드가 가운데 놓인 모습 → 이긴 사람 쪽으로 쓸려 감
  const view = useStagedView(raw, (a: GameView, b: GameView) => stageTrickEnd(a, b));
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const draft = g.phase === 'draft';
  const t = useTable(view, notify, {
    title: 'Orbit Tasks',
    turn: g.turn,
    playing: g.status === 'playing',
    stepKey: `${g.round}-${g.phase}-${g.trickNo}-${g.trick.length}-${g.tasks.filter((x) => x.owner !== null).length}`,
    mySub: draft ? '맡을 과제를 골라요' : '카드를 1장 내요',
  });
  useLogSounds(
    g.log,
    (e) =>
      e.type === 'play'
        ? 'cardSnap'
        : e.type === 'take'
          ? 'pageTurn'
          : e.type === 'signal'
            ? ['beep', 'static']
            : e.type === 'trick'
              ? e.done.length
                ? ['sweep', 'ding']
                : 'sweep'
              : e.type === 'result'
                ? e.success
                  ? 'win'
                  : 'fail'
                : e.type === 'mission'
                  ? 'riffle'
                  : null,
    {
      me: t.me,
      describe: (e) => describe(e),
      stamp: (e) =>
        e.type === 'result'
          ? {
              text: e.success ? '임무 성공!' : '임무 실패',
              tone: e.success ? 'good' : 'bad',
              shake: e.success ? 0.5 : 1,
            }
          : e.type === 'signal'
            ? { text: '신호!', tone: 'info', othersOnly: true }
            : null,
    },
  );
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [signalMode, setSignalMode] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);
  const touch = useRef(false);
  useEffect(() => {
    setSignalMode(false);
    setArmed(null);
  }, [g.round, g.phase, g.trickNo]);
  const { bySeat } = emotesBySeat(emotes);

  const shown = g.trick;
  // 방금 가져간 트릭: 이긴 사람 자리에 작게 쌓임 (가운데에서 그리로 날아감)
  const wonPile = (s: number) =>
    g.lastTrick && g.lastTrick.winner === s ? (
      <span className="ot-won" aria-label="방금 가져간 트릭">
        {g.lastTrick.plays.map((p) => (
          <SpaceCard key={p.card.id} card={p.card} size="xs" flip={`h${g.round}-${p.card.id}`} />
        ))}
      </span>
    ) : null;
  const lastLog = g.log[g.log.length - 1];
  const order = me >= 0 ? Array.from({ length: g.players - 1 }, (_, k) => (me + 1 + k) % g.players) : Array.from({ length: g.players }, (_, k) => k);
  const legal = new Set(g.legal);
  const signalable = new Set(g.signalable);
  const tapCard = (card: Card) => {
    if (signalMode) {
      if (!signalable.has(card.id)) return t.warn('그 색에서 가장 높거나 가장 낮거나 하나뿐인 카드만 알릴 수 있어요 (로켓 제외)');
      setSignalMode(false);
      return act('move', { move: { type: 'signal', card: card.id } });
    }
    if (draft) return t.warn('먼저 과제를 모두 골라요');
    if (!myTurn) return t.warn(t.waitingMsg);
    if (!legal.has(card.id)) return t.warn('처음 낸 색이 있으면 그 색을 내야 해요');
    if (touch.current && armed !== card.id) return setArmed(card.id);
    setArmed(null);
    act('move', { move: { type: 'play', card: card.id } });
  };
  const take = (id: string) => {
    if (!myTurn || !draft) return t.warn(draft ? t.waitingMsg : '과제는 이미 다 골랐어요');
    act('move', { move: { type: 'take', task: id } });
  };

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '대장(로켓 4)이 먼저 과제를 골라요';
    switch (e.type) {
      case 'mission':
        return `임무 ${e.no} · 과제 ${e.tasks}개 · 대장 ${names[e.captain]}`;
      case 'take':
        return `${names[e.seat]} 님이 ${cardName(e.card)} 과제를 맡았어요`;
      case 'signal':
        return `${names[e.seat]} 님의 신호: ${cardName(e.card)} — ${SIGNAL_TEXT[e.kind]}`;
      case 'play':
        return `${names[e.seat]} · ${cardName(e.card)}`;
      case 'trick':
        return e.done.length ? `${names[e.seat]} 님이 과제 ${e.done.map(cardName).join(', ')} 성공!` : `${names[e.seat]} 님이 가져갔어요`;
      case 'result':
        return e.success ? '임무 성공! 🚀' : `임무 실패 — ${e.why}`;
      case 'end':
        return `항해 끝 · 가장 큰 성공: 과제 ${e.best}개`;
    }
  };
  const title = draft
    ? myTurn
      ? '맡을 과제를 골라요'
      : `${names[g.turn]} 님이 과제를 고르는 중`
    : signalMode
      ? '알릴 카드를 골라요'
      : myTurn
        ? g.trick.length
          ? '같은 색을 내요 (없으면 아무거나)'
          : '카드를 1장 내서 시작해요'
        : `${names[g.turn]} 님 차례`;
  const hint = draft ? `과제 ${g.tasks.filter((x) => x.owner !== null).length}/${g.tasks.length}개 맡음 · 대장 ${names[g.captain]}` : `임무 ${g.round} · 과제 ${g.tasks.filter((x) => x.done).length}/${g.tasks.length} · 로켓은 으뜸`;
  const matchOver = g.status === 'match-over';
  const resultLog = [...g.log].reverse().find((e) => e.type === 'result') as Extract<LogEntry, { type: 'result' }> | undefined;
  const canSignal = g.signalable.length > 0;

  return (
    <TableLayout
      layout="focus"
      dealIn={g.log.length <= 1}
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.attempts} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && (
            <TableBanner
              t={t}
              act={act}
              title={title}
              hint={hint}
              icon={<SeatDot seat={g.turn} size={16} />}
              steps={
                <span className="small muted nowrap">
                  임무 {g.round}/{c.attempts}
                </span>
              }
            />
          )}
        </>
      }
      main={
        <>
          <section className="ot-tasks" aria-label="과제">
            {g.tasks.map((task) => (
              <button
                key={task.card.id}
                type="button"
                className={`ot-task ${task.done ? 'done' : ''} ${task.owner === null ? 'open' : ''}`}
                onClick={() => task.owner === null && take(task.card.id)}
                disabled={task.owner !== null || !(draft && myTurn)}
                aria-label={`과제 ${cardName(task.card)}${task.owner !== null ? `, ${names[task.owner]} 님 맡음` : ''}${task.order ? `, 순서 ${task.order}` : ''}`}
              >
                {task.order !== null && <span className={`ot-order ${task.order < g.nextOrder ? 'past' : ''}`}>{task.order}</span>}
                <SpaceCard card={task.card} size="sm" />
                <span className="ot-task-owner small">
                  {task.done ? (
                    <>
                      <Icon name="check" /> 성공
                    </>
                  ) : task.owner !== null ? (
                    <>
                      <SeatDot seat={task.owner} size={9} /> {task.owner === me ? '나' : names[task.owner]}
                    </>
                  ) : (
                    '맡을 사람?'
                  )}
                </span>
              </button>
            ))}
          </section>

          <SeatRing
            players={g.players}
            me={me}
            className="ot-ring"
            seat={(s) => (
              <div data-ot-seat={s} className={`ot-opp ${g.turn === s ? 'acting' : ''}`}>
                <div className="ot-opp-head">
                  <SeatDot seat={s} size={10} /> <b>{names[s]}</b>
                  {g.captain === s && <span className="tag">대장</span>}
                  <EmoteBubble e={bySeat.get(s)} />
                </div>
                <span className="ot-opp-backs" aria-label={`카드 ${g.handCounts[s]}장`}>
                  {Array.from({ length: Math.min(g.handCounts[s], 13) }, (_, i) => (
                    <span key={i} className="ot-back" data-flip={`ob${g.round}-${s}-${i}`} data-flip-from=".ot-felt" />
                  ))}
                </span>
                <span className="small muted">카드 {g.handCounts[s]}장</span>
                {g.signals[s] && (
                  <span className="ot-opp-signal">
                    <SpaceCard card={g.signals[s]!.card} size="xs" />
                    <SignalMark kind={g.signals[s]!.kind} />
                  </span>
                )}
                {wonPile(s)}
              </div>
            )}
            center={
              <section className="ot-felt" aria-label="트릭">
                <div className="ot-center" aria-live="polite">
                  {shown.length === 0 && <span className="ot-empty small">{draft ? '과제를 고르는 중' : `${names[g.turn]} 님이 시작해요`}</span>}
                  {shown.map((p, i) => (
                    <div key={p.card.id} className={`ot-play ${g.lastTrick && !g.trick.length && p.seat === g.lastTrick.winner ? 'won' : ''}`} style={{ ['--i' as string]: i }}>
                      <SpaceCard card={p.card} size="md" flip={`h${g.round}-${p.card.id}`} />
                      <span className="ot-play-name small">
                        <SeatDot seat={p.seat} size={8} /> {p.seat === me ? '나' : names[p.seat]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            }
            bottom={
              me >= 0 && g.status === 'playing' ? (
                <section className="hand-panel ot-hand-panel" data-ot-seat={me} aria-label="내 카드">
                  <div className="hand-panel-head small">
                    <span>
                      <SeatDot seat={me} size={14} /> 내 카드 {g.hand.length}장{g.captain === me ? ' · 대장' : ''} {wonPile(me)}
                    </span>
                    {g.signals[me] ? (
                      <span className="ot-my-signal">
                        보낸 신호: {cardName(g.signals[me]!.card)} <SignalMark kind={g.signals[me]!.kind} />
                      </span>
                    ) : (
                      c.signals &&
                      !draft && (
                        <button
                          type="button"
                          className={`btn tiny ${signalMode ? 'primary' : ''}`}
                          disabled={!canSignal && !signalMode}
                          onClick={() => setSignalMode((x) => !x)}
                          title={canSignal ? '손패 한 장을 「가장 높음·낮음·하나뿐」으로 알려요 (트릭 사이에만)' : '트릭 사이에만 보낼 수 있어요'}
                        >
                          <Icon name="bell" /> {signalMode ? '그만두기' : '신호 보내기'}
                        </button>
                      )
                    )}
                  </div>
                  <div className="ot-hand" onPointerDown={(e) => (touch.current = e.pointerType !== 'mouse')}>
                    {g.hand.map((card, i) => {
                      const can = signalMode ? signalable.has(card.id) : !draft && myTurn && legal.has(card.id);
                      const isTask = g.tasks.find((x) => x.card.id === card.id && !x.done);
                      return (
                        <span
                          key={card.id}
                          className={`ot-slot ${armed === card.id ? 'picked' : ''}`}
                          style={{
                            ['--i' as string]: i,
                            ['--n' as string]: g.hand.length,
                          }}
                        >
                          <SpaceCard card={card} size="md" playable={can} dim={!can && (signalMode || (myTurn && !draft))} onClick={() => tapCard(card)} flip={`h${g.round}-${card.id}`} flipFrom=".ot-felt" className={isTask ? 'task' : ''} />
                        </span>
                      );
                    })}
                  </div>
                </section>
              ) : null
            }
          />
          <Ticker text={describe(lastLog)} />
        </>
      }
      side={
        <>
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.handCounts.map((n, seat) => ({
              seat,
              accent: seatColor(seat),
              children: (
                <span className="ot-seat small">
                  {g.captain === seat && <span className="tag">대장</span>} 카드 {n}장 · 과제 {g.tasks.filter((x) => x.owner === seat && !x.done).length}개 남음
                </span>
              ),
            }))}
          />
          <SideNote title="항해 기록">
            {g.results.length === 0 ? (
              <div className="muted">아직 끝낸 임무가 없어요</div>
            ) : (
              g.results.map((r, i) => (
                <div key={i}>
                  임무 {i + 1} · 과제 {r.level}개 — {r.success ? '성공' : '실패'}
                </div>
              ))
            )}
          </SideNote>
          <SideNote title="규칙">
            <div>모두 한 팀 — 과제 카드는 맡은 사람이 가져가야 해요</div>
            <div>처음 낸 색이 있으면 그 색을 내요 · 로켓은 으뜸</div>
            <div>순서 번호가 붙은 과제는 1번부터 차례로</div>
            {c.signals && <div>임무마다 한 번, 트릭 사이에 카드 한 장을 「가장 높음·낮음·하나뿐」으로 알려요</div>}
          </SideNote>
        </>
      }
      overlay={
        g.status !== 'playing' &&
        (peek ? (
          <button className="btn primary peek-btn" onClick={() => setPeek(false)}>
            결과 보기
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
            headline={matchOver ? `항해 끝! 가장 큰 성공: 과제 ${g.best}개` : resultLog?.success ? '🚀 임무 성공!' : '임무 실패'}
            sub={matchOver ? `${g.results.filter((r) => r.success).length}/${g.results.length}번 성공했어요` : resultLog?.success ? (c.climb ? `다음 임무는 과제 ${g.level + 1}개` : '같은 과제 수로 한 번 더') : (resultLog?.why ?? '')}
            columns={g.results.map((_, i) => `임무 ${i + 1}`)}
            rows={g.totals.map((total, seat) => ({
              seat,
              rank: 1,
              cells: g.results.map((r) => (r.success ? `✔ ${r.level}` : '✖')),
              total: `${total}점`,
            }))}
          />
        ))
      }
    />
  );
}
