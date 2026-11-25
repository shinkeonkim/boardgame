import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry } from '@bg/five-stones-engine';
import { ConfirmButton, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, useLogSounds, usePeek, useTable } from '@bg/web';
import { Board } from './Board';
import { StoneView, stoneName } from './theme';

type View = RoomView<GameView, GameConfig>;

const col = (x: number) => String.fromCharCode(65 + (x >= 8 ? x + 1 : x)); // I 는 건너뛰는 바둑식 좌표

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, {
    title: 'Five Stones',
    turn: g.turn,
    playing: g.status === 'playing',
    stepKey: `${g.round}-${g.moves}`,
    mySub: `${g.myStone === null ? '' : stoneName(g.myStone)} 돌을 놓아요`,
  });
  // 소리: 돌 놓기는 나무 딱, 이기면 축하
  useLogSounds(g.log, (e) => (e.type === 'place' ? 'stone' : e.type === 'win' ? 'win' : e.type === 'draw' ? 'tick' : null));
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const last = g.log[g.log.length - 1];
  const describe = (e: LogEntry | undefined) => {
    if (!e) return '흑이 먼저 놓아요';
    if (e.type === 'place') return `${names[e.seat]}(${stoneName(e.stone)}) · ${col(e.x)}${c.size - e.y}`;
    if (e.type === 'win') return e.resigned ? `${names[1 - e.seat]} 님이 돌을 던졌어요 — ${names[e.seat]} 님 승리` : `${names[e.seat]} 님이 다섯을 이었어요!`;
    return '판이 가득 찼어요 — 무승부';
  };
  const title = myTurn ? `내 차례 · ${stoneName(g.myStone!)}` : `${names[g.turn]} 님 차례 (${stoneName(g.stones[g.turn])})`;
  const hint = myTurn ? (matchMedia('(pointer: coarse)').matches ? '놓을 곳을 누르면 미리 보이고, 한 번 더 누르면 놓여요' : '놓을 곳을 누르세요') : `${g.moves}수째 · ${c.exactFive ? '딱 다섯만 승리' : '다섯 이상이면 승리'}`;
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  const lastWin = [...g.log].reverse().find((e) => e.type === 'win') as Extract<LogEntry, { type: 'win' }> | undefined;

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && (
            <TableBanner
              t={t}
              act={act}
              title={title}
              hint={hint}
              icon={<StoneView stone={g.stones[g.turn]} size={18} />}
              steps={<span className="small muted nowrap">{g.moves}수</span>}
            />
          )}
        </>
      }
      main={
        <>
          <section className="fs-table" aria-label="오목판">
            <Board
              size={c.size}
              board={g.board}
              myStone={g.myStone}
              canPlay={myTurn && g.status === 'playing'}
              lastMove={g.lastMove}
              winLine={g.winLine}
              onPlace={(x, y) => act('move', { move: { type: 'place', x, y } })}
            />
          </section>
          <Ticker text={describe(last)} />
        </>
      }
      side={
        <>
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.stones.map((stone, seat) => ({
              seat,
              accent: seatColor(seat),
              score: c.rounds > 1 ? `${g.totals[seat]}승` : undefined,
              children: (
                <span className="fs-seat">
                  <StoneView stone={stone} size={20} /> {stoneName(stone)}
                  {g.status === 'playing' && g.turn === seat && <span className="tag">두는 중</span>}
                </span>
              ),
            }))}
          />
          {me >= 0 && g.status === 'playing' && (
            <ConfirmButton small label="돌 던지기 (기권)" warning="이번 판을 지게 돼요" onConfirm={() => act('move', { move: { type: 'resign' } })} />
          )}
          <SideNote title="규칙">
            <div>흑이 먼저, 번갈아 한 수씩</div>
            <div>가로·세로·대각선으로 다섯을 먼저 이으면 승리</div>
            <div>{c.exactFive ? '여섯 이상(장목)은 이긴 것으로 치지 않아요' : '여섯 이상 이어도 이겨요'}</div>
            {c.rounds > 1 && <div>판마다 흑백을 바꿔요 · {c.rounds}판 중 과반</div>}
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
            headline={lastWin ? `${names[lastWin.seat]} 님 승리!` : '무승부'}
            sub={lastWin?.resigned ? '상대가 돌을 던졌어요' : lastWin ? `${g.moves}수 만에 다섯을 이었어요` : '판이 가득 찼어요'}
            columns={g.roundWinners.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.roundWinners.map((w) => (w === seat ? '🏆' : w === -1 ? '–' : '')), total: `${total}승` }))}
          />
        ))
      }
    />
  );
}
