import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { CARD_DEFS, GameConfig, GameView, Kind, LogEntry, deckSpec } from '@bg/sealed-letter-engine';
import { AlertBanner, SeatDot, seatColor, Icon, iconize } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, usePeek, useTable, useLogSounds, useDealFx } from '@bg/web';
import { CardBackMini, LetterCard, Seal } from './theme';

type View = RoomView<GameView, GameConfig>;
const nm = (k: Kind) => CARD_DEFS[k].name;

function describe(e: LogEntry | undefined, names: string[]): string {
  if (!e) return '카드를 1장 뽑았어요. 2장 중 1장을 내요';
  switch (e.type) {
    case 'play': {
      const base = `${names[e.seat]}: ${e.card.value} ${nm(e.card.kind)}`;
      const to = e.target !== undefined && e.target !== e.seat ? ` → ${names[e.target]}` : e.target === e.seat ? ' → 자기 자신' : '';
      const g = e.guess ? ` 「${nm(e.guess)}?」` : '';
      return `${base}${to}${g}${e.result ? ` · ${e.result}` : ''}`;
    }
    case 'out':
      return `💔 ${names[e.seat]} 탈락 — ${e.why}${e.card ? ` (${e.card.value} ${nm(e.card.kind)})` : ''}`;
    case 'round':
      return `✉️ ${e.winners.map((w) => names[w]).join(', ')} 님이 편지를 전했어요!${e.spy !== null ? ` 첩자 보너스: ${names[e.spy]}` : ''}`;
  }
}

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, { title: 'Sealed Letter', turn: g.turn, playing: g.status === 'playing', stepKey: `${g.round}-${g.turn}-${g.log.length ? g.log[g.log.length - 1].n : 0}`, mySub: '2장 중 1장을 내요' });
  // 이번 판에서 가장 최근에 낸 카드 (가운데에 크게)
  const lastEvent = [...g.log].reverse().find((e) => e.type === 'play' || e.type === 'round');
  const lastPlay = lastEvent?.type === 'play' ? lastEvent : null;
  // 가운데 버린 카드 더미: 이번 판에 낸 카드 중 방금 것 아래로 최근 4장을 비뚤게 겹쳐 쌓음
  const discardIds = new Set(g.discards.flat().map((d) => d.id));
  const pile = g.log.flatMap((e) => (e.type === 'play' && e !== lastPlay && discardIds.has(e.card.id) ? [e] : [])).slice(-4);
  // 소리: 편지(카드)를 내면 종이, 탈락은 쿵, 판이 끝나면 축하
  useLogSounds(g.log, (e) => (e.type === 'play' ? ['paper', 'stamp'] : e.type === 'out' ? ['tear', 'thud'] : e.type === 'round' ? 'success' : null), { me: t.me, describe: (e) => describe(e, t.names), stamp: (e) => (e.type === 'out' ? { text: '탈락!', tone: 'hot', shake: 1.2 } : e.type === 'round' ? { text: '편지 전달!', tone: 'good' } : null) });
  // 새 판마다 카드를 섞고 나눠 주는 연출 (@bg/web deal-fx)
  useDealFx(`${g.round}`, { per: 1, initial: g.log.length <= 2 });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [sel, setSel] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [guess, setGuess] = useState<Kind | null>(null);
  useEffect(() => {
    setSel(null);
    setTarget(null);
    setGuess(null);
  }, [g.turn, g.phase, g.round]);

  const card = g.hand.find((x) => x.id === sel) ?? null;
  const def = card ? CARD_DEFS[card.kind] : null;
  const options = card ? g.targets[card.id] ?? [] : [];
  const noTarget = !!def?.needsTarget && options.filter((s) => s !== me || def.self).length === 0;
  const ready = !!card && (!def!.needsTarget || noTarget || (target !== null && (card.kind !== 'watch' || !!guess)));
  const spec = deckSpec(c.edition);

  const pickCard = (id: string) => {
    if (!myTurn) return t.warn(t.waitingMsg);
    const k = g.hand.find((x) => x.id === id)!;
    if (g.mustAgent && k.kind !== 'agent') return t.warn('재상이나 사절과 함께 들고 있으면 밀정을 내야 해요');
    if (k.kind === 'queen') t.warn('여왕을 내면 탈락해요!');
    setSel(id);
    setTarget(null);
    setGuess(null);
  };
  const play = async () => {
    if (!card) return;
    if (await act('move', { move: { type: 'play', cardId: card.id, target: noTarget ? undefined : target ?? undefined, guess: guess ?? undefined } })) setSel(null);
  };

  // 배너
  let title: string;
  let hint: string;
  if (g.phase === 'scribe' && myTurn) {
    title = '남길 카드 1장을 고르세요';
    hint = '나머지 2장은 더미 밑으로 들어가요';
  } else if (myTurn) {
    title = card ? `${card.value} ${def!.name}` : '2장 중 1장을 내요';
    hint = card ? def!.text : g.mustAgent ? '밀정을 반드시 내야 해요' : '카드를 눌러 효과를 확인해요';
  } else {
    title = `${names[g.turn]} 님의 차례예요`;
    hint = '누가 편지를 끝까지 지킬까요?';
  }

  const matchOver = g.status === 'match-over';
  const lr = g.lastRound;

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={undefined} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.turn} size={16} />} />}
        </>
      }
      main={
        <>
          <section className="sl-center" aria-label="더미">
            <div className="sl-deck">
              <span className="sl-deck-stack" aria-hidden>
                <CardBackMini />
              </span>
              <span className="small">
                더미 <b>{g.deckCount}</b>장
              </span>
            </div>
            {g.burnedOpen.length > 0 && (
              <div className="sl-burned small">
                <span className="muted">빼 둔 카드</span>
                {g.burnedOpen.map((b) => (
                  <LetterCard key={b.id} kind={b.kind} value={b.value} size="xs" />
                ))}
              </div>
            )}
            {lastPlay && (
              <div className="sl-last" key={lastPlay.n} style={{ ['--seat' as string]: seatColor(lastPlay.seat) }}>
                <span className="sl-pile" aria-label={`버린 카드 ${pile.length + 1}장`}>
                  {pile.map((e) => (
                    <span key={e.card.id} className="sl-pile-under" style={{ transform: `translate(${((e.n * 7) % 9) - 4}px, ${((e.n * 5) % 7) - 3}px) rotate(${((e.n * 37) % 15) - 7}deg)` }} aria-hidden>
                      <LetterCard kind={e.card.kind} value={e.card.value} size="md" />
                    </span>
                  ))}
                  <span className="sl-pile-top">
                    <LetterCard kind={lastPlay.card.kind} value={lastPlay.card.value} size="md" />
                  </span>
                </span>
                <div className="sl-last-text">
                  <span className="small muted">방금 낸 카드</span>
                  <b>
                    <SeatDot seat={lastPlay.seat} size={12} /> {names[lastPlay.seat]}
                    {lastPlay.target !== undefined && lastPlay.target !== lastPlay.seat ? ` → ${names[lastPlay.target]}` : ''}
                  </b>
                  <span className="small">{describe(lastPlay, names)}</span>
                </div>
              </div>
            )}
            <details className="sl-ref small">
              <summary>카드 목록 ({spec.reduce((a, s) => a + s.copies, 0)}장)</summary>
              <ul>
                {spec.map((s) => (
                  <li key={s.kind}>
                    <b>
                      {s.value} {nm(s.kind)}
                    </b>{' '}
                    ×{s.copies} — {CARD_DEFS[s.kind].text}
                  </li>
                ))}
              </ul>
            </details>
          </section>

          {me >= 0 && g.alive[me] && g.status === 'playing' && (
            <section className="hand-panel" aria-label="내 카드">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 카드{g.protectedSeats[me] ? iconize(' · 🛡️ 보호 중') : ''}
                </span>
              </div>
              <div className="hand-row">
                {g.hand.map((h) => (
                  <LetterCard key={h.id} flip={`l${h.id}`} kind={h.kind} value={h.value} size="lg" selected={sel === h.id} onClick={g.phase === 'scribe' ? () => myTurn && act('move', { move: { type: 'keep', cardId: h.id } }) : () => pickCard(h.id)} />
                ))}
              </div>
              {card && myTurn && g.phase === 'play' && (
                <div className="sl-steps">
                  {def!.needsTarget && !noTarget && (
                    <div className="sl-step">
                      <span className="small">누구에게?</span>
                      {options.map((s) => (
                        <button key={s} className={`chip ${target === s ? 'on' : ''}`} onClick={() => setTarget(s)} style={{ borderColor: seatColor(s) }}>
                          {s === me ? '나 자신' : names[s]}
                          {g.known[s] ? ` (${nm(g.known[s]!.kind)})` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  {noTarget && <div className="small muted">지목할 수 있는 사람이 없어요. 효과 없이 내요</div>}
                  {card.kind === 'watch' && target !== null && (
                    <div className="sl-step">
                      <span className="small">어떤 카드일까요?</span>
                      {spec
                        .filter((s) => !(c.guardNoGuard && s.kind === 'watch'))
                        .map((s) => (
                          <button key={s.kind} className={`chip ${guess === s.kind ? 'on' : ''}`} onClick={() => setGuess(s.kind)}>
                            {s.value} {nm(s.kind)}
                          </button>
                        ))}
                    </div>
                  )}
                  <div className="action-row">
                    <button className={`btn ${card.kind === 'queen' ? 'danger-btn' : 'primary'}`} disabled={!ready} onClick={play}>
                      {card.kind === 'queen' ? '여왕 내기 (탈락)' : `${def!.name} 내기`}
                    </button>
                    <button className="btn ghost" onClick={() => setSel(null)}>
                      다시 고르기
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
          {me >= 0 && !g.alive[me] && g.status === 'playing' && <p className="muted center">이번 판은 탈락했어요. 다음 판을 기다려요 <Icon name="mail" /></p>}
          <Ticker text={describe(g.log[g.log.length - 1], names)} />
        </>
      }
      side={
        <>
          {me >= 0 && g.hand.some((h) => h.kind === 'queen') && g.status === 'playing' && <AlertBanner icon={<Icon name="crown" />} title="여왕을 들고 있어요" sub="여왕을 내거나 버리게 되면 탈락해요. 사절을 조심!" />}
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.alive.map((alive, seat) => ({
              seat,
              accent: seatColor(seat),
              dim: !alive,
              score: (
                <span className="seals" title={`인장 ${g.tokens[seat]}/${g.goal}`}>
                  {Array.from({ length: g.goal }, (_, i) => (
                    <Seal key={i} on={i < g.tokens[seat]} />
                  ))}
                </span>
              ),
              badge: !alive ? <span className="tag">탈락</span> : g.protectedSeats[seat] ? <span className="tag ready"><Icon name="shield" /> 보호</span> : null,
              children: (
                <>
                  {g.known[seat] && (
                    <span className="sl-known" title="내가 아는 이 사람의 카드">
                      <Icon name="eye" /> <LetterCard kind={g.known[seat]!.kind} value={g.known[seat]!.value} size="xs" />
                    </span>
                  )}
                  <span className="sl-discards">
                    {g.discards[seat].map((d, i, all) => (
                      // 가장 최근에 낸 카드는 이름까지 보이게
                      <LetterCard key={d.id} flip={`l${d.id}`} kind={d.kind} value={d.value} size={i === all.length - 1 ? 'sm' : 'xs'} />
                    ))}
                  </span>
                </>
              ),
            }))}
          />
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
            headline={matchOver ? `👑 ${g.tokens.map((x, i) => (x >= g.goal ? names[i] : null)).filter(Boolean).join(', ')} 님 우승!` : `✉️ ${lr?.winners.map((w) => names[w]).join(', ')} 님이 편지를 전했어요`}
            sub={lr ? (lr.reason === 'last' ? '마지막까지 남았어요' : '더미가 비어 가장 높은 카드를 든 사람이 이겼어요') + (lr.spy !== null ? ` · 첩자 보너스 ${names[lr.spy]}` : '') : undefined}
            columns={['마지막 카드']}
            rows={g.tokens.map((tk, seat) => ({
              seat,
              rank: rankOf(g.tokens)[seat],
              cells: [lr?.reveal[seat] ? `${lr.reveal[seat]!.value} ${nm(lr.reveal[seat]!.kind)}` : '—'],
              total: `인장 ${tk}/${g.goal}`,
            }))}
          />
        ))
      }
    />
  );
}
