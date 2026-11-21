import { CURSOR_SCRIPT, ORIGIN, center, clickAt, gameSocket, glide, recorder, sleep, typeSlow, waitFor } from '../lib.mjs';

export const T = 'crown-march';

const DIRS = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

/** 봇 한 명 (또는 브라우저 플레이어와 같은 자리를 쓰는 그림자 소켓) */
class Bot {
  constructor(name) {
    this.name = name;
    this.s = gameSocket('crown-march');
    this.view = null;
    this.s.on('room', (v) => {
      this.view = v;
      this.tick();
    });
    this.auto = null;
    this.busy = false;
  }
  call(ev, p = {}) {
    return new Promise((r) => this.s.emit(ev, p, r));
  }
  async create(password) {
    const r = await this.call('create', { name: this.name, password });
    this.code = r.code;
    return r;
  }
  join(code, extra = {}) {
    this.code = code;
    return this.call('join', { code, name: this.name, ...extra });
  }
  get g() {
    return this.view?.game;
  }
  get myTurn() {
    const g = this.g;
    return !!g && g.status === 'playing' && g.turn === g.me;
  }
  /** 이 카드를 내면 일어날 일: 'place' | 'hero' */
  kind(card) {
    const g = this.g;
    const [dx, dy] = DIRS[card.dir];
    const x = g.crown.x + dx * card.dist;
    const y = g.crown.y + dy * card.dist;
    const v = g.board[y * g.size + x];
    return v === -1 ? 'place' : 'hero';
  }
  plays(kind) {
    const g = this.g;
    const hand = g.hands[g.me] ?? [];
    return hand.filter((c) => g.can.plays.includes(c.id) && (!kind || this.kind(c) === kind));
  }
  /** 자동 진행: { delay, heroRate, emoteRate, emotes } */
  play(opts) {
    this.auto = opts;
    this.tick();
  }
  stop() {
    this.auto = null;
  }
  tick() {
    if (!this.auto || !this.myTurn || this.busy) return;
    this.busy = true;
    const { delay = 900, heroRate = 0.15, emoteRate = 0, emotes = ['thumbs', 'nice', 'think', 'fire', 'plan', 'meh'] } = this.auto;
    setTimeout(async () => {
      const move = this.chooseMove(heroRate);
      if (Math.random() < emoteRate) this.s.emit('emote', { id: emotes[Math.floor(Math.random() * emotes.length)] }, () => {});
      const r = move ? await this.call('move', { move }) : { ok: true };
      this.busy = false;
      if (!r.ok) console.log(`[${this.name}] ${r.error}`);
      this.tick();
    }, delay);
  }
  chooseMove(heroRate = 0.15) {
    const g = this.g;
    if (!g || g.turn !== g.me || g.status !== 'playing') return null;
    const place = this.plays('place');
    const hero = this.plays('hero');
    if (hero.length && Math.random() < heroRate) return { type: 'play', cardId: hero[0].id };
    if (place.length) return { type: 'play', cardId: place[Math.floor(Math.random() * place.length)].id };
    if (g.can.draw) return { type: 'draw' };
    if (hero.length) return { type: 'play', cardId: hero[0].id };
    return { type: 'pass' };
  }
  close() {
    this.s.close();
  }
}




/** 브라우저 쪽 손패에서 카드의 DOM 순서 */
function handSel(me, card) {
  const i = me.g.hands[me.g.me].findIndex((c) => c.id === card.id);
  return `.hand > .move-card:nth-child(${i + 1})`;
}
async function myTurn(me) {
  await waitFor(() => me.myTurn, 60_000, 'my turn');
}
/** 브라우저 플레이어: 카드를 눌러 경로를 보여 준 뒤 한 번 더 눌러 실행 */
async function clickPlay(page, me, card, pause = 1100) {
  await clickAt(page, handSel(me, card));
  await sleep(pause);
  await clickAt(page, handSel(me, card), 150);
}
/** 브라우저 플레이어: 카드를 보드로 끌어다 놓기 */
async function dragPlay(page, me, card) {
  const from = await center(page, handSel(me, card));
  await page.mouse.move(from.x, from.y, { steps: 14 });
  await sleep(220);
  await page.mouse.down();
  const to = await center(page, '.board-frame');
  await page.mouse.move(from.x + (to.x - from.x) * 0.15, from.y - 30, { steps: 6 });
  await page.mouse.move(to.x, to.y, { steps: 26 });
  await sleep(350);
  await page.mouse.up();
}
/** 화면 밖에서 빠르게 진행(브라우저 플레이어 몫은 그림자 소켓이 둔다) */
async function fastForward(me, bots, until, heroRate = 0.05) {
  for (const b of bots) b.play({ delay: 40, heroRate });
  while (!(await until())) {
    if (me.g.status !== 'playing') throw new Error('round ended while fast-forwarding');
    if (me.myTurn) {
      const move = me.chooseMove(0);
      if (move) await me.call('move', { move });
    }
    await sleep(60);
  }
  for (const b of bots) b.stop();
  await waitFor(() => bots.every((b) => !b.busy), 5000, 'bots idle');
}

export async function desktop(browser, only) {
  const want = (n) => !only.length || only.includes(n);
  if (!['intro', 'lobby', 'play', 'knight', 'ending'].some(want)) return;
  const size = { width: 1280, height: 800 };
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2, locale: 'ko-KR', colorScheme: 'dark' });
  await ctx.addInitScript(CURSOR_SCRIPT);
  const page = await ctx.newPage();
  const shot = { width: size.width * 2, height: size.height * 2 };
  const bots = [new Bot('도윤'), new Bot('서연')];

  // 0) 첫 화면: 왕관 시연 → 게임 방법 모달 훑기
  await page.goto(`${ORIGIN}/${T}/`);
  await page.mouse.move(640, 300);
  await sleep(400);
  if (want('intro')) {
    const intro = await recorder(page, T, 'intro', shot);
    await sleep(3500);
    await clickAt(page, 'button:has-text("게임 방법 보기")');
    await sleep(1400);
    for (const n of [2, 3, 4, 6]) {
      await clickAt(page, `.g-nav .chip:nth-child(${n})`, 150);
      await sleep(1900);
    }
    await page.keyboard.press('Escape');
    await sleep(900);
    await intro.stop();
  }

  // 1) 로비: 방 만들기 → QR → 친구 입장 → 규칙 프리셋
  let rec = want('lobby') ? await recorder(page, T, 'lobby', shot) : null;
  await sleep(500);
  await clickAt(page, 'input[placeholder="예: 민지"]');
  await typeSlow(page, '민지');
  await sleep(300);
  await clickAt(page, 'button.big-btn:has-text("방 만들기")');
  await page.waitForSelector('.code.big');
  const code = (await page.textContent('.code.big')).trim();
  await sleep(1200);
  await bots[0].join(code);
  await sleep(500);
  bots[0].s.emit('emote', { id: 'please' }, () => {});
  await sleep(900);
  await bots[1].join(code);
  await sleep(600);
  bots[1].s.emit('emote', { id: 'crown' }, () => {});
  await sleep(700);
  for (const p of ['폐허 지도', '4명 팀전', '3명 추천']) {
    await clickAt(page, `.presets .chip:has-text("${p}")`);
    await sleep(1300);
  }
  await glide(page, 'button:has-text("게임 시작")');
  await sleep(600);
  if (rec) await rec.stop();

  const token = await page.evaluate(([c, t]) => localStorage.getItem(`bg:${t}:token:${c}`), [code, T]);
  const me = new Bot('민지');
  await me.join(code, { token });
  await waitFor(() => me.view, 5000, 'shadow view');

  // 2) 게임: 카드 선택(경로 미리보기) → 돌 놓기, 끌어다 놓기, 상대 차례·감정 표현
  rec = want('play') ? await recorder(page, T, 'play', shot) : null;
  await sleep(300);
  await clickAt(page, 'button:has-text("게임 시작")');
  await waitFor(() => me.g?.status === 'playing', 5000, 'game start');
  for (const b of bots) b.play({ delay: 1100, heroRate: 0, emoteRate: 0.4 });
  await sleep(1200);
  for (let turn = 0; turn < 3; turn++) {
    await myTurn(me);
    await sleep(turn === 0 ? 1600 : 1200);
    const place = me.plays('place');
    if (!place.length) break;
    const card = place[Math.floor(Math.random() * place.length)];
    if (turn === 1) await dragPlay(page, me, card);
    else await clickPlay(page, me, card);
    await waitFor(() => !me.myTurn, 5000, 'turn passed');
    if (turn === 0) {
      await sleep(500);
      await clickAt(page, '.deck-col .emote-toggle');
      await sleep(900);
      await clickAt(page, '.emote-phrases .chip:has-text("계획대로")');
    }
  }
  await sleep(2500);
  for (const b of bots) b.stop();
  if (rec) await rec.stop();

  // 3) 기사: 상대 돌을 뒤집을 수 있을 때까지 빠르게 진행 → 선택해 뒤집기
  if (want('knight') || want('ending')) {
    await fastForward(me, bots, () => me.myTurn && me.plays('hero').length > 0 && me.g.board.filter((v) => v >= 0).length >= 12);
    await page.mouse.move(640, 500, { steps: 5 });
    await sleep(1500);
    if (want('knight')) {
      rec = await recorder(page, T, 'knight', shot);
      await sleep(800);
      const hero = me.plays('hero')[0];
      await glide(page, handSel(me, hero), 22);
      await sleep(500);
      await clickAt(page, handSel(me, hero), 100);
      await sleep(1800);
      await clickAt(page, '.actions .btn.primary', 200);
      await sleep(2600);
      await rec.stop();
    }
  }

  // 4) 끝: 남은 돌 경고 → 마지막 수 → 결과표
  if (want('ending')) {
    await fastForward(me, bots, () => me.g.supply <= me.g.players * 2 + 1 && me.myTurn);
    rec = await recorder(page, T, 'ending', shot);
    for (const b of bots) b.play({ delay: 700, heroRate: 0.1 });
    while (me.g.status === 'playing') {
      if (me.myTurn) {
        await sleep(700);
        const place = me.plays('place');
        if (place.length) await clickPlay(page, me, place[0], 600);
        else await clickAt(page, '.actions .btn');
        await waitFor(() => !me.myTurn || me.g.status !== 'playing', 5000, 'moved');
      }
      await sleep(80);
    }
    await page.waitForSelector('.overlay .scores');
    await sleep(1500);
    await glide(page, '.overlay .scores', 30);
    await sleep(3000);
    await rec.stop();
  }

  for (const b of [...bots, me]) b.close();
  await ctx.close();
}

export async function mobile(browser, only) {
  if (only.length && !only.includes('mobile')) return;
  const size = { width: 390, height: 844 };
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR', colorScheme: 'light' });
  await ctx.addInitScript(CURSOR_SCRIPT);
  const page = await ctx.newPage();

  // 방장은 봇, 브라우저는 QR 링크로 들어오는 친구
  const host = new Bot('지호');
  await host.create();
  await host.call('config', { config: { boardSize: 7, stones: 30, heroes: 2, handLimit: 4, maxDistance: 2, cardCopies: 2 } });
  const code = host.code;

  const rec = await recorder(page, T, 'mobile', { width: size.width * 2, height: size.height * 2 });
  await page.goto(`${ORIGIN}/${T}/r/${code}`);
  await sleep(900);
  await page.tap('.field input');
  await typeSlow(page, '하린');
  await sleep(300);
  await page.tap('button.primary:has-text("들어가기")');
  await page.waitForSelector('.code.big');
  const token = await page.evaluate(([c, t]) => localStorage.getItem(`bg:${t}:token:${c}`), [code, T]);
  const me = new Bot('하린');
  await me.join(code, { token });
  await sleep(1500);
  host.s.emit('emote', { id: 'please' }, () => {});
  await sleep(1300);
  await host.call('start');
  host.play({ delay: 1300, heroRate: 0, emoteRate: 0.6, emotes: ['teabag', 'meh', 'think'] });
  for (let turn = 0; turn < 3; turn++) {
    await myTurn(me);
    await sleep(1300);
    const place = me.plays('place');
    if (!place.length) break;
    await page.tap(handSel(me, place[0]));
    await sleep(1000);
    await page.tap('.actions .btn.primary');
    await waitFor(() => !me.myTurn, 5000, 'turn passed');
  }
  await sleep(2600);
  host.stop();
  await rec.stop();
  for (const b of [host, me]) b.close();
  await ctx.close();
}

