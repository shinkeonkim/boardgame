import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry, Tile, analyze, arrange, setValue, tableProblem } from '@bg/number-runs-engine';
import { AlertBanner, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, fitZoom, SeatList, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, usePeek, useTable } from '@bg/web';
import { TileFace } from './theme';


type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, { title: 'Number Runs', turn: g.turn, playing: g.status === 'playing', mySub: '타일을 내거나 1장 가져와요' });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [draft, setDraft] = useState<Tile[][]>(g.table);
  const [hand, setHand] = useState<Tile[]>(g.hand);
  const [sel, setSel] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'color' | 'number'>('color');
  const reset = () => {
    setDraft(g.table.map((s) => [...s]));
    setHand([...g.hand]);
    setSel([]);
  };
  // 서버 상태가 바뀌면 초안을 새로
  useEffect(reset, [g.table, g.hand, g.turn]);

  const handIds = useMemo(() => new Set(g.hand.map((x) => x.id)), [g.hand]);
  const all = useMemo(() => new Map([...g.table.flat(), ...g.hand].map((x) => [x.id, x])), [g.table, g.hand]);
  const toggle = (id: string) => {
    if (!myTurn) return t.warn(t.waitingMsg);
    if (!g.opened[me] && !handIds.has(id)) return t.warn(`처음 등록(${c.initialMeld}점) 전에는 테이블 타일을 옮길 수 없어요`);
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  /** 고른 타일을 묶음 i로 (i = -1이면 새 묶음) */
  const moveTo = (i: number) => {
    if (!sel.length) return t.warn('먼저 옮길 타일을 골라 주세요');
    const tiles = sel.map((id) => all.get(id)!);
    const nextDraft = draft.map((s) => s.filter((x) => !sel.includes(x.id)));
    if (i === -1) nextDraft.push(tiles);
    else nextDraft[i] = arrange([...nextDraft[i], ...tiles], c.maxNumber, c.colors);
    setDraft(nextDraft.filter((s) => s.length).map((s) => arrange(s, c.maxNumber, c.colors)));
    setHand(hand.filter((x) => !sel.includes(x.id)));
    setSel([]);
  };
  const backToHand = () => {
    const back = sel.filter((id) => handIds.has(id));
    if (!back.length) return t.warn('테이블에 있던 타일은 손으로 가져올 수 없어요');
    setDraft(draft.map((s) => s.filter((x) => !back.includes(x.id))).filter((s) => s.length));
    setHand([...hand, ...back.map((id) => all.get(id)!).filter((x) => !hand.some((h) => h.id === x.id))]);
    setSel([]);
  };
  // ---------- 끌어다 놓기: 타일(고른 타일 묶음)을 묶음·「새 묶음」·손으로 ----------
  type Target = number | 'new' | 'hand';
  const [drag, setDrag] = useState<{ x: number; y: number; ids: string[]; over: Target | null } | null>(null);
  const fns = useRef({ moveTo, backToHand });
  fns.current = { moveTo, backToHand };
  const targetAt = (x: number, y: number): Target | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop]');
    if (!el) return null;
    const d = el.dataset.drop!;
    return d === 'new' || d === 'hand' ? d : Number(d);
  };
  const grab = (id: string, e: React.PointerEvent) => {
    if (!myTurn || e.button !== 0) return;
    if (!g.opened[me] && !handIds.has(id)) return;
    const sx = e.clientX;
    const sy = e.clientY;
    let ids: string[] | null = null;
    const move = (ev: PointerEvent) => {
      if (!ids) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        // 고른 타일 중 하나를 끌면 고른 것 모두, 아니면 그 타일만
        ids = sel.includes(id) ? sel : [id];
        setSel(ids);
      }
      setDrag({ x: ev.clientX, y: ev.clientY, ids, over: targetAt(ev.clientX, ev.clientY) });
    };
    const up = (ev: PointerEvent) => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      setDrag(null);
      if (!ids || ev.type !== 'pointerup') return;
      const to = targetAt(ev.clientX, ev.clientY);
      if (to === null) return;
      if (to === 'hand') fns.current.backToHand();
      else fns.current.moveTo(to === 'new' ? -1 : to);
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  };
  const dropCls = (to: Target) => (drag ? (drag.over === to ? 'drop-on' : 'drop-can') : '');

  const problem = myTurn ? tableProblem({ table: g.table, hands: Object.assign([], { [me]: g.hand }) as Tile[][], opened: g.opened, config: c }, me, draft) : null;
  const changed = hand.length !== g.hand.length;
  const submit = () => act('move', { move: { type: 'play', table: draft.map((s) => s.map((x) => x.id)) } });
  const sortedHand = [...hand].sort((a, b) => (sortBy === 'color' ? (a.n === 0 ? 1 : 0) - (b.n === 0 ? 1 : 0) || a.color - b.color || a.n - b.n : (a.n || 99) - (b.n || 99) || a.color - b.color));
  const freshSum = g.opened[me] ? 0 : draft.filter((s) => s.every((x) => handIds.has(x.id))).reduce((a, s) => a + setValue(s, c.maxNumber, c.colors), 0);

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '같은 색 연속(줄) 또는 같은 숫자 다른 색(무리)을 3장 이상 만들어 내요';
    switch (e.type) {
      case 'play':
        return `${names[e.seat]} 님이 타일 ${e.count}장을 냈어요${e.first ? ' (처음 등록!)' : ''}`;
      case 'draw':
        return e.empty ? `${names[e.seat]} 님은 낼 게 없고 더미도 비었어요` : `${names[e.seat]} 님이 1장 가져왔어요`;
      case 'win':
        return e.reason === 'out' ? `🎉 ${names[e.seat]} 님이 손을 다 비웠어요!` : `더미가 바닥나 남은 점수가 가장 적은 ${names[e.seat]} 님이 이겼어요`;
    }
  };
  const title = myTurn ? (changed ? (problem ? '아직 낼 수 없어요' : '이대로 낼까요?') : g.opened[me] ? '타일을 내거나 1장 가져오세요' : `처음 등록: 합 ${c.initialMeld} 이상`) : `${names[g.turn]} 님의 차례`;
  const hint = myTurn ? (changed ? problem ?? '「내기」를 누르면 확정돼요' : '타일을 묶음이나 「새 묶음」으로 끌어다 놓거나, 눌러 고른 뒤 묶음을 눌러요') : '테이블이 어떻게 바뀔까요?';
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} steps={!g.opened[me] && myTurn && changed ? <span className="tag">등록 {freshSum}/{c.initialMeld}</span> : null} />}
        </>
      }
      main={
        <>
          <section className={`nr-table ${myTurn ? 'editing' : ''}`} aria-label="테이블">
            {draft.length === 0 && <span className="muted small">테이블이 비었어요</span>}
            {draft.map((set, i) => {
              const ok = !!analyze(set, c.maxNumber, c.colors);
              return (
                <div key={i} data-drop={i} className={`nr-set ${ok ? 'ok' : 'bad'} ${dropCls(i)}`} onClick={myTurn && sel.length ? () => moveTo(i) : undefined}>
                  {set.map((x) => (
                    <TileFace
                      key={x.id}
                      flip={`n${x.id}`}
                      t={x}
                      size="sm"
                      selected={sel.includes(x.id)}
                      lifted={!!drag?.ids.includes(x.id)}
                      onPointerDown={myTurn ? (e) => grab(x.id, e) : undefined}
                      fresh={g.lastPlayed.includes(x.id) || (myTurn && handIds.has(x.id))}
                      onClick={
                        myTurn
                          ? () => {
                              if (sel.length && !sel.includes(x.id)) return; // 다른 타일을 고른 상태면 묶음 클릭으로
                              toggle(x.id);
                            }
                          : undefined
                      }
                    />
                  ))}
                  {!ok && <span className="nr-bad">✕</span>}
                </div>
              );
            })}
            {myTurn && (
              <button className={`nr-set new ${dropCls('new')}`} data-drop="new" onClick={() => moveTo(-1)} disabled={!sel.length && !drag}>
                + 새 묶음
              </button>
            )}
          </section>
          {me >= 0 && g.status === 'playing' && (
            <section className={`hand-panel ${dropCls('hand')}`} data-drop="hand" aria-label="내 타일">
              <div className="hand-panel-head small">
                <span>
                  내 타일 {hand.length}장{g.opened[me] ? '' : ` · 처음 등록 전 (${c.initialMeld}점 필요)`}
                </span>
                <span className="row tight">
                  <button className={`btn tiny ${sortBy === 'color' ? 'on' : 'ghost'}`} onClick={() => setSortBy('color')}>
                    색순
                  </button>
                  <button className={`btn tiny ${sortBy === 'number' ? 'on' : 'ghost'}`} onClick={() => setSortBy('number')}>
                    숫자순
                  </button>
                </span>
              </div>
              <div className="hand-row nr-hand">
                {sortedHand.map((x) => (
                  <TileFace key={x.id} flip={`n${x.id}`} t={x} selected={sel.includes(x.id)} lifted={!!drag?.ids.includes(x.id)} onClick={() => toggle(x.id)} onPointerDown={myTurn ? (e) => grab(x.id, e) : undefined} />
                ))}
              </div>
              {myTurn && (
                <div className="action-row">
                  <button className="btn primary" disabled={!changed || !!problem} onClick={submit}>
                    내기 ({g.hand.length - hand.length}장)
                  </button>
                  <button className="btn" onClick={() => act('move', { move: { type: 'draw' } })} disabled={changed}>
                    1장 가져오기 ({g.poolCount})
                  </button>
                  {sel.length > 0 && (
                    <button className="btn ghost" onClick={backToHand}>
                      손으로
                    </button>
                  )}
                  {changed && (
                    <button className="btn ghost" onClick={reset}>
                      되돌리기
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
          {drag &&
            createPortal(
              <div className="nr-ghost" style={{ left: drag.x, top: drag.y, ['--gz' as string]: fitZoom(innerWidth, innerHeight) }} aria-hidden>
                {drag.ids.map((id) => all.get(id)).map((x) => x && <TileFace key={x.id} t={x} />)}
              </div>,
              document.body,
            )}
        </>
      }
      side={
        <>
          {g.handCounts.some((n, i) => n <= 2 && i !== me) && g.status === 'playing' && <AlertBanner icon="⚠️" title="타일이 거의 없는 사람이 있어요" sub="곧 손을 비울지도 몰라요" />}
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.handCounts.map((n, seat) => ({
              seat,
              accent: seatColor(seat),
              score: `${n}장`,
              scoreLabel: '남은 타일',
              badge: g.opened[seat] ? <span className="tag ready">등록</span> : <span className="tag">등록 전</span>,
              children: g.roundScores.length ? <span className="muted small">누적 {g.totals[seat]}점</span> : undefined,
            }))}
          />
          <section className="panel small nr-ref">
            <b>규칙</b>
            <div>· 줄: 같은 색 연속 3장 이상 (예: 빨강 4·5·6)</div>
            <div>· 무리: 같은 숫자 다른 색 3~4장</div>
            <div>· ☺ 조커는 아무 타일로나, 남으면 30점 감점</div>
            <div>· 등록 뒤에는 테이블 묶음을 나누고 합쳐도 돼요 — 끝에 모든 묶음이 맞기만 하면</div>
            <div>· 더미 {g.poolCount}장</div>
          </section>
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
            headline={`🎉 ${names[g.winners[g.winners.length - 1]]} 님 승리!`}
            sub="진 사람은 남은 타일 합만큼 감점, 이긴 사람이 그만큼 가져가요 (조커 30)"
            columns={[...g.roundScores.map((_, i) => `${i + 1}판`), '남은 타일']}
            rows={g.totals.map((total, seat) => ({
              seat,
              rank: ranks[seat],
              cells: [...g.roundScores.map((r) => r[seat]), g.hands ? g.hands[seat].length : '—'],
              total,
            }))}
          />
        ))
      }
    />
  );
}
