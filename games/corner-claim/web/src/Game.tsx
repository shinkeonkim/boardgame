import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RoomView } from '@bg/core';
import { Cell, GameConfig, GameView, LogEntry, pieceById, placeProblem } from '@bg/corner-claim-engine';
import { GameScreenProps, ResultSheet, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, usePeek, useTable, SideNote } from '@bg/web';
import { COLORS, PieceIcon, flip, orientIndex, rotate } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const n = c.size;
  const t = useTable(view, notify, { title: 'Corner Claim', turn: g.owners[g.color], playing: g.status === 'playing', stepKey: `${g.color}-${g.log.length ? g.log[g.log.length - 1].n : 0}`, mySub: `${COLORS[g.color].name} 조각을 놓아요` });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [piece, setPiece] = useState<string | null>(null);
  const [shape, setShape] = useState<Cell[]>([]);
  const [hover, setHover] = useState<[number, number] | null>(null);
  useEffect(() => {
    setPiece(null);
    setHover(null);
  }, [g.color, g.log.length]);

  const choose = (id: string) => {
    if (!myTurn) return t.warn(t.waitingMsg);
    if (live.current.piece === id) return; // 이미 든 조각은 돌린 모양 그대로
    setPiece(id);
    setShape(pieceById(id)!.orients[0]);
  };
  const rot = () => shape.length && setShape(rotate(shape));
  const flp = () => shape.length && setShape(flip(shape));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') rot();
      if (e.key === 'f' || e.key === 'F') flp();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /** 조각의 가운데쯤이 가리킨 칸에 오도록 놓을 자리 */
  const placementFor = (id: string, cells: Cell[], at: [number, number]) => {
    const cx = Math.floor(Math.max(...cells.map((s) => s[0])) / 2);
    const cy = Math.floor(Math.max(...cells.map((s) => s[1])) / 2);
    const x = at[0] - cx;
    const y = at[1] - cy;
    const orient = orientIndex(id, cells);
    const problem = placeProblem({ board: g.board, config: c, remaining: g.remaining }, g.color, { piece: id, orient, x, y });
    return { x, y, orient, problem, cells: new Set(cells.map(([dx, dy]) => (y + dy) * n + (x + dx))) };
  };
  /** 미리보기 */
  const preview = useMemo(() => (piece && hover && shape.length ? placementFor(piece, shape, hover) : null), [piece, hover, shape, g.board, c, g.remaining, g.color, n]); // eslint-disable-line react-hooks/exhaustive-deps

  const place = () => {
    if (!preview) return;
    if (preview.problem) return t.warn(preview.problem);
    act('move', { move: { type: 'place', piece, orient: preview.orient, x: preview.x, y: preview.y } });
  };

  // ---------- 끌어다 놓기 ----------
  // 판 칸은 data-i로 찾는다 (화면 맞춤 배율과 상관없이 elementFromPoint로 판정)
  const boardRef = useRef<HTMLElement>(null);
  const live = useRef({ piece, shape });
  live.current = { piece, shape };
  const [drag, setDrag] = useState<{ x: number; y: number; over: boolean } | null>(null);
  const cellAt = (px: number, py: number): [number, number] | null => {
    const el = document.elementFromPoint(px, py)?.closest<HTMLElement>('.cc-cell[data-i]');
    if (!el) return null;
    const i = Number(el.dataset.i);
    return [i % n, Math.floor(i / n)];
  };
  const cellPx = () => (boardRef.current ? boardRef.current.getBoundingClientRect().width / n : 24);
  /** 손가락으로 끌 때는 조각이 손가락에 가리지 않게 조금 위를 가리킨다 */
  const track = (e: { pointerType: string }, onEnd?: (cell: [number, number] | null) => void) => {
    const touch = e.pointerType !== 'mouse';
    const lift = touch ? cellPx() * 1.8 : 0;
    let moved = false;
    let sx = NaN;
    let sy = NaN;
    const move = (ev: PointerEvent) => {
      if (Number.isNaN(sx)) {
        sx = ev.clientX;
        sy = ev.clientY;
      }
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
      moved = true;
      const cell = cellAt(ev.clientX, ev.clientY - lift);
      setHover(cell);
      setDrag({ x: ev.clientX, y: ev.clientY - lift, over: !!cell });
    };
    const up = (ev: PointerEvent) => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      setDrag(null);
      if (moved && ev.type === 'pointerup') onEnd?.(cellAt(ev.clientX, ev.clientY - lift));
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  };
  /** 조각 줄에서 집어 판으로 끌기 → 놓으면 바로 둔다 (안 되는 자리면 이유를 보여 주고 그대로 들고 있음) */
  const grab = (id: string, e: React.PointerEvent) => {
    if (!myTurn) return t.warn(t.waitingMsg);
    if (e.button !== 0) return;
    if (live.current.piece !== id) {
      setPiece(id);
      setShape(pieceById(id)!.orients[0]);
    }
    track(e, (cell) => {
      const { piece: p, shape: sh } = live.current;
      if (!cell || !p) return;
      const pl = placementFor(p, sh, cell);
      setHover(cell);
      if (pl.problem) return t.warn(pl.problem);
      act('move', { move: { type: 'place', piece: p, orient: pl.orient, x: pl.x, y: pl.y } });
    });
  };
  /** 터치: 조각을 고른 뒤 판 위에서 손가락을 움직여 자리를 맞춤 (놓기는 「놓기」 버튼) */
  const boardDown = (e: React.PointerEvent) => {
    if (!myTurn || !piece || e.pointerType === 'mouse') return;
    track(e);
  };
  // 휠 = 회전, 오른쪽 클릭 = 뒤집기 (조각을 들고 있을 때)
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      if (!live.current.piece) return;
      e.preventDefault();
      if (Date.now() - last < 140) return;
      last = Date.now();
      setShape((sh) => (e.deltaY < 0 ? rotate(rotate(rotate(sh))) : rotate(sh)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches;

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '내 색의 귀퉁이(★)에서 시작해, 내 조각과 모서리만 닿게 넓혀 가요';
    if (e.type === 'stuck') return `${COLORS[e.color].name}은 더 놓을 곳이 없어요`;
    return `${names[e.seat]} · ${COLORS[e.color].name}: ${e.size}칸 조각을 놓았어요`;
  };
  const myColors = g.fixedOwners.flatMap((o, col) => (o === me ? [col] : []));
  const title = myTurn ? (piece ? '놓을 자리를 고르세요' : `${COLORS[g.color].name} 조각을 고르세요`) : `${names[g.owners[g.color]]} 님 · ${COLORS[g.color].name} 차례`;
  const hint = myTurn
    ? piece
      ? isTouch
        ? '판으로 끌어다 놓거나, 칸을 눌러 맞춘 뒤 「놓기」 · 내 색과는 모서리만 닿게'
        : '판으로 끌어다 놓거나 판을 눌러 놓기 · 휠/R 회전 · 오른쪽 클릭/F 뒤집기'
      : '조각을 판으로 끌어다 놓아요 · 큰 조각부터 쓰는 게 좋아요'
    : '어디로 뻗어 올까요?';
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
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<span className="cc-swatch" style={{ background: COLORS[g.color].fill }} />} />}
        </>
      }
      main={
        <>
          <div className="table-fit">
            <section
              ref={boardRef}
              className={`cc-board ${piece && myTurn ? 'holding' : ''}`}
              style={{ ['--n' as string]: n }}
              aria-label="판"
              onMouseLeave={() => !isTouch && !drag && setHover(null)}
              onPointerDown={boardDown}
              onContextMenu={(e) => {
                if (!piece) return;
                e.preventDefault();
                flp();
              }}
            >
              {g.board.map((cell, i) => {
                const x = i % n;
                const y = (i - x) / n;
                const start = g.starts.findIndex(([sx, sy]) => sx === x && sy === y);
                const inPreview = preview?.cells.has(i);
                return (
                  <div
                    key={i}
                    data-i={i}
                    className={`cc-cell ${cell >= 0 ? 'filled' : ''} ${g.lastCells.includes(i) ? 'last' : ''} ${inPreview ? (preview!.problem ? 'pv-bad' : 'pv-ok') : ''}`}
                    style={cell >= 0 ? { background: COLORS[cell].fill } : inPreview ? { ['--pv' as string]: COLORS[g.color].fill } : undefined}
                    onMouseEnter={() => !isTouch && piece && !drag && setHover([x, y])}
                    onClick={() => {
                      if (!myTurn || !piece) return;
                      if (isTouch) setHover([x, y]);
                      else place();
                    }}
                  >
                    {start >= 0 && cell < 0 && <span className="cc-star" style={{ color: COLORS[start].fill }}>★</span>}
                  </div>
                );
              })}
            </section>
          </div>
          {me >= 0 && g.status === 'playing' && (
            <section className="hand-panel cc-tray" aria-label="내 조각">
              <div className="hand-panel-head small">
                <span>
                  {myColors.map((col) => (
                    <span key={col} className="cc-swatch" style={{ background: COLORS[col].fill }} />
                  ))}{' '}
                  {myTurn ? `${COLORS[g.color].name} 조각 ${g.remaining[g.color].length}개` : '내 조각'}
                </span>
                {piece && myTurn && (
                  <span className="row tight">
                    <button className="btn tiny" onClick={rot} title="회전 (R)">
                      ↻ 회전
                    </button>
                    <button className="btn tiny" onClick={flp} title="뒤집기 (F)">
                      ⇋ 뒤집기
                    </button>
                    {isTouch && (
                      <button className="btn tiny primary" disabled={!preview || !!preview.problem} onClick={place}>
                        놓기
                      </button>
                    )}
                  </span>
                )}
              </div>
              {piece && myTurn && preview?.problem && <div className="small warn">{preview.problem}</div>}
              <div className="cc-pieces">
                {(myTurn ? g.remaining[g.color] : g.remaining[myColors[0] ?? 0] ?? []).map((id) => (
                  <PieceIcon
                    key={id}
                    cells={piece === id ? shape : pieceById(id)!.orients[0]}
                    color={myTurn ? g.color : myColors[0] ?? 0}
                    size={13}
                    selected={piece === id}
                    dragging={piece === id && !!drag}
                    onClick={myTurn ? () => choose(id) : undefined}
                    onPointerDown={myTurn ? (e) => grab(id, e) : undefined}
                    title={`${pieceById(id)!.size}칸 조각`}
                  />
                ))}
              </div>
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
          {drag &&
            !drag.over &&
            piece &&
            createPortal(
              // 판 밖에서 끌고 있을 때: 손에 든 조각 (판 위에서는 판의 미리보기가 대신 보인다)
              <div className="cc-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden>
                <PieceIcon cells={shape} color={g.color} size={cellPx()} />
              </div>,
              document.body,
            )}
        </>
      }
      side={
        <>
          <section className="panel small cc-colors">
            {COLORS.slice(0, g.remaining.length).map((col, i) => {
              const owner = g.fixedOwners[i];
              const left = g.remaining[i].reduce((a, id) => a + pieceById(id)!.size, 0);
              return (
                <div key={i} className={`cc-color ${g.color === i && g.status === 'playing' ? 'active' : ''} ${g.stuck[i] ? 'stuck' : ''}`}>
                  <span className="cc-swatch" style={{ background: col.fill }} />
                  <b>{col.name}</b>
                  <span className="muted">{owner >= 0 ? names[owner] : '돌아가며'}</span>
                  <span className="grow" />
                  <span title="남은 칸">{left}칸</span>
                  <b>{g.colorScores[i] > 0 ? `+${g.colorScores[i]}` : g.colorScores[i]}</b>
                  {g.stuck[i] && <span className="tag">막힘</span>}
                </div>
              );
            })}
          </section>
          <section className="panel small cc-players">
            {Array.from({ length: g.players }, (_, s) => (
              <div key={s} className="cc-player">
                {g.fixedOwners.flatMap((o, col) => (o === s ? [<span key={col} className="cc-swatch" style={{ background: COLORS[col].fill }} />] : []))}
                <b>{names[s]}</b>
                {view.members.find((m) => m.seat === s)?.bot && <span className="tag bot">🤖</span>}
                <span className="grow" />
                <b>{g.totals[s]}점</b>
              </div>
            ))}
          </section>
          <SideNote title="규칙" className="cc-ref">
            <div>· 첫 조각은 내 귀퉁이 ★을 덮어요</div>
            <div>· 내 색끼리는 모서리만 닿고 변은 닿으면 안 돼요 (남의 색은 상관없음)</div>
            <div>· 놓을 곳이 없으면 그 색은 끝 · 남은 칸 −1점, 다 놓으면 +15 (마지막이 1칸이면 +20)</div>
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
            headline={`🧩 ${names[g.winners[g.winners.length - 1]]} 님이 가장 넓게 차지했어요!`}
            sub="남은 칸은 감점, 모두 놓으면 보너스"
            columns={g.roundTotals.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.roundTotals.map((r) => r[seat]), total }))}
          />
        ))
      }
    />
  );
}
