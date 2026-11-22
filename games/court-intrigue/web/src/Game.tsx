import { useEffect, useState } from 'react';
import type { RoomView } from '@bg/core';
import { ACTION_DEFS, ActionKind, GameConfig, GameView, LogEntry, ROLE_DEFS, ROLES, Role } from '@bg/court-intrigue-engine';
import { AlertBanner, EmoteBubble, SeatDot, seatColor } from '@bg/ui';
import { GameScreenProps, ResultSheet, TableBanner, TableEmotes, TableLayout, TableTopBar, Ticker, emotesBySeat, rankOf, usePeek, useTable, SideNote } from '@bg/web';
import { Coins, RoleCard } from './theme';

type View = RoomView<GameView, GameConfig>;
const rn = (r: Role) => ROLE_DEFS[r].name;

function describe(e: LogEntry | undefined, names: string[]): string {
  if (!e) return '행동을 고르세요. 역할은 허풍이어도 돼요 — 들키지만 않으면!';
  switch (e.type) {
    case 'act': {
      const d = ACTION_DEFS[e.action];
      return `${names[e.seat]}: ${d.name}${d.role ? ` (${rn(d.role)})` : ''}${e.target !== null ? ` → ${names[e.target]}` : ''}`;
    }
    case 'challenge':
      return `⚡ ${names[e.seat]} 님이 ${names[e.against]}의 ${rn(e.role)}에 도전! ${e.ok ? '거짓말이었어요' : '진짜였어요'}`;
    case 'block':
      return `🚫 ${names[e.seat]}: ${rn(e.role)}로 막아요`;
    case 'lose':
      return `💔 ${names[e.seat]} 님이 ${rn(e.role)}을(를) 잃었어요 (${e.why})`;
    case 'resolve':
      return `${names[e.seat]}의 ${ACTION_DEFS[e.action].name}: ${e.text}`;
    case 'out':
      return `${names[e.seat]} 님이 궁정에서 쫓겨났어요`;
    case 'win':
      return `👑 ${names[e.seat]} 님이 궁정을 차지했어요!`;
  }
}

export function Game({ view, act, onLeave, notify, emotes, onEmote }: GameScreenProps<GameView, GameConfig>) {
  const v = view as View;
  const g = v.game!;
  const c = g.config;
  const pend = g.pending;
  const reaction = g.phase === 'challenge' || g.phase === 'block' || g.phase === 'blockChallenge';
  const t = useTable(view, notify, {
    title: 'Court Intrigue',
    turn: g.phase === 'lose' ? g.loss?.seat ?? g.turn : g.turn,
    playing: g.status === 'playing',
    simultaneous: reaction,
    quiet: reaction,
    stepKey: `${g.turn}-${g.phase}-${g.log.length ? g.log[g.log.length - 1].n : 0}`,
    mySub: reaction ? '도전하거나 통과해요' : g.phase === 'lose' ? '잃을 카드를 골라요' : '행동을 골라요',
  });
  const names = t.names;
  const me = t.me;
  const myTurn = t.myTurn;
  const { bySeat } = emotesBySeat(emotes);
  const [peek, setPeek] = usePeek(`${g.status}-${g.round}`);
  const [action, setAction] = useState<ActionKind | null>(null);
  const [keep, setKeep] = useState<string[]>([]);
  useEffect(() => {
    setAction(null);
    setKeep([]);
  }, [g.phase, g.turn]);

  const myLive = me >= 0 ? g.hands[me].filter((h) => !h.lost) : [];
  const opps = Array.from({ length: g.players }, (_, i) => i).filter((s) => s !== me && g.influence[s] > 0);

  const doAct = (a: ActionKind, target?: number) => act('move', { move: { type: 'act', action: a, target } });

  // 배너
  let title = '';
  let hint = '';
  const claim = pend ? ACTION_DEFS[pend.action].role : null;
  if (g.phase === 'action') {
    title = myTurn ? '행동을 고르세요' : `${names[g.turn]} 님이 행동을 고르는 중`;
    hint = myTurn ? '역할이 필요한 행동은 그 카드가 없어도 할 수 있어요. 다만 도전받으면…' : '무엇을 할까요?';
  } else if (g.phase === 'challenge' && pend) {
    title = `${names[pend.actor]}: ${ACTION_DEFS[pend.action].name}${claim ? ` — 「나는 ${rn(claim)}이다」` : ''}${pend.target !== null ? ` → ${names[pend.target]}` : ''}`;
    hint = myTurn ? '거짓말 같으면 도전! 아니면 통과' : '다른 사람이 도전할지 기다리는 중';
  } else if (g.phase === 'block' && pend) {
    title = `${names[pend.actor]}의 ${ACTION_DEFS[pend.action].name}${pend.target !== null ? ` → ${names[pend.target]}` : ''} — 막을 사람?`;
    hint = myTurn ? `막으려면 ${ACTION_DEFS[pend.action].blockers.map(rn).join('·')}라고 주장해요 (허풍 가능)` : '막을지 기다리는 중';
  } else if (g.phase === 'blockChallenge' && pend) {
    title = `${names[pend.blocker!]}: 「${rn(pend.blockRole!)}로 막는다」`;
    hint = myTurn ? '이 막기가 거짓말 같으면 도전!' : '도전할지 기다리는 중';
  } else if (g.phase === 'lose' && g.loss) {
    title = g.loss.seat === me ? '잃을 카드를 고르세요' : `${names[g.loss.seat]} 님이 카드를 잃어요`;
    hint = g.loss.why;
  } else if (g.phase === 'exchange') {
    title = myTurn ? `남길 카드 ${myLive.length}장을 고르세요` : `${names[g.turn]} 님이 카드를 바꾸는 중`;
    hint = '고르지 않은 카드는 더미로 돌아가요';
  }

  const matchOver = g.status === 'match-over';
  const legal = new Set(g.legal);
  const pool = g.phase === 'exchange' && myTurn ? [...myLive.map((h) => ({ id: h.id, role: h.role! })), ...g.drawn.map((d) => ({ id: d.id, role: d.role }))] : [];

  return (
    <TableLayout
      mine={myTurn}
      splash={t.splash}
      top={
        <>
          <TableTopBar view={view} act={act} round={g.round} rounds={c.rounds} over={matchOver}>
            <TableEmotes emotes={emotes} onEmote={onEmote} small />
          </TableTopBar>
          {g.status === 'playing' && <TableBanner t={t} act={act} title={title} hint={hint} icon={<SeatDot seat={pend?.actor ?? g.turn} size={16} />} />}
        </>
      }
      main={
        <>
          <section className="ci-court" aria-label="궁정">
            {Array.from({ length: g.players }, (_, s) => s)
              .filter((s) => s !== me)
              .map((s) => {
                const m = view.members.find((x) => x.seat === s);
                const out = g.influence[s] === 0;
                const acting = g.actors.includes(s);
                return (
                  <div key={s} className={`ci-seat ${out ? 'out' : ''} ${acting ? 'acting' : ''} ${pend?.target === s ? 'targeted' : ''}`} style={{ ['--seat' as string]: seatColor(s) }}>
                    <div className="ci-seat-head small">
                      <span className="seat-name">
                        <EmoteBubble e={bySeat.get(s)} />
                        <b>{names[s]}</b>
                        {m?.bot && <span className={`tag bot ${m.bot}`}>🤖</span>}
                        {m && !m.connected && <span className="tag away-tag">끊김</span>}
                      </span>
                      <Coins n={g.coins[s]} />
                    </div>
                    <div className="ci-cards">
                      {g.hands[s].map((h) => (
                        <RoleCard key={h.id} flip={`r${h.id}`} role={h.role} lost={h.lost} size="sm" />
                      ))}
                    </div>
                    {reaction && g.passed.includes(s) && <span className="ci-pass">통과 ✓</span>}
                  </div>
                );
              })}
          </section>

          {pend && g.status === 'playing' && (
            // 지금 걸린 선언: 누가 · 무슨 역할로 · 무엇을 · 누구에게 (+ 막기)
            <section className="ci-claim" key={`${pend.actor}-${pend.action}-${pend.target}-${pend.blocker}`} aria-live="polite">
              <span className="ci-claim-who" style={{ ['--seat' as string]: seatColor(pend.actor) }}>
                <SeatDot seat={pend.actor} size={12} /> <b>{names[pend.actor]}</b>
              </span>
              {ACTION_DEFS[pend.action].role && <span className="ci-claim-role">{ROLE_DEFS[ACTION_DEFS[pend.action].role!].icon} {rn(ACTION_DEFS[pend.action].role!)} 주장</span>}
              <span className="ci-claim-act">{ACTION_DEFS[pend.action].name}</span>
              {pend.target !== null && (
                <>
                  <span aria-hidden>→</span>
                  <span className="ci-claim-who" style={{ ['--seat' as string]: seatColor(pend.target) }}>
                    <SeatDot seat={pend.target} size={12} /> <b>{names[pend.target]}</b>
                  </span>
                </>
              )}
              {pend.blocker !== null && pend.blockRole && (
                <span className="ci-claim-block">
                  🚫 {names[pend.blocker]} · {ROLE_DEFS[pend.blockRole].icon} {rn(pend.blockRole)}로 막기
                </span>
              )}
              {reaction && <span className="small muted ci-claim-wait">통과 {g.passed.length}명</span>}
            </section>
          )}

          {me >= 0 && g.status === 'playing' && g.influence[me] > 0 && (
            <section className="hand-panel" aria-label="내 영향력">
              <div className="hand-panel-head small">
                <span>
                  <SeatDot seat={me} size={14} /> 내 카드 (나만 봐요)
                </span>
                <Coins n={g.coins[me]} />
              </div>
              <div className="hand-row">
                {g.phase === 'exchange' && myTurn
                  ? pool.map((p) => (
                      <RoleCard key={p.id} role={p.role} size="md" selected={keep.includes(p.id)} onClick={() => setKeep((k) => (k.includes(p.id) ? k.filter((x) => x !== p.id) : k.length < myLive.length ? [...k, p.id] : k))} />
                    ))
                  : g.hands[me].map((h) => (
                      <RoleCard key={h.id} flip={`r${h.id}`} role={h.role} lost={h.lost} size="md" onClick={g.phase === 'lose' && g.loss?.seat === me && !h.lost ? () => act('move', { move: { type: 'lose', cardId: h.id } }) : undefined} />
                    ))}
              </div>
              {g.phase === 'exchange' && myTurn && (
                <div className="action-row">
                  <button className="btn primary" disabled={keep.length !== myLive.length} onClick={() => act('move', { move: { type: 'keep', cardIds: keep } })}>
                    {keep.length}/{myLive.length}장 남기기
                  </button>
                </div>
              )}
              {g.phase === 'action' && myTurn && (
                <>
                  <div className="ci-actions">
                    {(Object.keys(ACTION_DEFS) as ActionKind[]).map((a) => {
                      const d = ACTION_DEFS[a];
                      const bluff = !!d.role && !myLive.some((h) => h.role === d.role);
                      return (
                        <button
                          key={a}
                          className={`ci-act ${action === a ? 'on' : ''} ${bluff ? 'bluff' : ''}`}
                          disabled={!legal.has(a)}
                          onClick={() => (d.target ? setAction(a) : doAct(a))}
                          title={d.text}
                        >
                          <b>{d.name}</b>
                          <small>{d.role ? `${ROLE_DEFS[d.role].icon} ${rn(d.role)}${bluff ? ' (허풍)' : ''}` : a === 'coup' ? `금화 ${c.coupCost}` : a === 'income' ? '+1' : '+2'}</small>
                        </button>
                      );
                    })}
                  </div>
                  {action && (
                    <div className="sl-step action-row">
                      <span className="small">{ACTION_DEFS[action].name} 대상:</span>
                      {opps
                        .filter((s) => action !== 'steal' || g.coins[s] > 0)
                        .map((s) => (
                          <button key={s} className="chip" style={{ borderColor: seatColor(s) }} onClick={() => doAct(action, s)}>
                            {names[s]} <Coins n={g.coins[s]} />
                          </button>
                        ))}
                      <button className="btn ghost small-btn" onClick={() => setAction(null)}>
                        취소
                      </button>
                    </div>
                  )}
                </>
              )}
              {reaction && myTurn && (
                <div className="action-row ci-react">
                  {g.phase !== 'block' && (
                    <button className="btn danger-btn" onClick={() => act('move', { move: { type: 'challenge' } })}>
                      ⚡ 도전! 「거짓말이야」
                    </button>
                  )}
                  {g.phase === 'block' &&
                    pend &&
                    ACTION_DEFS[pend.action].blockers.map((r) => (
                      <button key={r} className={`btn ${myLive.some((h) => h.role === r) ? 'primary' : ''}`} onClick={() => act('move', { move: { type: 'block', role: r } })}>
                        🚫 {rn(r)}로 막기{myLive.some((h) => h.role === r) ? '' : ' (허풍)'}
                      </button>
                    ))}
                  <button className="btn" onClick={() => act('move', { move: { type: 'pass' } })}>
                    통과
                  </button>
                </div>
              )}
            </section>
          )}
          {me >= 0 && g.influence[me] === 0 && g.status === 'playing' && <p className="muted center">궁정에서 쫓겨났어요. 남은 사람들의 음모를 지켜봐요 👀</p>}
          <Ticker text={describe(g.log[g.log.length - 1], names)} />
        </>
      }
      side={
        <>
          {me >= 0 && g.influence[me] === 1 && g.status === 'playing' && <AlertBanner icon="⚠️" title="영향력이 하나 남았어요" critical sub="한 번만 더 잃으면 탈락이에요" />}
          <SideNote title={`역할 (각 ${c.copies}장)`} className="ci-ref">
            {ROLES.map((r) => (
              <div key={r} className="ci-ref-row">
                <span>
                  {ROLE_DEFS[r].icon} <b>{rn(r)}</b>
                </span>
                <span className="muted">
                  {ROLE_DEFS[r].action !== '—' ? ROLE_DEFS[r].action : ''}
                  {ROLE_DEFS[r].block !== '—' ? ` · 🚫 ${ROLE_DEFS[r].block}` : ''}
                </span>
              </div>
            ))}
            <div className="muted">
              누구나: 소득 +1 · 원조 +2 · 쿠데타(금화 {c.coupCost}, {c.mustCoup}개 이상이면 반드시)
            </div>
          </SideNote>
          {g.log.length > 0 && (
            <section className="panel log-list small" aria-label="기록">
              {[...g.log]
                .reverse()
                .slice(0, 14)
                .map((e) => (
                  <div key={e.n}>{describe(e, names)}</div>
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
            headline={`👑 ${names[g.winners[g.winners.length - 1]]} 님이 궁정을 차지했어요!`}
            sub={g.outOrder.length ? `쫓겨난 순서: ${g.outOrder.map((s) => names[s]).join(' → ')}` : undefined}
            columns={g.winners.map((_, i) => `${i + 1}판`)}
            rows={g.totals.map((total, seat) => ({ seat, rank: rankOf(g.totals)[seat], cells: g.winners.map((w) => (w === seat ? '👑' : '')), total: `${total}승` }))}
          />
        ))
      }
    />
  );
}
