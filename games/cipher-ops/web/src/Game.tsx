import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, Key, LogEntry, clueProblem } from '@bg/cipher-ops-engine';
import { AlertBanner, EmoteBubble, Icon, iconize } from '@bg/ui';
import { GameScreenProps, ResultSheet, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, usePeek, useTable, useLogSounds } from '@bg/web';
import { TEAMS } from './theme';

type View = RoomView<GameView, GameConfig>;
const countText = (n: number) => (n === 99 ? '∞' : String(n));

function describe(e: LogEntry | undefined, names: string[]): string {
  if (!e) return '팀장이 첫 힌트를 생각하고 있어요';
  const t = TEAMS[e.team];
  switch (e.type) {
    case 'clue':
      return `${t.icon} ${names[e.seat]} 팀장: 「${e.word}」 ${countText(e.count)}`;
    case 'guess': {
      const what = e.key === 'X' ? '💀 암살자!' : e.key === 'N' ? '중립 카드' : e.key === e.team ? '정답!' : `${TEAMS[e.key as 0 | 1].name} 카드`;
      return `${t.icon} ${names[e.seat]} 님이 「${e.word}」 → ${what}`;
    }
    case 'end':
      return `${t.icon} ${t.name}이 이번 차례를 마쳤어요`;
    case 'win':
      return `${t.icon} ${t.name} 승리!${e.reason === 'assassin' ? ' (상대가 암살자를 골랐어요)' : ''}`;
  }
}

function cardClass(k: Key | null, revealed: boolean, spy: boolean) {
  if (k === null) return 'unknown';
  const base = k === 'X' ? 'assassin' : k === 'N' ? 'neutral' : k === 0 ? 'red' : 'blue';
  return `${base} ${revealed ? 'open' : spy ? 'hinted' : ''}`;
}

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, {
    title: 'Cipher Ops',
    turn: g.actors[0] ?? 0,
    playing: g.status === 'playing',
    simultaneous: g.phase === 'guess',
    stepKey: `${g.round}-${g.team}-${g.phase}-${g.clues.length}`,
    mySub: g.phase === 'clue' ? '한 단어와 숫자로 힌트를 주세요' : `「${g.clue?.word}」 힌트로 단어를 골라요`,
  });
  // 소리: 힌트는 쪽지, 단어를 고르면 카드 뒤집기 + 맞으면 띵/틀리면 둔탁, 암살자는 쿵
  useLogSounds(g.log, (e) => (e.type === 'clue' ? ['static', 'beep'] : e.type === 'guess' ? (e.key === 'X' ? ['cardSnap', 'thud'] : e.key === e.team ? ['cardSnap', 'ding'] : ['cardSnap', 'buzzer']) : e.type === 'win' ? 'win' : null), { me: t.me, describe: (e) => describe(e, t.names), stamp: (e) => (e.type === 'guess' && e.key === 'X' ? { text: '암살자!', tone: 'hot', shake: 1.6 } : e.type === 'clue' ? { text: `${e.word} · ${e.count}`, tone: 'info', othersOnly: true } : null) });
  const names = t.names;
  const me = t.me;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [word, setWord] = useState('');
  const [count, setCount] = useState(1);
  const [armed, setArmed] = useState<number | null>(null);
  useEffect(() => setArmed(null), [g.clues.length, g.phase, g.team]);
  const myTeam = g.myTeam;
  const isOperative = me >= 0 && !g.spymaster;
  const canGuess = g.status === 'playing' && g.phase === 'guess' && isOperative && myTeam === g.team;
  const canClue = g.status === 'playing' && g.phase === 'clue' && g.spymaster && myTeam === g.team;
  const problem = word ? clueProblem(g, word) : null;
  const myRemaining = myTeam !== null ? g.remaining[myTeam] : 0;

  const tap = (i: number) => {
    if (g.revealed[i] !== null) return;
    if (!canGuess) {
      if (g.status !== 'playing') return;
      if (g.spymaster) return t.warn('팀장은 카드를 고를 수 없어요. 힌트만 줘요');
      if (me < 0) return t.warn('관전 중이에요');
      return t.warn(g.phase === 'clue' ? `${TEAMS[g.team].name} 팀장이 힌트를 주는 중이에요` : `지금은 ${TEAMS[g.team].name}이 고르는 중이에요`);
    }
    if (armed === i) {
      setArmed(null);
      act('move', { move: { type: 'guess', index: i } });
    } else {
      setArmed(i);
      act('move', { move: { type: 'mark', index: i } });
    }
  };
  const send = async () => {
    if (!canClue) return;
    if (problem) return t.warn(problem);
    if (await act('move', { move: { type: 'clue', word: word.trim(), count } })) setWord('');
  };

  // 배너
  const teamName = TEAMS[g.team].name;
  let title = '';
  let hint = '';
  if (g.phase === 'clue') {
    title = canClue ? '힌트를 주세요' : `${teamName} 팀장 ${names[g.spymasters[g.team]]} 님이 힌트를 생각 중`;
    hint = canClue ? `우리 팀 단어 ${myRemaining}개를 한 단어로 묶고, 몇 개인지 숫자로 알려 줘요. 색이 칠해진 것이 정답 지도예요` : g.spymaster ? '상대 팀장의 차례예요' : '힌트가 오면 우리 팀 단어를 골라요';
  } else {
    title = `「${g.clue!.word}」 ${countText(g.clue!.count)} · ${teamName} 차례`;
    hint = canGuess
      ? `단어를 한 번 누르면 팀원에게 표시, 한 번 더 누르면 공개해요 · ${g.guessesLeft >= 99 ? '틀릴 때까지' : `${g.guessesLeft}번 더`} 고를 수 있어요`
      : g.spymaster && myTeam === g.team
        ? '팀원들이 고르는 중이에요. 말없이 표정으로만 응원해요'
        : `${teamName} 요원들이 고르는 중이에요`;
  }

  const matchOver = g.status === 'match-over';
  const lastWinner = g.winners[g.winners.length - 1];
  const assassinNear = g.status === 'playing' && c.assassins > 0 && canGuess;

  const teamPanel = (team: 0 | 1) => (
    <section className={`panel co-team ${team === 0 ? 'red' : 'blue'} ${g.team === team && g.status === 'playing' ? 'active' : ''}`}>
      <div className="co-team-head">
        <b>
          {TEAMS[team].icon} {TEAMS[team].name}
        </b>
        <span className="co-left" title="남은 단어">
          {g.remaining[team]}
          <small>/{g.totalCards[team]}</small>
        </span>
      </div>
      {[g.spymasters[team], ...g.operatives[team]].map((seat) => {
        const m = view.members.find((x) => x.seat === seat);
        return (
          <div key={seat} data-seat={seat} className={`co-member ${g.actors.includes(seat) ? 'acting' : ''}`}>
            <EmoteBubble e={bySeat.get(seat)} />
            <span className="co-role">{seat === g.spymasters[team] ? iconize('🕵️ 팀장') : '요원'}</span>
            <b>{names[seat]}</b>
            {seat === me && <span className="tag mine">나</span>}
            {m?.bot && <span className={`tag bot ${m.bot}`}><Icon name="bot" /></span>}
            {m && !m.connected && <span className="tag away-tag">끊김</span>}
          </div>
        );
      })}
      <div className="co-clues small">
        {g.clues
          .filter((cl) => cl.team === team)
          .map((cl, i) => (
            <span key={i} className="co-clue" title={`${cl.hits.length}개 맞힘`}>
              {cl.word} <b>{countText(cl.count)}</b>
              {cl.hits.length > 0 && <em><Icon name="check" />{cl.hits.length}</em>}
            </span>
          ))}
      </div>
    </section>
  );

  return (
    <TableLayout
      mine={t.myTurn}
      splash={t.splash}
      className="co"
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} style={{ ['--team' as string]: TEAMS[g.team].hex }} />}
        </>
      }
      main={
        <>
          <div className="co-score" aria-label="남은 단어">
            <span className="red">
              {TEAMS[0].icon} {g.remaining[0]}
            </span>
            <span className="muted small">{g.spymaster ? iconize('🕵️ 팀장 화면 · 정답 지도가 보여요') : myTeam !== null ? `나는 ${TEAMS[myTeam].name} 요원` : '관전 중'}</span>
            <span className="blue">
              {g.remaining[1]} {TEAMS[1].icon}
            </span>
          </div>
          <div className="table-fit">
            <section className={`co-board ${g.spymaster ? 'spy' : ''}`} style={{ ['--n' as string]: c.size }} aria-label="단어 보드">
              {g.words.map((w, i) => {
                const open = g.revealed[i] !== null;
                const marks = g.marks[i] ?? [];
                return (
                  <button
                    key={i}
                    className={`co-card pc light ${cardClass(g.key[i], open, g.spymaster)} ${armed === i ? 'armed' : ''} ${canGuess && !open ? 'can' : ''}`}
                    onClick={() => tap(i)}
                    aria-label={`${w}${open ? ' (공개됨)' : ''}`}
                    disabled={open}
                  >
                    <span className="co-word">{w}</span>
                    {g.key[i] === 'X' && (open || g.spymaster) && <span className="co-skull"><Icon name="skull" /></span>}
                    {marks.length > 0 && !open && (
                      <span className="co-marks">
                        {marks.map((s) => (
                          <i key={s} title={names[s]}>
                            {names[s].slice(0, 1)}
                          </i>
                        ))}
                      </span>
                    )}
                    {armed === i && <span className="co-confirm">한 번 더 → 공개</span>}
                  </button>
                );
              })}
            </section>
          </div>
          {canClue && (
            <section className="hand-panel co-clue-form" aria-label="힌트 주기">
              <div className="row">
                <input className="grow" value={word} maxLength={16} placeholder="힌트 한 단어 (예: 바다)" onChange={(e) => setWord(e.target.value.replace(/\s/g, ''))} onKeyDown={(e) => e.key === 'Enter' && send()} aria-label="힌트 단어" />
                <select value={count} onChange={(e) => setCount(Number(e.target.value))} aria-label="몇 개">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 99].map((n) => (
                    <option key={n} value={n}>
                      {countText(n)}
                    </option>
                  ))}
                </select>
                <button className="btn primary" disabled={!word || !!problem} onClick={send}>
                  힌트 보내기
                </button>
              </div>
              <div className={`small ${problem ? 'warn' : 'muted'}`}>{problem ?? '0 = "이 단어들은 아니야"(제한 없이 고름) · ∞ = 지난 힌트까지 마음껏'}</div>
            </section>
          )}
          {canGuess && (
            <div className="action-row">
              <button className="btn" onClick={() => act('move', { move: { type: 'end' } })}>
                이번 차례 마치기
              </button>
            </div>
          )}
          <Ticker text={describe(g.log[g.log.length - 1], names)} />
        </>
      }
      side={
        <>
          {assassinNear && g.guessesLeft === 1 && <AlertBanner icon={<Icon name="target" />} title="마지막 한 번" sub="확실하지 않으면 「이번 차례 마치기」도 좋아요" />}
          {teamPanel(0)}
          {teamPanel(1)}
          {g.log.length > 0 && (
          <section className="panel log-list small" aria-label="기록">
            {[...g.log]
              .reverse()
              .slice(0, 12)
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
            headline={
              matchOver
                ? g.totals.every((x) => x === g.totals[0])
                  ? '비겼어요!'
                  : `${TEAMS[(g.totals[0] > g.totals[1] ? 0 : 1) as 0 | 1].icon} ${TEAMS[(g.totals[0] > g.totals[1] ? 0 : 1) as 0 | 1].name} 승리!`
                : `${TEAMS[lastWinner].icon} ${TEAMS[lastWinner].name}이 ${g.round}판을 이겼어요`
            }
            sub={g.winReason === 'assassin' ? '상대 팀이 암살자 카드를 골랐어요 💀' : '우리 팀 단어를 모두 찾았어요'}
            columns={g.winners.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({
              seat,
              rank: total === Math.max(...g.totals) ? 1 : 2,
              cells: g.winners.map((w) => (w === seat % 2 ? '🏆' : '—')),
              total: `${total}승`,
            }))}
            note="판을 다시 보면 모든 카드의 정체가 보여요"
          />
        ))
      }
    />
  );
}
