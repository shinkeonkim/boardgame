/**
 * 3D 주사위 판 (three.js + cannon-es 물리). 나중에 불러온다(lazy) — 첫 화면을 무겁게 하지 않게.
 *
 * 결과는 서버가 정한다. 그래서:
 *  1) 던질 때 물리 시뮬레이션을 미리 끝까지 돌려(눈에 안 보이게) 각 주사위가 어느 면을 위로 멈추는지 본다.
 *  2) 그 면에 서버가 준 눈이 오도록 주사위 면 그림을 바꿔 붙인다 (정육면체 회전 24가지 중 하나 → 마주 보는 면 합 7 유지).
 *  3) 기록해 둔 움직임을 그대로 재생한다 → 굴러서 멈춘 면이 곧 결과.
 *  멈춘 뒤에는 한 줄로 가지런히 모이고, 누르면 남기기(살짝 들리고 금색 받침).
 *  흔들기(shaking): 굴리기 버튼을 꾹 누르는 동안 남기지 않은 주사위가 오른쪽 위에서 달그락거리다, 결과가 오면 그 자리에서 던져진다.
 *
 *  주의: 남긴 주사위의 눈은 「지금 화면의 기울기」가 아니라 마지막으로 멈춘 자세(restQ)로 읽는다.
 *  (굴러가는 도중에 다음 굴림이 오면 기울어진 자세를 반듯하게 맞추다 다른 면이 위로 와서 눈이 틀려 보였음)
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as CANNON from 'cannon-es';

const N = 5;
const TRAY_W = 10;
const TRAY_D = 4.6;
const STEP = 1 / 60;
const MAX_STEPS = 60 * 4;

/** BoxGeometry 면 순서: +x, -x, +y, -y, +z, -z — 표준 주사위 눈 (마주 보는 면 합 7) */
const DIRS: [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
const STD = [1, 6, 2, 5, 3, 4];
const dirIndex = (d: number[]) => DIRS.findIndex((x) => x[0] === d[0] && x[1] === d[1] && x[2] === d[2]);

/** 정육면체 회전 24가지 (부호 있는 순열 행렬, det = +1) */
const ROTS: number[][][] = (() => {
  const out: number[][][] = [];
  const perms = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  for (const p of perms)
    for (let s = 0; s < 8; s++) {
      const m = [0, 1, 2].map((r) => [0, 0, 0].map((_, c) => (c === p[r] ? ((s >> r) & 1 ? -1 : 1) : 0)));
      const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      if (det === 1) out.push(m);
    }
  return out;
})();
const mul = (m: number[][], v: number[]) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);

/** 면 k(방향)에 붙일 눈: 「face 방향 면에 value」가 오게 하는 회전으로 표준 눈을 옮김 */
function labelsFor(face: number, value: number): number[] {
  const want = DIRS[STD.indexOf(value)];
  const m = ROTS.find((r) => {
    const v = mul(r, DIRS[face]);
    return v[0] === want[0] && v[1] === want[1] && v[2] === want[2];
  })!;
  return DIRS.map((d) => STD[dirIndex(mul(m, d))]);
}

/** 위를 향한 면 (몸체 좌표의 면 번호) */
function topFace(q: THREE.Quaternion): number {
  let best = 0;
  let bestY = -Infinity;
  DIRS.forEach((d, i) => {
    const y = new THREE.Vector3(...d).applyQuaternion(q).y;
    if (y > bestY) {
      bestY = y;
      best = i;
    }
  });
  return best;
}

/** 가장 가까운 「반듯한」 자세 (24가지 중) + 위를 향한 면 유지 */
function snapQuat(q: THREE.Quaternion): THREE.Quaternion {
  let best = new THREE.Quaternion();
  let bestDot = -1;
  for (const r of ROTS) {
    const m = new THREE.Matrix4().set(r[0][0], r[0][1], r[0][2], 0, r[1][0], r[1][1], r[1][2], 0, r[2][0], r[2][1], r[2][2], 0, 0, 0, 0, 1);
    const c = new THREE.Quaternion().setFromRotationMatrix(m);
    const d = Math.abs(c.dot(q));
    if (d > bestDot) {
      bestDot = d;
      best = c;
    }
  }
  return best;
}

/** 면 그림 (상아색 바탕 + 눈, 1은 빨간 눈) */
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.26, 0.26],
    [0.5, 0.5],
    [0.74, 0.74],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.26, 0.26],
    [0.74, 0.26],
    [0.5, 0.5],
    [0.26, 0.74],
    [0.74, 0.74],
  ],
  6: [
    [0.28, 0.24],
    [0.72, 0.24],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.76],
    [0.72, 0.76],
  ],
};
function faceTexture(v: number): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, '#fffdf7');
  grad.addColorStop(1, '#efe5cf');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  for (const [x, y] of PIPS[v]) {
    const r = v === 1 ? 17 : 11.5;
    const pg = g.createRadialGradient(x * 128 - 3, y * 128 - 3, 1, x * 128, y * 128, r);
    pg.addColorStop(0, v === 1 ? '#e0584a' : '#4a4038');
    pg.addColorStop(1, v === 1 ? '#9e2a1f' : '#0e0b09');
    g.fillStyle = pg;
    g.beginPath();
    g.arc(x * 128, y * 128, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export interface TrayProps {
  values: number[];
  held: boolean[];
  /** 굴릴 때마다 바뀌는 값 (바뀌면 남기지 않은 주사위를 던짐) */
  rollKey: string | number;
  /** 아직 한 번도 안 굴렸으면 흐릿하게 */
  blank?: boolean;
  /** 손에 쥐고 흔드는 중 (굴리기 버튼을 누르고 있음) */
  shaking?: boolean;
  /** 던지는 힘 0~1 (오래·세게 흔들수록) */
  power?: number;
  onToggle?: (i: number) => void;
}

/** 줄로 놓일 자리 */
const rowX = (i: number) => (i - (N - 1) / 2) * 2.05;

export default function DiceTray({ values, held, rollKey, blank, onToggle, shaking = false, power = 0.5 }: TrayProps) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ roll: (values: number[], held: boolean[], power: number) => void; set: (values: number[], held: boolean[], blank: boolean) => void; shake: (on: boolean, held: boolean[]) => void } | null>(null);
  const powerRef = useRef(power);
  powerRef.current = power;
  const toggleRef = useRef(onToggle);
  toggleRef.current = onToggle;
  const lastKey = useRef(rollKey);

  // 장면 만들기 (한 번)
  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 2, 0.1, 100);
    camera.position.set(0, 8.4, 2.4);
    camera.lookAt(0, 0, 0.15);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a5a6a, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-4, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 5, bottom: -5 });
    sun.shadow.radius = 4;
    scene.add(sun);
    // 바닥: 그림자만 받는 투명 면 (판 색은 CSS 펠트가 그대로 보이게)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.32 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const tex = [1, 2, 3, 4, 5, 6].map(faceTexture);
    const mats = tex.map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.42, metalness: 0 }));
    const geo = new RoundedBoxGeometry(1, 1, 1, 4, 0.16);
    const ringGeo = new THREE.RingGeometry(0.72, 0.9, 40);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf2b33d, transparent: true, opacity: 0.95 });
    const dice = Array.from({ length: N }, () => {
      const mesh = new THREE.Mesh(geo, STD.map((v) => mats[v - 1]));
      mesh.castShadow = true;
      scene.add(mesh);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.visible = false;
      scene.add(ring);
      return { mesh, ring, labels: [...STD] };
    });
    /** 마지막으로 멈춘(멈출) 자세 — 눈을 읽는 기준 */
    const restQ = dice.map((d) => d.mesh.quaternion.clone());
    const setLabels = (i: number, labels: number[]) => {
      dice[i].labels = labels;
      dice[i].mesh.material = labels.map((v) => mats[v - 1]);
    };

    // 물리 세계 (미리 돌려 보기용)
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -30, 0) });
    world.allowSleep = true;
    const dieMat = new CANNON.Material('die');
    const wallMat = new CANNON.Material('wall');
    world.addContactMaterial(new CANNON.ContactMaterial(dieMat, wallMat, { friction: 0.25, restitution: 0.45 }));
    world.addContactMaterial(new CANNON.ContactMaterial(dieMat, dieMat, { friction: 0.2, restitution: 0.4 }));
    const ground = new CANNON.Body({ mass: 0, material: wallMat, shape: new CANNON.Plane() });
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(ground);
    const wall = (x: number, z: number, w: number, d: number) => {
      const b = new CANNON.Body({ mass: 0, material: wallMat, shape: new CANNON.Box(new CANNON.Vec3(w / 2, 4, d / 2)) });
      b.position.set(x, 4, z);
      world.addBody(b);
    };
    wall(0, -TRAY_D / 2 - 0.5, TRAY_W + 2, 1);
    wall(0, TRAY_D / 2 + 0.5, TRAY_W + 2, 1);
    wall(-TRAY_W / 2 - 0.5, 0, 1, TRAY_D + 2);
    wall(TRAY_W / 2 + 0.5, 0, 1, TRAY_D + 2);
    const bodies = Array.from({ length: N }, () => {
      const b = new CANNON.Body({ mass: 1, material: dieMat, shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)), sleepSpeedLimit: 0.2, sleepTimeLimit: 0.25, linearDamping: 0.08, angularDamping: 0.12 });
      world.addBody(b);
      return b;
    });

    // 재생 상태
    type Frame = { p: THREE.Vector3; q: THREE.Quaternion }[];
    let frames: Frame[] | null = null;
    let frameAt = 0;
    let settle: { from: Frame; to: Frame; t: number } | null = null;
    let heldNow: boolean[] = Array(N).fill(false);
    let dim = false;
    let shaking = false;
    let shakeT = 0;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    /** 줄로 놓인 자세: 위 면 유지, 반듯하게, 자리별 살짝 비뚤게 */
    const restPose = (i: number, q: THREE.Quaternion) => {
      const s = snapQuat(q);
      const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ((i * 37) % 11 - 5) * 0.025);
      return { p: new THREE.Vector3(rowX(i), heldNow[i] ? 0.85 : 0.5, heldNow[i] ? -0.9 : 0.35), q: yaw.multiply(s) };
    };
    const applyFrame = (f: Frame) => f.forEach((x, i) => (dice[i].mesh.position.copy(x.p), dice[i].mesh.quaternion.copy(x.q)));
    const current = (): Frame => dice.map((d) => ({ p: d.mesh.position.clone(), q: d.mesh.quaternion.clone() }));
    const toRow = (animate: boolean) => {
      const to = dice.map((_, i) => restPose(i, restQ[i]));
      if (animate && !reduced) settle = { from: current(), to, t: 0 };
      else applyFrame(to);
    };
    const showRings = () => dice.forEach((d, i) => ((d.ring.visible = heldNow[i]), d.ring.position.set(rowX(i), 0.02, -0.9)));

    /** 값만 맞춰 놓기 (애니메이션 없이): 표준 그림, 그 눈이 위로 */
    const set = (values: number[], held: boolean[], blank: boolean) => {
      heldNow = held;
      dim = blank;
      values.forEach((v, i) => {
        // 이미 그 눈이 위면 그대로 (남기기를 눌렀을 때 주사위가 휙 돌지 않게)
        if (dice[i].labels[topFace(snapQuat(restQ[i]))] === v) return;
        setLabels(i, [...STD]);
        const up = DIRS[STD.indexOf(v)];
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...up), new THREE.Vector3(0, 1, 0));
        dice[i].mesh.quaternion.copy(q);
        restQ[i].copy(q);
      });
      if (!frames && !shaking) toRow(false);
      showRings();
    };

    /** 던지기: 남기지 않은 주사위만 */
    const roll = (values: number[], held: boolean[], power: number) => {
      heldNow = held;
      dim = false;
      const fromHand = shaking;
      shaking = false;
      const moving = values.map((_, i) => !held[i]);
      // 남긴 주사위: 마지막으로 멈춘 자세에서 위를 향한 면에 서버 눈이 오게 (자세는 그대로, 그림만 맞춤)
      values.forEach((v, i) => {
        if (moving[i]) return;
        const top = topFace(snapQuat(restQ[i]));
        if (dice[i].labels[top] !== v) setLabels(i, labelsFor(top, v));
      });
      const heldPose = dice.map((_, i) => restPose(i, restQ[i]));
      const speed = 10 + power * 10;
      bodies.forEach((b, i) => {
        if (moving[i]) {
          b.type = CANNON.Body.DYNAMIC;
          b.mass = 1;
          b.updateMassProperties();
          const mp = dice[i].mesh.position;
          const mq = dice[i].mesh.quaternion;
          // 흔들던 손에서 그대로 놓기 (화면이 끊기지 않게), 아니면 오른쪽 위에서 던짐
          if (fromHand) b.position.set(Math.min(TRAY_W / 2 - 0.6, mp.x), Math.max(0.6, mp.y), Math.max(-TRAY_D / 2 + 0.6, Math.min(TRAY_D / 2 - 0.6, mp.z)));
          else b.position.set(TRAY_W / 2 - 0.9 - Math.random() * 0.6, 1.2 + Math.random() * 1.6, (i - 2) * 0.8 + (Math.random() - 0.5) * 0.3);
          if (fromHand) b.quaternion.set(mq.x, mq.y, mq.z, mq.w);
          else b.quaternion.setFromEuler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
          b.velocity.set(-speed - Math.random() * 5, 2 + Math.random() * 3, (Math.random() - 0.5) * 4);
          const spin = 22 + power * 18;
          b.angularVelocity.set((Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin);
        } else {
          // 남긴 주사위는 뒤쪽 줄에 고정 (부딪히는 벽 역할)
          b.type = CANNON.Body.STATIC;
          b.mass = 0;
          b.updateMassProperties();
          b.position.set(rowX(i), 0.5, -0.9);
          b.velocity.setZero();
          b.angularVelocity.setZero();
        }
        b.wakeUp();
      });
      // 끝까지 미리 돌려 기록
      const rec: Frame[] = [];
      for (let s = 0; s < MAX_STEPS; s++) {
        world.step(STEP);
        rec.push(bodies.map((b, i) => (moving[i] ? { p: new THREE.Vector3(b.position.x, b.position.y, b.position.z), q: new THREE.Quaternion(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w) } : heldPose[i])));
        if (s > 30 && bodies.every((b, i) => !moving[i] || b.sleepState === CANNON.Body.SLEEPING)) break;
      }
      // 멈춘 면에 서버 눈이 오도록 그림을 바꿔 붙임
      const last = rec[rec.length - 1];
      values.forEach((v, i) => {
        if (!moving[i]) return;
        setLabels(i, labelsFor(topFace(last[i].q), v));
        restQ[i].copy(last[i].q);
      });
      showRings();
      if (reduced) {
        applyFrame(last);
        toRow(false);
        return;
      }
      frames = rec;
      frameAt = 0;
    };
    /** 손에 쥐고 흔들기 시작/멈춤 (멈추면 원래 자리로) */
    const shake = (on: boolean, held: boolean[]) => {
      if (on === shaking) return;
      heldNow = held;
      if (on) {
        if (frames) {
          applyFrame(frames[frames.length - 1]);
          frames = null;
        }
        settle = null;
        shaking = true;
        dim = false;
        shakeT = 0;
      } else {
        shaking = false;
        toRow(true);
      }
    };
    api.current = { roll, set, shake };

    // 크기
    const fit = () => {
      const r = el.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = r.width / Math.max(1, r.height);
      // 좁으면 더 멀리서
      // 위에서 거의 내려다봄 (윗면이 잘 읽히게). 좁으면 더 멀리서 → 판 너비가 늘 다 보이게
      const k = Math.max(1, 2.3 / camera.aspect);
      camera.position.set(0, 8.4 * k, 2.4 * k);
      camera.lookAt(0, 0, 0.15);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();

    // 누르기 → 남기기
    const ray = new THREE.Raycaster();
    const onClick = (e: PointerEvent) => {
      if (!toggleRef.current || frames || settle) return;
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(dice.map((d) => d.mesh))[0];
      if (hit) toggleRef.current(dice.findIndex((d) => d.mesh === hit.object));
    };
    renderer.domElement.addEventListener('pointerup', onClick);
    const onMove = (e: PointerEvent) => {
      if (!toggleRef.current) return (renderer.domElement.style.cursor = '');
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      renderer.domElement.style.cursor = ray.intersectObjects(dice.map((d) => d.mesh)).length ? 'pointer' : '';
    };
    renderer.domElement.addEventListener('pointermove', onMove);

    let raf = 0;
    let prev = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      // 실제 흐른 시간 기준 (느린 기기에서도 같은 시간 안에 끝나게, 한 번에 최대 0.1초)
      const now = performance.now();
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      if (shaking) {
        // 오른쪽 위 「손」 속에서 달그락: 무작위로 튀고 돌아감 (점점 세게)
        shakeT += dt * 60;
        const amp = Math.min(1, 0.45 + shakeT / 90);
        const hand = new THREE.Vector3(TRAY_W / 2 - 1.7 + Math.sin(shakeT * 0.55) * 0.35 * amp, 1.9 + Math.abs(Math.sin(shakeT * 0.9)) * 0.5 * amp, 0.2 + Math.cos(shakeT * 0.7) * 0.3 * amp);
        let k = 0;
        dice.forEach((d, i) => {
          if (heldNow[i]) {
            d.mesh.position.lerp(new THREE.Vector3(rowX(i), 0.85, -0.9), 0.2);
            return;
          }
          const a = (k++ / 4) * Math.PI * 2 + shakeT * 0.3;
          const target = hand.clone().add(new THREE.Vector3(Math.cos(a) * 0.75 + (Math.random() - 0.5) * 0.35 * amp, (Math.random() - 0.5) * 0.45 * amp, Math.sin(a) * 0.6 + (Math.random() - 0.5) * 0.35 * amp));
          d.mesh.position.lerp(target, 0.35);
          const spin = new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random() - 0.5) * 0.5 * amp, (Math.random() - 0.5) * 0.5 * amp, (Math.random() - 0.5) * 0.5 * amp));
          d.mesh.quaternion.multiply(spin);
        });
      } else if (frames) {
        applyFrame(frames[Math.min(frames.length - 1, Math.floor(frameAt))]);
        frameAt += dt * 60;
        if (frameAt >= frames.length) {
          frames = null;
          toRow(true);
        }
      } else if (settle) {
        settle.t = Math.min(1, settle.t + dt * (60 / 22));
        const k = 1 - Math.pow(1 - settle.t, 3);
        dice.forEach((d, i) => {
          d.mesh.position.lerpVectors(settle!.from[i].p, settle!.to[i].p, k);
          d.mesh.quaternion.slerpQuaternions(settle!.from[i].q, settle!.to[i].q, k);
        });
        if (settle.t >= 1) settle = null;
      } else {
        // 남긴 주사위는 살짝 들리고, 나머지는 바닥에
        // 지금 화면에서 위를 향한 눈 (테스트·화면 읽기용)
        const top = dice.map((d) => d.labels[topFace(d.mesh.quaternion)]).join(',');
        if (el.dataset.top !== top) el.dataset.top = top;
        dice.forEach((d, i) => {
          const ty = heldNow[i] ? 0.85 : 0.5;
          const tz = heldNow[i] ? -0.9 : 0.35;
          d.mesh.position.y += (ty - d.mesh.position.y) * 0.2;
          d.mesh.position.z += (tz - d.mesh.position.z) * 0.2;
          d.mesh.position.x += (rowX(i) - d.mesh.position.x) * 0.2;
        });
      }
      mats.forEach((m) => (m.opacity = dim ? 0.45 : 1, m.transparent = dim));
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerup', onClick);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.dispose();
      geo.dispose();
      ringGeo.dispose();
      tex.forEach((t) => t.dispose());
      mats.forEach((m) => m.dispose());
      el.removeChild(renderer.domElement);
      api.current = null;
    };
  }, []);

  // 값 바뀜 → 굴리기 또는 그냥 놓기
  useEffect(() => {
    if (!api.current) return;
    if (rollKey !== lastKey.current && !blank) api.current.roll(values, held, powerRef.current);
    else api.current.set(values, held, !!blank);
    lastKey.current = rollKey;
  }, [rollKey, values.join(), held.join(), blank]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.current?.shake(shaking, held);
  }, [shaking]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={host} className="ya-tray3d" data-held={held.map(Number).join('')} aria-label={`주사위 ${values.join(', ')}`} role="img" />;
}
