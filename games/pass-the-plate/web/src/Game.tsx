import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { DISH, Dish, GROUPS, GameConfig, GameView, Played } from '@bg/pass-the-plate-engine';
import { AlertBanner, SeatDot, seatColor, Icon, iconize } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, usePeek, useTable, waitingText, SideNote, useChangeSound, useDealFx } from '@bg/web';
import { DishCard } from './theme';

type View = RoomView<GameView, GameConfig>;

/** 앞에 놓인 카드를 묶음별로 */
function Tableau({ t, size = 'sm' }: { t: Played[]; size?: 'xs' | 'sm' }) {
  return (
    <div className={`tableau ${size}`}>
      {GROUPS.map((g) => {
        const cards = t.filter((p) => DISH[p.dish].group === g.id);
        if (!cards.length) return null;
        return (
          <span key={g.id} className="tab-group" title={g.name}>
            {cards.map((p) => (
              <DishCard key={p.id} flip={`d${p.id}`} dish={p.dish} size="xs" className={`${p.onWasabi ? 'on-wasabi' : ''} ${p.used ? 'used' : ''}`} />
            ))}
          </span>
        );
      })}
      {!t.length && <span className="muted small">아직 없음</span>}
    </div>
  );
}

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, { title: 'Pass the Plate', turn: g.actors[0] ?? 0, playing: g.status === 'playing', simultaneous: true, stepKey: `${g.round}-${g.turn}`, mySub: '한 접시 골라요' });
  // 소리: 모두 고르면 접시를 내려놓는 쨍, 손패가 넘어오면 미끄러짐
  useChangeSound(`${g.round}-${g.turn}`, 'plate', g.status === 'playing');
  // 새 판마다 카드를 섞고 나눠 주는 연출 (@bg/web deal-fx)
  useDealFx(`${g.round}`, { per: 3 });
  const names = t.names;
  const me = t.me;
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [two, setTwo] = useState(false);
  const [first, setFirst] = useState<string | null>(null);
  useEffect(() => {
    setTwo(false);
    setFirst(null);
  }, [g.turn, g.round]);

  const pick = async (id: string) => {
    if (g.status !== 'playing' || me < 0) return;
    if (g.myPick && !c.allowChange) return t.warn('이미 골랐어요. 모두 고르면 공개돼요');
    if (two) {
      if (!first) return setFirst(id);
      if (first === id) return setFirst(null);
      await act('move', { move: { type: 'pick', cardId: first, second: id } });
      setTwo(false);
      setFirst(null);
      return;
    }
    await act('move', { move: { type: 'pick', cardId: id } });
  };

  const myT = me >= 0 ? g.tableaus[me] ?? [] : [];
  const myPreview = me >= 0 ? g.preview[me] : null;
  const picked = new Set(g.myPick ? [g.myPick.cardId, g.myPick.second].filter(Boolean) : []);
  const title = me < 0 ? '모두 접시를 고르는 중' : g.myPick ? '골랐어요!' : two ? (first ? '두 번째 접시를 고르세요' : '젓가락: 첫 접시를 고르세요') : `${g.turn}번째 접시를 고르세요`;
  const hint = me < 0 ? '관전 중' : g.myPick ? `${waitingText(t)}${c.allowChange ? ' · 공개 전에는 바꿀 수 있어요' : ''}` : `모두 고르면 공개되고, 남은 접시는 ${g.dir === 1 ? '왼쪽' : '오른쪽'} 사람에게 넘어가요`;
  const matchOver = g.status === 'match-over';
  const last = g.round >= c.rounds;

  return (
    <TableLayout
      mine={t.myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} steps={<span className="small muted nowrap">{g.turn}/{g.handSize}번째 · 넘김 {g.dir === 1 ? '→' : '←'}</span>} />}
        </>
      }
      main={
        <>
          {g.revealed.length > 0 && (
            <section className="pp-reveal" aria-label="방금 고른 접시">
              <span className="small muted">방금</span>
              {g.revealed.map((r) => (
                <span key={r.seat} className="pp-reveal-item" style={{ ['--seat' as string]: seatColor(r.seat) }}>
                  <SeatDot seat={r.seat} size={12} /> {names[r.seat]}
                  {r.cards.map((d, i) => (
                    <DishCard key={i} dish={d} size="xs" />
                  ))}
                </span>
              ))}
            </section>
          )}
          {me >= 0 && (
            <section className="panel pp-mine" aria-label="내 앞 접시">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내가 먹은 접시
                </span>
                {myPreview && (
                  <span className="pp-preview" title="이번 판 지금까지 (김밥은 현재 순위 기준)">
                    지금 <b>{myPreview.total}</b>점 · 푸딩 {g.puddings[me] + myT.filter((p) => p.dish === 'pudding').length}
                  </span>
                )}
              </div>
              <Tableau t={myT} />
            </section>
          )}
          {me >= 0 && g.status === 'playing' && (
            <section className="hand-panel" aria-label="내 손패">
              <div className="hand-panel-head small">
                <span>돌아온 접시 {g.hand.length}장</span>
                {g.canChopsticks && !g.myPick && (
                  <button className={`btn tiny ${two ? 'on' : 'ghost'}`} onClick={() => (setTwo((x) => !x), setFirst(null))}>
                    <Icon name="chopsticks" /> 젓가락으로 2장{two ? ' (끄기)' : ''}
                  </button>
                )}
              </div>
              {/* 옆 사람에게서 넘어온 접시: 넘기는 방향의 반대쪽에서 밀려 들어옴 (차례마다 다시 그림) */}
              <div className={`hand-row pp-incoming ${g.dir === 1 ? 'from-left' : 'from-right'}`} key={`${g.round}-${g.turn}`}>
                {g.hand.map((h, i) => (
                  <DishCard key={h.id} flip={`d${h.id}`} noEnter className="pp-in" style={{ animationDelay: `${i * 40}ms` }} dish={h.dish} size="md" selected={picked.has(h.id) || first === h.id} onClick={() => pick(h.id)} badge={first === h.id ? '1' : undefined} />
                ))}
              </div>
            </section>
          )}
          <Ticker text={g.revealed.length ? `${g.turn - 1}번째 공개 · 손패가 ${g.dir === 1 ? '왼쪽' : '오른쪽'}으로 넘어갔어요` : '모두 동시에 한 접시씩 골라요'} />
        </>
      }
      side={
        <>
          {g.status === 'playing' && g.hand.length === 1 && <AlertBanner icon={<Icon name="plate" />} title="이번 판 마지막 접시" sub={last ? '마지막 판이에요. 푸딩 순위가 곧 정해져요' : '판이 끝나면 점수를 계산해요'} />}
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.picked.map((pk, seat) => ({
              seat,
              accent: seatColor(seat),
              score: g.totals[seat] + (g.status === 'playing' ? g.preview[seat].total : 0),
              scoreLabel: '지금까지 점수 (이번 판 포함)',
              badge: g.status === 'playing' ? <span className={`tag ${pk ? 'ready' : ''}`}>{pk ? iconize('골랐어요 ✓') : '고르는 중…'}</span> : null,
              children: seat !== me && g.tableaus[seat] ? <Tableau t={g.tableaus[seat]!} size="xs" /> : seat !== me ? <span className="muted small">먹은 접시 비공개</span> : undefined,
            }))}
          />
          <SideNote title="점수" className="pp-ref">
            <div>🍙 김밥 줄 수 1등 6 · 2등 3 · 🍤 튀김 2개 5 · 🐟 회 3개 10</div>
            <div>🥟 만두 1·3·6·10·15 · <Icon name="plate" /> 초밥 1·2·3 (🌿 겨자 위면 ×3)</div>
            <div>🍮 푸딩: 게임 끝에 가장 많으면 +6, 가장 적으면 −6</div>
          </SideNote>
        </>
      }
      overlay={
        g.status !== 'playing' &&
        (peek ? (
          <button className="btn primary peek-btn" onClick={() => setPeek(false)}>
            점수 보기
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
            headline={matchOver ? `${rankOf(g.totals).flatMap((r, i) => (r === 1 ? [names[i]] : [])).join(', ')} 님이 가장 잘 먹었어요!` : `${g.round}판 결과`}
            sub={matchOver ? '푸딩 점수까지 더했어요' : '먹은 접시는 치우고 새로 나눠요 (푸딩은 남아요)'}
            columns={[...g.roundScores.map((_, i) => `${i + 1}판`), ...(g.puddingScore ? ['푸딩'] : [])]}
            rows={g.totals.map((total, seat) => ({
              seat,
              rank: rankOf(g.totals)[seat],
              cells: [...g.roundScores.map((r) => r[seat].total), ...(g.puddingScore ? [g.puddingScore[seat]] : [])],
              total,
            }))}
          >
            {g.roundScores.length > 0 && (
              <p className="small muted">
                이번 판 {names[me >= 0 ? me : 0]}: {(() => {
                  const r = g.roundScores[g.roundScores.length - 1][me >= 0 ? me : 0];
                  return `김밥 ${r.maki} · 튀김 ${r.tempura} · 회 ${r.sashimi} · 만두 ${r.dumpling} · 초밥 ${r.nigiri}`;
                })()}
              </p>
            )}
          </ResultSheet>
        ))
      }
    />
  );
}

export type { Dish };
