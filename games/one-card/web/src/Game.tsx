import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { Card, GameConfig, GameView, LogEntry } from '@bg/one-card-engine';
import { EmoteBubble, SeatDot, seatColor, iconize } from '@bg/ui';
import { GameScreenProps, ResultSheet, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, rankOf, useLogSounds, usePeek, useTable, useDealFx } from '@bg/web';
import { CardBack, PlayingCard, SUITS, SUIT_NAMES, cardName, isRed } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, {
    title: 'One Card',
    turn: g.turn,
    playing: g.status === 'playing',
    simultaneous: g.phase === 'call',
    quiet: g.phase === 'call',
    stepKey: `${g.round}-${g.turn}-${g.log.length ? g.log[g.log.length - 1].n : 0}`,
    mySub: g.attack > 0 ? `공격 ${g.attack}장! 막거나 받아요` : '카드를 내요',
  });
  // 소리: 내면 카드 탁(공격이면 경고), 가져오면 미끄러짐(많이면 여러 장), 원카드 외치기는 종, 잡히면 실패음, 나가면 축하
  useLogSounds(g.log, (e) => (e.type === 'play' ? (e.attack > 0 ? ['card', 'alert'] : 'card') : e.type === 'draw' ? (e.count > 1 ? 'shuffle' : 'deal') : e.type === 'call' ? (e.caught ? ['alert', 'fail'] : 'bell') : e.type === 'out' ? (e.bankrupt ? 'thud' : 'success') : e.type === 'end' ? 'win' : null));
  // 새 판마다 카드를 섞고 나눠 주는 연출 (@bg/web deal-fx)
  useDealFx(`${g.round}`, { per: 3, seats: '.oc-opp', initial: g.log.length <= 2 });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [seven, setSeven] = useState<Card | null>(null);
  useEffect(() => setSeven(null), [g.turn, g.log[g.log.length - 1]?.n]);

  const tryPlay = (card: Card) => {
    if (g.phase === 'call') return;
    if (!myTurn) return t.warn(t.waitingMsg);
    if (!g.playable.includes(card.id)) {
      if (g.attack > 0) return t.warn(`공격을 받는 중이에요 — 공격 카드로 막거나 「${g.attack}장 받기」`);
      return t.warn(g.suit === null ? '조커 다음엔 아무 카드나 낼 수 있어요' : `${SUIT_NAMES[g.suit]}(${SUITS[g.suit]})나 같은 숫자를 내요`);
    }
    if (card.suit >= 0 && card.rank === 7 && c.seven && g.attack === 0) return setSeven(card);
    act('move', { move: { type: 'play', cardId: card.id } });
  };
  const live = Array.from({ length: g.players }, (_, i) => i).filter((s) => !g.out.includes(s));
  const others = Array.from({ length: g.players }, (_, k) => (me >= 0 ? (me + 1 + k) % g.players : k)).filter((s) => s !== me);
  const calling = g.phase === 'call' && g.callFor !== null;
  const iAmCalled = calling && g.callFor === me;

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '무늬나 숫자가 같은 카드를 내요. 먼저 다 내면 이겨요';
    switch (e.type) {
      case 'play':
        return `${names[e.seat]} 님: ${cardName(e.card)}${e.attack ? ` — 공격 ${e.attack}장!` : ''}${e.card.suit >= 0 && e.card.rank === 7 && e.suit !== null && e.suit !== e.card.suit ? ` · ${SUIT_NAMES[e.suit]}로 바꿈` : ''}`;
      case 'draw':
        return e.attacked ? `${names[e.seat]} 님이 공격을 받아 ${e.count}장 가져갔어요` : `${names[e.seat]} 님이 1장 가져왔어요`;
      case 'call':
        return e.caught ? `${names[e.seat]} 님이 잡았다! ${names[e.target]} 님 ${e.penalty}장 추가` : `${names[e.seat]} 님 「원카드!」`;
      case 'out':
        return e.bankrupt ? `${names[e.seat]} 님 파산 (카드가 ${c.bankrupt}장을 넘었어요)` : `${names[e.seat]} 님이 다 냈어요! (${e.place}등)`;
      case 'end':
        return `${names[e.winner]} 님 승리!`;
    }
  };
  const title = calling
    ? iAmCalled
      ? '한 장 남았어요 — 「원카드!」를 외쳐요!'
      : `${names[g.callFor!]} 님이 한 장! 「잡았다!」`
    : myTurn
      ? g.attack > 0
        ? `공격 ${g.attack}장! 막거나 받아요`
        : g.again
          ? 'K — 한 장 더 내요'
          : '카드를 내거나 1장 가져와요'
      : `${names[g.turn]} 님 차례`;
  const hint = calling ? `${c.callSec}초 안에 먼저 누르는 사람이 이겨요${iAmCalled ? '' : ` — 잡으면 ${names[g.callFor!]} 님이 ${c.callPenalty}장`}` : g.suit === null ? '조커 다음 — 아무 카드나' : `지금 무늬: ${SUIT_NAMES[g.suit]} ${SUITS[g.suit]}`;
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  const handMid = (g.hand.length - 1) / 2;

  return (
    <TableLayout
      mine={myTurn && !calling}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={calling ? g.callFor! : g.turn} size={16} />} steps={g.attack > 0 ? <span className="tag results">공격 +{g.attack}</span> : null} />}
        </>
      }
      main={
        <>
          <section className="oc-opps" aria-label="다른 사람">
            {others.map((s) => {
              const m = view.members.find((x) => x.seat === s);
              const n = g.handCounts[s];
              const out = g.out.includes(s);
              return (
                <div key={s} className={`oc-opp ${g.turn === s && !calling ? 'acting' : ''} ${out ? 'out' : ''} ${n === 1 && !out ? 'one' : ''}`} style={{ ['--seat' as string]: seatColor(s) }}>
                  <span className="oc-opp-name">
                    <EmoteBubble e={bySeat.get(s)} />
                    <SeatDot seat={s} size={11} /> <b>{names[s]}</b>
                    {m?.bot && iconize(' 🤖')}
                  </span>
                  <span className="oc-opp-hand" aria-label={`카드 ${n}장`}>
                    {Array.from({ length: Math.min(n, 10) }, (_, i) => (
                      <CardBack key={i} size="sm" />
                    ))}
                  </span>
                  <span className="oc-opp-count">{out ? (g.bankrupt[s] ? '파산' : '다 냄') : n === 1 ? '원카드!' : `${n}장`}</span>
                </div>
              );
            })}
          </section>

          <section className={`oc-table ${g.attack > 0 ? 'attacked' : ''}`} aria-label="테이블">
            <div className="oc-pile">
              <div className="oc-deck">
                <CardBack size="lg" />
                <span className="oc-deck-count">{g.deckCount}</span>
              </div>
              <span className="small">더미</span>
            </div>
            <div className="oc-pile">
              <PlayingCard key={g.top.id + g.discardCount} card={g.top} size="lg" className="oc-top" />
              <span className="small">버린 카드</span>
            </div>
            <div className="oc-state">
              <span className={`oc-suit ${g.suit !== null && isRed(g.suit) ? 'red' : ''}`} title="지금 무늬">
                {g.suit === null ? '★' : SUITS[g.suit]}
              </span>
              <span className="oc-dir" title="진행 방향">
                {g.dir === 1 ? '↻' : '↺'}
              </span>
              {g.attack > 0 && <span className="oc-attack">+{g.attack}</span>}
            </div>
          </section>

          {calling && me >= 0 && !g.out.includes(me) && (
            <div className="oc-call">
              {g.callWaiting.includes(me) ? (
                <>
                  <button className={`btn oc-call-btn ${iAmCalled ? 'mine' : 'catch'}`} onClick={() => act('move', { move: { type: 'call' } })}>
                    {iAmCalled ? iconize('☝️ 원카드!') : iconize('🖐 잡았다!')}
                  </button>
                  <button className="btn ghost small" onClick={() => act('move', { move: { type: 'pass' } })}>
                    넘기기
                  </button>
                </>
              ) : (
                <span className="muted">다른 사람을 기다려요…</span>
              )}
            </div>
          )}

          {me >= 0 && g.status === 'playing' && !g.out.includes(me) && (
            <section className="hand-panel oc-hand-panel" aria-label="내 카드">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 카드 {g.hand.length}장{c.bankrupt ? ` · ${c.bankrupt}장 넘으면 파산` : ''}
                </span>
                {myTurn && !calling && (
                  <button className={`btn ${g.attack > 0 ? 'danger-btn' : ''} tiny`} onClick={() => act('move', { move: { type: 'draw' } })}>
                    {g.attack > 0 ? `공격 받기 (${g.attack}장)` : '1장 가져오기'}
                  </button>
                )}
              </div>
              <div className="oc-hand">
                {g.hand.map((card, i) => (
                  <span key={card.id} className="oc-hand-slot" style={{ transform: `rotate(${(i - handMid) * Math.min(5, 40 / g.hand.length)}deg) translateY(${Math.abs(i - handMid) ** 1.4 * 2}px)` }}>
                    <PlayingCard card={card} flip={`oc${card.id}`} playable={g.playable.includes(card.id)} onClick={() => tryPlay(card)} />
                  </span>
                ))}
              </div>
              {seven && (
                <div className="oc-seven" role="dialog" aria-label="무늬 고르기">
                  <span className="small">7 — 바꿀 무늬를 골라요</span>
                  {[0, 1, 2, 3].map((s) => (
                    <button key={s} className={`btn oc-suit-btn ${isRed(s) ? 'red' : ''}`} onClick={() => act('move', { move: { type: 'play', cardId: seven.id, suit: s } })}>
                      {SUITS[s]} {SUIT_NAMES[s]}
                    </button>
                  ))}
                  <button className="btn ghost tiny" onClick={() => setSeven(null)}>
                    취소
                  </button>
                </div>
              )}
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
        </>
      }
      side={
        <>
          <section className="panel small oc-scores">
            {Array.from({ length: g.players }, (_, s) => (
              <div key={s} className={`oc-score-row ${live.includes(s) ? '' : 'out'}`}>
                <SeatDot seat={s} size={10} /> <b>{names[s]}</b>
                <span className="grow" />
                <span>{g.handCounts[s]}장</span>
                <b>{g.totals[s]}점</b>
              </div>
            ))}
          </section>
          <SideNote title="특수 카드" className="oc-ref">
            {c.attacks && <div>2 → 다음 사람 +2 · A → +3 · ♠A → +5 (공격은 같거나 센 공격 카드로 막아요)</div>}
            {c.jokers && <div>흑백 조커 +5 · 컬러 조커 +7 · 조커 다음엔 아무 카드나</div>}
            {c.seven && <div>7 → 무늬 바꾸기</div>}
            {c.jack && <div>J → 다음 사람 건너뛰기</div>}
            {c.queen && <div>Q → 방향 바꾸기</div>}
            {c.king && <div>K → 한 장 더</div>}
            {c.call && <div>한 장 남으면 「원카드!」 — 남이 먼저 「잡았다!」 하면 {c.callPenalty}장</div>}
            {c.bankrupt > 0 && <div>손에 {c.bankrupt}장이 넘으면 파산</div>}
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
            headline={`🃏 ${names[ranks.indexOf(1)]} 님 ${matchOver ? '우승' : '1등'}!`}
            sub={c.until === 'last' ? '먼저 나간 순서대로 점수' : '다 낸 사람 0점, 남은 카드 장수만큼 감점 (파산은 더 크게)'}
            columns={g.roundScores.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.roundScores.map((r) => r[seat]), total }))}
          />
        ))
      }
    />
  );
}
