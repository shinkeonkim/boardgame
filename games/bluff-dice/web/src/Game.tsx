import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry, ga, myeon } from '@bg/bluff-dice-engine';
import { AlertBanner, SeatDot, seatColor, Icon } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, usePeek, useTable, useLogSounds, useChangeSound } from '@bg/web';
import { Cup, Die } from './theme';

type View = RoomView<GameView, GameConfig>;

function describe(e: LogEntry | undefined, names: string[]): string {
  if (!e) return '주사위를 굴렸어요. 첫 사람이 걸어요';
  switch (e.type) {
    case 'bid':
      return `${names[e.seat]}: 「${ga(e.face)} ${e.count}개 이상」`;
    case 'call':
      return e.kind === 'challenge' ? `${names[e.seat]}: 「거짓말!」` : `${names[e.seat]}: 「딱 맞다!」`;
    case 'out':
      return `${names[e.seat]} 님이 주사위를 모두 잃었어요`;
    case 'win':
      return `🏆 ${names[e.seat]} 님 우승!`;
  }
}

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, { title: 'Bluff Dice', turn: g.turn, playing: g.status === 'playing', stepKey: `${g.hand}-${g.phase}-${g.bids.length}`, mySub: g.phase === 'reveal' ? '주사위를 굴려 다음 판' : '더 높게 걸거나 거짓말!' });
  // 소리: 호가는 칩, 「거짓말!」은 경고 + 컵을 여는 주사위, 탈락은 쿵 / 새로 굴리면 컵 흔들기
  useLogSounds(g.log, (e) => (e.type === 'bid' ? 'chip' : e.type === 'call' ? ['alert', 'dice'] : e.type === 'out' ? 'thud' : e.type === 'win' ? 'win' : null));
  useChangeSound(`${g.round}-${g.hand}`, 'cup', g.status === 'playing');
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const prev = g.bids[g.bids.length - 1];
  const firstFace = (() => {
    for (let f = c.faces; f >= 1; f--) if (g.minCounts[f] !== null) return f;
    return 2;
  })();
  const [face, setFace] = useState(prev?.face ?? firstFace);
  const [count, setCount] = useState(1);
  useEffect(() => {
    const f = g.minCounts[face] !== null ? face : prev?.face && g.minCounts[prev.face] !== null ? prev.face : firstFace;
    setFace(f);
    setCount(g.minCounts[f] ?? 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.bids.length, g.hand]);
  const min = g.minCounts[face];
  const bidOk = myTurn && g.phase === 'bid' && min !== null && count >= min && count <= g.total;

  const guard = () => {
    if (!myTurn) {
      t.warn(t.waitingMsg);
      return false;
    }
    return true;
  };
  const bid = () => guard() && (min === null ? t.warn('그 숫자에는 걸 수 없어요') : count < min ? t.warn(`${myeon(face)} ${min}개 이상 불러야 해요`) : act('move', { move: { type: 'bid', count, face } }));
  const call = (type: 'challenge' | 'exact') => guard() && (prev ? act('move', { move: { type } }) : t.warn('아직 아무도 걸지 않았어요. 먼저 걸어 주세요'));

  const r = g.reveal;
  const showAll = g.phase === 'reveal' && r;

  // 배너
  let title: string;
  let hint: string;
  if (g.phase === 'reveal' && r) {
    const callerName = names[r.caller];
    const outcome = r.gained ? `딱 맞았어요! ${callerName} 님이 주사위 하나를 되찾아요` : `${names[r.loser]} 님이 주사위 ${r.lost}개를 잃어요`;
    title = `${ga(r.bid.face)} 실제로 ${r.actual}개 (호가 ${r.bid.count}개) → ${outcome}`;
    hint = myTurn ? '주사위를 굴려 다음 판을 시작하세요' : `${names[g.turn]} 님이 다음 판을 시작해요`;
  } else if (myTurn) {
    title = prev ? `${names[prev.seat]}: 「${ga(prev.face)} ${prev.count}개 이상」` : '첫 호가를 불러 주세요';
    hint = prev ? '더 높게 걸거나 「거짓말!」을 외쳐요' : `모두 합쳐 주사위 ${g.total}개 · 내 주사위를 보고 몇 개일지 걸어요`;
  } else {
    title = `${names[g.turn]} 님이 고민 중이에요`;
    hint = prev ? `지금 호가: 「${ga(prev.face)} ${prev.count}개 이상」` : '첫 호가를 기다리는 중';
  }

  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  const matches = (d: number) => !!r && (d === r.bid.face || (r.wild && d === 1));

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
              steps={g.palifico ? <span className="tag results">팔리피코</span> : g.wild ? <span className="tag">1은 와일드</span> : null}
            />
          )}
        </>
      }
      main={
        <>
          <section className="bd-table" aria-label="테이블">
            <div className="bd-center">
              {prev ? (
                <div key={g.bids.length} className="bd-bid" style={{ ['--seat' as string]: seatColor(prev.seat) }}>
                  <span className="small">{names[prev.seat]}</span>
                  <b>{prev.count}개</b>
                  <Die face={prev.face} seat={prev.seat} size={40} />
                  <span className="small muted">이상</span>
                </div>
              ) : (
                <span className="muted">아직 호가 없음</span>
              )}
              <div className="small muted">
                주사위 모두 {g.total}개 · {c.faces}면{g.wild ? ' ·  1은 아무 숫자로나' : ''}
              </div>
            </div>
            <div className="bd-history">
              {g.bids.map((b, i) => (
                <span key={i} data-flip={`bid${i}`} className="bd-chip" style={{ ['--seat' as string]: seatColor(b.seat) }}>
                  {b.count}×<Die face={b.face} seat={b.seat} size={16} />
                </span>
              ))}
            </div>
            {showAll && (
              <div className="bd-reveal">
                {r!.dice.map((ds, seat) =>
                  ds.length ? (
                    <div key={seat} className={`bd-reveal-row ${seat === r!.loser ? 'loser' : ''}`}>
                      <span className="small">
                        <SeatDot seat={seat} size={12} /> {names[seat]}
                      </span>
                      {ds.map((d, i) => (
                        <Die key={i} face={d} seat={seat} size={28} hit={matches(d)} wild={r!.wild && d === 1} className="reveal-die" style={{ animationDelay: `${(seat * 5 + i) * 45}ms` }} />
                      ))}
                    </div>
                  ) : null,
                )}
                <div className="bd-reveal-sum">
                  {r!.bid.face}
                  {r!.wild ? ' (+1)' : ''} = <b>{r!.actual}개</b> / 호가 {r!.bid.count}개 →{' '}
                  {r!.kind === 'exact' ? (r!.gained ? '딱 맞다 성공!' : '딱 맞지 않았어요') : r!.actual >= r!.bid.count ? '호가가 맞았어요' : '거짓말이었어요!'}
                </div>
              </div>
            )}
          </section>

          {me >= 0 && g.counts[me] > 0 && g.status === 'playing' && (
            <section className="hand-panel" aria-label="내 주사위">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 주사위 {g.counts[me]}개 (나만 봐요)
                </span>
              </div>
              <div className="hand-row">
                {g.myDice.map((d, i) => (
                  // 주사위가 바뀌면(새로 굴림) 다시 그려 굴러 나오는 움직임
                  <Die key={`${g.round}-${g.myDice.join('')}-${i}`} face={d} seat={me} size={44} hit={face === d || (g.wild && d === 1 && face !== 1)} className="rolled" style={{ animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
              {g.phase === 'bid' ? (
                <>
                  <div className="small muted center bd-faces-head">걸 숫자를 고르세요 · 아래 숫자는 걸 수 있는 가장 적은 개수예요</div>
                  <div className="bd-faces" role="radiogroup" aria-label="숫자 고르기">
                    {Array.from({ length: c.faces }, (_, i) => i + 1).map((f) => {
                      const mc = g.minCounts[f];
                      return (
                        <button
                          key={f}
                          role="radio"
                          aria-checked={face === f}
                          className={`bd-face ${face === f ? 'on' : ''}`}
                          disabled={mc === null || mc > g.total}
                          onClick={() => {
                            setFace(f);
                            setCount(Math.max(mc ?? 1, f === face ? count : 0));
                          }}
                        >
                          <Die face={f} seat={me} size={28} />
                          <small>{mc === null ? '—' : `${mc}개부터`}</small>
                        </button>
                      );
                    })}
                  </div>
                  <div className="action-row bd-actions">
                    <span className="bd-count">
                      <button className="icon-btn" onClick={() => setCount((x) => Math.max(min ?? 1, x - 1))} aria-label="하나 줄이기" disabled={count <= (min ?? 1)}>
                        −
                      </button>
                      <b>{count}개</b>
                      <button className="icon-btn" onClick={() => setCount((x) => Math.min(g.total, x + 1))} aria-label="하나 늘리기" disabled={count >= g.total}>
                        +
                      </button>
                    </span>
                    <button className="btn primary" disabled={!bidOk} onClick={bid}>
                      「{ga(face)} {count}개」 걸기
                    </button>
                    <button className="btn danger-btn" disabled={!myTurn || !prev} onClick={() => call('challenge')}>
                      거짓말!
                    </button>
                    {c.exactCall && (
                      <button className="btn" disabled={!myTurn || !prev} onClick={() => call('exact')}>
                        딱 맞다!
                      </button>
                    )}
                  </div>
                </>
              ) : (
                myTurn && (
                  <div className="action-row">
                    <button className="btn primary" onClick={() => act('move', { move: { type: 'roll' } })}>
                      <Icon name="dice" /> 주사위 굴리기
                    </button>
                  </div>
                )
              )}
            </section>
          )}
          {me >= 0 && g.counts[me] === 0 && g.status === 'playing' && <p className="muted center">주사위를 모두 잃었어요. 남은 사람들의 승부를 지켜봐요 <Icon name="eye" /></p>}
          <Ticker text={describe(g.log[g.log.length - 1], names)} />
        </>
      }
      side={
        <>
          {me >= 0 && g.counts[me] === 1 && g.status === 'playing' && <AlertBanner icon={<Icon name="dice" />} title="주사위가 하나 남았어요" critical sub="한 번만 더 지면 탈락이에요" />}
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.counts.map((n, seat) => ({
              seat,
              accent: seatColor(seat),
              dim: n === 0,
              score: g.totals[seat] > 0 ? `🏆${g.totals[seat]}` : undefined,
              badge: n === 0 ? <span className="tag">탈락</span> : undefined,
              children:
                n > 0 ? (
                  <span className="bd-seat-dice">
                    <Cup seat={seat} count={n} size={36} />
                    <span className="bd-seat-hidden" aria-hidden>
                      {Array.from({ length: n }, (_, i) => (
                        <Die key={i} face={null} seat={seat} size={16} />
                      ))}
                    </span>
                    <span className="small muted">주사위 {n}개</span>
                  </span>
                ) : undefined,
            }))}
          />
          <p className="small muted rule-note">
            모두의 주사위 중 그 숫자가 몇 개 이상인지 걸어요. 다음 사람은 더 높게 걸거나 「거짓말!」. 공개해서 틀린 쪽이 주사위 하나를 잃어요.
          </p>
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
            headline={`🏆 ${names[g.winners[g.winners.length - 1]]} 님이 ${matchOver ? '이겼어요!' : `${g.round}게임을 이겼어요`}`}
            sub="마지막까지 주사위를 지킨 사람이 이겨요"
            columns={g.winners.map((_, i) => `${i + 1}게임`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.winners.map((w) => (w === seat ? '🏆' : '')), total: `${total}승` }))}
          />
        ))
      }
    />
  );
}
