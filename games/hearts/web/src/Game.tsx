import { useEffect, useRef, useState } from 'react';
import type { RoomView } from '@bg/core';
import { Card, GameConfig, GameView, LogEntry, isQueenOfSpades } from '@bg/hearts-engine';
import { CardBack, EmoteBubble, PlayingCard, SeatDot, cardName, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, flyClone, rankOf, useLogSounds, usePeek, useTable } from '@bg/web';
import { DIR_TEXT, TakenBadge } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const passing = g.phase === 'pass';
  const t = useTable(view, notify, {
    title: 'Hearts',
    turn: g.turn,
    playing: g.status === 'playing',
    simultaneous: passing,
    stepKey: `${g.round}-${g.phase}-${g.trickNo}-${g.trick.length}`,
    mySub: passing ? '건넬 카드 3장을 골라요' : '카드를 1장 내요',
  });
  useLogSounds(g.log, (e) => (e.type === 'play' ? 'cardSnap' : e.type === 'trick' ? (e.points > 0 ? ['sweep', 'thud'] : 'sweep') : e.type === 'pass' ? 'riffle' : e.type === 'broken' ? ['alert', 'heartbeat'] : e.type === 'end' ? 'win' : null), { me: t.me, describe: (e) => describe(e), stamp: (e) => (e.type === 'broken' ? { text: '하트 깨짐!', tone: 'hot', shake: 0.6 } : e.type === 'trick' && e.cards.some(isQueenOfSpades) ? { text: '스페이드 퀸!', tone: 'bad', shake: 1 } : e.type === 'hand' && e.moon !== null ? { text: '달 쏘기!', tone: 'good', shake: 1.4 } : null) });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [picks, setPicks] = useState<string[]>([]);
  const [armed, setArmed] = useState<string | null>(null);
  const touch = useRef(false);
  useEffect(() => {
    setPicks([]);
    setArmed(null);
  }, [g.round, g.phase]);
  const { bySeat } = emotesBySeat(emotes);

  // 가운데: 지금 트릭, 방금 끝난 트릭은 다음 카드가 나올 때까지 그대로 (이긴 사람 표시)
  const lastLog = g.log[g.log.length - 1];
  const lastTrick = lastLog?.type === 'trick' ? lastLog : null;
  const shown = g.trick.length ? g.trick : (g.lastTrick?.plays ?? []);
  // 트릭을 가져가면 카드가 그 사람 자리로 날아감
  const trickN = lastTrick?.n ?? 0;
  useEffect(() => {
    if (!lastTrick) return;
    const from = document.querySelector('.hr-center');
    const to = document.querySelector(`[data-hr-seat="${lastTrick.seat}"]`) ?? document.querySelector('.hand-panel');
    const tm = setTimeout(() => flyClone(from, to, { count: Math.min(4, g.players), duration: 650, like: document.querySelector('.hr-center .oc-card') }), 900);
    return () => clearTimeout(tm);
  }, [trickN]); // eslint-disable-line react-hooks/exhaustive-deps

  const order = me >= 0 ? Array.from({ length: g.players - 1 }, (_, k) => (me + 1 + k) % g.players) : Array.from({ length: g.players }, (_, k) => k);
  const legal = new Set(g.legal);
  const play = (card: Card) => {
    if (passing) {
      setPicks((p) => (p.includes(card.id) ? p.filter((x) => x !== card.id) : p.length >= 3 ? p : [...p, card.id]));
      return;
    }
    if (!myTurn) return t.warn(t.waitingMsg);
    if (!legal.has(card.id)) return t.warn(whyNot(g, card));
    if (touch.current && armed !== card.id) return setArmed(card.id);
    setArmed(null);
    act('move', { move: { type: 'play', card: card.id } });
  };
  const sendPass = () => act('move', { move: { type: 'pass', cards: picks } });
  const myPassed = me >= 0 && g.passed[me];

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '가장 낮은 클로버를 가진 사람이 시작해요';
    switch (e.type) {
      case 'pass':
        return `카드 3장을 ${DIR_TEXT[e.dir]}에게 건넸어요`;
      case 'play':
        return `${names[e.seat]} · ${cardName(e.card)}`;
      case 'broken':
        return `${names[e.seat]} 님이 하트를 깼어요 — 이제 하트로 시작할 수 있어요`;
      case 'trick':
        return `${names[e.seat]} 님이 가져갔어요${e.points ? ` (+${e.points}점)` : ''}`;
      case 'hand':
        return e.moon !== null ? `🌕 ${names[e.moon]} 님이 문을 쐈어요! 나머지 모두 +26` : '판이 끝났어요';
      case 'end':
        return `${e.winners.map((w) => names[w]).join(', ')} 님 승리!`;
    }
  };
  const title = passing ? (myPassed ? '다른 사람이 건네기를 기다려요' : `카드 3장을 ${DIR_TEXT[g.passDir]}에게 건네요`) : myTurn ? (g.trick.length ? '같은 무늬를 내요' : '카드를 1장 내서 시작해요') : `${names[g.turn]} 님 차례`;
  const hint = passing ? `${picks.length}/3장 골랐어요 · 받는 사람: ${g.passTo !== null ? names[g.passTo] : ''}` : `${g.trickNo + 1}번째 트릭 · ${g.heartsBroken ? '하트가 깨졌어요' : '하트는 아직 못 열어요'}`;
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals, true);
  const endLog = [...g.log].reverse().find((e) => e.type === 'end') as Extract<LogEntry, { type: 'end' }> | undefined;
  const lastHand = [...g.log].reverse().find((e) => e.type === 'hand') as Extract<LogEntry, { type: 'hand' }> | undefined;

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.turn} size={16} />} steps={<span className="small muted nowrap">{g.round}판</span>} />}
        </>
      }
      main={
        <>
          <section className="hr-opps" aria-label="다른 사람">
            {order.map((s) => (
              <div key={s} data-hr-seat={s} className={`hr-opp ${g.turn === s && !passing ? 'acting' : ''}`} style={{ ['--seat' as string]: seatColor(s) }}>
                <div className="hr-opp-head">
                  <SeatDot seat={s} size={10} /> <b>{names[s]}</b>
                  <EmoteBubble e={bySeat.get(s)} />
                </div>
                <div className="hr-opp-cards" aria-label={`카드 ${g.handCounts[s]}장`}>
                  {Array.from({ length: Math.min(g.handCounts[s], 13) }, (_, i) => (
                    <CardBack key={i} size="sm" />
                  ))}
                </div>
                <div className="hr-opp-foot">
                  <TakenBadge cards={g.taken[s]} jackBonus={c.jackBonus} />
                  {passing && <span className={`tag ${g.passed[s] ? 'ready' : ''}`}>{g.passed[s] ? '건넸어요' : '고르는 중…'}</span>}
                </div>
              </div>
            ))}
          </section>

          <section className="hr-felt" aria-label="트릭">
            <div className="hr-center" aria-live="polite">
              {shown.length === 0 && <span className="hr-empty small">{passing ? '모두 건넬 카드를 고르는 중' : `${names[g.turn]} 님이 시작해요`}</span>}
              {shown.map((p, i) => (
                <div key={p.card.id} className={`hr-play ${g.lastTrick && !g.trick.length && p.seat === g.lastTrick.winner ? 'won' : ''}`} style={{ ['--i' as string]: i }}>
                  <PlayingCard card={p.card} size="md" className="flip-reveal" flip={`h${p.card.id}`} />
                  <span className="hr-play-name small">
                    <SeatDot seat={p.seat} size={8} /> {p.seat === me ? '나' : names[p.seat]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {me >= 0 && g.status === 'playing' && (
            <section className="hand-panel hr-hand-panel" data-hr-seat={me} aria-label="내 카드">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 카드 {g.hand.length}장 · 이번 판 <b>{g.handPoints[me]}점</b>
                </span>
                {passing && !myPassed && (
                  <button className="btn primary tiny" disabled={picks.length !== 3} onClick={sendPass}>
                    {g.passTo !== null ? `${names[g.passTo]} 님에게 ` : ''}3장 건네기
                  </button>
                )}
              </div>
              <div className="hr-hand" onPointerDown={(e) => (touch.current = e.pointerType !== 'mouse')}>
                {g.hand.map((card, i) => {
                  const can = passing ? !myPassed : myTurn && legal.has(card.id);
                  const picked = picks.includes(card.id) || armed === card.id;
                  return (
                    <span key={card.id} className={`hr-slot ${picked ? 'picked' : ''} ${g.received.includes(card.id) ? 'got' : ''}`} style={{ ['--i' as string]: i, ['--n' as string]: g.hand.length }}>
                      <PlayingCard card={card} size="md" playable={can && !passing} className={`${!can && !passing ? 'dim' : ''} ${picks.includes(card.id) ? 'selected' : ''}`} onClick={() => play(card)} flip={`h${card.id}`} />
                    </span>
                  );
                })}
              </div>
            </section>
          )}
          <Ticker text={describe(lastLog)} />
        </>
      }
      side={
        <>
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.totals.map((total, seat) => ({
              seat,
              accent: seatColor(seat),
              score: `${total}점`,
              scoreLabel: '누적 점수 (낮을수록 좋음)',
              children: (
                <span className="hr-seat">
                  <TakenBadge cards={g.taken[seat]} jackBonus={c.jackBonus} />
                  <span className="muted small">이번 판 {g.handPoints[seat]}점</span>
                </span>
              ),
            }))}
          />
          <SideNote title="규칙">
            <div>처음 낸 무늬가 있으면 그 무늬를 내요</div>
            <div>가장 높은 카드(A가 제일 높음)가 트릭을 가져가요</div>
            <div>하트 1점 · 스페이드 Q 13점{c.jackBonus ? ' · 다이아 J -10' : ''} — 적을수록 좋아요</div>
            <div>{c.target}점에 닿는 사람이 나오면 끝</div>
            {c.shootMoon && <div>하트 13장 + 스페이드 Q 를 혼자 먹으면 나머지 +26 (문 쏘기)</div>}
            {g.removed.length > 0 && <div>인원에 맞춰 뺀 카드: {g.removed.map((x) => cardName(x)).join(', ')}</div>}
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
            headline={matchOver && endLog ? `🏆 ${endLog.winners.map((w) => names[w]).join(', ')} 님 승리!` : lastHand?.moon !== null && lastHand?.moon !== undefined ? `🌕 ${names[lastHand.moon]} 님이 문을 쐈어요!` : `${g.round}판 끝`}
            sub={matchOver ? `누군가 ${c.target}점에 닿았어요 · 점수가 가장 낮은 사람이 이겨요` : `${c.target}점에 닿을 때까지 계속해요`}
            columns={g.handScores.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.handScores.map((r) => r[seat]), total: `${total}점` }))}
          />
        ))
      }
    />
  );
}

function whyNot(g: GameView, card: Card): string {
  const led = g.trick[0]?.card.suit;
  if (g.trickNo === 0 && !g.trick.length) return '첫 트릭은 가장 낮은 클로버로 시작해요';
  if (led !== undefined && g.hand.some((c) => c.suit === led)) return '처음 낸 무늬와 같은 무늬를 내야 해요';
  if (led === undefined && card.suit === 1) return '하트가 아직 안 나왔어요. 다른 무늬로 시작해요';
  return '첫 트릭에는 하트·스페이드 Q 를 버릴 수 없어요';
}
