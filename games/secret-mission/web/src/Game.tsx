import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry, ROLES_ORDER, TEAM_SIZES, failsNeeded, isSpy } from '@bg/secret-mission-engine';
import { EmoteBubble, SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, rankOf, useLogSounds, usePeek, useTable } from '@bg/web';
import { ROLE_INFO, RoleCard, TokenCard } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const simultaneous = g.phase === 'vote' || g.phase === 'mission';
  const t = useTable(view, notify, {
    title: 'Secret Mission',
    turn: g.turn,
    playing: g.status === 'playing',
    simultaneous,
    stepKey: `${g.mission}-${g.phase}-${g.history.length}`,
    mySub: g.phase === 'team' ? '원정대를 골라요' : g.phase === 'vote' ? '찬성? 반대?' : g.phase === 'mission' ? '원정 카드를 내요' : '예언자를 찾아요',
  });
  // 소리: 원정대 발표는 종이, 투표 공개는 카드 뒤집기, 원정 성공은 띵/실패는 쿵, 사냥은 경고
  useLogSounds(g.log, (e) => (e.type === 'team' ? 'paper' : e.type === 'vote' ? (e.approved ? 'flip' : ['flip', 'tick']) : e.type === 'mission' ? (e.success ? ['shuffle', 'success'] : ['shuffle', 'thud']) : e.type === 'hunt' ? ['alert', e.hit ? 'thud' : 'success'] : e.type === 'end' ? 'win' : null));
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [pick, setPick] = useState<number[]>([]);
  const [showRole, setShowRole] = useState(true);
  useEffect(() => setPick([]), [g.phase, g.leader, g.mission]);

  const lastVote = [...g.history].reverse()[0];
  const showVotes = g.phase !== 'vote' && lastVote && lastVote.votes;
  const choosingTeam = g.phase === 'team' && myTurn;
  const hunting = g.phase === 'hunt' && myTurn;
  const toggle = (s: number) => {
    if (choosingTeam) setPick((p) => (p.includes(s) ? p.filter((x) => x !== s) : p.length < g.teamSize ? [...p, s] : p));
    else if (hunting && s !== me) act('move', { move: { type: 'hunt', target: s } });
  };
  const propose = () => {
    if (pick.length !== g.teamSize) return t.warn(`원정대 ${g.teamSize}명을 골라 주세요`);
    act('move', { move: { type: 'team', seats: pick } });
  };

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '대장이 원정대를 고르면, 모두 찬성·반대 투표로 보낼지 정해요';
    switch (e.type) {
      case 'team':
        return `대장 ${names[e.seat]} 님이 원정대를 골랐어요: ${e.team.map((s) => names[s]).join(', ')}`;
      case 'vote':
        return e.approved ? `찬성 ${e.yes} : 반대 ${e.no} — 원정대 출발!` : `찬성 ${e.yes} : 반대 ${e.no} — 부결 (${e.rejects}/${c.rejectLimit})`;
      case 'mission':
        return e.success ? `원정 ${e.mission + 1} 성공${e.fails ? ` (실패 카드 ${e.fails}장이 있었지만 2장이 필요해요)` : ''}` : `원정 ${e.mission + 1} 실패 — 실패 카드 ${e.fails}장`;
      case 'hunt':
        return `사냥꾼 ${names[e.seat]} 님이 ${names[e.target]} 님을 지목 — ${e.hit ? '예언자였어요!' : '빗나갔어요'}`;
      case 'end':
        return e.winner === 'agents' ? '요원 승리!' : e.why === 'rejects' ? `원정대가 ${c.rejectLimit}번 부결 — 첩자 승리` : e.why === 'hunt' ? '예언자가 사냥당했어요 — 첩자 승리' : '첩자 승리!';
    }
  };
  const title = (() => {
    switch (g.phase) {
      case 'team':
        return myTurn ? `원정대 ${g.teamSize}명을 골라요` : `대장 ${names[g.leader]} 님이 원정대를 고르는 중`;
      case 'vote':
        return g.myVote === null && me >= 0 ? '이 원정대를 보낼까요?' : `투표 중 (${g.voted.filter(Boolean).length}/${g.players})`;
      case 'mission':
        return myTurn ? '원정 카드를 내요' : `원정 중 (${g.played.filter((x, i) => x && g.team.includes(i)).length}/${g.team.length})`;
      case 'hunt':
        return myTurn ? '예언자로 보이는 사람을 지목하세요' : '사냥꾼이 예언자를 찾는 중…';
    }
  })();
  const hint = (() => {
    if (g.phase === 'team') return myTurn ? '자리를 눌러 고르고 「원정대 제안」 · 나를 넣어도 돼요' : '얼굴을 보며 이야기해 보세요 — 누가 수상한가요?';
    if (g.phase === 'vote') return `과반이 찬성해야 출발 · 연속 ${c.rejectLimit}번 부결이면 첩자 승 (지금 ${g.rejects}번)`;
    if (g.phase === 'mission') return g.failsNeeded > 1 ? '이번 원정은 실패 카드 2장이어야 실패해요' : '실패 카드가 1장이라도 있으면 원정 실패';
    return '사냥꾼이 맞히면 첩자가 역전승해요';
  })();
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  const sizes = TEAM_SIZES[g.players] ?? TEAM_SIZES[10];

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.turn} size={16} />} steps={<span className="small muted nowrap">원정 {g.mission + 1}/5</span>} />}
        </>
      }
      main={
        <>
          <section className={`sm-table ${choosingTeam ? 'picking' : ''} ${hunting ? 'hunting' : ''}`} aria-label="원탁">
            <div className="sm-center">
              <div className="sm-track" aria-label="원정 기록">
                {sizes.map((n, i) => (
                  <span key={i} className={`sm-mission ${g.results[i] === true ? 'win' : g.results[i] === false ? 'lose' : ''} ${i === g.mission && g.status === 'playing' ? 'now' : ''}`} title={`${i + 1}번째 원정 · ${n}명${failsNeeded(g.players, i) > 1 ? ' · 실패 2장 필요' : ''}`}>
                    <b>{g.results[i] === true ? '✔' : g.results[i] === false ? '✖' : n}</b>
                    {failsNeeded(g.players, i) > 1 && <small>✖✖</small>}
                  </span>
                ))}
              </div>
              <div className="sm-rejects" title="연속 부결">
                {Array.from({ length: c.rejectLimit }, (_, i) => (
                  <i key={i} className={i < g.rejects ? 'on' : ''} />
                ))}
                <span className="small">부결</span>
              </div>
            </div>
            {Array.from({ length: g.players }, (_, s) => {
              // 원탁: 나는 아래 가운데, 나머지는 시계 방향
              const k = me >= 0 ? (s - me + g.players) % g.players : s;
              const a = Math.PI / 2 + (k / g.players) * Math.PI * 2;
              const x = 50 + Math.cos(a) * 42;
              const y = 50 + Math.sin(a) * 38;
              const onTeam = (g.phase === 'team' ? pick : g.team).includes(s);
              const known = g.known[s];
              const role = g.roles?.[s];
              const vote = showVotes ? lastVote.votes![s] : null;
              const m = view.members.find((x) => x.seat === s);
              return (
                <button
                  key={s}
                  className={`sm-seat ${onTeam ? 'on-team' : ''} ${g.actors.includes(s) ? 'acting' : ''} ${s === me ? 'me' : ''} ${known ? `known-${known}` : ''} ${role ? (isSpy(role) ? 'reveal-spy' : 'reveal-agent') : ''}`}
                  style={{ left: `${x}%`, top: `${y}%`, ['--seat' as string]: seatColor(s) }}
                  onClick={() => toggle(s)}
                  disabled={!choosingTeam && !(hunting && s !== me)}
                  aria-label={`${names[s]}${onTeam ? ', 원정대' : ''}`}
                >
                  <EmoteBubble e={bySeat.get(s)} />
                  {g.leader === s && g.status === 'playing' && <span className="sm-crown" title="대장">👑</span>}
                  <span className="sm-seat-name">
                    {names[s]}
                    {m?.bot && ' 🤖'}
                  </span>
                  {role ? <span className="sm-tag">{ROLE_INFO[role].name}</span> : known === 'spy' ? <span className="sm-tag spy">첩자</span> : known === 'seer' ? <span className="sm-tag seer">예언자?</span> : null}
                  {onTeam && <span className="sm-badge">원정대</span>}
                  {g.phase === 'vote' && <span className={`sm-voted ${g.voted[s] ? 'done' : ''}`}>{g.voted[s] ? '✓' : '…'}</span>}
                  {vote !== null && vote !== undefined && <span className={`sm-vote ${vote ? 'yes' : 'no'}`}>{vote ? '찬성' : '반대'}</span>}
                </button>
              );
            })}
          </section>

          {me >= 0 && g.myRole && (
            <section className="hand-panel sm-hand" aria-label="내 역할과 할 일">
              <div className="sm-me">
                <button className="sm-role-toggle" onClick={() => setShowRole((x) => !x)} aria-label={showRole ? '역할 가리기' : '역할 보기'} title="옆 사람이 볼 때 가려요">
                  {showRole ? <RoleCard role={g.myRole} size="sm" /> : <span className="sm-role-hidden pc back">역할 보기</span>}
                </button>
                {showRole && (
                  <div className="sm-me-text small">
                    <b>{ROLE_INFO[g.myRole].name}</b> · {ROLE_INFO[g.myRole].goal}
                    <br />
                    <span className="muted">{ROLE_INFO[g.myRole].know}</span>
                  </div>
                )}
              </div>
              <div className="action-row sm-actions">
                {choosingTeam && (
                  <>
                    <span className="small">
                      {pick.length}/{g.teamSize}명
                    </span>
                    <button className="btn primary" disabled={pick.length !== g.teamSize} onClick={propose}>
                      원정대 제안
                    </button>
                  </>
                )}
                {g.phase === 'vote' && g.myVote === null && (
                  <>
                    <TokenCard kind="yes" onClick={() => act('move', { move: { type: 'vote', approve: true } })} />
                    <TokenCard kind="no" onClick={() => act('move', { move: { type: 'vote', approve: false } })} />
                  </>
                )}
                {g.phase === 'vote' && g.myVote !== null && <TokenCard kind={g.myVote ? 'yes' : 'no'} selected />}
                {g.phase === 'mission' && myTurn && (
                  <>
                    <TokenCard kind="success" onClick={() => act('move', { move: { type: 'play', success: true } })} />
                    <TokenCard kind="fail" disabled={!isSpy(g.myRole)} onClick={() => act('move', { move: { type: 'play', success: false } })} />
                  </>
                )}
                {g.phase === 'mission' && g.myPlay !== null && <span className="muted small">카드를 냈어요. 다른 대원을 기다려요</span>}
                {hunting && <span className="small">원탁에서 예언자로 보이는 사람을 눌러요</span>}
              </div>
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
        </>
      }
      side={
        <>
          <section className="panel small sm-history" aria-label="원정대 기록">
            <b>원정대 기록</b>
            {g.history.length === 0 && <div className="muted">아직 없어요</div>}
            {[...g.history].reverse().map((h, i) => (
              <div key={i} className={`sm-hist ${h.approved ? (h.fails === null ? '' : h.fails > 0 ? 'lose' : 'win') : 'rejected'}`}>
                <span>
                  {h.mission + 1}번째 · 대장 <SeatDot seat={h.leader} size={9} /> {names[h.leader]}
                </span>
                <span className="sm-hist-team">{h.team.map((s) => names[s]).join(', ')}</span>
                <span>
                  {h.approved ? (h.fails === null ? '출발' : h.fails > 0 ? `실패 ✖${h.fails}` : '성공 ✔') : '부결'} · 찬성 {h.yes}
                  {h.votes && (
                    <span className="muted">
                      {' '}
                      (
                      {h.votes
                        .map((y, s) => (y ? names[s] : null))
                        .filter(Boolean)
                        .join(', ')}
                      )
                    </span>
                  )}
                </span>
              </div>
            ))}
          </section>
          <SideNote title="역할" className="sm-ref">
            <div>
              요원 {g.players - g.spyCount}명 · 첩자 {g.spyCount}명
            </div>
            {ROLES_ORDER.filter((r) => (r === 'seer' || r === 'hunter' ? c.seer : r === 'guard' ? c.guard : r === 'falseSeer' ? c.falseSeer : r === 'shadow' ? c.shadow : r === 'loner' ? c.loner : true)).map((r) => (
              <div key={r}>
                <b className={ROLE_INFO[r].side === 'spy' ? 'spy-text' : ''}>{ROLE_INFO[r].name}</b> · {ROLE_INFO[r].know}
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
            headline={g.winner === 'agents' ? '🕵️ 요원 승리!' : '🎭 첩자 승리!'}
            sub={g.roles ? `첩자: ${g.roles.flatMap((r, s) => (isSpy(r) ? [`${names[s]}(${ROLE_INFO[r].name})`] : [])).join(', ')}` : ''}
            columns={g.roundScores.map((_, i) => `${i + 1}게임`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.roundScores.map((r) => (r[seat] ? '승' : '패')), total }))}
            note="이긴 편 모두 1점"
          />
        ))
      }
    />
  );
}
