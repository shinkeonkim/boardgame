import { useEffect, useMemo, useState } from 'react';
import { useViewport } from './viewport';
import type { RoomView } from '@bg/core';
import { GameConfig, GameView, HCard, LogEntry, MONTH_NAMES } from '@bg/go-stop-engine';
import { SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SeatList, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, rankOf, useLogSounds, useNarrow, usePeek, useTable } from '@bg/web';
import { Captured, type Stage } from './Captured';
import { HwatuBack, HwatuCard } from './theme';

type View = RoomView<GameView, GameConfig>;

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, {
    title: 'Go Stop',
    turn: g.turn,
    playing: g.status === 'playing',
    stepKey: `${g.round}-${g.phase}-${g.handCounts.join('.')}`,
    mySub: g.phase === 'gostop' ? '고? 스톱?' : '카드를 내요',
  });
  useLogSounds(
    g.log,
    (e) =>
      e.type === 'play'
        ? // 카드 소리를 손놀림 순서에 맞춘다: 낸 카드 탁 → 뒤집은 카드 탁 → 쓸어 감
          [e.special.length ? 'slapHard' : 'slap', ...(e.flip ? ([['slap', 0.42]] as const) : []), ...(e.took.length ? ([['sweep', e.flip ? 0.86 : 0.55]] as const) : []), ...(e.stolen ? ([['pop', 1.1]] as const) : [])]
        : e.type === 'go'
          ? 'gong'
          : e.type === 'stop'
            ? ['gong', 'win']
            : e.type === 'deal'
              ? 'riffle'
              : e.type === 'nagari'
                ? 'fizzle'
                : null,
    {
      me: t.me,
      describe: (e) => describe(e),
      stamp: (e) =>
        e.type === 'play' && e.special.length
          ? { text: `${e.special.join(' · ')}!`, tone: e.special.includes('뻑') ? 'bad' : 'hot', shake: e.special.includes('뻑') ? 0 : 1 }
          : e.type === 'go'
            ? { text: `${e.count}고!`, tone: 'hot', shake: e.count >= 3 ? 1.4 : 0.6 }
            : e.type === 'stop'
              ? { text: '스톱!', tone: 'good' }
              : e.type === 'nagari'
                ? { text: '나가리', tone: 'bad' }
                : null,
    },
  );
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const narrow = useNarrow();
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [pending, setPending] = useState<HCard | null>(null);
  useEffect(() => setPending(null), [g.handCounts.join('.'), g.phase]);
  const playing = myTurn && g.phase === 'play';
  const gostop = myTurn && g.phase === 'gostop';

  const tapHand = (card: HCard) => {
    if (!playing) return;
    const same = g.table.filter((x) => x.month === card.month);
    if (same.length === 2 && !(same[0].kind === same[1].kind && same[0].kind === 'pi')) return setPending(card);
    act('move', { move: { type: 'play', card: card.id } });
  };
  const tapTable = (target: HCard) => {
    if (!pending || target.month !== pending.month) return;
    act('move', { move: { type: 'play', card: pending.id, target: target.id } });
    setPending(null);
  };

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '같은 달 카드를 맞춰 먹어요';
    if (e.type === 'play') {
      const who = names[e.seat];
      const sp = e.special.length ? ` · ${e.special.join(' · ')}!` : '';
      const st = e.stolen ? ` · 피 ${e.stolen}장 뺏음` : '';
      return e.took.length ? `${who} 님이 ${e.took.length}장 먹었어요 (${MONTH_NAMES[e.card.month]})${sp}${st}` : `${who} 님이 ${MONTH_NAMES[e.card.month]}을 바닥에 놓았어요${sp}`;
    }
    if (e.type === 'go') return `${names[e.seat]} 님 ${e.count}고! (${e.score}점)`;
    if (e.type === 'stop') return `${names[e.seat]} 님 스톱! ${e.detail.join(' · ')}`;
    if (e.type === 'nagari') return '나가리 — 아무도 나지 않았어요';
    return `${e.round}판째 패를 돌렸어요`;
  };
  const title = gostop ? `${g.scores[me]}점 났어요! 고? 스톱?` : playing ? (pending ? '바닥에서 먹을 카드를 골라요' : '낼 카드를 골라요') : g.phase === 'gostop' ? `${names[g.turn]} 님이 고/스톱을 고르는 중` : `${names[g.turn]} 님 차례`;
  const hint = gostop ? `고: 더 가서 점수 +1 (3고부터 두 배) · 상대가 먼저 나면 위험` : playing ? '빛나는 카드는 바닥에 같은 달이 있어요' : `${g.goAt}점부터 고/스톱`;
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);
  const vp = useViewport();
  // 카드 크기: 넓은 화면은 높이에 맞춰 크게, 폰은 손패 한 줄(5~6장)이 너비에 들어가게
  const cw = narrow ? Math.max(34, Math.min(50, Math.floor((vp.w - 48) / 7.4))) : Math.max(44, Math.min(78, Math.floor((vp.h - 250) / 7.6)));
  const cap = Math.round(cw * (narrow ? 0.52 : 0.6));
  // 바닥: 같은 달끼리 겹쳐 묶고, 더미를 가운데 두고 양옆에 나눠 놓는다
  const fieldGroups = Object.values(
    g.table.reduce<Record<number, HCard[]>>((acc, x) => {
      (acc[x.month] ??= []).push(x);
      return acc;
    }, {}),
  ).sort((a, b) => a[0].month - b[0].month);
  const half = Math.ceil(fieldGroups.length / 2);
  // 실제 화투처럼 순서대로: ① 낸 카드가 맞는 바닥 카드 위에 탁 → ② 더미 카드를 뒤집어 탁 → ③ 먹은 카드를 쓸어 감 → ④ 뺏은 피
  const lastPlay = g.log[g.log.length - 1];
  const flippedId = lastPlay?.type === 'play' ? lastPlay.flip?.id : undefined;
  const stage = useMemo<Stage>(() => {
    const e = lastPlay;
    if (e?.type !== 'play') return {};
    const out: Stage = {};
    const took = new Set(e.took.map((x) => x.id));
    const mate = (c: HCard) => e.took.find((x) => x.month === c.month && x.id !== c.id && x.id !== e.flip?.id && x.id !== e.card.id)?.id ?? e.took.find((x) => x.month === c.month && x.id !== c.id)?.id;
    out[e.card.id] = took.has(e.card.id) ? { via: mate(e.card), land: 'slap' } : { land: 'slap' };
    if (e.flip) out[e.flip.id] = { from: '.gs-pile', delay: 380, land: 'slap', via: took.has(e.flip.id) ? mate(e.flip) : undefined };
    for (const x of e.took) if (x.id !== e.card.id && x.id !== e.flip?.id) out[x.id] = { delay: e.flip ? 820 : 520 };
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPlay?.n]);
  const st = (id: string) => stage[id] ?? {};
  const renderGroup = (list: HCard[]) => (
    <span key={list[0].month} className={`gs-month ${pending && pending.month === list[0].month ? 'target' : ''}`} data-n={list.length}>
      {list.map((x) => {
        const target = !!pending && x.month === pending.month;
        return (
          <span key={x.id} data-flip={x.id} data-flip-from={st(x.id).from ?? (x.id === flippedId ? '.gs-pile' : undefined)} data-flip-delay={st(x.id).delay} data-flip-land={st(x.id).land} className="gs-month-card">
            <HwatuCard card={x} w={cw} glow={target} dim={!!pending && !target} onClick={target ? () => tapTable(x) : undefined} />
          </span>
        );
      })}
    </span>
  );
  const lastStop = [...g.log].reverse().find((e) => e.type === 'stop' || e.type === 'nagari');

  return (
    <TableLayout
      layout="focus"
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && (
            <TableBanner
              t={t}
              act={act}
              title={title}
              hint={hint}
              icon={<SeatDot seat={g.turn} size={16} />}
              steps={
                gostop ? (
                  <span className="gs-gostop">
                    <button type="button" className="btn primary" onClick={() => act('move', { move: { type: 'go' } })} disabled={g.hand.length === 0}>
                      고!
                    </button>
                    <button type="button" className="btn" onClick={() => act('move', { move: { type: 'stop' } })}>
                      스톱
                    </button>
                  </span>
                ) : (
                  <span className="small muted nowrap">더미 {g.pileCount}장</span>
                )
              }
            />
          )}
        </>
      }
      main={
        <section className="gs-room" style={{ ['--cw' as string]: `${cw}px` }} aria-label="고스톱 판">
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            className="gs-opps"
            rows={g.captured
              .map((cards, seat) => ({
                seat,
                accent: seatColor(seat),
                score: `${g.scores[seat]}점${g.goes[seat] ? ` · ${g.goes[seat]}고` : ''}`,
                children: (
                  <div className="gs-opp">
                    <span className="gs-opp-hand" aria-label={`손패 ${g.handCounts[seat]}장`}>
                      {Array.from({ length: g.handCounts[seat] }, (_, i) => (
                        <HwatuBack key={i} w={Math.round(cap * 0.8)} />
                      ))}
                    </span>
                    <Captured cards={cards} w={cap} flip stage={stage} />
                  </div>
                ),
              }))
              .filter((r) => r.seat !== me)}
          />
          <div className="gs-field" aria-label="바닥">
            <div className="gs-field-side left">{fieldGroups.slice(0, half).map(renderGroup)}</div>
            <div className="gs-pile" aria-label={`더미 ${g.pileCount}장`}>
              {g.pileCount > 0 ? (
                <span className="gs-pile-stack" style={{ ['--h' as string]: Math.min(7, Math.ceil(g.pileCount / 3)) }}>
                  <HwatuBack w={cw} />
                </span>
              ) : (
                <span className="gs-pile-empty" />
              )}
              <span className="gs-pile-n">{g.pileCount}</span>
            </div>
            <div className="gs-field-side right">{fieldGroups.slice(half).map(renderGroup)}</div>
            {!g.table.length && <span className="gs-field-empty small">바닥이 비었어요</span>}
          </div>
          {me >= 0 && (
            <div className={`gs-me ${myTurn ? 'active' : ''}`} aria-label="내 자리">
              <div className="gs-me-head small">
                <span>
                  <SeatDot seat={me} size={14} /> <b>{names[me]}</b> <b className="gs-me-score">{g.scores[me]}점</b>
                  {g.goes[me] > 0 && <b className="gs-go-badge"> {g.goes[me]}고</b>}
                  {g.lines[me].length > 0 && <span className="gs-lines"> · {g.lines[me].map((l) => `${l.label} ${l.points}`).join(' · ')}</span>}
                </span>
                {pending && (
                  <button type="button" className="btn tiny" onClick={() => setPending(null)}>
                    다른 카드
                  </button>
                )}
              </div>
              <Captured cards={g.captured[me]} w={cap} flip stage={stage} />
              <div className="gs-hand">
                {g.hand.map((x) => {
                  const match = g.table.some((y) => y.month === x.month);
                  return (
                    <span key={x.id} data-flip={x.id} className={`gs-hand-slot ${pending?.id === x.id ? 'lifted' : ''}`}>
                      <HwatuCard card={x} w={cw} glow={playing && match && !pending} dim={(!!pending && pending.id !== x.id) || !playing} onClick={playing ? () => tapHand(x) : undefined} />
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <Ticker text={describe(g.log[g.log.length - 1])} />
        </section>
      }
      side={
        <>
          <SeatList
            t={t}
            view={view}
            emotes={emotes}
            rows={g.captured.map((cards, seat) => ({
              seat,
              accent: seatColor(seat),
              score: `${g.scores[seat]}점${g.goes[seat] ? ` · ${g.goes[seat]}고` : ''}`,
              children: <Captured cards={cards} compact />,
            }))}
          />
          <SideNote title="점수">
            <div>광 3장 3점(비광 끼면 2) · 4장 4 · 5장 15</div>
            <div>고도리(새 3마리) 5 · 홍단·청단·초단 각 3</div>
            <div>열끗·띠 5장부터 1점씩 · 피 10장부터 1점씩</div>
            <div>{g.goAt}점부터 고/스톱 · 3고부터 두 배{c.bak ? ' · 피박·광박 두 배' : ''}</div>
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
            headline={matchOver ? `🎴 ${names[ranks.indexOf(1)]} 님이 이겼어요!` : lastStop?.type === 'stop' ? `🎴 ${names[lastStop.seat]} 님 스톱! +${lastStop.points}` : '나가리!'}
            sub={lastStop?.type === 'stop' ? lastStop.detail.join(' · ') : '아무도 나지 못해 점수 없이 끝났어요'}
            columns={g.roundScores.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.roundScores.map((r) => r[seat]), total: `${total}점` }))}
          />
        ))
      }
    />
  );
}
