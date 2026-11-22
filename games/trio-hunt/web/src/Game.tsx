import type { RoomView } from '@bg/core';
import { Flip, GameConfig, GameView, LogEntry, Move } from '@bg/trio-hunt-engine';
import { EmoteBubble, SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, SideNote, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, rankOf, useLogSounds, usePeek, useTable } from '@bg/web';
import { TrioCard } from './theme';

type View = RoomView<GameView, GameConfig>;

/** 숫자 뒤 「을/를」: 읽는 소리 끝에 받침이 있으면 을 (일·삼·육·칠·팔·십·십일·십삼…) */
const eul = (n: number) => ([1, 3, 6, 7, 8].includes(n % 10) || n === 10 ? '을' : '를');

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const t = useTable(view, notify, { title: 'Trio Hunt', turn: g.turn, playing: g.status === 'playing', mySub: '같은 숫자 세 장을 찾아요' });
  // 소리: 뒤집으면 카드 뒤집기, 세트는 축하, 틀리면 실패음
  useLogSounds(g.log, (e) => (e.type === 'flip' ? 'flip' : e.type === 'trio' ? 'success' : e.type === 'miss' ? 'fail' : e.type === 'win' ? 'win' : null));
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const reveal = (mv: Move) => {
    if (!myTurn) return t.warn(t.waitingMsg);
    act('move', { move: mv });
  };
  const flipped = new Map(g.flips.map((f) => [f.id, f]));
  const missShown = new Map(g.lastMiss.map((f) => [f.id, f]));
  const target = g.flips[0]?.n;

  const describe = (e: LogEntry | undefined) => {
    if (!e) return '누군가의 가장 작은·큰 카드나 가운데 카드를 뒤집어 같은 숫자 세 장을 모아요';
    switch (e.type) {
      case 'flip':
        return `${names[e.seat]} 님이 ${e.flip.from === -1 ? '가운데' : `${names[e.flip.from]} 님의 ${e.flip.end === 'low' ? '가장 작은' : '가장 큰'}`} 카드를 뒤집었어요: ${e.flip.n}`;
      case 'trio':
        return `${names[e.seat]} 님이 ${e.value} 세 장을 모았어요!`;
      case 'miss':
        return `다른 숫자 — ${e.flips.map((f) => f.n).join(' · ')} 를 기억해 두세요`;
      case 'win':
        return e.seven ? `${names[e.seat]} 님이 7 세 장으로 바로 승리!` : `${names[e.seat]} 님 승리!`;
    }
  };
  const title = myTurn ? (g.flips.length ? `${target}${eul(target!)} ${3 - g.flips.length}장 더!` : '뒤집을 카드를 골라요') : `${names[g.turn]} 님 차례`;
  const hint = myTurn ? '다른 숫자가 나오면 차례가 끝나고 다시 덮여요 — 공개된 숫자를 기억해요' : '뒤집히는 카드를 잘 봐 두세요';
  const matchOver = g.status === 'match-over';
  const ranks = rankOf(g.totals);

  const handRow = (s: number) => {
    const h = g.hands[s];
    const mine = s === me;
    const cards = mine ? g.hand : Array.from({ length: h.count }, () => null);
    return (
      <div key={s} className={`th-seat ${g.turn === s ? 'acting' : ''} ${mine ? 'mine' : ''}`} style={{ ['--seat' as string]: seatColor(s) }}>
        <div className="th-seat-head small">
          <span className="seat-name">
            <EmoteBubble e={bySeat.get(s)} />
            <SeatDot seat={s} size={11} /> <b>{mine ? '나' : names[s]}</b>
            {view.members.find((x) => x.seat === s)?.bot && ' 🤖'}
          </span>
          <span className="th-trios">
            {g.trios[s].map((n, i) => (
              <span key={i} className="th-trio" title={`${n} 세트`}>
                <TrioCard n={n} size="sm" />
              </span>
            ))}
            <span className="muted">{g.trios[s].length}/{c.goal}</span>
          </span>
        </div>
        <div className="th-hand">
          {myTurn && h.lowId && (
            <button className="th-end" onClick={() => reveal({ type: 'reveal', seat: s, end: 'low' })} title="가장 작은 카드 뒤집기">
              ◀ 작은
            </button>
          )}
          {cards.map((card, i) => {
            const id = mine ? card!.id : null;
            const open = id ? flipped.get(id) ?? missShown.get(id) : null;
            // 남의 패: 이번 차례에 뒤집힌 카드는 그 자리(끝)에 앞면으로
            const otherOpen = !mine ? g.flips.filter((f) => f.from === s) : [];
            const lowOpen = otherOpen.filter((f) => f.end === 'low');
            const highOpen = otherOpen.filter((f) => f.end === 'high');
            const missFor = !mine ? g.lastMiss.filter((f) => f.from === s) : [];
            let face: Flip | null = null;
            if (!mine) {
              if (i < lowOpen.length) face = lowOpen[i];
              else if (i >= h.count - highOpen.length) face = highOpen[h.count - 1 - i];
              else if (i < missFor.filter((f) => f.end === 'low').length) face = missFor.filter((f) => f.end === 'low')[i];
              else if (i >= h.count - missFor.filter((f) => f.end === 'high').length) face = missFor.filter((f) => f.end === 'high')[h.count - 1 - i];
            }
            if (mine) return <TrioCard key={card!.id} n={card!.n} size="sm" glow={!!open && flipped.has(card!.id)} flip={`th${card!.id}`} />;
            return <TrioCard key={i} n={face?.n ?? null} faceDown={!face} size="sm" glow={!!face && flipped.has(face.id)} />;
          })}
          {myTurn && h.highId && h.highId !== h.lowId && (
            <button className="th-end" onClick={() => reveal({ type: 'reveal', seat: s, end: 'high' })} title="가장 큰 카드 뒤집기">
              큰 ▶
            </button>
          )}
        </div>
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
          <section className="th-tray" aria-label="이번에 뒤집은 카드">
            {g.flips.length ? (
              g.flips.map((f) => <TrioCard key={f.id} n={f.n} size="lg" glow />)
            ) : g.lastMiss.length ? (
              <>
                <span className="small th-miss-label">방금 공개:</span>
                {g.lastMiss.map((f) => (
                  <TrioCard key={f.id} n={f.n} size="md" />
                ))}
              </>
            ) : (
              <span className="muted small">같은 숫자 세 장을 이어 뒤집으면 세트!</span>
            )}
          </section>
          <section className="th-middle" aria-label="가운데 카드">
            {g.middle.map((id, idx) => {
              if (!id) return <span key={idx} className="th-gap" />;
              const f = flipped.get(id) ?? missShown.get(id);
              return <TrioCard key={id} n={f?.n ?? null} faceDown={!f} size="md" glow={!!f && flipped.has(id)} onClick={myTurn && !flipped.has(id) ? () => reveal({ type: 'reveal', seat: -1, idx }) : undefined} />;
            })}
          </section>
          <section className="th-seats" aria-label="손패">
            {Array.from({ length: g.players }, (_, k) => (me >= 0 ? (me + 1 + k) % g.players : k)).map(handRow)}
          </section>
          <Ticker text={describe(g.log[g.log.length - 1])} />
        </>
      }
      side={
        <>
          <section className="panel small th-goal">
            <b>목표</b> 세트 {c.goal}개{c.sevenWins ? ' · 또는 7 세 장이면 바로 승리' : ''}
          </section>
          <SideNote title="규칙" className="th-ref">
            <div>· 내 차례에 계속 뒤집어요: 누군가(나 포함)의 가장 작은 카드나 가장 큰 카드, 또는 가운데 카드</div>
            <div>· 같은 숫자면 계속, 세 장이 모이면 세트를 가져가요</div>
            <div>· 다른 숫자가 나오면 차례 끝 — 다시 덮여요 (기억!)</div>
            <div>· 손패는 작은 숫자부터 정렬돼 있어요</div>
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
            headline={`🃏 ${names[g.winners[g.winners.length - 1]]} 님 승리!`}
            sub="이긴 사람 +3 · 모은 세트마다 +1"
            columns={g.roundScores.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: ranks[seat], cells: g.roundScores.map((r) => r[seat]), total }))}
          />
        ))
      }
    />
  );
}
