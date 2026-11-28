import { useEffect, useRef, useState } from 'react';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, LogEntry } from '@bg/holdem-engine';
import { CardBack, CountBadge, EmoteBubble, PlayingCard, SeatDot, seatColor, iconize } from '@bg/ui';
import { flyClone, GameScreenProps, useNarrow, ResultSheet, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, rankOf, useLogSounds, usePeek, useTable, useDealFx } from '@bg/web';
import { ChipStack } from './theme';

type View = RoomView<GameView, GameConfig>;
const STREET = { preflop: '프리플랍', flop: '플랍', turn: '턴', river: '리버' } as const;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const showdown = g.phase === 'showdown';
  const t = useTable(view, notify, { title: "Hold'em", turn: g.turn, playing: g.status === 'playing', simultaneous: showdown, quiet: showdown, stepKey: `${g.handNo}-${g.street}-${g.log.length ? g.log[g.log.length - 1].n : 0}`, mySub: g.toCall ? `${g.toCall} 콜?` : '체크 또는 베팅' });
  // 소리: 콜·레이즈는 칩, 올인은 칩 여러 개, 접기는 카드, 새 카드는 카드 깔기, 이기면 칩 쓸어 담기
  useLogSounds(g.log, (e) => (e.type === 'act' ? (e.act === 'allin' ? 'chips' : e.act === 'fold' ? 'card' : e.act === 'check' ? 'tick' : 'chip') : e.type === 'street' ? ['chipStack', ['flip', 0.35]] : e.type === 'hand' ? 'shuffle' : e.type === 'win' ? ['sweep', 'coins'] : e.type === 'end' ? 'win' : e.type === 'bust' ? 'thud' : null), { me: t.me, describe: (e) => describe(e), stamp: (e) => (e.type === 'act' && e.act === 'allin' ? { text: '올인!', tone: 'hot', shake: 1.2 } : e.type === 'bust' ? { text: '파산', tone: 'bad' } : null) });
  // 팟을 가져가면 칩이 이긴 사람 자리로 쓸려 감
  const winLog = [...g.log].reverse().find((e) => e.type === 'win');
  const winN = winLog?.n ?? 0;
  useEffect(() => {
    if (!winLog || winLog.type !== 'win') return;
    const pot = document.querySelector('.hd-pot');
    winLog.pots.forEach((p, k) =>
      p.winners.forEach((w) => flyClone(pot, document.querySelector(`[data-hd-seat="${w}"] .hd-chips`), { count: Math.min(5, 2 + Math.floor(p.amount / 200)), delay: 250 + k * 200, duration: 700, like: pot?.querySelector('.hd-stack') ?? null })),
    );
  }, [winN]); // eslint-disable-line react-hooks/exhaustive-deps
  // 칩이 실제로 오간다: 베팅하면 자리 칩 → 베팅 자리, 한 바퀴가 끝나면 베팅 칩이 모두 팟으로 쓸려 감
  const lastN = g.log.length ? g.log[g.log.length - 1].n : 0;
  const seenN = useRef<number | null>(null);
  const betsRef = useRef<number[]>(g.bets);
  useEffect(() => {
    const prev = seenN.current;
    const prevBets = betsRef.current;
    seenN.current = lastN;
    betsRef.current = g.bets;
    if (prev === null || lastN <= prev) return;
    const seatQ = (s: number) => document.querySelector(`[data-hd-seat="${s}"]`);
    const chipLook = (el: Element | null | undefined) => el?.querySelector('.hd-stack') ?? document.querySelector('.hd-pot .hd-stack');
    g.log
      .filter((e) => e.n > prev)
      .forEach((e, i) => {
        if (e.type === 'act' && e.amount > 0) {
          const bet = seatQ(e.seat)?.querySelector('.hd-bet');
          flyClone(seatQ(e.seat)?.querySelector('.hd-chips'), bet, { count: e.act === 'allin' ? 4 : e.amount >= 100 ? 3 : 2, duration: 460, delay: i * 140, like: chipLook(bet) });
        }
        if (e.type === 'street' || e.type === 'win') {
          const pot = document.querySelector('.hd-pot');
          prevBets.forEach((b, s) => {
            if (b > 0) flyClone(seatQ(s), pot?.querySelector('.hd-stack') ?? pot, { count: 2, duration: 520, delay: i * 140 + s * 50, like: chipLook(pot) });
          });
        }
      });
  }, [lastN]); // eslint-disable-line react-hooks/exhaustive-deps
  // 새 판마다 카드를 섞고 나눠 주는 연출 (@bg/web deal-fx)
  useDealFx(`${g.round}-${g.handNo}`, { per: 2, seats: '.hd-seat:not(.busted)', hand: null, cards: '.hd-seat.me .hd-cards .pc', origin: '.hd-center', initial: g.log.length <= 4 });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn && !showdown;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}`);
  const [raiseTo, setRaiseTo] = useState(0);
  useEffect(() => setRaiseTo(g.raise?.min ?? 0), [g.raise?.min, g.handNo, g.street]);
  const r = g.raise;
  const narrow = useNarrow();
  const clampRaise = (x: number) => (r ? Math.max(r.min, Math.min(r.max, Math.round(x))) : 0);

  const lastWin = [...g.log].reverse().find((e) => e.type === 'win') as Extract<LogEntry, { type: 'win' }> | undefined;
  const describe = (e: LogEntry | undefined) => {
    if (!e) return '좋은 패로 칩을 모으거나, 블러핑으로 상대를 접게 하세요';
    switch (e.type) {
      case 'hand':
        return `${e.no}번째 핸드 · 딜러 ${names[e.dealer]}`;
      case 'act':
        return `${names[e.seat]} 님 ${{ fold: '접기', check: '체크', call: `콜 ${e.amount}`, raise: `${e.to}로 레이즈`, allin: `올인 (${e.to})`, blind: `블라인드 ${e.amount}` }[e.act]}`;
      case 'street':
        return `${STREET[e.street]} 공개`;
      case 'win':
        return e.pots.map((p) => `${p.winners.map((w) => names[w]).join(', ')} 님 ${p.amount}칩${p.hand ? ` (${p.hand})` : ''}`).join(' · ');
      case 'bust':
        return `${names[e.seat]} 님 탈락 (${e.place}등)`;
      case 'end':
        return `${names[e.winner]} 님 우승!`;
    }
  };
  const title = showdown ? (lastWin ? describe(lastWin) : '핸드 끝') : myTurn ? (g.toCall ? `${g.toCall} 콜하거나 접거나 올려요` : '체크하거나 베팅해요') : `${names[g.turn]} 님 생각 중`;
  const hint = showdown ? '「다음 핸드」를 누르거나 잠시 기다리면 이어져요' : `${STREET[g.street]} · 팟 ${g.pot} · 블라인드 ${g.blinds.sb}/${g.blinds.bb}${g.myHand ? ` · 내 패: ${g.myHand}` : ''}`;
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  const winners = new Set(showdown ? g.results.flatMap((p) => p.winners) : []);

  const seatEl = (s: number) => {
          const k = me >= 0 ? (s - me + g.players) % g.players : s;
          const a = Math.PI / 2 + (k / g.players) * Math.PI * 2;
          const pos = narrow ? undefined : { left: `${50 + Math.cos(a) * 43}%`, top: `${50 + Math.sin(a) * 39}%` };
          const hole = g.hole[s];
          const m = view.members.find((x) => x.seat === s);
          return (
            <div key={s} data-hd-seat={s} data-seat={s} className={`hd-seat ${g.turn === s && !showdown ? 'acting' : ''} ${g.folded[s] ? 'folded' : ''} ${g.busted[s] ? 'busted' : ''} ${winners.has(s) ? 'winner' : ''} ${s === me ? 'me' : ''}`} style={{ ...pos, ['--seat' as string]: seatColor(s) }}>
              <EmoteBubble e={bySeat.get(s)} />
              <div className="hd-cards">
                {hole === null ? (
                  <>
                    <CardBack size="sm" />
                    <CardBack size="sm" />
                  </>
                ) : (
                  hole.map((cd) => <PlayingCard key={cd.id} card={cd} size={s === me ? 'md' : 'sm'} className={s === me ? '' : 'flip-reveal'} />)
                )}
              </div>
              <div className="hd-name">
                {g.dealer === s && <span className="hd-btn d">D</span>}
                {g.sb === s && <span className="hd-btn">SB</span>}
                {g.bb === s && <span className="hd-btn">BB</span>}
                <b>{s === me ? '나' : names[s]}</b>
                {m?.bot && iconize(' 🤖')}
              </div>
              <div className="hd-chips">
                {g.busted[s] ? <span className="tag">탈락</span> : <span className="hd-chipcount">{g.chips[s]}</span>}
                {g.chips[s] === 0 && !g.busted[s] && !g.folded[s] && <span className="tag results">올인</span>}
                {g.folded[s] && !g.busted[s] && <span className="tag">접음</span>}
              </div>
              {g.bets[s] > 0 && (
                <span className="hd-bet">
                  <ChipStack amount={g.bets[s]} size={18} max={4} />
                  <CountBadge n={g.bets[s]} className="inline" />
                </span>
              )}
            </div>
          );
  };
  const order = me >= 0 ? Array.from({ length: g.players }, (_, k) => (me + 1 + k) % g.players) : Array.from({ length: g.players }, (_, k) => k);

  return (
    <TableLayout
      layout="focus"
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.turn} size={16} />} steps={<span className="small muted nowrap">{g.handNo}핸드 · 레벨 {g.blinds.level + 1}</span>} />}
        </>
      }
      main={
        <>
          <section className={`hd-table ${narrow ? 'narrow' : ''}`} aria-label="테이블">
            {narrow ? (
              <>
                <div className="hd-others">{order.filter((s) => s !== me).map(seatEl)}</div>
                <div className="hd-center">
                  <div className="hd-board">
                    {Array.from({ length: 5 }, (_, i) => (g.board[i] ? <PlayingCard key={g.board[i].id} card={g.board[i]} size="md" flip={`b${g.board[i].id}`} className="flip-reveal" /> : <span key={i} className="hd-slot" />))}
                  </div>
                  <div className="hd-pot">
                    <ChipStack amount={g.pot} size={24} />
                    <b>팟 {g.pot}</b>
                  </div>
                </div>
                {me >= 0 && seatEl(me)}
              </>
            ) : (
              <>
                <div className="hd-center">
                  <div className="hd-board">
                    {Array.from({ length: 5 }, (_, i) => (g.board[i] ? <PlayingCard key={g.board[i].id} card={g.board[i]} size="md" flip={`b${g.board[i].id}`} className="flip-reveal" /> : <span key={i} className="hd-slot" />))}
                  </div>
                  <div className="hd-pot">
                    <ChipStack amount={g.pot} size={24} />
                    <b>팟 {g.pot}</b>
                  </div>
                </div>
                {order.map(seatEl)}
              </>
            )}
          </section>

          {me >= 0 && g.status === 'playing' && !g.busted[me] && (
            <section className="hand-panel hd-actions" aria-label="내 행동">
              {showdown ? (
                <div className="action-row">
                  <button className="btn primary" disabled={g.ready[me]} onClick={() => act('move', { move: { type: 'next' } })}>
                    {g.ready[me] ? '다른 사람을 기다려요…' : iconize('다음 핸드 ▶')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="action-row">
                    <button className="btn" disabled={!myTurn} onClick={() => act('move', { move: { type: 'fold' } })}>
                      접기
                    </button>
                    {g.toCall === 0 ? (
                      <button className="btn" disabled={!myTurn} onClick={() => act('move', { move: { type: 'check' } })}>
                        체크
                      </button>
                    ) : (
                      <button className="btn primary" disabled={!myTurn} onClick={() => act('move', { move: { type: 'call' } })}>
                        콜 {Math.min(g.toCall, g.chips[me])}
                        {g.chips[me] <= g.toCall ? ' (올인)' : ''}
                      </button>
                    )}
                    {r && (
                      <button className="btn danger-btn" disabled={!myTurn} onClick={() => act('move', { move: raiseTo >= r.max ? { type: 'allin' } : { type: 'raise', to: raiseTo } })}>
                        {raiseTo >= r.max ? `올인 ${r.max}` : `${g.currentBet ? '레이즈' : '베팅'} ${raiseTo}`}
                      </button>
                    )}
                  </div>
                  {r && myTurn && (
                    <div className="hd-raise">
                      <input type="range" min={r.min} max={r.max} step={g.blinds.sb} value={raiseTo} onChange={(e) => setRaiseTo(clampRaise(Number(e.target.value)))} aria-label="베팅 금액" />
                      <span className="row tight">
                        <button className="btn tiny" onClick={() => setRaiseTo(clampRaise(g.currentBet + g.pot / 2))}>
                          ½팟
                        </button>
                        <button className="btn tiny" onClick={() => setRaiseTo(clampRaise(g.currentBet + g.pot))}>
                          팟
                        </button>
                        <button className="btn tiny" onClick={() => setRaiseTo(r.max)}>
                          최대
                        </button>
                      </span>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
        </>
      }
      side={
        <>
          <section className="panel small hd-info">
            <div>
              블라인드 <b>{g.blinds.sb}/{g.blinds.bb}</b> {c.blindUp ? `· ${c.blindUp}핸드마다 ×2` : ''}
            </div>
            <div>{c.maxHands ? `${g.handNo}/${c.maxHands}핸드 — 끝나면 칩이 많은 순` : '한 명이 남을 때까지'}</div>
            <div className="muted">돈이 오가지 않는 칩 게임이에요</div>
          </section>
          <SideNote title="족보 (강한 순)" className="hd-ref">
            <div>스트레이트 플러시 · 포카드 · 풀 하우스 · 플러시 · 스트레이트</div>
            <div>트리플 · 투 페어 · 원 페어 · 하이 카드</div>
            <div className="muted">손패 2장 + 바닥 5장 중 가장 좋은 5장</div>
          </SideNote>
        </>
      }
      overlay={
        matchOver &&
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
            matchOver
            round={g.handNo}
            status={g.status}
            headline={`🏆 ${names[ranks.indexOf(1)]} 님 우승!`}
            sub="남은 칩이 많은 순 (탈락한 사람은 늦게 탈락할수록 위)"
            columns={['칩']}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: [g.busted[seat] ? '탈락' : g.chips[seat]], total }))}
          />
        ))
      }
    />
  );
}
