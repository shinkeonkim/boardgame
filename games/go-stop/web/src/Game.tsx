import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, HCard, LogEntry, MONTH_NAMES } from '@bg/go-stop-engine';
import { SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, useLogSounds, useNarrow, usePeek, useTable } from '@bg/web';
import { Captured } from './Captured';
import { HwatuBack, HwatuCard } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, {
    title: 'Go Stop',
    turn: g.turn,
    playing: g.status === 'playing',
    stepKey: `${g.round}-${g.phase}-${g.handCounts.join('.')}`,
    mySub: g.phase === 'gostop' ? '고? 스톱?' : '카드를 내요',
  });
  useLogSounds(g.log, (e) => (e.type === 'play' ? (e.special.length ? 'chip' : e.took.length ? 'card' : 'card') : e.type === 'go' ? 'bell' : e.type === 'stop' ? 'win' : e.type === 'deal' ? 'shuffle' : e.type === 'nagari' ? 'fizzle' : null));
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const narrow = useNarrow();
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [pending, setPending] = useState<HCard | null>(null);
  useEffect(() => setPending(null), [g.handCounts.join('.'), g.phase]);
  const playing = myTurn && g.phase === 'play';
  const gostop = myTurn && g.phase === 'gostop';

  const tapHand = (card: HCard) => {
    if (!playing) return;
    const same = g.table.filter((x) => x.month === card.month);
    if (same.length === 2 && !(same[0].kind === same[1].kind && same[0].kind === 'pi')) return setPending(card);
    act('move', { move: { type: 'play', card: card.id } });
  };
  const tapTable = (target: HCard) => {
    if (!pending || target.month !== pending.month) return;
    act('move', { move: { type: 'play', card: pending.id, target: target.id } });
    setPending(null);
  };

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '같은 달 카드를 맞춰 먹어요';
    if (e.type === 'play') {
      const who = names[e.seat];
      const sp = e.special.length ? ` · ${e.special.join(' · ')}!` : '';
      const st = e.stolen ? ` · 피 ${e.stolen}장 뺏음` : '';
      return e.took.length ? `${who} 님이 ${e.took.length}장 먹었어요 (${MONTH_NAMES[e.card.month]})${sp}${st}` : `${who} 님이 ${MONTH_NAMES[e.card.month]}을 바닥에 놓았어요${sp}`;
    }
    if (e.type === 'go') return `${names[e.seat]} 님 ${e.count}고! (${e.score}점)`;
    if (e.type === 'stop') return `${names[e.seat]} 님 스톱! ${e.detail.join(' · ')}`;
    if (e.type === 'nagari') return '나가리 — 아무도 나지 않았어요';
    return `${e.round}판째 패를 돌렸어요`;
  };
  const title = gostop ? `${g.scores[me]}점 났어요! 고? 스톱?` : playing ? (pending ? '바닥에서 먹을 카드를 골라요' : '낼 카드를 골라요') : g.phase === 'gostop' ? `${names[g.turn]} 님이 고/스톱을 고르는 중` : `${names[g.turn]} 님 차례`;
  const hint = gostop ? `고: 더 가서 점수 +1 (3고부터 두 배) · 상대가 먼저 나면 위험` : playing ? '빛나는 카드는 바닥에 같은 달이 있어요' : `${g.goAt}점부터 고/스톱`;
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  const cw = narrow ? 38 : 50;
  const lastStop = [...g.log].reverse().find((e) => e.type === 'stop' || e.type === 'nagari');

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
              icon={<SeatDot seat={g.turn} size={16} />}
              steps={
                gostop ? (
                  <span className="gs-gostop">
                    <button type="button" className="btn primary" onClick={() => act('move', { move: { type: 'go' } })} disabled={g.hand.length === 0}>
                      고!
                    </button>
                    <button type="button" className="btn" onClick={() => act('move', { move: { type: 'stop' } })}>
                      스톱
                    </button>
                  </span>
                ) : (
                  <span className="small muted nowrap">더미 {g.pileCount}장</span>
                )
              }
            />
          )}
        </>
      }
      main={
        <>
          <section className="gs-felt" aria-label="바닥">
            <div className="gs-pile" aria-label={`더미 ${g.pileCount}장`}>
              {g.pileCount > 0 && (
                <span className="gs-pile-stack" style={{ ['--h' as string]: Math.min(6, Math.ceil(g.pileCount / 4)) }}>
                  <HwatuBack w={cw * 0.8} />
                </span>
              )}
              <span className="small">{g.pileCount}</span>
            </div>
            <div className="gs-table">
              {g.table.map((x) => {
                const target = !!pending && x.month === pending.month;
                return <HwatuCard key={x.id} card={x} w={cw} glow={target} dim={!!pending && !target} onClick={target ? () => tapTable(x) : undefined} />;
              })}
              {!g.table.length && <span className="muted small">바닥이 비었어요</span>}
            </div>
          </section>
          {me >= 0 && (
            <section className="hand-panel gs-mine" aria-label="내 패">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 점수 <b>{g.scores[me]}점</b>
                  {g.goes[me] > 0 && <b className="gs-go-badge"> {g.goes[me]}고</b>}
                  {g.lines[me].length > 0 && <span className="muted"> · {g.lines[me].map((l) => `${l.label} ${l.points}`).join(' · ')}</span>}
                </span>
                {pending && (
                  <button type="button" className="btn tiny ghost" onClick={() => setPending(null)}>
                    다른 카드
                  </button>
                )}
              </div>
              <Captured cards={g.captured[me]} w={narrow ? 24 : 30} />
              <div className="gs-hand">
                {g.hand.map((x) => {
                  const match = g.table.some((y) => y.month === x.month);
                  return <HwatuCard key={x.id} card={x} w={cw} glow={playing && match && !pending} dim={(!!pending && pending.id !== x.id) || !playing} onClick={playing ? () => tapHand(x) : undefined} />;
                })}
              </div>
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
            rows={g.captured.map((cards, seat) => ({
              seat,
              accent: seatColor(seat),
              score: `${g.scores[seat]}점${g.goes[seat] ? ` · ${g.goes[seat]}고` : ''}`,
              children:
                seat === me ? null : (
                  <div className="gs-opp">
                    <span className="gs-opp-hand small muted">
                      <HwatuBack w={12} /> 손패 {g.handCounts[seat]}
                    </span>
                    <Captured cards={cards} w={18} />
                  </div>
                ),
            }))}
          />
          <SideNote title="점수">
            <div>광 3장 3점(비광 끼면 2) · 4장 4 · 5장 15</div>
            <div>고도리(새 3마리) 5 · 홍단·청단·초단 각 3</div>
            <div>열끗·띠 5장부터 1점씩 · 피 10장부터 1점씩</div>
            <div>{g.goAt}점부터 고/스톱 · 3고부터 두 배{c.bak ? ' · 피박·광박 두 배' : ''}</div>
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
            headline={matchOver ? `🎴 ${names[ranks.indexOf(1)]} 님이 이겼어요!` : lastStop?.type === 'stop' ? `🎴 ${names[lastStop.seat]} 님 스톱! +${lastStop.points}` : '나가리!'}
            sub={lastStop?.type === 'stop' ? lastStop.detail.join(' · ') : '아무도 나지 못해 점수 없이 끝났어요'}
            columns={g.roundScores.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.roundScores.map((r) => r[seat]), total: `${total}점` }))}
          />
        ))
      }
    />
  );
}
