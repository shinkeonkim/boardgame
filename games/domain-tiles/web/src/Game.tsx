import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry, Slot } from '@bg/domain-tiles-engine';
import { SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, useLogSounds, useNarrow, usePeek, useTable } from '@bg/web';
import { KingdomBoard } from './Kingdom';
import { DominoView, TERRAIN } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, {
    title: 'Domain Tiles',
    turn: g.turn,
    playing: g.status === 'playing',
    stepKey: `${g.round}-${g.step}-${g.active}-${g.row.length}-${g.next.filter((s) => s.claim !== null).length}`,
    mySub: g.step === 'place' ? '도미노를 왕국에 놓아요' : '다음 도미노를 골라요',
  });
  useLogSounds(g.log, (e) => (e.type === 'place' ? 'tile' : e.type === 'claim' ? 'wood' : e.type === 'discard' ? 'fizzle' : e.type === 'end' ? 'win' : null));
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const narrow = useNarrow();
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const placing = myTurn && g.step === 'place';
  const claiming = myTurn && (g.step === 'claim' || g.step === 'claim-first');
  const myDomino = placing ? g.row[g.active].domino : null;

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '번호가 작은 도미노를 고르면 다음에 먼저 둬요';
    if (e.type === 'claim') return `${names[e.seat]} 님이 ${e.domino.id}번을 골랐어요`;
    if (e.type === 'place') return `${names[e.seat]} 님이 ${TERRAIN[e.domino.a.t].name}·${TERRAIN[e.domino.b.t].name} 도미노를 놓았어요`;
    if (e.type === 'discard') return `${names[e.seat]} 님은 놓을 곳이 없어 버렸어요`;
    return '왕국 완성!';
  };
  const title = placing ? '고른 도미노를 왕국에 놓아요' : claiming ? '다음 줄에서 도미노를 골라요' : g.step === 'claim-first' ? `${names[g.turn]} 님이 처음 도미노를 고르는 중` : `${names[g.turn]} 님 차례`;
  const hint = placing ? (g.legal.length ? '성이나 같은 땅에 한 칸 이상 닿게, 왕국 크기 안에' : '놓을 자리가 없어요 — 버려야 해요') : claiming ? '번호가 작을수록 다음에 먼저 둬요 · 왕관이 많을수록 번호가 커요' : `남은 도미노 ${g.deckLeft + g.next.length}장`;
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  // 낮은 가로 화면(폰 눕힘)은 칸을 작게 — 왕국 판이 위아래로 넘치지 않게
  const short = typeof window !== 'undefined' && window.innerHeight < 520;
  const cell = short ? 26 : narrow ? 34 : 44;

  const slotRow = (slots: Slot[], label: string, kind: 'row' | 'next') => (
    <div className={`dt-row ${kind}`}>
      <span className="dt-row-label small">{label}</span>
      <div className="dt-row-slots">
        {slots.map((s, i) => {
          const can = kind === 'next' && claiming && s.claim === null;
          const activeNow = kind === 'row' && g.step === 'place' && i === g.active;
          const done = kind === 'row' && (i < g.active || (g.step === 'claim' && i === g.active));
          return (
            <button key={s.domino.id} type="button" className={`dt-pick ${can ? 'can' : ''} ${activeNow ? 'now' : ''} ${done ? 'done' : ''}`} disabled={!can} onClick={() => act('move', { move: { type: 'claim', slot: i } })}>
              <DominoView d={s.domino} size={narrow ? 26 : 32} />
              {s.claim !== null ? (
                <span className="dt-king small" style={{ ['--seat' as string]: seatColor(s.claim) }}>
                  <SeatDot seat={s.claim} size={9} /> {s.claim === me ? '나' : names[s.claim]}
                </span>
              ) : (
                <span className="dt-king small muted">{can ? '고르기' : '비어 있음'}</span>
              )}
            </button>
          );
        })}
        {!slots.length && <span className="muted small">{kind === 'next' ? '마지막 줄이에요' : '—'}</span>}
      </div>
    </div>
  );

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.turn} size={16} />} steps={<span className="small muted nowrap">남은 {g.deckLeft + g.next.length}장</span>} />}
        </>
      }
      main={
        <>
          <section className="dt-rows" aria-label="도미노 줄">
            {g.row.length > 0 && slotRow(g.row, '지금 줄', 'row')}
            {slotRow(g.next, '다음 줄', 'next')}
          </section>
          {me >= 0 && (
            <section className="hand-panel dt-mine" aria-label="내 왕국">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 왕국 · <b>{g.scores[me]}점</b>
                </span>
                {myDomino && (
                  <span className="dt-holding">
                    놓을 도미노 <DominoView d={myDomino} size={24} />
                  </span>
                )}
                {placing && !g.legal.length && (
                  <button type="button" className="btn tiny primary" onClick={() => act('move', { move: { type: 'discard' } })}>
                    놓을 곳이 없어요 · 버리기
                  </button>
                )}
              </div>
              <KingdomBoard kingdom={g.kingdoms[me]} size={c.size} domino={myDomino} legal={g.legal} cell={cell} onPlace={(p) => act('move', { move: { type: 'place', ...p } })} />
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
        </>
      }
      side={
        <>
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.kingdoms.map((k, seat) => ({
              seat,
              accent: seatColor(seat),
              score: `${g.totals[seat]}점`,
              children: seat === me ? null : <KingdomBoard kingdom={k} size={c.size} cell={narrow ? 14 : 18} small />,
            }))}
          />
          <SideNote title="규칙">
            <div>고른 도미노는 성이나 같은 땅에 한 칸 이상 닿게 놓아요</div>
            <div>왕국은 {c.size}×{c.size} 를 넘을 수 없어요 · 놓을 곳이 없으면 버려요</div>
            <div>점수: 같은 땅 구역마다 칸 수 × 왕관 수</div>
            <div>번호가 작은 도미노를 고르면 다음에 먼저 둬요</div>
            {c.middle && <div>성이 왕국 한가운데면 +10</div>}
            {c.harmony && <div>왕국을 꽉 채우면(버린 것 없이) +5</div>}
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
            headline={`👑 ${names[ranks.indexOf(1)]} 님의 왕국이 이겼어요!`}
            sub="같은 땅 구역의 칸 수 × 왕관 수"
            columns={g.roundScores.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.roundScores.map((r) => r[seat]), total: `${total}점` }))}
          />
        ))
      }
    />
  );
}
