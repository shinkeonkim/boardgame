import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { Disc, GameConfig, GameView, LogEntry } from '@bg/hidden-thorn-engine';
import { AlertBanner, EmoteBubble, SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, rankOf, usePeek, useTable, waitingText } from '@bg/web';
import { DiscView } from './theme';

type View = RoomView<GameView, GameConfig>;

function describe(e: LogEntry | undefined, names: string[]): string {
  if (!e) return '모두 첫 원판을 몰래 놓아요';
  switch (e.type) {
    case 'bid':
      return `${names[e.seat]}: 「${e.count}장 뒤집을게」`;
    case 'pass':
      return `${names[e.seat]} 님은 포기했어요`;
    case 'flip':
      return `${names[e.seat]} 님이 ${e.from === e.seat ? '자기' : `${names[e.from]}의`} 원판을 뒤집었어요 → ${e.disc === 'rose' ? '🌹 장미' : '🌵 가시!'}`;
    case 'success':
      return `🌹 ${names[e.seat]} 님 도전 성공! (${e.points}점)`;
    case 'fail':
      return `🌵 ${names[e.seat]} 님이 ${e.owner === e.seat ? '자기' : `${names[e.owner]}의`} 가시에 찔려 원판 하나를 잃었어요`;
    case 'out':
      return `${names[e.seat]} 님은 원판을 모두 잃었어요`;
    case 'win':
      return `🏆 ${names[e.seat]} 님 우승!`;
  }
}

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, {
    title: 'Hidden Thorn',
    turn: g.actors[0] ?? g.turn,
    playing: g.status === 'playing',
    simultaneous: g.phase === 'open',
    stepKey: `${g.phase}-${g.turn}-${g.log.length ? g.log[g.log.length - 1].n : 0}`,
    mySub: g.phase === 'flip' ? '뒤집을 원판을 골라요' : g.phase === 'bidding' ? '더 부르거나 포기' : '원판을 놓거나 도전',
  });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [bid, setBid] = useState(1);
  useEffect(() => setBid(Math.max(1, (g.bid?.count ?? 0) + 1)), [g.bid?.count, g.phase]);

  const place = (d: Disc) => (myTurn ? act('move', { move: { type: 'place', disc: d } }) : t.warn(t.waitingMsg));
  const flip = (s: number) => {
    if (!myTurn || g.phase !== 'flip') return;
    if (s === me) return t.warn('내 원판은 이미 모두 뒤집었어요');
    if (g.flippedDiscs[s].length >= g.matCounts[s]) return t.warn('그 사람 원판은 다 뒤집었어요');
    act('move', { move: { type: 'flip', seat: s } });
  };

  let title = '';
  let hint = '';
  if (g.phase === 'open') {
    title = me >= 0 && g.myMat.length === 0 ? '첫 원판을 몰래 놓으세요' : '모두 첫 원판을 놓는 중';
    hint = me >= 0 && g.myMat.length === 0 ? '장미 🌹 또는 가시 🌵 — 남에게는 뒷면만 보여요' : waitingText(t, '놓는 중');
  } else if (g.phase === 'turn') {
    title = myTurn ? '원판을 하나 더 놓거나, 도전하세요' : `${names[g.turn]} 님의 차례`;
    hint = myTurn ? `도전: 「장미를 몇 장 뒤집을 수 있다」 — 모두 ${g.total}장 깔려 있어요` : '원판을 놓을까, 도전할까?';
  } else if (g.phase === 'bidding') {
    title = `${names[g.bid!.seat]}: 「${g.bid!.count}장」${myTurn ? ' — 더 부를까요?' : ''}`;
    hint = myTurn ? '더 높게 부르거나 포기해요. 가장 높게 부른 사람이 뒤집어요' : `${names[g.turn]} 님이 고민 중`;
  } else if (g.phase === 'flip') {
    title = myTurn ? `장미 ${g.roses}/${g.bid!.count} — 뒤집을 원판을 고르세요` : `${names[g.turn]} 님이 뒤집는 중 (${g.roses}/${g.bid!.count})`;
    hint = '자기 원판은 먼저 모두 뒤집어요. 남의 원판은 맨 위부터 하나씩';
  } else if (g.phase === 'lose') {
    title = myTurn ? '내 가시에 찔렸어요 — 잃을 원판을 고르세요' : `${names[g.turn]} 님이 잃을 원판을 고르는 중`;
    hint = '';
  }

  const matchOver = g.status === 'match-over';
  const order = Array.from({ length: g.players }, (_, i) => (me >= 0 ? (me + i) % g.players : i));

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} steps={g.bid ? <span className="tag results">도전 {g.bid.count}장</span> : null} />}
        </>
      }
      main={
        <>
          <section className={`ht-table ${g.phase === 'flip' && myTurn ? 'flipping' : ''}`} aria-label="테이블">
            {order.map((s) => {
              const out = g.ownedCounts[s] === 0;
              const m = view.members.find((x) => x.seat === s);
              const canFlip = g.phase === 'flip' && myTurn && s !== me && g.flippedDiscs[s].length < g.matCounts[s];
              return (
                <div key={s} className={`ht-mat ${out ? 'out' : ''} ${g.actors.includes(s) ? 'acting' : ''} ${canFlip ? 'can-flip' : ''} ${s === me ? 'mine' : ''}`} style={{ ['--seat' as string]: seatColor(s) }} onClick={canFlip ? () => flip(s) : undefined}>
                  <div className="ht-mat-head small">
                    <span className="seat-name">
                      <EmoteBubble e={bySeat.get(s)} />
                      <b>{names[s]}</b>
                      {m?.bot && <span className={`tag bot ${m.bot}`}>🤖</span>}
                      {g.passed.includes(s) && g.phase === 'bidding' && <span className="tag">포기</span>}
                    </span>
                    <span className="ht-points" title="성공 횟수">
                      {Array.from({ length: c.winPoints }, (_, i) => (
                        <i key={i} className={i < g.points[s] ? 'on' : ''} />
                      ))}
                    </span>
                  </div>
                  <div className="ht-stack">
                    {Array.from({ length: g.matCounts[s] }, (_, i) => {
                      // 위에서부터 i번째 (0 = 맨 위)
                      const fromTop = g.matCounts[s] - 1 - i;
                      const flipped = g.flippedDiscs[s][fromTop];
                      const own = s === me ? g.myMat[i] : null;
                      return (
                        <span key={i} className={`ht-slot ${own && !flipped ? 'peek' : ''}`} style={{ ['--i' as string]: i }}>
                          <DiscView disc={flipped ?? (own && g.status !== 'playing' ? own : flipped ?? null)} seat={s} size={34} />
                          {own && !flipped && <span className="ht-peek">{own === 'rose' ? '🌹' : '🌵'}</span>}
                        </span>
                      );
                    })}
                    {g.matCounts[s] === 0 && <span className="muted small">{out ? '탈락' : '비어 있음'}</span>}
                  </div>
                  <div className="small muted">원판 {g.ownedCounts[s]}개</div>
                </div>
              );
            })}
          </section>

          {me >= 0 && g.status === 'playing' && g.ownedCounts[me] > 0 && (
            <section className="hand-panel" aria-label="내 원판">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 손의 원판 {g.hand.length}개 · 가진 원판 {g.myOwned.map((d) => (d === 'rose' ? '🌹' : '🌵')).join('')}
                </span>
              </div>
              {(g.phase === 'open' || g.phase === 'turn') && (
                <div className="hand-row">
                  {(['rose', 'thorn'] as Disc[]).map((d) => {
                    const n = g.hand.filter((x) => x === d).length;
                    return (
                      <button key={d} className="ht-choice" disabled={!myTurn || n === 0} onClick={() => place(d)}>
                        <DiscView disc={d} size={52} />
                        <span>
                          {d === 'rose' ? '장미' : '가시'} 놓기 ({n})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {g.phase === 'lose' && myTurn && (
                <div className="hand-row">
                  {[...new Set(g.myOwned)].map((d) => (
                    <button key={d} className="ht-choice" onClick={() => act('move', { move: { type: 'lose', disc: d } })}>
                      <DiscView disc={d} size={52} />
                      <span>{d === 'rose' ? '장미' : '가시'} 잃기</span>
                    </button>
                  ))}
                </div>
              )}
              {((g.phase === 'turn' && myTurn && g.total > 0) || (g.phase === 'bidding' && myTurn)) && (
                <div className="action-row ht-bid">
                  <span className="bd-count">
                    <button className="icon-btn" onClick={() => setBid((b) => Math.max((g.bid?.count ?? 0) + 1, b - 1))} aria-label="하나 줄이기">
                      −
                    </button>
                    <b>{bid}장</b>
                    <button className="icon-btn" onClick={() => setBid((b) => Math.min(g.total, b + 1))} aria-label="하나 늘리기">
                      +
                    </button>
                  </span>
                  <button className="btn primary" onClick={() => act('move', { move: { type: 'bid', count: bid } })}>
                    「장미 {bid}장 뒤집을게」
                  </button>
                  {g.phase === 'bidding' && (
                    <button className="btn" onClick={() => act('move', { move: { type: 'pass' } })}>
                      포기
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1], names)} />
        </>
      }
      side={
        <>
          {me >= 0 && g.ownedCounts[me] === 1 && g.status === 'playing' && <AlertBanner icon="⚠️" title="원판이 하나 남았어요" critical sub="한 번 더 찔리면 탈락이에요" />}
          <section className="panel small ht-ref">
            <b>규칙 요약</b>
            <div>· 처음엔 모두 한 장씩 몰래 놓아요</div>
            <div>· 차례에 한 장 더 놓거나 「몇 장 뒤집을게」 도전</div>
            <div>· 가장 높게 부른 사람이 자기 원판부터 뒤집고, 남은 수만큼 남의 맨 위를 뒤집어요</div>
            <div>· 모두 장미면 성공 ({c.winPoints}번이면 우승), 가시가 나오면 원판 하나를 잃어요</div>
          </section>
          {g.log.length > 0 && (
            <section className="panel log-list small" aria-label="기록">
              {[...g.log]
                .reverse()
                .slice(0, 14)
                .map((e) => (
                  <div key={e.n}>{describe(e, names)}</div>
                ))}
            </section>
          )}
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
            headline={`🏆 ${names[g.winners[g.winners.length - 1]]} 님 우승!`}
            sub={g.log.some((e) => e.type === 'win' && e.why === 'last') ? '마지막까지 원판을 지켰어요' : `도전에 ${c.winPoints}번 성공했어요`}
            columns={g.winners.map((_, i) => `${i + 1}게임`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: rankOf(g.totals)[seat], cells: g.winners.map((w) => (w === seat ? '🏆' : '')), total: `${total}승` }))}
          />
        ))
      }
    />
  );
}
