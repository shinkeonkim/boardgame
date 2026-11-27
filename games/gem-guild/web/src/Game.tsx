import { useEffect, useState } from 'react';

/** 남은 장수만큼 더미가 두툼하게 (5장마다 한 겹, 최대 6겹) */
function deckThickness(n: number): React.CSSProperties {
  const layers = Math.min(6, Math.ceil(n / 5));
  if (!layers) return { opacity: 0.35 };
  return { boxShadow: Array.from({ length: layers }, (_, i) => `${(i + 1) * 1}px ${(i + 1) * 1.6}px 0 -0.5px color-mix(in srgb, var(--card-back-edge, #2a2540) ${100 - i * 8}%, #000)`).join(', ') };
}

const SHORT_LAND = '(max-height: 520px) and (min-aspect-ratio: 1/1)';
function useMedia(q: string): boolean {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(q);
    if (!mq) return;
    const f = () => setOn(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [q]);
  return on;
}
import type { RoomView } from '@bg/core';
import { DevCard, GameConfig, GameView, LogEntry } from '@bg/gem-guild-engine';
import { AlertBanner, SeatDot, seatColor, Icon } from '@bg/ui';
import { useNarrow, GameScreenProps, ResultSheet, SeatList, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, usePeek, useTable, useLogSounds } from '@bg/web';
import { DevCardView, GEM_INFO, GemToken, NobleView, ReservedBack, Tableau } from './theme';
import type { SeenPlayer } from '@bg/gem-guild-engine';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, { title: 'Gem Guild', turn: g.turn, playing: g.status === 'playing', mySub: '보석 · 예약 · 사기 중 하나' });
  // 소리: 보석 가져오기·버리기는 칩 여러 개, 사기는 카드 + 동전, 예약은 카드, 귀족은 축하
  useLogSounds(g.log, (e) => (e.type === 'take' ? ['crystal', 'crystal'] : e.type === 'discard' ? 'chips' : e.type === 'buy' ? ['cardSnap', 'coins'] : e.type === 'reserve' ? ['deal', 'coin'] : e.type === 'noble' ? ['fanfare'] : e.type === 'final' ? 'bell' : null), { me: t.me, describe: (e) => describe(e), stamp: (e) => (e.type === 'noble' ? { text: '귀족 방문!', tone: 'good' } : e.type === 'final' ? { text: '마지막 바퀴!', tone: 'hot', shake: 0.6 } : null) });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [pick, setPick] = useState<number[]>([]);
  const [card, setCard] = useState<DevCard | null>(null);
  const [drop, setDrop] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  useEffect(() => {
    setPick([]);
    setCard(null);
    setDrop([0, 0, 0, 0, 0, 0]);
  }, [g.turn, g.phase]);

  const mine = me >= 0 ? g.seats[me] : null;
  const narrow = useNarrow();
  // 폰 가로(낮은 화면): 정보 패널이 접히므로 상대 띠를 오른쪽 열에
  const shortLand = useMedia(SHORT_LAND);
  // 넓은 창: 오른쪽 목록에서 산 카드를 색별로 쌓아 모두 보여 줌 (좁으면 장수만)
  const wide = useMedia('(min-width: 1280px) and (min-height: 700px)');
  const [showAll, setShowAll] = useState(false);
  const describe = (e: LogEntry | undefined): string => {
    if (!e) return '보석을 모아 카드를 사고, 카드 보너스로 더 싸게 사요';
    switch (e.type) {
      case 'take':
        return e.gems.length ? `${names[e.seat]} 님이 보석 ${e.gems.map((x) => GEM_INFO[x].short).join('·')}을 가져왔어요` : `${names[e.seat]} 님은 할 수 있는 게 없어 넘겼어요`;
      case 'reserve':
        return `${names[e.seat]} 님이 ${e.card ? `${e.tier}단계 카드를` : `${e.tier}단계 더미 맨 위를`} 예약했어요${e.gold ? ' (+황금)' : ''}`;
      case 'buy':
        return `💎 ${names[e.seat]} 님이 ${GEM_INFO[e.card.bonus].name} 카드를 샀어요${e.card.points ? ` (+${e.card.points}점)` : ''}`;
      case 'noble':
        return `🎩 귀족이 ${names[e.seat]} 님을 방문했어요 (+${e.noble.points}점)`;
      case 'discard':
        return `${names[e.seat]} 님이 보석 ${e.gems.reduce((a, b) => a + b, 0)}개를 버렸어요`;
      case 'final':
        return `🏁 ${names[e.seat]} 님이 ${c.winPoints}점! 이번 바퀴까지 하고 끝나요`;
    }
  };

  const toggleGem = (gem: number) => {
    if (!myTurn) return t.warn(t.waitingMsg);
    setCard(null);
    setPick((p) => {
      if (p.length === 1 && p[0] === gem && g.bank[gem] >= c.takeTwoMin) return [gem, gem];
      if (p.includes(gem)) return p.filter((x) => x !== gem);
      if (p.length >= 3 || (p.length === 2 && p[0] === p[1])) return [gem];
      return [...p, gem];
    });
  };
  const take = async () => {
    if (await act('move', { move: { type: 'take', gems: pick } })) setPick([]);
  };
  const clickCard = (cd: DevCard) => {
    if (!myTurn) return t.warn(t.waitingMsg);
    setPick([]);
    setCard((x) => (x?.id === cd.id ? null : cd));
  };

  const title = g.phase === 'discard' && myTurn ? `보석이 넘쳐요 — ${g.over}개를 버려 주세요` : g.phase === 'noble' && myTurn ? '방문할 귀족을 고르세요' : myTurn ? '내 차례예요' : `${names[g.turn]} 님의 차례`;
  const hint = myTurn
    ? card
      ? g.affordable.includes(card.id)
        ? '이 카드를 살 수 있어요'
        : '보석이 모자라요 — 예약하면 황금 1개를 받아요'
      : pick.length
        ? pick.length === 2 && pick[0] === pick[1]
          ? `같은 색 2개 (그 색이 ${c.takeTwoMin}개 이상 남았을 때)`
          : '서로 다른 색 3개까지'
        : '보석(다른 색 3개 / 같은 색 2개) · 카드 예약 · 카드 사기 중 하나'
    : '어떤 카드를 노릴까요?';

  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);

  return (
    <TableLayout
      className="gg-table"
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={g.turn} size={16} />} steps={g.finalRound ? <span className="tag results">마지막 바퀴</span> : null} />}
        </>
      }
      main={
        <>
          <div className="gg-col-a">
          {g.nobles.length > 0 && (
            <section className="gg-nobles" aria-label="귀족">
              {g.nobles.map((n) => (
                <NobleView key={n.id} noble={n} size="sm" />
              ))}
            </section>
          )}
          <section className="gg-market" aria-label="시장">
            {[2, 1, 0].map((tier) => (
              <div key={tier} className="gg-tier">
                <button className={`gg-deck pc back t${tier + 1}`} style={deckThickness(g.deckCounts[tier])} disabled={!myTurn || !g.deckCounts[tier] || (mine?.reservedCount ?? 0) >= c.maxReserve} onClick={() => act('move', { move: { type: 'reserve', tier: tier + 1 } })} title="맨 위 카드를 몰래 예약">
                  <b>{tier + 1}단계</b>
                  <small>{g.deckCounts[tier]}장</small>
                </button>
                {g.market[tier].map((cd) => (
                  <DevCardView key={cd.id} card={cd} selected={card?.id === cd.id} affordable={myTurn && g.affordable.includes(cd.id)} onClick={() => clickCard(cd)} />
                ))}
              </div>
            ))}
          </section>
          {myTurn && card && g.phase === 'turn' && (
            <div className="action-row">
              <button className="btn primary" disabled={!g.affordable.includes(card.id)} onClick={() => act('move', { move: { type: 'buy', cardId: card.id } })}>
                <Icon name="gem" /> 사기
              </button>
              {g.market.flat().some((x) => x.id === card.id) && (
                <button className="btn" disabled={(mine?.reservedCount ?? 0) >= c.maxReserve} onClick={() => act('move', { move: { type: 'reserve', cardId: card.id } })}>
                  <Icon name="pin" /> 예약하기{g.bank[5] > 0 ? ' (+황금)' : ''}
                </button>
              )}
              <button className="btn ghost" onClick={() => setCard(null)}>
                취소
              </button>
            </div>
          )}
          </div>
          <div className="gg-col-b">
          {/* 폰: 오른쪽 목록이 판 아래로 내려가므로, 상대 상단을 판 위에 작게 */}
          {(narrow || shortLand) && g.players > 1 && (
            <section className="gg-opps" aria-label="상대 상단">
              <button type="button" className="gg-opp gg-opp-all" onClick={() => setShowAll(true)} aria-label="모두의 상단 펼쳐 보기">
                <Icon name="cards" />
                <span>펼쳐 보기</span>
              </button>
              {g.seats.map((s, seat) =>
                seat === me ? null : (
                  <div key={seat} className={`gg-opp ${g.turn === seat && g.status === 'playing' ? 'active' : ''}`} style={{ ['--seat' as string]: seatColor(seat) }}>
                    <div className="gg-opp-head">
                      <SeatDot seat={seat} size={10} /> <b className="gg-opp-name">{names[seat]}</b> <b className="gg-opp-pts">{s.points}점</b>
                    </div>
                    <Holdings s={s} limit={c.tokenLimit} maxReserve={c.maxReserve} compact />
                  </div>
                ),
              )}
            </section>
          )}
          <section className="hand-panel gg-bank" aria-label="보석 은행">
            <div className="hand-panel-head small">
              <span>보석 은행 — 눌러서 고르기</span>
              {pick.length > 0 && myTurn && (
                <button className="btn primary tiny" onClick={take}>
                  {pick.map((x) => GEM_INFO[x].short).join('·')} 가져오기
                </button>
              )}
            </div>
            <div className="gg-bank-row">
              {[0, 1, 2, 3, 4].map((gem) => (
                <GemToken key={gem} gem={gem} n={g.bank[gem]} stack={g.bank[gem]} size={46} selected={pick.includes(gem)} onClick={() => toggleGem(gem)} disabled={!myTurn || g.phase !== 'turn' || g.bank[gem] === 0} label={`${GEM_INFO[gem].name} ${g.bank[gem]}개 남음`} />
              ))}
              <GemToken gem={5} n={g.bank[5]} stack={g.bank[5]} size={46} label={`황금 ${g.bank[5]}개 (예약할 때만 받아요)`} />
            </div>
          </section>
          {mine && (
            <section className="hand-panel gg-mine" aria-label="내 보석과 카드">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 상단 · <b>{mine.points}점</b> · 보석 {mine.tokens.reduce((a, b) => a + b, 0)}/{c.tokenLimit}
                </span>
              </div>
              <div className="gg-mine-row">
                {[0, 1, 2, 3, 4, 5].map((gem) => (
                  <span key={gem} className="gg-mine-cell">
                    <GemToken gem={gem} n={mine.tokens[gem]} stack={mine.tokens[gem]} size={30} />
                    {gem < 5 && <span className="gg-bonus" title="카드 보너스 (영구 할인)" style={{ background: GEM_INFO[gem].fill, color: GEM_INFO[gem].ink }}>+{mine.bonuses[gem]}</span>}
                    {g.phase === 'discard' && myTurn && mine.tokens[gem] > 0 && (
                      <span className="gg-drop">
                        <button className="icon-btn" onClick={() => setDrop((d) => d.map((x, i) => (i === gem ? Math.max(0, x - 1) : x)))}>
                          −
                        </button>
                        <b>{drop[gem]}</b>
                        <button className="icon-btn" onClick={() => setDrop((d) => d.map((x, i) => (i === gem ? Math.min(mine.tokens[gem], x + 1) : x)))}>
                          +
                        </button>
                      </span>
                    )}
                  </span>
                ))}
              </div>
              {g.phase === 'discard' && myTurn && (
                <div className="action-row">
                  <button className="btn primary" disabled={drop.reduce((a, b) => a + b, 0) !== g.over} onClick={() => act('move', { move: { type: 'discard', gems: drop } })}>
                    {drop.reduce((a, b) => a + b, 0)}/{g.over}개 버리기
                  </button>
                </div>
              )}
              {g.phase === 'noble' && myTurn && (
                <div className="gg-nobles">
                  {g.eligibleNobles.map((n) => (
                    <NobleView key={n.id} noble={n} onClick={() => act('move', { move: { type: 'noble', nobleId: n.id } })} />
                  ))}
                </div>
              )}
              {mine.reservedSeen.length > 0 && (
                <div className="gg-reserved">
                  <span className="small muted">예약 {mine.reservedCount}/{c.maxReserve}</span>
                  {mine.reservedSeen.map((r) => r.card && <DevCardView key={r.card.id} card={r.card} size="sm" secret={r.secret} selected={card?.id === r.card.id} affordable={myTurn && g.affordable.includes(r.card.id)} onClick={() => clickCard(r.card!)} />)}
                </div>
              )}
            </section>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
          </div>
        </>
      }
      side={
        <>
          {g.finalRound && g.status === 'playing' && <AlertBanner icon={<Icon name="flag" />} title="마지막 바퀴" critical sub={`누군가 ${c.winPoints}점에 닿았어요. 첫 사람 차례 전까지 하고 끝나요`} />}
          <button type="button" className="btn small gg-all-btn" onClick={() => setShowAll(true)}>
            <Icon name="cards" /> 모두의 상단 펼쳐 보기
          </button>
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.seats.map((s, seat) => ({
              seat,
              accent: seatColor(seat),
              score: `${s.points}점`,
              children: <Holdings s={s} limit={c.tokenLimit} maxReserve={c.maxReserve} tableau={wide} />,
            }))}
          />
        </>
      }
      overlay={
        showAll && g.status === 'playing' ? (
          <AllTableaus g={g} names={names} me={me} limit={c.tokenLimit} maxReserve={c.maxReserve} onClose={() => setShowAll(false)} />
        ) : g.status !== 'playing' &&
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
            headline={`💎 ${names[g.winners[g.winners.length - 1]]} 님의 상단이 이겼어요!`}
            sub="점수가 같으면 카드를 덜 산 쪽이 이겨요"
            columns={['카드', '귀족']}
            rows={g.seats.map((s, seat) => ({ seat, rank: ranks[seat], cells: [s.cardCount, s.nobles.length], total: `${g.totals[seat]}점` }))}
          />
        ))
      }
    />
  );
}

/**
 * 한 사람의 상단 (오른쪽 목록): 색마다 「카드(영구 할인) 몇 장 · 보석 몇 개」를 같은 칸에,
 * 아래에 합계와 예약 카드 — 시장에서 예약한 건 앞면, 더미에서 몰래 예약한 건 뒷면.
 */
function Holdings({ s, limit, maxReserve, compact, tableau, cardsShown }: { s: SeenPlayer; limit: number; maxReserve: number; /** 폰 위쪽 띠: 작게, 예약은 개수·뒷면 수만 */ compact?: boolean; /** 넓은 창: 카드 장수 대신 산 카드를 색별로 쌓아서 */ tableau?: boolean; /** 산 카드를 바로 위에 따로 크게 보여 줌 (장수 줄·작은 쌓기 생략) */ cardsShown?: boolean }) {
  const cards = s.bonuses.reduce((a, b) => a + b, 0);
  return (
    <span className={`gg-hold ${compact ? 'compact' : ''}`}>
      {tableau && !cardsShown && <Tableau cards={s.cards} size="xs" />}
      <span className="gg-hold-grid" role="table" aria-label={tableau || cardsShown ? '색별 보석' : '색별 카드와 보석'}>
        {!(tableau || cardsShown) && (
        <span className="gg-hold-label" role="rowheader">
          카드
        </span>
        )}
        {!(tableau || cardsShown) && [0, 1, 2, 3, 4].map((gem) => (
          <span key={gem} role="cell" data-cbl={GEM_INFO[gem].short} className={`gg-hold-card ${s.bonuses[gem] ? '' : 'zero'}`} style={{ background: GEM_INFO[gem].fill, color: GEM_INFO[gem].ink, borderColor: GEM_INFO[gem].stroke }} title={`${GEM_INFO[gem].name} 카드 ${s.bonuses[gem]}장 (영구 할인)`}>
            {s.bonuses[gem]}
          </span>
        ))}
        {!(tableau || cardsShown) && <span role="cell" />}
        <span className="gg-hold-label" role="rowheader">
          보석
        </span>
        {[0, 1, 2, 3, 4, 5].map((gem) => (
          <span key={gem} role="cell" data-cbl={GEM_INFO[gem].short} className={`gg-hold-chip ${s.tokens[gem] ? '' : 'zero'}`} style={{ background: GEM_INFO[gem].fill, color: GEM_INFO[gem].ink, borderColor: GEM_INFO[gem].stroke }} title={`${GEM_INFO[gem].name} ${s.tokens[gem]}개`}>
            {s.tokens[gem]}
          </span>
        ))}
      </span>
      <span className="gg-hold-sum small">
        <span className={s.tokenTotal >= limit ? 'warn' : ''}>
          보석 <b>{s.tokenTotal}</b>/{limit}
        </span>
        <span>
          카드 <b>{cards}</b>장
        </span>
        {compact && s.reservedCount > 0 && (
          <span>
            예약 <b>{s.reservedCount}</b>
          </span>
        )}
        {s.nobles.length > 0 && (
          <span>
            <Icon name="hat" /> 귀족 <b>{s.nobles.length}</b>
          </span>
        )}
      </span>
      {!compact && s.reservedSeen.length > 0 && (
        <span className="gg-hold-res">
          <span className="small muted">
            예약 {s.reservedCount}/{maxReserve}
          </span>
          {s.reservedSeen.map((r, i) => (r.card ? <DevCardView key={r.card.id} card={r.card} size="xs" secret={r.secret} flip={false} /> : <ReservedBack key={`b${i}`} tier={r.tier} />))}
        </span>
      )}
    </span>
  );
}

/** 모두의 상단을 실제 탁자처럼 펼쳐 보기: 사람마다 산 카드(색별로 쌓음)·보석·예약·귀족 */
function AllTableaus({ g, names, me, limit, maxReserve, onClose }: { g: GameView; names: string[]; me: number; limit: number; maxReserve: number; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);
  // 나부터, 그다음 차례 순서
  const order = g.seats.map((_, i) => (me >= 0 ? (me + i) % g.players : i));
  return (
    <div className="overlay gg-all" role="dialog" aria-modal="true" aria-label="모두의 상단" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel sheet gg-all-sheet">
        <div className="gg-all-head">
          <h2>모두의 상단</h2>
          <button type="button" className="btn small" onClick={onClose} autoFocus>
            <Icon name="x" /> 닫기
          </button>
        </div>
        <div className="gg-all-grid">
          {order.map((seat) => {
            const s = g.seats[seat];
            return (
              <section key={seat} className={`gg-all-seat ${g.turn === seat ? 'active' : ''}`} style={{ ['--seat' as string]: seatColor(seat) }} aria-label={`${names[seat]} 님의 상단`}>
                <header className="gg-all-name">
                  <SeatDot seat={seat} size={12} /> <b>{seat === me ? `${names[seat]} (나)` : names[seat]}</b>
                  <span className="gg-all-pts">{s.points}점</span>
                </header>
                <Tableau cards={s.cards} size="sm" label={`${names[seat]} 님이 산 카드`} />
                <Holdings s={s} limit={limit} maxReserve={maxReserve} cardsShown />
                {s.nobles.length > 0 && (
                  <div className="gg-all-nobles">
                    {s.nobles.map((n) => (
                      <NobleView key={n.id} noble={n} size="sm" />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

