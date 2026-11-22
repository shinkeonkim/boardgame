/**
 * 효과음 — 전부 WebAudio로 합성 (음원 파일 없음).
 * 실제 도구 소리를 흉내 낸다: 카드는 종이를 튕기는 짧은 잡음, 칩은 점토 딸깍, 동전은 금속 울림,
 * 주사위는 여러 번의 짧은 딸각, 타일은 도자기 딱, 나무 블록은 둔탁한 톡, 불꽃은 쉭 → 펑.
 * 게임은 sound.fx('card') 또는 useLogSounds(log, 기록 → 소리)로 쓴다.
 */
export type Fx =
  | 'myTurn'
  | 'tick'
  | 'pop'
  | 'card'
  | 'deal'
  | 'flip'
  | 'shuffle'
  | 'sweep'
  | 'chip'
  | 'chips'
  | 'coin'
  | 'coins'
  | 'dice'
  | 'cup'
  | 'tile'
  | 'tiles'
  | 'wood'
  | 'stone'
  | 'paper'
  | 'plate'
  | 'firework'
  | 'fizzle'
  | 'thud'
  | 'lock'
  | 'bell'
  | 'alert'
  | 'success'
  | 'fail'
  | 'win';

export const FX_NAMES: Fx[] = ['myTurn', 'tick', 'pop', 'card', 'deal', 'flip', 'shuffle', 'sweep', 'chip', 'chips', 'coin', 'coins', 'dice', 'cup', 'tile', 'tiles', 'wood', 'stone', 'paper', 'plate', 'firework', 'fizzle', 'thud', 'lock', 'bell', 'alert', 'success', 'fail', 'win'];

let noise: AudioBuffer | null = null;
function noiseBuf(ctx: AudioContext) {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

const MASTER = 0.8;
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
  src.connect(f).connect(g).connect(ctx.destination);
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
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + o.dur + 0.02);
}

/** 마림바 한 음: 세모파 + 4배 배음이 빨리 사라짐 */
function marimba(ctx: AudioContext, t: number, freq: number, gain: number, dur = 0.45) {
  tone(ctx, t, { freq, dur, gain, type: 'triangle' });
  tone(ctx, t, { freq: freq * 4, dur: dur * 0.25, gain: gain * 0.25 });
}

export function playFx(ctx: AudioContext, name: Fx, delay = 0) {
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
  }
}
