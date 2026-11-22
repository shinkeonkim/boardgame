import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry } from '@bg/one-word-engine';
import { SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, useLogSounds, usePeek, useTable } from '@bg/web';
import { ClueNote, WordCard } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, {
    title: 'One Word',
    turn: g.guesser,
    playing: g.status === 'playing',
    simultaneous: g.phase === 'clue',
    stepKey: `${g.card}-${g.phase}`,
    mySub: g.phase === 'clue' ? '힌트 한 단어를 써요' : '정답을 맞혀요',
  });
  // 소리: 힌트가 모이면 쪽지 소리(겹치면 똑), 맞히면 종·틀리면 실패음
  useLogSounds(g.log, (e) => (e.type === 'clues' ? (e.erased ? ['paper', 'tick'] : 'paper') : e.type === 'guess' ? (e.ok ? 'success' : e.guess === null ? 'tick' : 'fail') : e.type === 'end' ? 'win' : null));
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [text, setText] = useState('');
  useEffect(() => setText(''), [g.card, g.phase]);
  const iGuess = me === g.guesser;
  const myClue = g.clues.find((x) => x.seat === me);
  const send = () => {
    const w = text.trim();
    if (!w) return t.warn(g.phase === 'clue' ? '힌트를 써 주세요' : '정답을 써 주세요 (모르면 「넘기기」)');
    if (g.phase === 'clue' && /\s/.test(w)) return t.warn('한 단어만 — 띄어쓰기 없이 써 주세요');
    act('move', { move: { type: g.phase === 'clue' ? 'clue' : 'guess', word: w } });
  };
  const last = g.results[g.results.length - 1];

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '맞히는 사람만 단어를 몰라요. 나머지는 한 단어씩 힌트 — 겹친 힌트는 지워져요';
    if (e.type === 'clues') return e.erased ? `힌트 ${e.erased}개가 겹쳐서 지워졌어요 · 남은 힌트 ${e.left}개` : `힌트 ${e.left}개가 모두 살아남았어요`;
    if (e.type === 'guess') return e.ok ? `「${e.word}」 정답! 🎉` : e.guess === null ? `넘겼어요 — 정답은 「${e.word}」` : `「${e.guess}」… 아쉬워요! 정답은 「${e.word}」${e.lostNext ? ' · 다음 카드도 잃어요' : ''}`;
    return `${g.deckSize}장 중 ${e.score}장 맞혔어요`;
  };
  const title =
    g.phase === 'clue'
      ? iGuess
        ? '친구들이 힌트를 쓰는 중이에요'
        : myClue?.done
          ? '힌트를 썼어요 · 다른 사람을 기다려요'
          : `「${g.word}」 — 힌트 한 단어를 써요`
      : iGuess
        ? '남은 힌트로 정답을 맞혀요'
        : `${names[g.guesser]} 님이 맞히는 중`;
  const hint = g.phase === 'clue' ? (iGuess ? '다른 사람과 같은(비슷한) 힌트는 지워져요' : '남과 겹치지 않을 단어로! 겹치면 지워져요') : iGuess ? '모르겠으면 넘기기 — 틀리면 다음 카드도 잃어요' : '맞히는 사람은 지워진 힌트를 못 봐요';
  const matchOver = g.status === 'match-over';

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.guesser} size={16} />} steps={<span className="small muted nowrap">{g.score}점 · {Math.min(g.card + 1, g.deckSize)}/{g.deckSize}장</span>} />}
        </>
      }
      main={
        <>
          <section className="ow-track" aria-label="카드">
            {Array.from({ length: g.deckSize }, (_, i) => {
              const r = g.results.find((x) => x.card === i);
              const lost = !r && i < g.card;
              return <span key={i} className={`ow-dot ${r ? (r.ok ? 'ok' : r.guess === null ? 'pass' : 'bad') : lost ? 'lost' : i === g.card ? 'now' : ''}`} title={r ? r.word : ''} />;
            })}
          </section>
          <section className="ow-board" aria-label="단어와 힌트">
            <div className="ow-center">
              <WordCard key={`${g.card}-${g.word ?? '?'}`} word={g.word} />
              <span className="small">
                <SeatDot seat={g.guesser} size={11} /> {names[g.guesser]} 님이 맞혀요
              </span>
            </div>
            <div className="ow-notes">
              {g.clues.map((cl) => (
                <div key={cl.seat} className="ow-note-wrap">
                  <ClueNote
                    text={cl.word}
                    seatColor={seatColor(cl.seat)}
                    state={g.phase === 'clue' ? (cl.word ? 'shown' : cl.done ? 'done' : 'writing') : cl.erased ? (cl.word ? 'erased' : 'hidden-erased') : 'shown'}
                  />
                  <span className="small muted">{names[cl.seat]}</span>
                </div>
              ))}
            </div>
          </section>
          {me >= 0 && g.status === 'playing' && myTurn && (
            <section className="hand-panel ow-input" aria-label={g.phase === 'clue' ? '힌트 쓰기' : '정답 쓰기'}>
              <form
                className="ow-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={g.phase === 'clue' ? '힌트 한 단어 (예: 바다)' : '정답은?'} maxLength={12} autoFocus />
                <button className="btn primary">{g.phase === 'clue' ? '힌트 내기' : '정답!'}</button>
                {g.phase === 'guess' && (
                  <button type="button" className="btn" onClick={() => act('move', { move: { type: 'pass' } })}>
                    넘기기
                  </button>
                )}
              </form>
            </section>
          )}
          {last && g.status === 'playing' && (
            <section className={`ow-last ${last.ok ? 'ok' : 'bad'}`} key={last.card}>
              <b>
                {last.ok ? '정답!' : last.guess === null ? '넘김' : `「${last.guess}」 오답`} — {last.word}
              </b>
              <span className="small">
                힌트:{' '}
                {last.clues.map((x) => (
                  <span key={x.seat} className={x.erased ? 'ow-erased' : ''}>
                    {x.word}{' '}
                  </span>
                ))}
              </span>
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
            rows={Array.from({ length: g.players }, (_, seat) => ({
              seat,
              accent: seatColor(seat),
              badge: seat === g.guesser ? <span className="tag results">맞히는 사람</span> : g.phase === 'clue' ? <span className={`tag ${g.clues.find((x) => x.seat === seat)?.done ? 'ready' : ''}`}>{g.clues.find((x) => x.seat === seat)?.done ? '썼어요 ✓' : '쓰는 중…'}</span> : null,
            }))}
          />
          <SideNote title="지난 카드" className="ow-history">
            {g.results.length === 0 && <div className="muted">아직 없어요</div>}
            {[...g.results].reverse().map((r) => (
              <div key={r.card} className={`ow-hist ${r.ok ? 'ok' : 'bad'}`}>
                <b>{r.word}</b> · {names[r.guesser]} {r.ok ? '정답' : r.guess === null ? '넘김' : `「${r.guess}」`}
                <div className="small muted">
                  {r.clues.map((x) => (
                    <span key={x.seat} className={x.erased ? 'ow-erased' : ''}>
                      {x.word}{' '}
                    </span>
                  ))}
                </div>
              </div>
            ))}
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
            headline={`${g.deckSize}장 중 ${g.score}장! ${g.score >= g.deckSize ? '완벽해요 🏆' : g.score >= g.deckSize * 0.7 ? '대단해요 🎉' : g.score >= g.deckSize * 0.4 ? '좋아요 🙂' : '다음엔 더 잘할 거예요 💪'}`}
            sub="모두 함께 맞힌 점수 (협력 게임)"
            columns={g.roundScores.map((_, i) => `${i + 1}게임`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: 1, cells: g.roundScores.map((r) => r[seat]), total }))}
          />
        ))
      }
    />
  );
}
