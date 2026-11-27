import { FormEvent, useEffect, useRef, useState } from 'react';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry } from '@bg/sketch-quiz-engine';
import { SeatDot, seatColor, Icon, iconize } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, rankOf, useLogSounds, usePeek, useTable } from '@bg/web';
import { Board } from './Board';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const t = useTable(view, notify, { title: 'Sketch Quiz', turn: g.drawer, playing: g.status === 'playing', simultaneous: g.phase !== 'pick', quiet: g.phase !== 'pick', stepKey: `${g.turnNo}-${g.phase}`, mySub: '그릴 단어를 골라요' });
  // 소리: 차례가 바뀌면 종이, 맞히면 성공, 아깝다는 톡, 공개는 종, 끝은 축하
  useLogSounds(g.log, (e) => (e.type === 'turn' ? ['pageTurn', 'scribble'] : e.type === 'correct' ? ['ding', 'success'] : e.type === 'guess' ? (e.close ? 'pop' : null) : e.type === 'reveal' ? 'bell' : e.type === 'end' ? 'win' : null), { me: t.me, actor: (e) => ('seat' in e ? e.seat : 'drawer' in e ? e.drawer : null), stamp: (e) => (e.type === 'correct' && e.order === 0 ? { text: '첫 정답!', tone: 'good', shake: 0.5 } : e.type === 'reveal' ? { text: e.word, tone: 'info' } : null) });
  const names = t.names;
  const me = t.me;
  const drawing = me === g.drawer;
  const solved = g.solved.includes(me);
  const [peekEnd, setPeekEnd] = usePeek(`${g.status}`);
  const [text, setText] = useState('');
  const send = (move: unknown) => act('move', { move });
  const guess = (e: FormEvent) => {
    e.preventDefault();
    const s = text.trim();
    if (!s) return;
    send({ type: 'guess', text: s });
    setText('');
  };
  const chatRef = useRef<HTMLDivElement>(null);
  const chat = g.log.filter((e) => e.type === 'guess' || e.type === 'correct' || e.type === 'reveal' || e.type === 'turn' || e.type === 'skip');
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [chat[chat.length - 1]?.n]);
  const lastReveal = [...g.log].reverse().find((e) => e.type === 'reveal') as Extract<LogEntry, { type: 'reveal' }> | undefined;

  const title =
    g.phase === 'pick'
      ? drawing
        ? '그릴 단어를 골라요'
        : `${names[g.drawer]} 님이 단어를 고르는 중`
      : g.phase === 'draw'
        ? drawing
          ? `「${g.word}」를 그려요!`
          : solved
            ? '맞혔어요! 다른 사람을 기다려요'
            : `${names[g.drawer]} 님의 그림 — 무엇일까요?`
        : `정답: ${lastReveal?.word ?? g.word}`;
  const hint =
    g.phase === 'draw'
      ? drawing
        ? '글자·숫자는 쓰면 안 돼요 · 맞힌 사람마다 +3'
        : `${g.solved.length}명 맞힘 · ${g.config.hints ? '시간이 지나면 초성·글자 힌트가 나와요' : '힌트 없음'}`
      : g.phase === 'reveal'
        ? `${lastReveal?.correct ?? 0}명 맞힘 · ${names[g.drawer]} 님 +${lastReveal?.drawerPoints ?? 0}`
        : `${g.turnNo + 1}/${g.totalTurns}번째 그림`;
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);

  const line = (e: LogEntry) => {
    switch (e.type) {
      case 'turn':
        return <div key={e.n} className="sq-msg sys"><Icon name="pencil" /> {names[e.drawer]} 님 차례 ({e.no}/{g.totalTurns})</div>;
      case 'skip':
        return <div key={e.n} className="sq-msg sys">{names[e.drawer]} 님이 넘겼어요</div>;
      case 'guess':
        return (
          <div key={e.n} className={`sq-msg ${e.close ? 'close' : ''}`}>
            <SeatDot seat={e.seat} size={9} /> <b>{names[e.seat]}</b> {e.text}
            {e.close && e.seat === me && <span className="tag">아깝다!</span>}
          </div>
        );
      case 'correct':
        return (
          <div key={e.n} className="sq-msg ok">
            <Icon name="party" /> {names[e.seat]} 님 정답! +{e.points}
          </div>
        );
      case 'reveal':
        return (
          <div key={e.n} className="sq-msg sys">
            정답은 <b>{e.word}</b>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <TableLayout
      mine={(g.phase === 'pick' && drawing) || (g.phase === 'draw' && !solved && !drawing)}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.drawer} size={16} />} steps={<span className="small muted nowrap">{g.turnNo + 1}/{g.totalTurns}</span>} />}
        </>
      }
      main={
        <>
          <section className="sq-word" aria-label="단어 힌트">
            {g.phase === 'pick' && drawing && g.options ? (
              <div className="sq-options">
                {g.options.map((w, i) => (
                  <button key={w} className="btn primary sq-option" onClick={() => send({ type: 'pick', idx: i })}>
                    {w}
                  </button>
                ))}
              </div>
            ) : g.phase === 'pick' ? (
              <span className="muted">단어를 고르는 중…</span>
            ) : (
              <span className="sq-slots">
                {g.slots.map((s, i) =>
                  s.ch === ' ' ? (
                    <span key={i} className="sq-space" />
                  ) : (
                    <span key={i} className={`sq-slot ${s.ch ? 'known' : s.cho ? 'cho' : ''}`}>
                      {s.ch ?? s.cho ?? ''}
                    </span>
                  ),
                )}
                <span className="small muted">{g.slots.filter((s) => s.ch !== ' ').length}글자</span>
              </span>
            )}
          </section>
          <Board strokes={g.strokes} canDraw={drawing && g.phase === 'draw' && g.status === 'playing'} send={send} />
          {g.status === 'playing' && (
            <div className="action-row sq-actions">
              {drawing && g.phase !== 'reveal' && (
                <button className="btn" onClick={() => send({ type: 'skip' })}>
                  {g.phase === 'draw' && g.solved.length ? '여기서 끝내기' : '이 단어 넘기기'}
                </button>
              )}
              {g.phase === 'reveal' && me >= 0 && (
                <button className="btn primary" disabled={g.ready[me]} onClick={() => send({ type: 'next' })}>
                  {g.ready[me] ? '기다리는 중…' : iconize('다음 그림 ▶')}
                </button>
              )}
            </div>
          )}
        </>
      }
      side={
        <>
          <section className="panel sq-chat-panel" aria-label="답 적기">
            <div className="sq-chat" ref={chatRef} aria-live="polite">
              {chat.map(line)}
            </div>
            {me >= 0 && g.status === 'playing' && (
              <form className="sq-guess" onSubmit={guess}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={drawing ? '그리는 중엔 답을 못 적어요' : solved ? '맞혔어요!' : g.phase === 'draw' ? '답을 적고 Enter' : '그림이 나오면 적어요'}
                  disabled={drawing || solved || g.phase !== 'draw'}
                  maxLength={30}
                  aria-label="답"
                />
                <button className="btn primary" disabled={drawing || solved || g.phase !== 'draw' || !text.trim()}>
                  보내기
                </button>
              </form>
            )}
          </section>
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.totals.map((total, seat) => ({
              seat,
              accent: seatColor(seat),
              score: `${total}점`,
              scoreLabel: '맞혀서 + 그려서 얻은 점수',
              badge: seat === g.drawer && g.status === 'playing' ? <span className="tag"><Icon name="pencil" /> 그리는 중</span> : g.solved.includes(seat) ? <span className="tag ready">정답 <Icon name="check" /></span> : null,
            }))}
          />
          <SideNote title="규칙" className="sq-ref">
            <div>· 차례대로 한 명이 단어를 그리고, 나머지가 맞혀요</div>
            <div>· 먼저 맞힐수록 점수가 커요 (10 · 8 · 6 · 5 · 4 · 3…)</div>
            <div>· 그린 사람은 맞힌 사람마다 +3, 모두 맞히면 +2 더</div>
            <div>· 글자·숫자를 쓰면 반칙이에요</div>
          </SideNote>
        </>
      }
      overlay={
        matchOver &&
        (peekEnd ? (
          <button className="btn primary peek-btn" onClick={() => setPeekEnd(false)}>
            결과 보기
          </button>
        ) : (
          <ResultSheet
            view={view}
            act={act}
            onLeave={onLeave}
            onPeek={() => setPeekEnd(true)}
            matchOver
            round={g.round}
            status={g.status}
            headline={`🎨 ${g.winners.map((w) => names[w]).join(', ')} 님 승리!`}
            sub="맞혀서 얻은 점수 + 그려서 얻은 점수"
            columns={['맞힘', '그림']}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: [g.guessPts[seat], g.drawPts[seat]], total }))}
          />
        ))
      }
    />
  );
}
