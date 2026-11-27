import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry } from '@bg/silent-count-engine';
import { CardBack, EmoteBubble, Icon, SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, useLogSounds, usePeek, useTable } from '@bg/web';
import { Lives, NumCard, Stars } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const t = useTable(view, notify, {
    title: 'Silent Count',
    turn: g.actors[0] ?? 0,
    playing: g.status === 'playing',
    simultaneous: true,
    quiet: true,
    stepKey: `${g.round}`,
    mySub: '때가 되면 가장 낮은 카드를 내요',
  });
  useLogSounds(g.log, (e) => (e.type === 'play' ? 'cardSnap' : e.type === 'miss' ? ['buzzer', 'thud'] : e.type === 'star' ? ['sparkle', 'sweep'] : e.type === 'clear' ? 'success' : e.type === 'level' ? 'riffle' : e.type === 'end' ? (e.won ? 'win' : 'fail') : null), { me: t.me, describe: (e) => describe(e), stamp: (e) => (e.type === 'miss' ? { text: '삐끗!', tone: 'hot', shake: 1.2 } : e.type === 'clear' ? { text: `${e.level}단계 통과!`, tone: 'good' } : null) });
  const names = t.names;
  const me = t.me;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const { bySeat } = emotesBySeat(emotes);
  const lastLog = g.log[g.log.length - 1];
  const miss = lastLog?.type === 'miss' ? lastLog : null;
  const low = g.hand[0];
  const myVote = me >= 0 && g.starVotes[me];

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '말없이, 작은 숫자부터';
    switch (e.type) {
      case 'level':
        return `${e.level}단계 — 한 사람 ${e.cards}장`;
      case 'play':
        return `${names[e.seat]} · ${e.card}`;
      case 'miss':
        return `앗! ${names[e.seat]} 님의 ${e.card} 앞에 더 작은 카드가 있었어요: ${e.lost.map((l) => `${names[l.seat]} ${l.card}`).join(', ')} — 생명 -1`;
      case 'star':
        return `수리검! 버린 카드: ${e.discarded.map((d) => `${names[d.seat]} ${d.card}`).join(', ')}`;
      case 'clear':
        return `${e.level}단계 통과!${e.reward === 'life' ? ' 생명 +1' : e.reward === 'star' ? ' 수리검 +1' : ''}`;
      case 'end':
        return e.won ? '모든 단계를 깼어요!' : `${e.level}단계에서 생명이 다했어요`;
    }
  };
  const title = me < 0 ? '모두 숨죽이고 있어요' : g.hand.length ? '때가 되면 가장 낮은 카드를 내요' : '내 카드는 다 냈어요 · 다른 사람을 기다려요';
  const hint = `${g.round}/${g.levels}단계 · 남은 카드 ${g.remaining}장 · 말로 숫자를 알려 주면 안 돼요`;
  const matchOver = g.status === 'match-over';

  return (
    <TableLayout
      mine={false}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={g.levels} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && (
            <TableBanner
              t={t}
              act={act}
              title={title}
              hint={hint}
              icon={<Icon name="eye" />}
              steps={
                <span className="sc-banner-res">
                  <Lives n={g.lives} /> <Stars n={g.stars} />
                </span>
              }
            />
          )}
        </>
      }
      main={
        <>
          <section className="sc-opps" aria-label="다른 사람">
            {g.handCounts.map((n, s) =>
              s === me ? null : (
                <div key={s} className="sc-opp" style={{ ['--seat' as string]: seatColor(s) }}>
                  <div className="sc-opp-head">
                    <SeatDot seat={s} size={10} /> <b>{names[s]}</b>
                    <EmoteBubble e={bySeat.get(s)} />
                  </div>
                  <div className="sc-opp-cards" aria-label={`카드 ${n}장`}>
                    {Array.from({ length: Math.min(n, 12) }, (_, i) => (
                      <CardBack key={i} size="sm" />
                    ))}
                    {n === 0 && <span className="muted small">다 냈어요</span>}
                  </div>
                  {g.starVotes[s] && <span className="tag">수리검 쓰자</span>}
                </div>
              ),
            )}
          </section>

          <section className={`sc-felt ${miss ? 'missed' : ''}`} aria-label="가운데 더미" key={miss?.n ?? 'ok'}>
            <div className="sc-pile">
              {g.pile.slice(-4, -1).map((n, i) => (
                <NumCard key={`${n}-${i}`} n={n} size="sm" className="sc-under" />
              ))}
              {g.top ? <NumCard key={g.top} n={g.top} size="lg" className="sc-top" flip={`h${g.top}`} /> : <span className="sc-empty">첫 카드를 기다려요</span>}
            </div>
            {miss && (
              <div className="sc-miss" role="alert">
                <b>앗!</b> 더 작은 카드: {miss.lost.map((l) => `${l.card}(${names[l.seat]})`).join(', ')}
              </div>
            )}
          </section>

          {me >= 0 && g.status === 'playing' && (
            <section className="hand-panel sc-hand-panel" aria-label="내 카드">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 카드 {g.hand.length}장
                </span>
                {g.stars > 0 && g.hand.length > 0 && (
                  <button type="button" className={`btn tiny ${myVote ? 'primary' : ''}`} onClick={() => act('move', { move: { type: 'star', on: !myVote } })} aria-pressed={myVote}>
                    <Stars n={1} /> {myVote ? '수리검 제안 취소' : '수리검 쓰자'}
                  </button>
                )}
              </div>
              <div className="sc-hand">
                {g.hand.map((n, i) => (
                  <NumCard key={n} n={n} size="md" className={i === 0 ? 'sc-low' : 'sc-rest'} flip={`h${n}`} />
                ))}
              </div>
              {low !== undefined && (
                <button type="button" className="btn primary sc-play" onClick={() => act('move', { move: { type: 'play' } })}>
                  지금이다! <b>{low}</b> 내기
                </button>
              )}
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
            rows={g.handCounts.map((n, seat) => ({
              seat,
              accent: seatColor(seat),
              children: <span className="small muted">카드 {n}장{g.starVotes[seat] ? ' · 수리검 쓰자' : ''}</span>,
            }))}
          />
          <SideNote title="규칙">
            <div>차례가 없어요 — 누구든 아무 때나 가장 낮은 카드를 내요</div>
            <div>모두의 카드가 작은 순서로 나와야 해요</div>
            <div>어긋나면 생명 -1, 더 작은 카드는 모두 버려요</div>
            <div>수리검: 카드를 가진 사람이 모두 「쓰자」면 각자 가장 낮은 카드를 버려요</div>
            <div>숫자를 말이나 손짓으로 알려 주면 안 돼요</div>
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
            headline={matchOver ? (g.won ? '🎉 모든 단계를 깼어요!' : `${g.cleared}단계까지 깼어요`) : `${g.round}단계 통과!`}
            sub={matchOver ? (g.won ? '마음이 통했어요' : '다음엔 더 멀리') : `다음은 한 사람 ${g.round + 1}장 · 생명 ${g.lives} · 수리검 ${g.stars}`}
            columns={['깬 단계']}
            rows={g.totals.map((total, seat) => ({ seat, rank: 1, cells: [total], total: `${total}단계` }))}
          />
        ))
      }
    />
  );
}
