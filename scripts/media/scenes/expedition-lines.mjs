import { CURSOR_SCRIPT, ORIGIN, center, clickAt, gameSocket, glide, recorder, sleep, typeSlow, waitFor } from '../lib.mjs';

export const T = 'expedition-lines';

/** 봇 한 명 (또는 브라우저 플레이어와 같은 자리를 쓰는 그림자 소켓) */
class Bot {
  constructor(name) {
    this.name = name;
    this.s = gameSocket('expedition-lines');
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
  /** 자동 진행: { delay, playRate, emoteRate, drawDiscardRate } */
  play(opts) {
    this.auto = opts;
    this.tick();
  }
  stop() {
    this.auto = null;
  }
  tick() {
    const g = this.g;
    if (!this.auto || !this.myTurn || this.busy) return;
    this.busy = true;
    const { delay = 900, playRate = 0.7, emoteRate = 0, drawDiscardRate = 0.25, emotes = ['thumbs', 'nice', 'think', 'fire', 'hmm', 'lol'] } = this.auto;
    setTimeout(async () => {
      const move = this.chooseMove(playRate, drawDiscardRate);
      if (Math.random() < emoteRate) this.s.emit('emote', { id: emotes[Math.floor(Math.random() * emotes.length)] }, () => {});
      const r = move ? await this.call('move', { move }) : { ok: true };
      this.busy = false;
      if (!r.ok) console.log(`[${this.name}] ${r.error}`);
      this.tick();
    }, delay);
  }
  chooseMove(playRate = 0.7, drawDiscardRate = 0.25) {
    const g = this.g;
    if (!g || g.turn !== g.me) return null;
    if (g.phase === 'play') {
      const best = this.best();
      if (best && Math.random() < playRate) return { type: 'play', cardId: best.id };
      return { type: 'discard', cardId: this.worst().id };
    }
    const piles = g.drawable.discards.flatMap((ok, i) => (ok ? [i] : []));
    if (piles.length && Math.random() < drawDiscardRate) return { type: 'draw', source: piles[0] };
    return { type: 'draw', source: 'deck' };
  }
  /** 그럴듯한 수: 이미 시작한 탐험대를 작은 간격으로 잇고, 새 탐험대·투자는 같은 색이 손에 많을 때만 */
  best() {
    const g = this.g;
    const same = (c) => g.hand.filter((h) => h.color === c.color && h.id !== c.id && h.value > 0).length;
    let pick = null;
    let score = Infinity;
    for (const c of this.playable()) {
      const col = g.expeditions[g.me][c.color];
      const top = col[col.length - 1];
      let s;
      if (c.value === 0) s = same(c) >= 2 ? 1 : Infinity;
      else if (top) s = c.value - (top.value || this.view.config.minValue - 1);
      else s = same(c) >= 1 ? 3 + c.value : Infinity;
      if (s < score) [pick, score] = [c, s];
    }
    return pick;
  }
  /** 버릴 카드: 이미 못 놓는 카드 → 같은 색이 적은 큰 숫자 */
  worst() {
    const g = this.g;
    const ok = new Set(this.playable().map((c) => c.id));
    const dead = g.hand.filter((c) => !ok.has(c.id));
    const pool = dead.length ? dead : g.hand;
    const count = (c) => g.hand.filter((h) => h.color === c.color).length;
    return [...pool].sort((a, b) => count(a) - count(b) || b.value - a.value)[0];
  }
  playable() {
    const g = this.g;
    const cfg = this.view.config;
    return g.hand.filter((c) => {
      const col = g.expeditions[g.me][c.color];
      const last = col[col.length - 1];
      if (!last) return true;
      if (c.value === 0) return last.value === 0;
      return cfg.allowEqual ? c.value >= last.value : c.value > last.value;
    });
  }
  close() {
    this.s.close();
  }
}


/** 브라우저 쪽 손패에서 카드의 DOM 순서 */
function handSel(me, card) {
  const i = me.g.hand.findIndex((c) => c.id === card.id);
  return `.hand > .card:nth-child(${i + 1})`;
}
/** 브라우저 플레이어가 화면에서 카드를 끌어 놓는다 */
async function dragCard(page, me, card, target) {
  const from = await center(page, handSel(me, card));
  await page.mouse.move(from.x, from.y, { steps: 14 });
  await sleep(220);
  await page.mouse.down();
  const to = await center(page, `[data-drop="${target}"]`);
  await page.mouse.move(from.x + (to.x - from.x) * 0.15, from.y - 30, { steps: 6 });
  await page.mouse.move(to.x, to.y, { steps: 26 });
  await sleep(220);
  await page.mouse.up();
}
async function myTurnPhase(me, phase) {
  await waitFor(() => me.myTurn && me.g.phase === phase, 60_000, `my ${phase}`);
}

/** 화면 밖에서 빠르게 진행(브라우저 플레이어 몫은 그림자 소켓이 둔다) */
async function fastForward(me, bots, until, playRate = 0.85) {
  for (const b of bots) b.play({ delay: 40, playRate, drawDiscardRate: 0.05 });
  while (!(await until())) {
    if (me.g.status !== 'playing') throw new Error('round ended while fast-forwarding');
    if (me.myTurn) {
      const move = me.chooseMove(playRate, 0.05);
      if (move) await me.call('move', { move });
    }
    await sleep(60);
  }
  for (const b of bots) b.stop();
  await waitFor(() => bots.every((b) => !b.busy), 5000, 'bots idle');
}



export async function desktop(browser, only) {
  const want = (n) => !only.length || only.includes(n);
  if (!['intro', 'lobby', 'play', 'discard', 'results'].some(want)) return;
  const size = { width: 1280, height: 800 };
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2, locale: 'ko-KR' });
  await ctx.addInitScript(CURSOR_SCRIPT);
  const page = await ctx.newPage();
  const shot = { width: size.width * 2, height: size.height * 2 };
  const bots = [new Bot('도윤'), new Bot('서연')];

  // 0) 첫 화면: 시연 애니메이션 → 게임 방법 모달 훑기
  await page.goto(`${ORIGIN}/${T}/`);
  await page.mouse.move(640, 300);
  await sleep(400);
  if (want('intro')) {
    const intro = await recorder(page, T, 'intro', shot);
    await sleep(3200);
    await clickAt(page, 'button:has-text("게임 방법 보기")');
    await sleep(1400);
    for (const id of ['parts', 'turn', 'column', 'score']) {
      await clickAt(page, `.g-nav .chip:nth-child(${['goal', 'parts', 'turn', 'column', 'discard', 'score'].indexOf(id) + 1})`, 150);
      await sleep(1900);
    }
    await page.keyboard.press('Escape');
    await sleep(900);
    await intro.stop();
  }

  // 1) 로비: 방 만들기 → QR → 친구 입장 → 규칙 프리셋
  let rec = want('lobby') ? await recorder(page, T, 'lobby', shot) : null;
  await sleep(700);
  await clickAt(page, 'input[placeholder="예: 민지"]');
  await typeSlow(page, '민지');
  await sleep(300);
  await clickAt(page, 'button:has-text("방 만들기")');
  await page.waitForSelector('.code.big');
  const code = (await page.textContent('.code.big')).trim();
  await sleep(1200);
  await bots[0].join(code);
  await sleep(500);
  bots[0].s.emit('emote', { id: 'please' }, () => {});
  await sleep(900);
  await bots[1].join(code);
  await sleep(600);
  bots[1].s.emit('emote', { id: 'wow' }, () => {});
  await sleep(700);
  await clickAt(page, '.presets .chip:has-text("긴 게임")');
  await sleep(1100);
  await clickAt(page, '[aria-label="탐험대(색) 수 줄이기"]');
  await sleep(700);
  await clickAt(page, '.presets .chip:has-text("3명 추천")');
  await sleep(1200);
  await glide(page, 'button:has-text("게임 시작")');
  await sleep(600);
  if (rec) await rec.stop();

  // 그림자 소켓: 브라우저 플레이어와 같은 자리(토큰)로 붙어 상태를 읽는다
  const token = await page.evaluate(([c, t]) => localStorage.getItem(`bg:${t}:token:${c}`), [code, T]);
  const me = new Bot('민지');
  await me.join(code, { token });
  await waitFor(() => me.view, 5000, 'shadow view');

  // 2) 게임: 시작 → 드래그로 내려놓기 → 덱에서 뽑기 → 상대 차례·감정 표현
  rec = want('play') ? await recorder(page, T, 'play', shot) : null;
  await sleep(300);
  await clickAt(page, 'button:has-text("게임 시작")');
  await waitFor(() => me.g?.status === 'playing', 5000, 'game start');
  for (const b of bots) b.play({ delay: 1000, playRate: 0.8, emoteRate: 0.5, drawDiscardRate: 0.3 });
  await sleep(1500);
  for (let turn = 0; turn < 3; turn++) {
    await myTurnPhase(me, 'play');
    await sleep(turn === 0 ? 900 : 1300);
    const best = me.best();
    if (turn === 1 || !best) {
      const worst = me.worst();
      await dragCard(page, me, worst, `discard-${worst.color}`);
    } else {
      await dragCard(page, me, best, `play-${best.color}`);
    }
    await myTurnPhase(me, 'draw');
    await sleep(700);
    await clickAt(page, '.deck');
    await waitFor(() => !me.myTurn, 5000, 'turn passed');
    if (turn === 1) {
      // 상대 차례 동안 덱 아래 감정 표현
      await sleep(500);
      await clickAt(page, '.deck-col .emote-toggle');
      await sleep(900);
      await clickAt(page, '.emote-phrases .chip:has-text("오 나이스")');
    }
  }
  await sleep(2500);
  for (const b of bots) b.stop();
  if (rec) await rec.stop();

  // 3) 버림 더미 펼쳐보기: 버림이 쌓일 때까지 빠르게 진행 후 호버
  if (want('discard') || want('results')) {
    await fastForward(me, bots, () => {
      const piles = me.g.discardPiles ?? [];
      const ready = piles.filter((p) => p.length >= 3).length >= 2 || (me.g.deckCount ?? 99) < 16;
      return ready && me.myTurn && me.g.phase === 'play';
    }, 0.5);
    await page.mouse.move(640, 700, { steps: 5 });
    await sleep(1200);
    if (want('discard')) {
      rec = await recorder(page, T, 'discard', shot);
      await sleep(600);
      const piles = me.g.discardPiles
        .map((p, i) => ({ i, n: p.length }))
        .filter((p) => p.n >= 2)
        .sort((a, b) => b.n - a.n)
        .slice(0, 2);
      for (const p of piles) {
        await glide(page, `[data-drop="discard-${p.i}"]`, 24);
        await sleep(2200);
      }
      // 상대 탐험대 위로도 지나가며 카드 더미 보여주기
      await page.mouse.move(640, 760, { steps: 20 });
      await sleep(900);
      await rec.stop();
    }
  }

  // 4) 판 종료 → 점수표
  if (want('results')) {
    await fastForward(me, bots, () => (me.g.deckCount ?? 99) <= 4 && me.myTurn && me.g.phase === 'play');
    rec = await recorder(page, T, 'results', shot);
    for (const b of bots) b.play({ delay: 700, playRate: 0.9 });
    while (me.g.status === 'playing') {
      if (me.myTurn && me.g.phase === 'play') {
        await sleep(500);
        const best = me.best();
        const card = best ?? me.worst();
        await dragCard(page, me, card, best ? `play-${card.color}` : `discard-${card.color}`);
        await waitFor(() => me.g.phase === 'draw' || me.g.status !== 'playing', 5000, 'played');
        if (me.g.status !== 'playing') break;
        await sleep(400);
        await clickAt(page, '.deck');
        await waitFor(() => !me.myTurn || me.g.status !== 'playing', 5000, 'drawn');
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
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ko-KR' });
  await ctx.addInitScript(CURSOR_SCRIPT);
  const page = await ctx.newPage();

  // 방장은 봇, 브라우저는 QR 링크로 들어오는 친구
  const host = new Bot('지호');
  await host.create();
  await host.call('config', { config: { colors: 4, handSize: 7 } });
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
  host.play({ delay: 1300, playRate: 0.8, emoteRate: 0.6, emotes: ['hurry', 'thumbs', 'think'] });
  for (let turn = 0; turn < 2; turn++) {
    await myTurnPhase(me, 'play');
    await sleep(1400);
    const best = me.best();
    const card = best ?? me.worst();
    await page.tap(handSel(me, card));
    await sleep(700);
    await page.tap(best ? '.actions button:has-text("탐험대에 놓기")' : '.actions button:has-text("버리기")');
    await myTurnPhase(me, 'draw');
    await sleep(800);
    await page.tap('.deck');
    await waitFor(() => !me.myTurn, 5000, 'turn passed');
  }
  await sleep(2600);
  host.stop();
  await rec.stop();
  for (const b of [host, me]) b.close();
  await ctx.close();
}

