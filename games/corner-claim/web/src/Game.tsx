import { useEffect, useMemo, useState } from 'react';
import type { RoomView } from '@bg/core';
import { Cell, GameConfig, GameView, LogEntry, pieceById, placeProblem } from '@bg/corner-claim-engine';
import { GameScreenProps, ResultSheet, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, usePeek, useTable } from '@bg/web';
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

  /** 미리보기: 조각의 가운데쯤을 가리킨 칸에 */
  const preview = useMemo(() => {
    if (!piece || !hover || !shape.length) return null;
    const cx = Math.floor(Math.max(...shape.map((s) => s[0])) / 2);
    const cy = Math.floor(Math.max(...shape.map((s) => s[1])) / 2);
    const x = hover[0] - cx;
    const y = hover[1] - cy;
    const orient = orientIndex(piece, shape);
    const problem = placeProblem({ board: g.board, config: c, remaining: g.remaining }, g.color, { piece, orient, x, y });
    const cells = new Set(shape.map(([dx, dy]) => (y + dy) * n + (x + dx)));
    return { x, y, orient, problem, cells };
  }, [piece, hover, shape, g.board, c, g.remaining, g.color, n]);

  const place = () => {
    if (!preview) return;
    if (preview.problem) return t.warn(preview.problem);
    act('move', { move: { type: 'place', piece, orient: preview.orient, x: preview.x, y: preview.y } });
  };
  const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches;

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '내 색의 귀퉁이(★)에서 시작해, 내 조각과 모서리만 닿게 넓혀 가요';
    if (e.type === 'stuck') return `${COLORS[e.color].name}은 더 놓을 곳이 없어요`;
    return `${names[e.seat]} · ${COLORS[e.color].name}: ${e.size}칸 조각을 놓았어요`;
  };
  const myColors = g.fixedOwners.flatMap((o, col) => (o === me ? [col] : []));
  const title = myTurn ? (piece ? '놓을 자리를 고르세요' : `${COLORS[g.color].name} 조각을 고르세요`) : `${names[g.owners[g.color]]} 님 · ${COLORS[g.color].name} 차례`;
  const hint = myTurn ? (piece ? `${isTouch ? '칸을 누르고 「놓기」' : '판을 눌러 놓기'} · 회전 R · 뒤집기 F · 내 색과는 모서리만 닿게` : '큰 조각부터 쓰는 게 좋아요 — 남은 칸이 감점이에요') : '어디로 뻗어 올까요?';
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
            <section className="cc-board" style={{ ['--n' as string]: n }} aria-label="판" onMouseLeave={() => !isTouch && setHover(null)}>
              {g.board.map((cell, i) => {
                const x = i % n;
                const y = (i - x) / n;
                const start = g.starts.findIndex(([sx, sy]) => sx === x && sy === y);
                const inPreview = preview?.cells.has(i);
                return (
                  <div
                    key={i}
                    className={`cc-cell ${cell >= 0 ? 'filled' : ''} ${g.lastCells.includes(i) ? 'last' : ''} ${inPreview ? (preview!.problem ? 'pv-bad' : 'pv-ok') : ''}`}
                    style={cell >= 0 ? { background: COLORS[cell].fill } : inPreview ? { ['--pv' as string]: COLORS[g.color].fill } : undefined}
                    onMouseEnter={() => !isTouch && piece && setHover([x, y])}
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
                  <PieceIcon key={id} cells={piece === id ? shape : pieceById(id)!.orients[0]} color={myTurn ? g.color : myColors[0] ?? 0} size={11} selected={piece === id} onClick={myTurn ? () => choose(id) : undefined} title={`${pieceById(id)!.size}칸 조각`} />
                ))}
              </div>
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
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
          <section className="panel small cc-ref">
            <b>규칙</b>
            <div>· 첫 조각은 내 귀퉁이 ★을 덮어요</div>
            <div>· 내 색끼리는 모서리만 닿고 변은 닿으면 안 돼요 (남의 색은 상관없음)</div>
            <div>· 놓을 곳이 없으면 그 색은 끝 · 남은 칸 −1점, 다 놓으면 +15 (마지막이 1칸이면 +20)</div>
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
