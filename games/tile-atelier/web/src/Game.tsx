import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { RoomView } from '@bg/core';
import { FIRST, GameConfig, GameView, LogEntry, lineProblem } from '@bg/tile-atelier-engine';
import { AlertBanner, SeatDot, seatColor, Icon } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, usePeek, useTable, SideNote, flyClone, useLogSounds } from '@bg/web';
import { BoardView, TILE, TileView } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, {
    title: 'Tile Atelier',
    turn: g.actors[0] ?? g.turn,
    playing: g.status === 'playing',
    simultaneous: g.phase === 'wall',
    stepKey: `${g.stage}-${g.phase}-${g.turn}`,
    mySub: g.phase === 'wall' ? '벽에 놓을 칸을 골라요' : '공장에서 한 색을 가져와요',
  });
  // 누가 공장에서 타일을 가져가면: 공장(가운데) → 그 사람의 줄(바닥)로 날아감
  const lastTake = [...g.log].reverse().find((e) => e.type === 'take' || e.type === 'round');
  const takeKey = lastTake?.type === 'take' ? lastTake.n : null;
  useLayoutEffect(() => {
    if (!lastTake || lastTake.type !== 'take') return;
    const from = document.querySelector(`[data-factory="${lastTake.source}"]`);
    const board = document.querySelector(`[data-board="${lastTake.seat}"]`);
    const row = board?.querySelector(lastTake.line >= 0 ? `[data-line="${lastTake.line}"]` : '[data-floor]');
    const tiles = row ? [...row.querySelectorAll('.tile')] : [];
    tiles.slice(-lastTake.count).forEach((el, j) => flyClone(from, el, { delay: j * 70 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takeKey]);
  // 소리: 공장에서 가져오면 타일 여러 개, 벽에 붙이면 타일 하나, 보너스는 축하
  useLogSounds(g.log, (e) => (e.type === 'take' ? 'tiles' : e.type === 'tile' ? 'tile' : e.type === 'bonus' ? 'success' : e.type === 'round' ? 'shuffle' : null));
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [sel, setSel] = useState<{ source: number; color: number } | null>(null);
  useEffect(() => setSel(null), [g.turn, g.stage, g.phase]);
  const myBoard = me >= 0 ? g.boards[me] : null;

  const okLines = useMemo(() => {
    const s = new Set<number>();
    if (!sel || !myBoard) return s;
    for (let i = 0; i < c.colors; i++) if (!lineProblem(c, myBoard, i, sel.color)) s.add(i);
    return s;
  }, [sel, myBoard, c]);
  const selCount = sel ? (sel.source === -1 ? g.center : g.factories[sel.source]).filter((x) => x === sel.color).length : 0;

  const pickTile = (source: number, color: number) => {
    if (color === FIRST) return;
    if (!myTurn || g.phase !== 'draft') return t.warn(t.waitingMsg);
    setSel((s) => (s && s.source === source && s.color === color ? null : { source, color }));
  };
  const take = (line: number) => {
    if (!sel) return;
    act('move', { move: { type: 'take', source: sel.source, color: sel.color, line } });
  };

  const describe = (e: LogEntry | undefined): string => {
    if (!e) return '공장에서 한 색을 모두 가져와 패턴 줄에 놓아요';
    switch (e.type) {
      case 'take':
        return `${names[e.seat]}: ${e.source === -1 ? '가운데' : `${e.source + 1}번 공장`}에서 ${TILE[e.color].name} ${e.count}장 → ${e.line === -1 ? '바닥' : `${e.line + 1}번째 줄`}${e.first ? ' (첫 플레이어 표시)' : ''}`;
      case 'tile':
        return `🧱 ${names[e.seat]}: 벽에 ${e.placed.length}장 · +${e.placed.reduce((a, p) => a + p.points, 0)}점${e.floor ? ` · 바닥 ${e.floor}` : ''}`;
      case 'bonus':
        return `🏅 ${names[e.seat]} 끝 보너스 +${e.points} (가로 ${e.rows} · 세로 ${e.cols} · 색 ${e.colors})`;
      case 'round':
        return `${e.round}번째 공장 채우기`;
    }
  };

  const title =
    g.phase === 'wall'
      ? myTurn
        ? `${g.pendingRows[0] + 1}번째 줄 타일을 벽 어디에 놓을까요?`
        : '모두 벽에 놓는 중'
      : myTurn
        ? sel
          ? `${TILE[sel.color].name} ${selCount}장 — 놓을 줄을 고르세요`
          : '공장이나 가운데에서 타일을 고르세요'
        : `${names[g.turn]} 님의 차례`;
  const hint =
    g.phase === 'wall'
      ? '같은 가로줄·세로줄에 같은 색은 한 번만 · 이어질수록 점수가 커요'
      : myTurn
        ? sel
          ? '빛나는 줄을 누르세요. 넘치는 타일은 바닥(감점)으로 · 바닥을 눌러 바로 버릴 수도 있어요'
          : '한 색을 모두 가져가고, 공장의 나머지는 가운데로 가요'
        : '어떤 색을 가져갈까요?';

  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  const nearEnd = g.boards.some((b) => b.wall.some((r) => r.filter((x) => x !== null).length === c.colors - 1));

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.actors[0] ?? g.turn} size={16} />} steps={<span className="small muted nowrap">{g.stage}번째 채우기</span>} />}
        </>
      }
      main={
        <>
          <section className="ta-factories" aria-label="공장">
            {g.factories.map((f, i) => (
              <div key={i} data-factory={i} className={`ta-factory ${f.length ? '' : 'empty'}`}>
                {f.map((col, k) => (
                  <TileView key={k} color={col} size={32} selected={sel?.source === i && sel.color === col} onClick={() => pickTile(i, col)} />
                ))}
              </div>
            ))}
            <div className="ta-center" data-factory={-1} aria-label="가운데">
              {g.center.length === 0 && <span className="muted small">가운데</span>}
              {[...g.center]
                .sort((a, b) => a - b)
                .map((col, k) => (
                  <TileView key={k} color={col} first={col === FIRST} size={32} selected={sel?.source === -1 && sel.color === col} onClick={() => pickTile(-1, col)} />
                ))}
            </div>
          </section>
          {myBoard && (
            <section className="hand-panel ta-mine" data-board={me} aria-label="내 작업대">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 작업대 · <b>{myBoard.score}점</b>
                  {g.nextFirst === me && g.phase === 'draft' ? ' · 다음 판 첫 차례' : ''}
                </span>
                {sel && myTurn && (
                  <button className="btn tiny" onClick={() => take(-1)}>
                    바닥에 버리기
                  </button>
                )}
              </div>
              <BoardView
                c={c}
                b={myBoard}
                size={30}
                onLine={take}
                onFloor={sel && myTurn ? () => take(-1) : undefined}
                highlightLines={myTurn ? okLines : undefined}
                pendingRow={g.phase === 'wall' && myTurn ? g.pendingRows[0] : null}
                onWall={g.phase === 'wall' && myTurn ? (row, col) => act('move', { move: { type: 'wall', row, col } }) : undefined}
              />
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
        </>
      }
      side={
        <>
          {nearEnd && g.status === 'playing' && <AlertBanner icon={<Icon name="flag" />} title="가로줄 완성이 가까워요" sub="누군가 가로줄을 채우면 이번 판 끝에 게임이 끝나요" />}
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.boards.map((b, seat) => ({
              seat,
              accent: seatColor(seat),
              score: `${b.score}점`,
              badge: g.nextFirst === seat && g.phase === 'draft' ? <span className="tag">1번</span> : null,
              children:
                seat !== me ? (
                  <span data-board={seat}>
                    <BoardView c={c} b={b} size={13} />
                  </span>
                ) : undefined,
            }))}
          />
          <SideNote title="점수" className="ta-ref">
            <div>벽에 놓을 때: 혼자면 1점, 가로·세로로 이어진 타일 수만큼</div>
            <div>바닥: {c.floor.join(' ')}</div>
            <div>
              끝 보너스: 가로줄 +{c.rowBonus} · 세로줄 +{c.colBonus} · 한 색 모두 +{c.colorBonus}
            </div>
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
            headline={`🎨 ${names[g.winners[g.winners.length - 1]]} 님의 벽이 가장 아름다워요!`}
            sub="같으면 가로줄을 더 많이 채운 쪽"
            columns={['가로', '세로', '색', '보너스']}
            rows={g.boards.map((b, seat) => ({ seat, rank: ranks[seat], cells: [g.bonus[seat].rows, g.bonus[seat].cols, g.bonus[seat].colors, `+${g.bonus[seat].points}`], total: `${g.totals[seat]}점` }))}
          />
        ))
      }
    />
  );
}
