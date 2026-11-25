import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry } from '@bg/number-vault-engine';
import { AlertBanner, EmoteBubble, SeatDot, Icon, iconize } from '@bg/ui';
import { GameScreenProps, ResultSheet, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, rankOf, usePeek, useTable, useLogSounds } from '@bg/web';
import { TileView } from './theme';

type View = RoomView<GameView, GameConfig>;
const num = (n: number) => (n === -1 ? '조커' : String(n));

function describe(e: LogEntry | undefined, names: string[]): string {
  if (!e) return '타일을 가져오고, 다른 사람의 가려진 타일 숫자를 맞혀요';
  switch (e.type) {
    case 'draw':
      return `${names[e.seat]} 님이 ${e.color ? '하얀' : '검은'} 타일을 가져왔어요`;
    case 'guess':
      return `${names[e.seat]} → ${names[e.target]}의 ${e.pos + 1}번째 타일은 「${num(e.value)}」? ${e.ok ? '맞았어요! 🔓' : '틀렸어요'}`;
    case 'stop':
      return `${names[e.seat]} 님이 여기서 멈췄어요`;
    case 'expose':
      return `${names[e.seat]} 님의 타일 「${num(e.value)}」이 공개됐어요`;
    case 'out':
      return `${names[e.seat]} 님의 금고가 모두 열렸어요 (탈락)`;
    case 'win':
      return `🏆 ${names[e.seat]} 님 승리!`;
  }
}

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, { title: 'Number Vault', turn: g.turn, playing: g.status === 'playing', stepKey: `${g.turn}-${g.log.length ? g.log[g.log.length - 1].n : 0}-${g.phase}`, mySub: '타일을 가져오고 숫자를 맞혀요' });
  // 소리: 타일 가져오기는 딱, 맞히면 금고 철컥, 틀리면 실패음 + 내 타일 공개, 탈락은 쿵
  useLogSounds(g.log, (e) => (e.type === 'draw' ? 'tile' : e.type === 'guess' ? (e.ok ? 'lock' : 'fail') : e.type === 'expose' ? 'flip' : e.type === 'out' ? 'thud' : e.type === 'win' ? 'win' : e.type === 'stop' ? 'tick' : null));
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [sel, setSel] = useState<{ target: number; tileId: string } | null>(null);
  useEffect(() => setSel(null), [g.turn, g.phase]);

  const guess = async (value: number) => {
    if (!sel) return;
    if (await act('move', { move: { type: 'guess', target: sel.target, tileId: sel.tileId, value } })) setSel(null);
  };
  const pickTile = (target: number, tileId: string, revealed: boolean) => {
    if (g.status !== 'playing' || revealed) return;
    if (!myTurn) return t.warn(t.waitingMsg);
    if (g.phase === 'draw') return t.warn('먼저 타일을 1장 가져와 주세요');
    if (g.phase === 'place') return t.warn('먼저 조커를 놓을 자리를 골라 주세요');
    if (g.phase === 'reveal') return t.warn('틀렸어요. 내 타일 중 하나를 골라 공개해 주세요');
    setSel({ target, tileId });
  };
  const missesFor = (tileId: string) => new Set(g.misses.filter((x) => x.tileId === tileId).map((x) => x.value));

  // 배너
  let title = '';
  let hint = '';
  if (!myTurn) {
    title = `${names[g.turn]} 님의 차례예요`;
    hint = g.phase === 'continue' ? '한 번 맞혀서 더 맞힐지 고민 중이에요' : '누구의 타일을 노릴까요?';
  } else if (g.phase === 'draw') {
    title = '타일을 1장 가져오세요';
    hint = c.chooseColor ? '검은 타일과 하얀 타일 중 골라요' : '더미에서 1장 가져와요';
  } else if (g.phase === 'place') {
    title = '조커를 어디에 놓을까요?';
    hint = '내 줄의 원하는 자리(점선)를 눌러요. 조커는 순서와 상관없이 놓여요';
  } else if (g.phase === 'guess') {
    title = sel ? `${names[sel.target]} 님의 타일 숫자는?` : '맞힐 타일을 고르세요';
    hint = sel ? '아래에서 숫자를 고르면 바로 맞혀요' : '다른 사람의 가려진 타일을 눌러요. 틀리면 내가 가져온 타일이 공개돼요';
  } else if (g.phase === 'continue') {
    title = '맞았어요! 더 맞힐까요?';
    hint = '또 맞히면 계속, 틀리면 가져온 타일이 공개돼요. 멈추면 안전하게 내 줄에 숨겨요';
  } else {
    title = '내 타일 하나를 공개해야 해요';
    hint = '가져온 타일이 없어서, 내 가려진 타일 중 하나를 골라 공개해요';
  }

  const matchOver = g.status === 'match-over';
  const order = Array.from({ length: g.players }, (_, i) => (me >= 0 ? (me + i) % g.players : i)).filter((s) => s !== me);
  const myRow = me >= 0 ? g.rows[me] : [];
  const myHidden = myRow.filter((x) => !x.revealed).length;

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.turn} size={16} />} />}
        </>
      }
      main={
        <>
          <section className="nv-others" aria-label="다른 사람 금고">
            {order.map((seat) => {
              const out = g.outOrder.includes(seat);
              const m = view.members.find((x) => x.seat === seat);
              return (
                <div key={seat} className={`nv-row ${g.turn === seat && g.status === 'playing' ? 'active' : ''} ${out ? 'out' : ''}`}>
                  <div className="nv-row-head small">
                    <span className="seat-name">
                      <EmoteBubble e={bySeat.get(seat)} />
                      <SeatDot seat={seat} size={14} /> <b>{names[seat]}</b>
                      {m?.bot && <span className={`tag bot ${m.bot}`}><Icon name="bot" /></span>}
                      {m && !m.connected && <span className="tag away-tag">끊김</span>}
                      {out && <span className="tag">열림</span>}
                    </span>
                    <span className="muted">가려진 타일 {g.rows[seat].filter((x) => !x.revealed).length}장</span>
                  </div>
                  <div className="nv-tiles">
                    {g.rows[seat].map((tile) => (
                      <div key={tile.id} className="nv-slot" data-flip={`t${tile.id}`}>
                        <TileView key={tile.revealed ? 'open' : 'closed'} t={tile} className={tile.revealed ? 'flip-reveal' : ''} selected={sel?.tileId === tile.id} onClick={!tile.revealed ? () => pickTile(seat, tile.id, tile.revealed) : undefined} />
                        {!tile.revealed && missesFor(tile.id).size > 0 && (
                          <span className="nv-miss" title="틀린 추측">
                            {[...missesFor(tile.id)].map((x) => (
                              <s key={x}><Icon name="x" />{num(x)}</s>
                            ))}
                          </span>
                        )}
                      </div>
                    ))}
                    {g.pending && g.turn === seat && (
                      <div className="nv-slot pending" data-flip={`t${g.pending.id}`}>
                        <TileView t={g.pending} size="sm" />
                        <span className="small muted">가져온 타일</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {sel && myTurn && (
            <section className="hand-panel nv-picker" aria-label="숫자 고르기">
              <div className="small">
                <b>{names[sel.target]}</b> 님의 {(g.rows[sel.target].findIndex((x) => x.id === sel.tileId) ?? 0) + 1}번째 타일 · 틀린 숫자는 줄이 그어져 있어요
              </div>
              <div className="nv-nums">
                {Array.from({ length: c.maxNumber + 1 }, (_, n) => n)
                  .concat(c.jokers ? [-1] : [])
                  .map((n) => {
                    const missed = missesFor(sel.tileId).has(n);
                    const mineHas = myRow.some((x) => x.n === n && x.color === g.rows[sel.target].find((y) => y.id === sel.tileId)?.color);
                    return (
                      <button key={n} className={`nv-num ${missed ? 'missed' : ''} ${mineHas ? 'mine' : ''}`} onClick={() => guess(n)} title={missed ? '이미 틀린 숫자' : mineHas ? '내가 가진 같은 색 숫자' : undefined}>
                        {n === -1 ? '–' : n}
                      </button>
                    );
                  })}
                <button className="btn ghost small-btn" onClick={() => setSel(null)}>
                  취소
                </button>
              </div>
            </section>
          )}

          {me >= 0 && (
            <section className="hand-panel nv-mine" aria-label="내 금고">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 금고 · 가려진 타일 {myHidden}장
                </span>
                <span className="muted">눈 표시 = 남에게 안 보임</span>
              </div>
              <div className="nv-tiles mine">
                {g.phase === 'place' && myTurn && (
                  <button className="nv-insert" onClick={() => act('move', { move: { type: 'place', index: 0 } })} aria-label="맨 앞에 놓기" />
                )}
                {myRow.map((tile, i) => (
                  <div key={tile.id} className="nv-slot-wrap" data-flip={`t${tile.id}`}>
                    <TileView
                      t={tile}
                      mine
                      size="lg"
                      onClick={g.phase === 'reveal' && myTurn && !tile.revealed ? () => act('move', { move: { type: 'reveal', tileId: tile.id } }) : undefined}
                      className={g.phase === 'reveal' && myTurn && !tile.revealed ? 'can-reveal' : ''}
                    />
                    {g.phase === 'place' && myTurn && <button className="nv-insert" onClick={() => act('move', { move: { type: 'place', index: i + 1 } })} aria-label={`${i + 1}번째 뒤에 놓기`} />}
                  </div>
                ))}
                {g.pending && g.turn === me && (
                  <div className="nv-slot pending" data-flip={`t${g.pending.id}`}>
                    <TileView t={g.pending} mine size="lg" />
                    <span className="small muted">가져온 타일</span>
                  </div>
                )}
              </div>
              <div className="action-row">
                {myTurn && g.phase === 'draw' && (
                  <>
                    {c.chooseColor ? (
                      <>
                        <button className="btn" disabled={!g.poolCount[0]} onClick={() => act('move', { move: { type: 'draw', color: 0 } })}>
                          {iconize('⬛')} 검은 타일 ({g.poolCount[0]})
                        </button>
                        <button className="btn" disabled={!g.poolCount[1]} onClick={() => act('move', { move: { type: 'draw', color: 1 } })}>
                          {iconize('⬜')} 하얀 타일 ({g.poolCount[1]})
                        </button>
                      </>
                    ) : (
                      <button className="btn primary" onClick={() => act('move', { move: { type: 'draw' } })}>
                        타일 가져오기 ({g.poolCount[0] + g.poolCount[1]})
                      </button>
                    )}
                  </>
                )}
                {myTurn && g.phase === 'continue' && (
                  <button className="btn primary" onClick={() => act('move', { move: { type: 'stop' } })}>
                    여기서 멈추기 <Icon name="lock" />
                  </button>
                )}
              </div>
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1], names)} />
        </>
      }
      side={
        <>
          {me >= 0 && myHidden === 1 && g.status === 'playing' && <AlertBanner icon={<Icon name="lock" />} title="마지막 타일 하나" critical sub="이게 열리면 탈락이에요" />}
          <section className="panel tokens small">
            남은 타일 {iconize('⬛')} {g.poolCount[0]} · {iconize('⬜')} {g.poolCount[1]}
            {g.poolCount[0] + g.poolCount[1] === 0 && <div className="muted">더미가 비었어요 — 틀리면 내 타일을 직접 공개해요</div>}
          </section>
          {g.log.length > 0 && (
            <section className="panel log-list small" aria-label="기록">
              {[...g.log]
                .reverse()
                .slice(0, 14)
                .map((e) => (
                  <div key={e.n} className={e.type === 'guess' ? (e.ok ? 'ok' : 'no') : ''}>
                    {describe(e, names)}
                  </div>
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
            headline={`🏆 ${names[g.winners[g.winners.length - 1]]} 님의 금고가 끝까지 버텼어요!`}
            sub={g.outOrder.length ? `열린 순서: ${g.outOrder.map((s) => names[s]).join(' → ')}` : undefined}
            columns={g.winners.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: rankOf(g.totals)[seat], cells: g.winners.map((w) => (w === seat ? '🏆' : '')), total: `${total}승` }))}
          />
        ))
      }
    />
  );
}
