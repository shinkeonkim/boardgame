import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { Cat, GameConfig, GameView, LogEntry, UPPER } from '@bg/yacht-engine';
import { SeatDot, seatColor, Icon, iconize } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, useLogSounds, usePeek, useTable } from '@bg/web';
import { CAT_INFO, Die } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const together = c.mode === 'together';
  const t = useTable(view, notify, {
    title: 'Yacht Dice',
    turn: g.turn,
    playing: g.status === 'playing',
    simultaneous: together,
    stepKey: together ? g.step : `${g.turn}-${g.log.filter((e) => e.type === 'score').length}`,
    mySub: '주사위를 굴려요',
  });
  // 소리: 굴리면 주사위 구르는 소리, 적으면 칩 딸깍(0점은 똑), 요트는 축하
  useLogSounds(g.log, (e) => (e.type === 'roll' ? 'dice' : e.type === 'score' ? (e.yacht && e.points >= 50 ? 'win' : e.points === 0 ? 'tick' : 'chip') : e.type === 'end' ? 'win' : null));
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);

  // 화면 가운데 주사위: 동시에면 내 것, 한 명씩이면 지금 차례인 사람 것
  const focus = together ? (me >= 0 ? me : g.turn) : g.turn;
  const fs = g.seats[focus];
  const mine = me >= 0 ? g.seats[me] : null;
  const left = mine ? c.rolls - mine.rolled : 0;
  const [hold, setHold] = useState<boolean[]>([false, false, false, false, false]);
  // 새 차례가 되면 남기기 초기화
  useEffect(() => {
    if (!mine || mine.rolled === 0) setHold([false, false, false, false, false]);
  }, [mine?.rolled]); // eslint-disable-line react-hooks/exhaustive-deps
  const canHold = myTurn && !!mine && mine.rolled > 0 && left > 0 && focus === me;
  const roll = () => {
    if (!myTurn) return t.warn(t.waitingMsg);
    if (left <= 0) return t.warn('더 굴릴 수 없어요. 칸을 골라 적어요');
    if (mine!.rolled > 0 && hold.every(Boolean)) return t.warn('굴릴 주사위를 하나 이상 남겨 주세요');
    act('move', { move: { type: 'roll', hold } });
  };
  const score = (cat: Cat) => {
    if (!myTurn) return t.warn(t.waitingMsg);
    if (!mine || mine.rolled === 0) return t.warn('먼저 주사위를 굴려 주세요');
    act('move', { move: { type: 'score', cat } });
  };
  const bestPreview = Object.entries(g.preview).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as Cat | undefined;

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '주사위 5개를 최대 ' + c.rolls + '번 굴려 족보 칸을 하나씩 채워요';
    if (e.type === 'roll') return `${names[e.seat]} 님이 굴렸어요 · ${e.dice.join(' ')}${e.left ? ` · ${e.left}번 남음` : ''}`;
    if (e.type === 'score') return `${names[e.seat]} 님: ${CAT_INFO[e.cat].name}에 ${e.points}점${e.yacht && e.points >= 50 ? ' — 요트!' : ''}`;
    return `${e.winners.map((w) => names[w]).join(', ')} 님 승리!`;
  };
  const title = myTurn ? (mine!.rolled === 0 ? '주사위를 굴리세요' : left > 0 ? '남길 주사위를 누르고 다시 굴리거나, 칸에 적어요' : '적을 칸을 골라요') : together ? '다른 사람이 적기를 기다려요' : `${names[g.turn]} 님 차례`;
  const hint = myTurn ? (mine!.rolled === 0 ? `이번 차례 ${c.rolls}번까지 굴릴 수 있어요` : left > 0 ? `${left}번 더 굴릴 수 있어요 · 남긴 주사위는 그대로` : '점수표에서 빈 칸을 눌러 적어요 (0점이어도 칸 하나를 채워야 해요)') : '어떤 족보를 노릴까요?';
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  // 점수표 열: 나부터
  const order = me >= 0 ? Array.from({ length: g.players }, (_, k) => (me + k) % g.players) : Array.from({ length: g.players }, (_, k) => k);
  const rollKey = g.log.filter((e) => e.type === 'roll' && e.seat === focus).length;

  const row = (cat: Cat) => (
    <tr key={cat} className={UPPER.includes(cat) ? 'upper' : ''}>
      <th scope="row" title={CAT_INFO[cat].hint}>
        <span className="ya-cat">{CAT_INFO[cat].name}</span>
        <small>{CAT_INFO[cat].hint}</small>
      </th>
      {order.map((s) => {
        const val = g.seats[s].card[cat];
        if (val !== undefined) return <td key={s} className={`done ${val === 0 ? 'zero' : ''}`}>{val}</td>;
        if (s === me && g.preview[cat] !== undefined && myTurn)
          return (
            <td key={s} className="pick">
              <button className={`ya-pick ${cat === bestPreview ? 'best' : ''} ${g.preview[cat] === 0 ? 'zero' : ''}`} onClick={() => score(cat)} aria-label={`${CAT_INFO[cat].name}에 ${g.preview[cat]}점 적기`}>
                {g.preview[cat]}
              </button>
            </td>
          );
        return <td key={s} className="empty" />;
      })}
    </tr>
  );

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={focus} size={16} />} steps={mine && mine.rolled > 0 ? <span className="small muted nowrap">굴림 {mine.rolled}/{c.rolls}</span> : null} />}
        </>
      }
      main={
        <>
          <section className="ya-tray" aria-label="주사위">
            <div className="ya-tray-who small">
              <SeatDot seat={focus} size={12} /> {focus === me ? '내 주사위' : `${names[focus]} 님의 주사위`}
              {fs.rolled > 0 && <span className="muted"> · {fs.rolled}/{c.rolls}번 굴림</span>}
            </div>
            <div className="ya-dice">
              {fs.dice.map((d, i) => {
                const held = focus === me ? hold[i] : fs.held[i];
                return (
                  <Die
                    key={`${rollKey}-${i}-${held ? 'h' : ''}`}
                    face={d}
                    size={64}
                    held={held && fs.rolled > 0}
                    className={fs.rolled === 0 ? 'blank' : held ? '' : 'rolled'}
                    style={{ animationDelay: `${i * 55}ms` }}
                    onClick={canHold ? () => setHold((h) => h.map((x, k) => (k === i ? !x : x))) : undefined}
                  />
                );
              })}
            </div>
            {me >= 0 && g.status === 'playing' && (focus === me || !together) && (
              <div className="action-row">
                <button className="btn primary ya-roll" disabled={!myTurn || left <= 0} onClick={roll}>
                  <Icon name="dice" /> {mine!.rolled === 0 ? '주사위 굴리기' : `다시 굴리기 (${left}번 남음)`}
                </button>
                {canHold && <span className="small muted">주사위를 누르면 남겨 둬요</span>}
              </div>
            )}
          </section>

          <section className="ya-card-wrap" aria-label="점수표">
            <table className="ya-card">
              <thead>
                <tr>
                  <th />
                  {order.map((s) => (
                    <th key={s} className={`${g.actors.includes(s) ? 'active' : ''}`} style={{ ['--seat' as string]: seatColor(s) }}>
                      <SeatDot seat={s} size={10} /> {s === me ? '나' : names[s]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.cats.filter((x) => UPPER.includes(x)).map(row)}
                <tr className="subtotal">
                  <th scope="row">
                    <span className="ya-cat">보너스</span>
                    <small>
                      위쪽 합 {c.bonusAt}점 이상이면 +{c.bonus}
                    </small>
                  </th>
                  {order.map((s) => {
                    const u = g.seats[s].upper;
                    const got = u >= c.bonusAt;
                    return (
                      <td key={s} className={got ? 'done' : ''}>
                        <span className="ya-bonus" style={{ ['--p' as string]: Math.min(1, u / Math.max(1, c.bonusAt)) }}>
                          {got ? `+${c.bonus}` : `${u}/${c.bonusAt}`}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {g.cats.filter((x) => !UPPER.includes(x)).map(row)}
                <tr className="total">
                  <th scope="row">합계</th>
                  {order.map((s) => (
                    <td key={s}>
                      <b>{g.seats[s].total}</b>
                      {g.seats[s].yachtBonus > 0 && <small> (요트 +{g.seats[s].yachtBonus * 100})</small>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>
          <Ticker text={describe(g.log[g.log.length - 1])} />
        </>
      }
      side={
        <>
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.seats.map((s, seat) => ({
              seat,
              accent: seatColor(seat),
              score: `${g.totals[seat]}점`,
              scoreLabel: '지금까지 점수 (지난 게임 포함)',
              badge: together && g.status === 'playing' ? <span className={`tag ${g.actors.includes(seat) ? '' : 'ready'}`}>{g.actors.includes(seat) ? '굴리는 중…' : iconize('적었어요 ✓')}</span> : null,
              children: (
                <span className="ya-mini">
                  {s.dice.map((d, i) => (
                    <Die key={i} face={d} size={18} />
                  ))}
                  <span className="muted small">
                    {Object.keys(s.card).length}/{g.cats.length}칸
                  </span>
                </span>
              ),
            }))}
          />
          <SideNote title="족보" className="ya-ref">
            {g.cats.map((cat) => (
              <div key={cat}>
                <b>{CAT_INFO[cat].name}</b> · {CAT_INFO[cat].hint}
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
            headline={`⛵ ${names[g.winners[g.winners.length - 1]]} 님 승리!`}
            sub={`위쪽 보너스 ${c.bonusAt}점 이상 +${c.bonus}${c.scoring === 'extended' ? ' · 요트를 또 내면 +100' : ''}`}
            columns={g.roundScores.map((_, i) => `${i + 1}게임`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.roundScores.map((r) => r[seat]), total }))}
          />
        ))
      }
    />
  );
}
