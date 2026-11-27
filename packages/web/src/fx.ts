/**
 * 효과음 — 전부 WebAudio로 합성 (음원 파일 없음).
 * 실제 도구 소리를 흉내 낸다: 카드는 종이를 튕기는 짧은 잡음, 칩은 점토 딸깍, 동전은 금속 울림,
 * 주사위는 여러 번의 짧은 딸각, 타일은 도자기 딱, 나무 블록은 둔탁한 톡, 불꽃은 쉭 → 펑.
 * 게임은 sound.fx('card') 또는 useLogSounds(log, 기록 → 소리)로 쓴다.
 */
export const FX_NAMES = [
  // 공통
  'myTurn', 'tick', 'pop', 'card', 'deal', 'flip', 'shuffle', 'sweep', 'chip', 'chips', 'coin', 'coins', 'dice', 'rattle', 'cup', 'tile', 'tiles', 'wood', 'stone', 'paper', 'plate', 'firework', 'fizzle', 'thud', 'lock', 'bell', 'alert', 'success', 'fail', 'win',
  // 게임 도구별 손맛
  'slap', 'slapHard', 'riffle', 'chipStack', 'gong', 'stamp', 'whoosh', 'scribble', 'buzzer', 'ding', 'drum', 'fanfare', 'crystal', 'clack', 'beep', 'static', 'pluck', 'heartbeat', 'clash', 'knock', 'sparkle', 'swish', 'pageTurn', 'cardSnap', 'pegs', 'tear',
  // 내 차례 신호 (게임마다 다른 「띠로롱」)
  'cueHwatu', 'cueChips', 'cueDice', 'cueFanfare', 'cueRadio', 'cueHarp', 'cueHeart', 'cueKnock', 'cueWood', 'cueCrystal', 'cueTile', 'cueKalimba', 'cueSpark', 'cueArcade', 'cueDrum', 'cueHorn', 'cueLock', 'cuePlate', 'cueBells', 'cueStone', 'cuePencil', 'cueWhistle',
] as const;
export type Fx = (typeof FX_NAMES)[number];

let noise: AudioBuffer | null = null;
function noiseBuf(ctx: AudioContext) {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

const MASTER = 0.8;
/** 지금 소리를 보낼 곳 (좌우 위치·크기 조절 노드). playFx가 잠깐 바꿔 끼운다 */
let OUT: AudioNode | null = null;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** 잡음 한 번 (필터를 거친 짧은 소리) */
function burst(ctx: AudioContext, t: number, o: { dur: number; freq: number; q?: number; gain: number; type?: BiquadFilterType; to?: number; attack?: number }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf(ctx);
  const f = ctx.createBiquadFilter();
  f.type = o.type ?? 'bandpass';
  f.frequency.setValueAtTime(o.freq, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  f.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  const a = o.attack ?? 0.003;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain * MASTER, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f).connect(g).connect(OUT ?? ctx.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + o.dur + 0.02);
}

/** 음 하나 (끝 음으로 미끄러질 수 있음) */
function tone(ctx: AudioContext, t: number, o: { freq: number; dur: number; gain: number; type?: OscillatorType; to?: number; attack?: number }) {
  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain * MASTER, t + (o.attack ?? 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(OUT ?? ctx.destination);
  osc.start(t);
  osc.stop(t + o.dur + 0.02);
}

/** 마림바 한 음: 세모파 + 4배 배음이 빨리 사라짐 */
function marimba(ctx: AudioContext, t: number, freq: number, gain: number, dur = 0.45) {
  tone(ctx, t, { freq, dur, gain, type: 'triangle' });
  tone(ctx, t, { freq: freq * 4, dur: dur * 0.25, gain: gain * 0.25 });
}

/**
 * 효과음 하나. pan(-1 왼쪽 ~ 1 오른쪽)은 소리를 낸 사람의 자리, gain은 크기 배율 (남의 손은 조금 작게).
 */
export function playFx(ctx: AudioContext, name: Fx, delay = 0, o: { pan?: number; gain?: number } = {}) {
  const pan = Math.max(-1, Math.min(1, o.pan ?? 0));
  const gain = o.gain ?? 1;
  let out: AudioNode | null = null;
  if (Math.abs(pan) > 0.01 || Math.abs(gain - 1) > 0.01) {
    const g = ctx.createGain();
    g.gain.value = gain;
    if (Math.abs(pan) > 0.01 && typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p).connect(ctx.destination);
    } else g.connect(ctx.destination);
    out = g;
    setTimeout(() => g.disconnect(), (delay + 3) * 1000);
  }
  const prev = OUT;
  OUT = out;
  try {
    inner(ctx, name, delay);
  } finally {
    OUT = prev;
  }
}

function inner(ctx: AudioContext, name: Fx, delay: number): void {
  const playFx = (_c: AudioContext, n: Fx, d: number) => inner(ctx, n, d);
  const t = ctx.currentTime + delay;
  switch (name) {
    case 'myTurn':
      [659, 880, 1319].forEach((f, i) => marimba(ctx, t + i * 0.1, f, 0.13));
      return;
    case 'tick':
      tone(ctx, t, { freq: 1100, dur: 0.05, gain: 0.05, type: 'triangle' });
      return;
    case 'pop':
      tone(ctx, t, { freq: 700, to: 1300, dur: 0.09, gain: 0.07 });
      return;
    case 'card': // 종이 카드를 탁 내려놓음
      burst(ctx, t, { dur: 0.055, freq: 3200, q: 0.9, gain: 0.5 });
      burst(ctx, t + 0.004, { dur: 0.04, freq: 800, q: 1, gain: 0.25 });
      return;
    case 'deal': // 카드를 미끄러뜨려 가져옴
      burst(ctx, t, { dur: 0.16, freq: 1300, to: 4200, q: 1.1, gain: 0.28, attack: 0.03 });
      return;
    case 'flip':
      playFx(ctx, 'card', delay);
      burst(ctx, t + 0.07, { dur: 0.04, freq: 3800, q: 1, gain: 0.32 });
      return;
    case 'shuffle':
      for (let i = 0; i < 8; i++) burst(ctx, t + i * 0.035 + rnd(0, 0.01), { dur: 0.035, freq: rnd(2600, 3800), q: 0.9, gain: 0.18 });
      return;
    case 'sweep': // 여러 장을 쓸어 모음
      burst(ctx, t, { dur: 0.32, freq: 900, to: 2600, q: 0.7, gain: 0.25, attack: 0.06 });
      for (let i = 0; i < 4; i++) burst(ctx, t + 0.05 + i * 0.06, { dur: 0.03, freq: 3000, q: 1, gain: 0.15 });
      return;
    case 'chip': // 점토 칩 딸깍
      burst(ctx, t, { dur: 0.035, freq: 1900, q: 4, gain: 0.45 });
      tone(ctx, t, { freq: rnd(2300, 2600), dur: 0.05, gain: 0.07, type: 'triangle' });
      return;
    case 'chips':
      for (let i = 0; i < 3; i++) playFx(ctx, 'chip', delay + i * 0.06 + rnd(0, 0.02));
      return;
    case 'coin': // 금속 울림 (배음이 정수배가 아님)
      [2093, 3290, 4870].forEach((f, i) => tone(ctx, t, { freq: f * rnd(0.99, 1.01), dur: 0.38 - i * 0.09, gain: 0.07 - i * 0.015 }));
      burst(ctx, t, { dur: 0.015, freq: 6000, q: 1, gain: 0.2 });
      return;
    case 'coins':
      for (let i = 0; i < 3; i++) playFx(ctx, 'coin', delay + i * 0.08 + rnd(0, 0.02));
      return;
    case 'dice': // 탁자 위로 구르는 주사위
      for (let i = 0; i < 7; i++) {
        const at = t + rnd(0, 0.36) * (i / 6) + i * 0.02;
        burst(ctx, at, { dur: 0.026, freq: rnd(1400, 2600), q: 4, gain: 0.55 });
        tone(ctx, at, { freq: rnd(700, 1100), dur: 0.03, gain: 0.03, type: 'square' });
      }
      return;
    case 'rattle': // 손에 쥔 주사위 달그락 (흔드는 동안 되풀이)
      for (let i = 0; i < 3; i++) burst(ctx, t + i * 0.025 + rnd(0, 0.015), { dur: 0.025, freq: rnd(1100, 2000), q: 5, gain: 0.12, type: 'bandpass' });
      return;
    case 'cup': // 컵 속에서 흔들림 → 탁
      for (let i = 0; i < 12; i++) burst(ctx, t + i * 0.04 + rnd(0, 0.02), { dur: 0.03, freq: rnd(900, 1600), q: 4, gain: 0.16, type: 'bandpass' });
      tone(ctx, t + 0.52, { freq: 150, to: 90, dur: 0.12, gain: 0.3 });
      burst(ctx, t + 0.52, { dur: 0.06, freq: 500, q: 1, gain: 0.25 });
      return;
    case 'tile': // 도자기·플라스틱 타일 딱
      tone(ctx, t, { freq: rnd(1150, 1350), dur: 0.07, gain: 0.09, type: 'triangle' });
      burst(ctx, t, { dur: 0.03, freq: 2400, q: 2, gain: 0.32 });
      return;
    case 'tiles':
      for (let i = 0; i < 3; i++) playFx(ctx, 'tile', delay + i * 0.07 + rnd(0, 0.02));
      return;
    case 'wood': // 나무 블록 톡
      tone(ctx, t, { freq: 380, to: 260, dur: 0.1, gain: 0.28 });
      burst(ctx, t, { dur: 0.045, freq: 800, q: 1.4, gain: 0.25 });
      return;
    case 'stone': // 묵직한 말
      tone(ctx, t, { freq: 230, to: 150, dur: 0.14, gain: 0.32 });
      burst(ctx, t, { dur: 0.05, freq: 550, q: 1, gain: 0.25 });
      return;
    case 'paper': // 편지 봉투를 펼침
      burst(ctx, t, { dur: 0.36, freq: 2200, to: 1200, q: 0.6, gain: 0.22, attack: 0.08, type: 'lowpass' });
      burst(ctx, t + 0.12, { dur: 0.04, freq: 3500, q: 1, gain: 0.15 });
      return;
    case 'plate': // 접시 쨍
      [1760, 2950, 4130].forEach((f, i) => tone(ctx, t, { freq: f, dur: 0.28 - i * 0.07, gain: 0.06 - i * 0.012 }));
      burst(ctx, t, { dur: 0.012, freq: 5000, q: 1, gain: 0.18 });
      return;
    case 'firework': // 쉭 올라가서 펑 + 탁탁
      burst(ctx, t, { dur: 0.45, freq: 500, to: 3200, q: 2, gain: 0.18, attack: 0.12 });
      burst(ctx, t + 0.45, { dur: 0.6, freq: 1100, q: 0.5, gain: 0.5, type: 'lowpass' });
      tone(ctx, t + 0.45, { freq: 110, to: 50, dur: 0.4, gain: 0.3 });
      for (let i = 0; i < 9; i++) burst(ctx, t + 0.55 + rnd(0, 0.5), { dur: 0.015, freq: rnd(3500, 6000), q: 1, gain: 0.14 });
      return;
    case 'fizzle': // 불발
      burst(ctx, t, { dur: 0.45, freq: 1600, to: 300, q: 1.2, gain: 0.3, attack: 0.05 });
      tone(ctx, t, { freq: 300, to: 110, dur: 0.4, gain: 0.04, type: 'sawtooth' });
      return;
    case 'thud': // 쿵 (탈락·암살)
      tone(ctx, t, { freq: 95, to: 50, dur: 0.3, gain: 0.45 });
      burst(ctx, t, { dur: 0.08, freq: 300, q: 1, gain: 0.3 });
      return;
    case 'lock': // 금고 다이얼 딸깍 → 철컥
      burst(ctx, t, { dur: 0.012, freq: 3200, q: 3, gain: 0.3 });
      burst(ctx, t + 0.07, { dur: 0.012, freq: 3200, q: 3, gain: 0.3 });
      tone(ctx, t + 0.14, { freq: 180, dur: 0.1, gain: 0.06, type: 'square' });
      tone(ctx, t + 0.14, { freq: 120, dur: 0.16, gain: 0.25 });
      return;
    case 'bell':
      tone(ctx, t, { freq: 1320, dur: 0.8, gain: 0.08 });
      tone(ctx, t, { freq: 2640, dur: 0.4, gain: 0.025 });
      return;
    case 'alert': // 도전! 두 번
      [880, 660, 880].forEach((f, i) => tone(ctx, t + i * 0.09, { freq: f, dur: 0.08, gain: 0.08, type: 'square' }));
      return;
    case 'success':
      [523, 659, 784, 1047].forEach((f, i) => marimba(ctx, t + i * 0.08, f, 0.11, 0.35));
      return;
    case 'fail':
      [392, 311].forEach((f, i) => marimba(ctx, t + i * 0.14, f, 0.12, 0.4));
      return;
    case 'win':
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => marimba(ctx, t + i * 0.1, f, 0.12, 0.5));
      return;

    // ── 게임 도구별 손맛 ──
    case 'slap': // 화투를 바닥에 「딱!」 내리침: 날카로운 딱 + 담요 밑 쿵
      burst(ctx, t, { dur: 0.028, freq: 4200, q: 0.7, gain: 0.85 });
      burst(ctx, t, { dur: 0.05, freq: 1500, q: 1.5, gain: 0.45 });
      tone(ctx, t, { freq: 170, to: 80, dur: 0.11, gain: 0.42 });
      return;
    case 'slapHard': // 쪽·따닥·싹쓸이: 두 번 세게
      inner(ctx, 'slap', delay);
      inner(ctx, 'slap', delay + 0.09);
      tone(ctx, t + 0.09, { freq: 110, to: 55, dur: 0.25, gain: 0.4 });
      return;
    case 'riffle': // 카드 리플 셔플: 점점 빨라지는 촤르르
      for (let i = 0; i < 22; i++) burst(ctx, t + 0.5 * Math.sqrt(i / 22), { dur: 0.022, freq: rnd(2800, 4400), q: 1.1, gain: 0.16 });
      burst(ctx, t + 0.52, { dur: 0.07, freq: 1200, q: 0.8, gain: 0.3 });
      return;
    case 'chipStack': // 칩을 쌓아 올림: 딸깍딸깍 음이 조금씩 높아짐
      for (let i = 0; i < 5; i++) {
        burst(ctx, t + i * 0.045, { dur: 0.03, freq: 1800 + i * 120, q: 5, gain: 0.4 });
        tone(ctx, t + i * 0.045, { freq: 2200 + i * 160, dur: 0.04, gain: 0.05, type: 'triangle' });
      }
      return;
    case 'gong': // 징: 낮고 길게 울림
      [130.8, 130.8 * 2.32, 130.8 * 4.1, 130.8 * 6.3].forEach((f, i) => tone(ctx, t, { freq: f * rnd(0.995, 1.005), to: f * 0.985, dur: 1.8 - i * 0.35, gain: 0.16 - i * 0.03, attack: 0.02 }));
      burst(ctx, t, { dur: 0.08, freq: 400, q: 0.8, gain: 0.25 });
      return;
    case 'stamp': // 도장 쾅
      tone(ctx, t, { freq: 140, to: 70, dur: 0.16, gain: 0.45 });
      burst(ctx, t, { dur: 0.06, freq: 700, q: 1, gain: 0.4 });
      burst(ctx, t + 0.04, { dur: 0.05, freq: 3000, q: 1, gain: 0.12 });
      return;
    case 'whoosh': // 휙 (던지기·넘기기)
      burst(ctx, t, { dur: 0.28, freq: 600, to: 2600, q: 1.4, gain: 0.22, attack: 0.1 });
      return;
    case 'swish': // 짧은 휙 (상대가 카드를 낼 때 날아오는 소리)
      burst(ctx, t, { dur: 0.14, freq: 1800, to: 5200, q: 1.6, gain: 0.16, attack: 0.05 });
      return;
    case 'scribble': // 연필 사각사각
      for (let i = 0; i < 6; i++) burst(ctx, t + i * 0.055 + rnd(0, 0.015), { dur: 0.045, freq: rnd(4500, 6500), q: 2.5, gain: 0.12, attack: 0.01 });
      return;
    case 'buzzer': // 땡! (틀림)
      tone(ctx, t, { freq: 150, dur: 0.38, gain: 0.07, type: 'square' });
      tone(ctx, t, { freq: 155, dur: 0.38, gain: 0.05, type: 'sawtooth' });
      return;
    case 'ding': // 딩동 (맞음)
      tone(ctx, t, { freq: 1568, dur: 0.5, gain: 0.09 });
      tone(ctx, t + 0.12, { freq: 1976, dur: 0.6, gain: 0.08 });
      tone(ctx, t + 0.12, { freq: 3952, dur: 0.25, gain: 0.02 });
      return;
    case 'drum': // 큰북 둥
      tone(ctx, t, { freq: 120, to: 55, dur: 0.38, gain: 0.5 });
      burst(ctx, t, { dur: 0.09, freq: 260, q: 0.8, gain: 0.35 });
      return;
    case 'fanfare': // 짧은 나팔
      [392, 523, 659, 784].forEach((f, i) => {
        tone(ctx, t + i * 0.09, { freq: f, dur: i === 3 ? 0.5 : 0.12, gain: 0.05, type: 'sawtooth', attack: 0.015 });
        tone(ctx, t + i * 0.09, { freq: f * 2, dur: i === 3 ? 0.4 : 0.1, gain: 0.02, type: 'square', attack: 0.015 });
      });
      return;
    case 'crystal': // 보석 짤랑 (정수배가 아닌 높은 배음)
      [2637, 3951, 5588].forEach((f, i) => tone(ctx, t + i * 0.012, { freq: f * rnd(0.98, 1.02), dur: 0.5 - i * 0.12, gain: 0.06 - i * 0.012 }));
      burst(ctx, t, { dur: 0.01, freq: 7000, q: 1, gain: 0.15 });
      return;
    case 'clack': // 바둑돌 딱 (단단한 돌이 나무판에)
      tone(ctx, t, { freq: rnd(1900, 2200), dur: 0.035, gain: 0.14, type: 'triangle' });
      burst(ctx, t, { dur: 0.02, freq: 3500, q: 3, gain: 0.5 });
      tone(ctx, t, { freq: 320, to: 220, dur: 0.07, gain: 0.2 });
      return;
    case 'beep': // 무전기 삑삑
      tone(ctx, t, { freq: 1250, dur: 0.06, gain: 0.06, type: 'square' });
      tone(ctx, t + 0.09, { freq: 1250, dur: 0.06, gain: 0.06, type: 'square' });
      return;
    case 'static': // 무전 잡음 치직
      burst(ctx, t, { dur: 0.18, freq: 2500, q: 0.4, gain: 0.14 });
      burst(ctx, t + 0.05, { dur: 0.05, freq: 900, q: 2, gain: 0.12 });
      return;
    case 'pluck': // 가야금처럼 튕긴 줄
      pluck(ctx, t, 440, 0.12);
      return;
    case 'heartbeat': // 두근두근
      [0, 0.18].forEach((d, i) => tone(ctx, t + d, { freq: 70, to: 45, dur: 0.16, gain: i ? 0.35 : 0.5 }));
      return;
    case 'clash': // 칼날 챙
      [1800, 2650, 3900].forEach((f, i) => tone(ctx, t, { freq: f, to: f * 0.97, dur: 0.6 - i * 0.15, gain: 0.05 }));
      burst(ctx, t, { dur: 0.12, freq: 5000, q: 0.7, gain: 0.3 });
      return;
    case 'knock': // 똑똑
      [0, 0.13].forEach((d) => {
        tone(ctx, t + d, { freq: 210, to: 150, dur: 0.08, gain: 0.35 });
        burst(ctx, t + d, { dur: 0.03, freq: 1000, q: 1.5, gain: 0.25 });
      });
      return;
    case 'sparkle': // 반짝
      for (let i = 0; i < 6; i++) tone(ctx, t + i * 0.045, { freq: rnd(2600, 4800), dur: 0.18, gain: 0.035 });
      return;
    case 'pageTurn': // 종이 한 장 넘김
      burst(ctx, t, { dur: 0.2, freq: 1700, to: 3600, q: 0.7, gain: 0.2, attack: 0.04 });
      burst(ctx, t + 0.17, { dur: 0.03, freq: 2400, q: 1, gain: 0.15 });
      return;
    case 'cardSnap': // 카드를 손가락으로 튕겨 냄 (원카드·하트)
      burst(ctx, t, { dur: 0.03, freq: 5200, q: 1.2, gain: 0.5 });
      burst(ctx, t + 0.02, { dur: 0.06, freq: 2000, q: 0.9, gain: 0.3 });
      return;
    case 'pegs': // 나무 말 여럿을 옮김
      for (let i = 0; i < 3; i++) {
        tone(ctx, t + i * 0.07, { freq: 520 - i * 40, to: 360, dur: 0.07, gain: 0.2 });
        burst(ctx, t + i * 0.07, { dur: 0.03, freq: 1100, q: 2, gain: 0.18 });
      }
      return;
    case 'tear': // 쫙 (찢거나 펼침)
      burst(ctx, t, { dur: 0.22, freq: 2500, q: 0.6, gain: 0.3, attack: 0.01 });
      for (let i = 0; i < 5; i++) burst(ctx, t + i * 0.035, { dur: 0.02, freq: rnd(3000, 5000), q: 2, gain: 0.14 });
      return;

    // ── 내 차례 신호: 게임마다 다른 소리 ──
    case 'cueHwatu': // 화투 탁 + 가야금 세 음 (궁·상·치)
      inner(ctx, 'slap', delay);
      [392, 440, 587].forEach((f, i) => pluck(ctx, t + 0.12 + i * 0.11, f, 0.11));
      return;
    case 'cueChips':
      inner(ctx, 'chipStack', delay);
      tone(ctx, t + 0.26, { freq: 1568, dur: 0.45, gain: 0.07 });
      return;
    case 'cueDice':
      inner(ctx, 'rattle', delay);
      inner(ctx, 'rattle', delay + 0.08);
      [784, 1175].forEach((f, i) => marimba(ctx, t + 0.2 + i * 0.1, f, 0.12, 0.35));
      return;
    case 'cueFanfare':
      inner(ctx, 'fanfare', delay);
      return;
    case 'cueRadio':
      inner(ctx, 'static', delay);
      inner(ctx, 'beep', delay + 0.18);
      return;
    case 'cueHarp':
      [523, 659, 784, 1047].forEach((f, i) => pluck(ctx, t + i * 0.06, f, 0.08));
      return;
    case 'cueHeart':
      inner(ctx, 'heartbeat', delay);
      pluck(ctx, t + 0.38, 659, 0.08);
      return;
    case 'cueKnock':
      inner(ctx, 'knock', delay);
      inner(ctx, 'paper', delay + 0.3);
      return;
    case 'cueWood':
      [0, 0.12].forEach((d, i) => tone(ctx, t + d, { freq: i ? 980 : 740, dur: 0.09, gain: 0.16, type: 'triangle' }));
      return;
    case 'cueCrystal':
      [1319, 1760, 2637].forEach((f, i) => tone(ctx, t + i * 0.08, { freq: f, dur: 0.6, gain: 0.07 }));
      inner(ctx, 'sparkle', delay + 0.2);
      return;
    case 'cueTile':
      [0, 0.09, 0.18].forEach((d, i) => tone(ctx, t + d, { freq: [1047, 1319, 1568][i], dur: 0.12, gain: 0.1, type: 'triangle' }));
      burst(ctx, t + 0.18, { dur: 0.03, freq: 2400, q: 2, gain: 0.25 });
      return;
    case 'cueKalimba':
      [784, 988, 1175].forEach((f, i) => pluck(ctx, t + i * 0.09, f, 0.09, 0.7));
      return;
    case 'cueSpark':
      burst(ctx, t, { dur: 0.25, freq: 800, to: 4000, q: 2, gain: 0.12, attack: 0.08 });
      inner(ctx, 'sparkle', delay + 0.2);
      return;
    case 'cueArcade': // 빠른 8비트 올림
      [523, 659, 784, 1047].forEach((f, i) => tone(ctx, t + i * 0.05, { freq: f, dur: 0.06, gain: 0.045, type: 'square' }));
      return;
    case 'cueDrum':
      inner(ctx, 'drum', delay);
      inner(ctx, 'drum', delay + 0.16);
      return;
    case 'cueHorn': // 탐험 나팔 (5도 위로)
      tone(ctx, t, { freq: 349, dur: 0.18, gain: 0.06, type: 'sawtooth', attack: 0.03 });
      tone(ctx, t + 0.18, { freq: 523, dur: 0.45, gain: 0.06, type: 'sawtooth', attack: 0.03 });
      tone(ctx, t + 0.18, { freq: 523, dur: 0.45, gain: 0.05, type: 'triangle' });
      return;
    case 'cueLock':
      inner(ctx, 'lock', delay);
      tone(ctx, t + 0.3, { freq: 1760, dur: 0.3, gain: 0.05 });
      return;
    case 'cuePlate':
      inner(ctx, 'plate', delay);
      inner(ctx, 'plate', delay + 0.13);
      return;
    case 'cueBells':
      [1047, 1319].forEach((f, i) => {
        tone(ctx, t + i * 0.14, { freq: f, dur: 0.7, gain: 0.07 });
        tone(ctx, t + i * 0.14, { freq: f * 2.4, dur: 0.3, gain: 0.02 });
      });
      return;
    case 'cueStone':
      inner(ctx, 'clack', delay);
      tone(ctx, t + 0.1, { freq: 880, dur: 0.5, gain: 0.05 });
      return;
    case 'cuePencil':
      inner(ctx, 'scribble', delay);
      pluck(ctx, t + 0.34, 880, 0.08, 0.6);
      return;
    case 'cueWhistle': // 휘익 (호루라기)
      tone(ctx, t, { freq: 1800, to: 2400, dur: 0.18, gain: 0.05 });
      tone(ctx, t + 0.22, { freq: 2400, dur: 0.15, gain: 0.05 });
      return;
  }
}

/** 튕긴 줄: 세모파 + 빠르게 사라지는 2배음, 살짝 음이 내려감 */
function pluck(ctx: AudioContext, t: number, freq: number, gain: number, dur = 0.9) {
  tone(ctx, t, { freq: freq * 1.01, to: freq, dur, gain, type: 'triangle', attack: 0.002 });
  tone(ctx, t, { freq: freq * 2, dur: dur * 0.3, gain: gain * 0.4, attack: 0.002 });
  burst(ctx, t, { dur: 0.012, freq: freq * 4, q: 2, gain: gain * 1.2 });
}
