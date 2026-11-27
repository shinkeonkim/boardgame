import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { FORMATIONS, GameConfig, GameView, LogEntry, Side, formationRank } from '@bg/flag-line-engine';
import { EmoteBubble, SeatDot, Icon } from '@bg/ui';
import { GameScreenProps, ResultSheet, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, usePeek, useTable, SideNote, useLogSounds } from '@bg/web';
import { FlagIcon, TROOP_NAMES, Troop } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, { title: 'Flag Line', turn: g.turn, playing: g.status === 'playing', mySub: '카드를 깃발에 놓아요' });
  // 소리: 카드를 깃발 앞에 탁, 깃발을 차지하면 축하
  useLogSounds(g.log, (e) => (e.type === 'play' ? 'cardSnap' : e.type === 'claim' ? ['drum', 'success'] : e.type === 'win' ? 'win' : null), { me: t.me, describe: (e) => describe(e), stamp: (e) => (e.type === 'claim' ? { text: `${e.flag + 1}번 깃발 점령!`, tone: e.seat === t.me ? 'good' : 'hot', shake: 0.6 } : null) });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => setSel(null), [g.turn]);
  const mySide: Side = g.mySide ?? 0;
  const opp = (1 - mySide) as Side;
  const teamName = (s: Side) => (g.players === 4 ? `${names[s]}·${names[s + 2]} 편` : names[s]);
  const sideLabel = (s: Side) => (s === mySide && me >= 0 ? '우리 편' : teamName(s));
  /** 「~이/님이」 주어 */
  const who = (s: Side) => (s === mySide && me >= 0 ? '우리 편이' : g.players === 4 ? `${teamName(s)}이` : `${names[s]} 님이`);

  const describe = (e: LogEntry | undefined): string => {
    if (!e) return '카드 한 장을 깃발 한쪽에 놓고, 한 장을 뽑아요';
    switch (e.type) {
      case 'play':
        return `${names[e.seat]}: ${TROOP_NAMES[e.card.color]} ${e.card.value} → ${e.flag + 1}번 깃발`;
      case 'claim':
        return `🚩 ${who(e.side)} ${e.flag + 1}번 깃발을 차지했어요${e.auto ? '' : ' (주장)'}`;
      case 'pass':
        return `${names[e.seat]} 님은 놓을 곳이 없어 넘겼어요`;
      case 'win':
        return `🏆 ${sideLabel(e.side)} 승리!`;
    }
  };

  const playable = (f: number) => {
    const flag = g.flags[f];
    return flag.owner === null && flag.cards[mySide].length < c.size;
  };
  const onFlag = (f: number) => {
    if (!myTurn) return t.warn(t.waitingMsg);
    if (!sel) return t.warn('먼저 손에서 카드를 골라 주세요');
    if (!playable(f)) return t.warn(g.flags[f].owner !== null ? '이미 주인이 정해진 깃발이에요' : `이쪽에는 ${c.size}장까지예요`);
    act('move', { move: { type: 'play', cardId: sel, flag: f } });
  };

  const counts = [0, 1].map((s) => g.flags.filter((f) => f.owner === s).length);
  const matchOver = g.status === 'match-over';
  const title = myTurn ? (sel ? '놓을 깃발을 고르세요' : '카드를 고르세요') : `${names[g.turn]} 님의 차례`;
  const hint = myTurn ? `깃발 ${g.goal}개${c.adjacentToWin ? ` 또는 연속 ${c.adjacentToWin}개` : ''}를 먼저 차지하면 승리 · 대형: 쐐기 > 방진 > 대대 > 산개 > 무리` : '어느 깃발을 노릴까요?';

  const Stack = ({ f, side }: { f: number; side: Side }) => {
    const cards = g.flags[f].cards[side];
    const full = cards.length === c.size;
    return (
      <div className={`fl-stack ${side === mySide ? 'mine' : 'theirs'}`}>
        {cards.map((x) => (
          <Troop key={x.id} flip={`t${x.id}`} color={x.color} value={x.value} size="sm" />
        ))}
        {Array.from({ length: c.size - cards.length }, (_, i) => (
          <span key={i} className="fl-empty" />
        ))}
        {full && <span className="fl-form">{FORMATIONS[formationRank(cards)]}</span>}
      </div>
    );
  };

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
          <div className="fl-score small">
            <span className="fl-side theirs">
              <FlagIcon owner={opp} size={16} /> {sideLabel(opp)} <b>{counts[opp]}</b>
            </span>
            <span className="muted">더미 {g.deckCount}장</span>
            <span className="fl-side mine">
              <b>{counts[mySide]}</b> {sideLabel(mySide)} <FlagIcon owner={mySide} size={16} />
            </span>
          </div>
          <section className="fl-board" style={{ ['--flags' as string]: c.flags }} aria-label="전선">
            {g.flags.map((f, i) => (
              <div key={i} className={`fl-col ${f.owner === mySide ? 'won' : f.owner === opp ? 'lost' : ''} ${sel && myTurn && playable(i) ? 'target' : ''}`} onClick={() => onFlag(i)}>
                <Stack f={i} side={opp} />
                <div className="fl-flag">
                  {/* 깃발 주인이 정해지면 깃발이 휙 넘어가며 그쪽 색으로 */}
                  <span key={f.owner ?? 'none'} className={f.owner !== null ? 'flip-reveal fl-flag-icon' : 'fl-flag-icon'}>
                    <FlagIcon owner={f.owner} />
                  </span>
                  <span className="small">{i + 1}</span>
                  {g.claimable.includes(i) && (
                    <button
                      className="btn tiny primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        act('move', { move: { type: 'claim', flag: i } });
                      }}
                    >
                      차지
                    </button>
                  )}
                </div>
                <Stack f={i} side={mySide} />
              </div>
            ))}
          </section>
          {me >= 0 && g.status === 'playing' && (
            <section className="hand-panel" aria-label="내 손패">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 카드 {g.hand.length}장{g.players === 4 ? ` · 같은 편: ${names[(me + 2) % 4]}` : ''}
                </span>
              </div>
              <div className="hand-row">
                {[...g.hand]
                  .sort((a, b) => a.color - b.color || a.value - b.value)
                  .map((x) => (
                    <Troop key={x.id} flip={`t${x.id}`} color={x.color} value={x.value} size="md" selected={sel === x.id} onClick={() => (myTurn ? setSel((s) => (s === x.id ? null : x.id)) : t.warn(t.waitingMsg))} />
                  ))}
              </div>
              {myTurn && g.hand.length > 0 && !g.flags.some((_, i) => playable(i)) && (
                <div className="action-row">
                  <button className="btn" onClick={() => act('move', { move: { type: 'pass' } })}>
                    놓을 곳이 없어요 — 넘기기
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
          <section className="panel small fl-players">
            {Array.from({ length: g.players }, (_, s) => {
              const m = view.members.find((x) => x.seat === s);
              return (
                <div key={s} data-seat={s} className={`fl-player ${g.turn === s ? 'acting' : ''}`}>
                  <EmoteBubble e={bySeat.get(s)} />
                  <span className={`fl-dot side${s % 2 === mySide ? 'm' : 't'}`} />
                  <b>{names[s]}</b>
                  {m?.bot && <span className={`tag bot ${m.bot}`}><Icon name="bot" /></span>}
                  {s === me && <span className="tag mine">나</span>}
                  <span className="muted">카드 {g.handCounts[s]}</span>
                </div>
              );
            })}
          </section>
          <SideNote title="대형 (강한 순)" className="fl-ref">
            <div>쐐기: 같은 색 연속 (예: 파랑 4·5·6)</div>
            <div>방진: 같은 숫자 (예: 7·7·7)</div>
            <div>대대: 같은 색</div>
            <div>산개: 연속 숫자 (색 상관없음)</div>
            <div>무리: 아무거나 — 같은 대형이면 합이 큰 쪽, 그래도 같으면 먼저 완성한 쪽</div>
            <div className="muted">상대가 남은 카드로 절대 못 이기면 깃발을 차지해요{c.autoClaim ? ' (자동)' : ' (「차지」 버튼)'}</div>
          </SideNote>
          {g.log.length > 0 && (
            <section className="panel log-list small" aria-label="기록">
              {[...g.log]
                .reverse()
                .slice(0, 12)
                .map((e) => (
                  <div key={e.n}>{describe(e)}</div>
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
            headline={`🏆 ${sideLabel(g.winners[g.winners.length - 1])} 승리!`}
            sub={g.winWhy === 'adjacent' ? `연속한 깃발 ${c.adjacentToWin}개를 차지했어요` : g.winWhy === 'majority' ? `깃발 ${g.goal}개를 차지했어요` : '모든 깃발을 비교했어요'}
            columns={g.winners.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: total === Math.max(...g.totals) ? 1 : 2, cells: g.winners.map((w) => (w === seat % 2 ? '🏆' : '')), total: `${total}승` }))}
          />
        ))
      }
    />
  );
}
