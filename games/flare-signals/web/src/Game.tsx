import { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react';
import type { RoomView } from '@bg/core';
import { Card, GameConfig, GameView, LogEntry, copiesOf, hintColors, possibilities, touchesColor } from '@bg/flare-signals-engine';
import { AlertBanner, EmoteBubble, SeatDot, Icon } from '@bg/ui';
import { GameScreenProps, ResultSheet, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, usePeek, useTable, flyClone, useLogSounds, useDealFx } from '@bg/web';
import { COLORS, ClueMarks, FlareCard, MysteryCard, RATING, colorName, colorStyle } from './theme';

type View = RoomView<GameView, GameConfig>;
type Hint = { color: number } | { value: number };

function describe(e: LogEntry | undefined, c: GameConfig, names: string[]): string {
  if (!e) return '모두에게 보이는 카드를 보고 힌트를 주고받아요';
  const who = names[e.seat];
  switch (e.type) {
    case 'hint':
      return `${who} → ${names[e.to]}: ${e.color !== undefined ? `「${colorName(c, e.color)}」` : `「${e.value}」`} 카드 ${e.touched.length}장`;
    case 'play':
      return e.ok ? `🎆 ${who} 님이 ${colorName(c, e.card.color)} ${e.card.value}을 쏘아 올렸어요${e.bonus ? ' (5 완성! 힌트 +1)' : ''}` : `💥 ${who} 님의 ${colorName(c, e.card.color)} ${e.card.value}이 불발! 실수 +1`;
    case 'discard':
      return `${who} 님이 ${colorName(c, e.card.color)} ${e.card.value}을 버리고 힌트 +1`;
    case 'draw':
      return `덱이 바닥났어요. ${c.lastRound ? '모두 한 번씩 더 하고 끝나요' : '이번 차례로 끝나요'}`;
  }
}

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, { title: 'Flare Signals', turn: g.turn, playing: g.status === 'playing', mySub: '힌트 · 내기 · 버리기 중 하나' });

  // 카드를 내거나 버리면: 그 카드가 있던 자리 → 불꽃 더미(또는 버린 카드 칸)로 날아감
  const cardRects = useRef(new Map<string, DOMRect>());
  const lastAct = [...g.log].reverse().find((e) => e.type === 'play' || e.type === 'discard');
  useLayoutEffect(() => {
    if (!lastAct || (lastAct.type !== 'play' && lastAct.type !== 'discard')) return;
    const from = cardRects.current.get(lastAct.card.id);
    const pileCard = document.querySelector(`[data-pile="${lastAct.card.color}"] .fcard`);
    if (lastAct.type === 'play' && lastAct.ok) flyClone(from, pileCard);
    else flyClone(from, document.querySelector(`[data-dg="${lastAct.card.color}-${lastAct.card.value}"]`), { like: pileCard });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAct?.n]);
  // 렌더마다 카드 자리를 기억 (다음에 사라질 카드의 출발점)
  useLayoutEffect(() => {
    const m = new Map<string, DOMRect>();
    document.querySelectorAll<HTMLElement>('[data-flip^="f"]').forEach((el) => m.set(el.dataset.flip!.slice(1), el.getBoundingClientRect()));
    cardRects.current = m;
  });
  // 소리: 힌트는 토큰 딸깍, 성공하면 불꽃 쉭-펑, 실패는 불발, 버리기는 카드, 뽑기는 미끄러짐
  useLogSounds(g.log, (e) => (e.type === 'hint' ? ['whoosh', 'pop'] : e.type === 'play' ? (e.ok ? 'firework' : 'fizzle') : e.type === 'discard' ? 'pageTurn' : e.type === 'draw' ? 'deal' : null), { me: t.me, describe: (e) => describe(e, g.config, t.names), stamp: (e) => (e.type === 'play' ? (e.ok ? (e.bonus ? { text: '불꽃 완성!', tone: 'good', shake: 0.5 } : null) : { text: '불발!', tone: 'bad', shake: 0.8 }) : null) });
  // 새 판마다 카드를 섞고 나눠 주는 연출 (@bg/web deal-fx)
  useDealFx(`${g.round}`, { per: 2, seats: '.hand-panel:not(.mine)', hand: '.hand-panel.mine', initial: g.log.length <= 1 });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [sel, setSel] = useState<string | null>(null); // 내 카드
  const [hintTo, setHintTo] = useState<number | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [showPoss, setShowPoss] = useState(c.showPossibilities);
  useEffect(() => {
    setSel(null);
    setHint(null);
    setHintTo(null);
  }, [g.turnCount]);

  const myHand = me >= 0 ? g.hands[me] : [];
  const selCard = myHand.find((x) => x.id === sel) ?? null;
  const touched = useMemo(() => {
    if (hintTo === null || !hint) return new Set<string>();
    return new Set(g.hands[hintTo].filter((card) => ('color' in hint ? touchesColor(c, card as Card, hint.color) : card.value === hint.value)).map((x) => x.id));
  }, [hintTo, hint, g.hands, c]);

  const guard = () => {
    if (g.status !== 'playing') return false;
    if (!myTurn) {
      t.warn(t.waitingMsg);
      return false;
    }
    return true;
  };
  const play = async () => {
    if (!guard() || !selCard) return;
    if (await act('move', { move: { type: 'play', cardId: selCard.id } })) setSel(null);
  };
  const discard = async () => {
    if (!guard() || !selCard) return;
    if (g.hints >= c.hints) return t.warn('힌트 토큰이 가득 차 있어서 버릴 수 없어요. 힌트를 주거나 카드를 내 주세요');
    if (await act('move', { move: { type: 'discard', cardId: selCard.id } })) setSel(null);
  };
  const give = async () => {
    if (!guard() || hintTo === null || !hint) return;
    if (g.hints <= 0) return t.warn('힌트 토큰이 없어요. 카드를 버리면 하나 돌아와요');
    if (!touched.size && !c.emptyHints) return t.warn('그 힌트에 해당하는 카드가 없어요');
    if (await act('move', { move: { type: 'hint', to: hintTo, ...hint } })) {
      setHint(null);
      setHintTo(null);
    }
  };
  const pickOtherCard = (seat: number, card: { color: number | null; value: number | null }) => {
    if (me < 0 || g.status !== 'playing') return;
    setSel(null);
    if (hintTo !== seat) setHintTo(seat);
    // 같은 카드를 다시 누르면 색 ↔ 숫자
    setHint((h) => (h && hintTo === seat && 'color' in h && h.color === card.color ? { value: card.value! } : { color: card.color! === 5 && c.sixth === 'rainbow' ? 0 : card.color! }));
  };

  // 배너
  let title: string;
  let hintText: string;
  if (myTurn) {
    title = '내 차례예요';
    if (hint && hintTo !== null) {
      title = `${names[hintTo]} 님에게 ${'color' in hint ? `「${colorName(c, hint.color)}」` : `「${hint.value}」`} 힌트`;
      hintText = touched.size ? `카드 ${touched.size}장을 가리켜요. 「힌트 주기」를 누르세요` : '가리키는 카드가 없어요';
    } else if (selCard) {
      title = '이 카드를 어떻게 할까요?';
      hintText = '「쏘아 올리기」는 맞으면 쌓이고 틀리면 실수, 「버리기」는 힌트 +1';
    } else hintText = '다른 사람 카드를 눌러 힌트를 주거나, 내 카드를 골라 내거나 버리세요';
  } else {
    title = me < 0 ? `${names[g.turn]} 님의 차례예요` : `${names[g.turn]} 님의 차례예요`;
    hintText = me < 0 ? '관전 중 · 모든 카드가 보여요' : '내 카드는 나만 못 봐요. 받은 힌트를 잘 기억해 두세요';
  }

  const matchOver = g.status === 'match-over';
  const order = Array.from({ length: g.players }, (_, i) => (me >= 0 ? (me + i) % g.players : i)).filter((s) => s !== me);

  // 버린 카드 표: 색 × 숫자, 남은 장수
  const discardGrid = (
    <section className="panel discard-grid" aria-label="버린 카드">
      <div className="small">
        <b>버린 카드</b> <span className="muted">{g.discard.length}장 · 빨간 칸은 더 없음</span>
      </div>
      <table>
        <tbody>
          {Array.from({ length: c.colors }, (_, color) => (
            <tr key={color} style={colorStyle(c, color)}>
              <th>
                <span className="dg-dot" />
              </th>
              {[1, 2, 3, 4, 5].map((value) => {
                const total = copiesOf(c, color, value);
                const gone = g.discard.filter((d) => d.color === color && d.value === value).length;
                const played = g.piles[color] >= value;
                return (
                  <td key={value} data-dg={`${color}-${value}`} className={`${gone >= total && !played ? 'lost' : ''} ${played ? 'played' : ''} ${gone === total - 1 && !played ? 'last' : ''}`} title={`${colorName(c, color)} ${value}: ${total}장 중 ${gone}장 버림`}>
                    {value}
                    {gone > 0 && <sub>{'×'.repeat(gone)}</sub>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            {c.showClues && (
              <button className={`btn ghost tiny ${showPoss ? 'on' : ''}`} aria-pressed={showPoss} onClick={() => setShowPoss((x) => !x)} title="내 카드가 될 수 있는 것">
                가능성
              </button>
            )}
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hintText} icon={<SeatDot seat={g.turn} size={16} />} />}
        </>
      }
      main={
        <>
          <section className="sky" aria-label="쏘아 올린 불꽃">
            {g.piles.map((top, color) => (
              <div key={color} data-pile={color} className={`pile ${top === 5 ? 'done' : ''}`} style={colorStyle(c, color)}>
                {top > 0 ? <FlareCard c={c} color={color} value={top} size="sm" /> : <span className="pile-empty">{colorName(c, color)}</span>}
                <span className="pile-dots" aria-hidden>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <i key={k} className={k <= top ? 'on' : ''} />
                  ))}
                </span>
              </div>
            ))}
          </section>

          <section className="others" aria-label="다른 사람 카드">
            {order.map((seat) => {
              const hand = g.hands[seat];
              const active = g.turn === seat && g.status === 'playing';
              const choosing = hintTo === seat;
              const m = view.members.find((x) => x.seat === seat);
              return (
                <div key={seat} data-seat={seat} className={`other ${active ? 'active' : ''} ${choosing ? 'choosing' : ''}`}>
                  <div className="other-head small">
                    <span className="seat-name">
                      <EmoteBubble e={bySeat.get(seat)} />
                      <SeatDot seat={seat} size={14} /> <b>{names[seat]}</b>
                      {m?.bot && <span className={`tag bot ${m.bot}`}><Icon name="bot" /></span>}
                      {m && !m.connected && <span className="tag away-tag">연결 끊김</span>}
                    </span>
                    {me >= 0 && g.status === 'playing' && (
                      <button className={`btn tiny ${choosing ? 'on' : 'ghost'}`} onClick={() => (choosing ? (setHintTo(null), setHint(null)) : (setHintTo(seat), setHint(null), setSel(null)))}>
                        {choosing ? '닫기' : '힌트 주기'}
                      </button>
                    )}
                  </div>
                  <div className="other-cards">
                    {hand.map((card, i) => (
                      <div key={card.id} data-flip={`f${card.id}`} className={`ocard ${touched.has(card.id) && choosing ? 'touch' : ''} ${i === g.chops[seat] ? 'chop' : ''}`}>
                        <FlareCard c={c} color={card.color!} value={card.value!} size="md" onClick={() => pickOtherCard(seat, card)} title="눌러서 이 카드의 색·숫자로 힌트" />
                        {c.showClues && <ClueMarks c={c} clue={card.clue} />}
                      </div>
                    ))}
                  </div>
                  {choosing && (
                    <div className="hint-bar">
                      {hintColors(c).map((color) => (
                        <button key={`c${color}`} className={`hint-chip color ${hint && 'color' in hint && hint.color === color ? 'on' : ''}`} style={colorStyle(c, color)} onClick={() => setHint({ color })}>
                          {COLORS[color].name}
                        </button>
                      ))}
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button key={`v${value}`} className={`hint-chip value ${hint && 'value' in hint && hint.value === value ? 'on' : ''}`} onClick={() => setHint({ value })}>
                          {value}
                        </button>
                      ))}
                      <button className="btn primary small-btn" disabled={!hint || !myTurn || g.hints <= 0} onClick={give}>
                        힌트 주기 ({g.hints})
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {me >= 0 && g.status === 'playing' && (
            <section className="hand-panel mine" aria-label="내 카드">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 카드 (나만 못 봐요)
                </span>
                <span className="muted">왼쪽이 오래된 카드 · 점선 = 버릴 차례</span>
              </div>
              <div className="hand-row">
                {myHand.map((card, i) => {
                  const ps = showPoss ? possibilities(g, me, card.clue) : [];
                  return (
                    <div key={card.id} data-flip={`f${card.id}`} className={`mycard ${i === g.chops[me] ? 'chop' : ''}`}>
                      <MysteryCard
                        c={c}
                        clue={card.clue}
                        show={c.showClues}
                        selected={sel === card.id}
                        onClick={() => {
                          setHint(null);
                          setHintTo(null);
                          setSel((s) => (s === card.id ? null : card.id));
                        }}
                        label={`내 ${i + 1}번째 카드`}
                      />
                      {showPoss && (
                        <span className="poss" title="될 수 있는 카드 (남은 장수)">
                          {ps.slice(0, 8).map((p) => (
                            <i key={`${p.color}-${p.value}`} style={colorStyle(c, p.color)}>
                              {p.value}
                            </i>
                          ))}
                          {ps.length > 8 && <em>+{ps.length - 8}</em>}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="action-row">
                <button className="btn primary" disabled={!selCard || !myTurn} onClick={play}>
                  <Icon name="firework" /> 쏘아 올리기
                </button>
                <button className="btn" disabled={!selCard || !myTurn || g.hints >= c.hints} onClick={discard}>
                  버리기 (힌트 +1)
                </button>
              </div>
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1], c, names)} />
        </>
      }
      side={
        <>
          {g.finalTurns !== null && g.status === 'playing' && (
            <AlertBanner icon={<Icon name="hourglass" />} title={`마지막 바퀴 · ${g.finalTurns}번 남았어요`} critical={g.finalTurns <= 1} compactKey={g.finalTurns} sub="덱이 바닥났어요. 지금 낼 수 있는 걸 내 보세요" />
          )}
          {g.status === 'playing' && c.fuses - g.fuses === 1 && <AlertBanner icon={<Icon name="boom" />} title="한 번만 더 틀리면 실패" critical sub="확실한 카드만 쏘아 올려요" />}
          <section className="panel tokens">
            <div className="token-row">
              <span className="small">힌트</span>
              <span className="tok-list">
                {Array.from({ length: c.hints }, (_, i) => (
                  <i key={i} className={`tok hint ${i < g.hints ? 'on' : ''}`} />
                ))}
              </span>
              <b>{g.hints}</b>
            </div>
            <div className="token-row">
              <span className="small">실수</span>
              <span className="tok-list">
                {Array.from({ length: c.fuses }, (_, i) => (
                  <i key={i} className={`tok fuse ${i < g.fuses ? 'on' : ''}`} />
                ))}
              </span>
              <b>
                {g.fuses}/{c.fuses}
              </b>
            </div>
            <div className="token-row small">
              <span>덱</span>
              <b>{g.deckCount}장</b>
              <span className="muted">
                점수 {g.score}/{g.maxScore}
              </span>
            </div>
          </section>
          {discardGrid}
          {g.log.length > 0 && (
          <section className="panel log-list small" aria-label="기록">
            {[...g.log]
              .reverse()
              .slice(0, 10)
              .map((e) => (
                <div key={e.n}>{describe(e, c, names)}</div>
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
            headline={`불꽃 ${g.roundScores[g.roundScores.length - 1] ?? 0}점! ${g.endReason === 'perfect' ? '🎆' : ''}`}
            sub={
              g.endReason === 'bomb'
                ? `실수 ${c.fuses}번으로 불꽃놀이가 멈췄어요${c.bombScore === 'zero' ? ' (0점)' : ''}`
                : g.endReason === 'perfect'
                  ? '모든 불꽃을 쏘아 올렸어요!'
                  : '덱을 모두 썼어요 · ' + RATING(g.roundScores[g.roundScores.length - 1] ?? 0, g.maxScore)
            }
            columns={g.roundScores.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: 1, cells: g.roundScores, total }))}
            note="협력 게임이라 모두 같은 점수예요"
          />
        ))
      }
    />
  );
}
