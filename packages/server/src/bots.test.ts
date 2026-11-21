import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameModule, RuleError } from '@bg/core';
import { crownMarch } from '@bg/crown-march-engine';
import { expeditionLines } from '@bg/expedition-lines-engine';
import { Rooms } from './rooms';

afterEach(() => vi.useRealTimers());

function withHost(game = crownMarch as never, opts = {}) {
  const rooms = new Rooms(game, () => {}, { botDelayMs: 0, ...opts });
  const { room, member: host } = rooms.create('호스트');
  rooms.connect(room, host);
  return { rooms, room, host };
}

/** 동시 진행 시험용 게임: 모두가 숫자 하나를 몰래 고르고, 다 고르면 한 판 끝 */
interface SimMatch {
  picks: (number | null)[];
  status: 'playing' | 'match-over';
  rounds: number;
}
const simul: GameModule<{ rounds: number; turnTimerSec: number }, SimMatch, { pick: number }, { picks: (number | boolean | null)[] }> = {
  id: 'simul',
  players: { min: 2, max: 4 },
  defaultConfig: { rounds: 1, turnTimerSec: 30 },
  sanitizeConfig: (c) => ({ rounds: 1, turnTimerSec: c.turnTimerSec ?? 30 }),
  validateConfig: () => [],
  lobbySummary: () => ({ text: '', warnings: [], info: {} }),
  turnTimerSec: (c) => c.turnTimerSec,
  newMatch: (_c, n) => ({ picks: Array(n).fill(null), status: 'playing', rounds: 0 }),
  isMove: (x): x is { pick: number } => typeof (x as { pick?: unknown })?.pick === 'number',
  applyMove(m, seat, move) {
    if (m.picks[seat] !== null) throw new RuleError('이미 골랐어요');
    m.picks[seat] = move.pick;
    if (m.picks.every((p) => p !== null)) m.status = 'match-over';
  },
  autoMove: () => ({ pick: 0 }),
  viewFor: (m, seat) => ({ picks: m.picks.map((p, i) => (i === seat ? p : p !== null)) }),
  status: (m) => m.status,
  turn: (m) => Math.max(0, m.picks.findIndex((p) => p === null)),
  actors: (m) => m.picks.flatMap((p, i) => (p === null ? [i] : [])),
  round: () => 1,
  config: () => ({ rounds: 1, turnTimerSec: 30 }),
  totals: (m) => m.picks.map((p) => p ?? 0),
  startNextRound: () => {},
  continueMatch: (m) => m,
  roundsDone: () => 0,
};

describe('봇', () => {
  it('방장만 봇을 넣고, 자리 수를 넘지 않고, 봇은 방장이 되지 않는다', () => {
    const { rooms, room, host } = withHost();
    const { member: guest } = rooms.join(room.code, { name: '손님' });
    rooms.connect(room, guest);
    expect(() => rooms.addBot(room, guest, 'easy')).toThrow('방장만');
    const b1 = rooms.addBot(room, host, 'easy');
    rooms.addBot(room, host, 'hard');
    expect(() => rooms.addBot(room, host, 'normal')).toThrow('자리가 다 찼어요');
    expect(b1.name).toBe('봇 하나');
    const v = rooms.view(room, host);
    expect(v.members.filter((m) => m.bot).map((m) => m.bot)).toEqual(['easy', 'hard']);
    expect(v.members.find((m) => m.bot)?.connected).toBe(true);
    rooms.setBotLevel(room, host, b1.id, 'normal');
    expect(b1.bot).toBe('normal');
    // 사람이 모두 나가면 봇만 남은 방은 없어진다
    rooms.leave(room, guest);
    rooms.disconnect(room, host);
    rooms.leave(room, host);
    expect(rooms.rooms.size).toBe(0);
  });

  it('사람 1명 + 봇 3명이 끝까지 (Crown March, 사람 차례는 시간 초과로)', () => {
    const { rooms, room, host } = withHost();
    rooms.setConfig(room, host, { turnTimerSec: 0 });
    for (const l of ['easy', 'normal', 'hard'] as const) rooms.addBot(room, host, l);
    rooms.setConfig(room, host, { boardSize: 11, stones: 92, heroes: 3, handLimit: 4, cardCopies: 2 });
    rooms.start(room, host);
    for (let i = 0; i < 2000 && crownMarch.status(room.match as never) === 'playing'; i++) {
      if (crownMarch.turn(room.match as never) === host.seat) rooms.timeout(room);
      else rooms.stepBots(room);
    }
    expect(crownMarch.status(room.match as never)).toBe('match-over');
  });

  it('봇 차례가 되면 타이머로 알아서 둔다 (Expedition Lines)', async () => {
    vi.useFakeTimers();
    const changes: number[] = [];
    const rooms = new Rooms(expeditionLines, () => changes.push(1), { botDelayMs: 10 });
    const { room, member: host } = rooms.create('호스트');
    rooms.connect(room, host);
    rooms.addBot(room, host, 'hard');
    rooms.start(room, host);
    const match = room.match as { state: { turn: number; phase: string } };
    if (match.state.turn === host.seat) rooms.timeout(room); // 사람 차례면 넘김
    expect(match.state.turn).not.toBe(host.seat);
    await vi.advanceTimersByTimeAsync(15); // 놓기
    await vi.advanceTimersByTimeAsync(15); // 가져오기
    expect(match.state.turn).toBe(host.seat);
    expect(changes.length).toBeGreaterThanOrEqual(2);
  });

  it('배포로 넘기는 중(freeze)에는 봇도 멈추고, 넘겨받은 쪽에서 이어서 둔다', async () => {
    vi.useFakeTimers();
    const a = new Rooms(expeditionLines, () => {}, { botDelayMs: 10 });
    const { room, member: host } = a.create('호스트');
    a.connect(room, host);
    a.addBot(room, host, 'normal');
    a.start(room, host);
    const m = room.match as { state: { turn: number } };
    if (m.state.turn === host.seat) a.timeout(room);
    a.freezeTimers();
    await vi.advanceTimersByTimeAsync(100);
    expect(m.state.turn).not.toBe(host.seat); // 봇이 안 둠
    const snap = JSON.parse(JSON.stringify(a.exportAll()));
    const b = new Rooms(expeditionLines, () => {}, { botDelayMs: 10 });
    b.importAll(snap);
    const moved = b.rooms.get(room.code)!;
    expect(moved.members.find((x) => x.bot)?.bot).toBe('normal');
    await vi.advanceTimersByTimeAsync(40);
    expect((moved.match as { state: { turn: number } }).state.turn).toBe(host.seat);
  });
});

describe('동시 진행 (actors)', () => {
  it('여럿이 동시에 고르고, 한 명이 골라도 타이머는 그대로, 시간 초과면 남은 사람만 자동', () => {
    vi.useFakeTimers();
    const rooms = new Rooms(simul as never);
    const { room, member: host } = rooms.create('호스트');
    rooms.connect(room, host);
    const { member: p1 } = rooms.join(room.code, { name: 'p1' });
    rooms.connect(room, p1);
    const { member: p2 } = rooms.join(room.code, { name: 'p2' });
    rooms.connect(room, p2);
    rooms.start(room, host);
    expect(rooms.view(room, host).actors).toEqual([0, 1, 2]);
    const deadline = room.turnDeadline;
    vi.advanceTimersByTime(5000);
    rooms.move(room, p1, { pick: 7 });
    expect(room.turnDeadline).toBe(deadline);
    expect(rooms.view(room, host).actors).toEqual([0, 2]);
    // 다른 사람의 선택은 보이지 않고 "골랐음"만
    expect((rooms.view(room, host).game as { picks: unknown[] }).picks[1]).toBe(true);
    vi.advanceTimersByTime(25_001);
    expect((room.match as SimMatch).picks).toEqual([0, 7, 0]);
    expect((room.match as SimMatch).status).toBe('match-over');
  });

  it('끊긴 사람만 대신 진행한다', () => {
    const rooms = new Rooms(simul as never);
    const { room, member: host } = rooms.create('호스트');
    rooms.connect(room, host);
    const { member: p1 } = rooms.join(room.code, { name: 'p1' });
    rooms.connect(room, p1);
    rooms.setConfig(room, host, { turnTimerSec: 0 });
    rooms.start(room, host);
    rooms.disconnect(room, p1);
    p1.disconnectedAt = Date.now() - 30_000;
    expect(rooms.nudgeInMs(room)).toBe(0);
    rooms.nudge(room, host);
    expect((room.match as SimMatch).picks).toEqual([null, 0]);
    expect(rooms.view(room, host).actors).toEqual([0]);
  });
});

describe('방 목록', () => {
  it('목록에 보이기 · 사람이 접속한 방만 · 상태', () => {
    const rooms = new Rooms(crownMarch);
    const { room, member: host } = rooms.create('호스트', 'pw');
    rooms.connect(room, host);
    rooms.addBot(room, host, 'easy');
    const { room: r2, member: h2 } = rooms.create('둘째');
    rooms.connect(room, h2);
    rooms.disconnect(r2, h2);
    let list = rooms.listing();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ code: room.code, host: '호스트', players: 2, bots: 1, hasPassword: true, state: 'lobby', open: true, maxPlayers: 4 });
    rooms.start(room, host);
    list = rooms.listing();
    expect(list[0]).toMatchObject({ state: 'playing', round: 1, open: false });
    rooms.setListed(room, host, false);
    expect(rooms.listing()).toHaveLength(0);
  });
});
