/**
 * 화투 48장 그림 — 사람들이 아는 전통 화투 구도를 따라 직접 그린 SVG (80×128 좌표).
 *  1 송학(솔·학·붉은 해) 2 매조(매화·꾀꼬리) 3 벚꽃(벚꽃·장막) 4 흑싸리(검은 등나무·두견새·초승달)
 *  5 난초(붓꽃·나무다리) 6 모란(모란·나비) 7 홍싸리(붉은 싸리·멧돼지) 8 공산(검은 언덕·보름달·기러기)
 *  9 국화(국화·술잔) 10 단풍(단풍·사슴) 11 오동(오동잎·봉황) 12 비(버들·우산 쓴 사람·제비·번개)
 * 전통 화투처럼 숫자는 없고, 광에는 「光」 동그라미, 홍단·청단 띠에는 글씨가 있다.
 */
import type { HCard } from '@bg/go-stop-engine';
import type { ReactNode } from 'react';

const INK = '#1b1714';
const RED = '#d0222b';
const DEEP = '#8f1a1f';
const GREEN = '#2e7d3c';
const DGREEN = '#1f4d2a';
const PURPLE = '#6a3d9a';
const YELLOW = '#f0c02a';
const PINK = '#f6c3cf';
const BROWN = '#7a4a24';
const SW = 1.3;

const ink = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** 다섯 잎 꽃 */
function Blossom({ x, y, r, fill, core = YELLOW }: { x: number; y: number; r: number; fill: string; core?: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => {
        const t = ((a - 90) * Math.PI) / 180;
        return <circle key={a} cx={x + r * 0.62 * Math.cos(t)} cy={y + r * 0.62 * Math.sin(t)} r={r * 0.5} fill={fill} {...ink} strokeWidth={0.9} />;
      })}
      <circle cx={x} cy={y} r={r * 0.28} fill={core} stroke={INK} strokeWidth={0.6} />
    </g>
  );
}

/** 솔잎 뭉치 (부채꼴) */
function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-16 4 Q0 -14 16 4 Z" fill={DGREEN} {...ink} />
      {[-12, -7, -2, 3, 8, 12].map((dx) => (
        <path key={dx} d={`M0 3 L${dx} ${-8 + Math.abs(dx) * 0.5}`} stroke="#6fae5c" strokeWidth={0.8} />
      ))}
    </g>
  );
}

/** 붉은 하늘(위)·땅(아래) 띠 — 화투 피 그림의 바탕 */
function Band({ top, color = RED }: { top?: boolean; color?: string }) {
  return top ? <path d="M4 4 H76 V30 Q58 40 40 32 T4 34 Z" fill={color} /> : <path d="M4 124 V96 Q22 86 40 94 T76 90 V124 Z" fill={color} />;
}

/** 띠: 비스듬히 늘어진 리본. text가 있으면 세로 글씨 (홍단·청단) */
function Ribbon({ color, text, x = 26 }: { color: string; text?: string; x?: number }) {
  return (
    <g>
      <path d={`M${x - 2} 14 L${x + 22} 18 L${x + 20} 92 L${x + 10} 104 L${x} 90 Z`} fill={color} {...ink} />
      <path d={`M${x + 1} 22 L${x + 19} 26`} stroke="rgba(255,255,255,0.45)" strokeWidth={1.4} />
      {text && (
        <text x={x + 10} y="46" textAnchor="middle" fontSize="16" fontWeight="900" fill={INK} fontFamily="serif">
          {text.split('').map((ch, i) => (
            <tspan key={i} x={x + 10} dy={i ? 20 : 0}>
              {ch}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}

/** 광 표시: 붉은 테 동그라미 안 「光」 */
function Gwang({ x = 64, y = 16 }: { x?: number; y?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="10" fill="#fffaf0" stroke={RED} strokeWidth="2" />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="900" fill={RED} fontFamily="serif">
        光
      </text>
    </g>
  );
}

/** 쌍피 표시 */
function Double() {
  return (
    <g>
      <rect x="52" y="100" width="22" height="20" rx="3" fill="#fffaf0" stroke={RED} strokeWidth="1.6" />
      <text x="63" y="114.5" textAnchor="middle" fontSize="11" fontWeight="900" fill={RED} fontFamily="serif">
        쌍피
      </text>
    </g>
  );
}

// ── 달마다 바탕 (피 그림) ──
function Scene({ month, kind }: { month: number; kind: HCard['kind'] }): ReactNode {
  switch (month) {
    case 1: // 송학: 붉은 땅 위 소나무
      return (
        <g>
          <Band />
          <path d="M34 124 Q30 90 42 62 Q48 46 44 30" fill="none" stroke={BROWN} strokeWidth={5} strokeLinecap="round" />
          <path d="M34 124 Q30 90 42 62 Q48 46 44 30" fill="none" stroke={INK} strokeWidth={0.8} />
          <Pine x={26} y={44} />
          <Pine x={54} y={32} s={1.1} />
          <Pine x={58} y={66} s={0.9} />
          <Pine x={24} y={76} s={0.85} />
        </g>
      );
    case 2: // 매조: 검은 가지에 붉은 매화
      return (
        <g>
          <Band top />
          <path d="M8 120 Q20 92 34 80 Q46 70 50 50 Q54 36 70 28" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M34 80 Q50 86 64 78" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          {[
            [20, 100],
            [36, 74],
            [50, 56],
            [62, 34],
            [60, 78],
            [44, 92],
            [26, 86],
          ].map(([x, y], i) => (
            <Blossom key={i} x={x} y={y} r={7} fill={RED} core="#fff3c4" />
          ))}
        </g>
      );
    case 3: // 벚꽃: 붉은 하늘 아래 흰 벚꽃 송이
      return (
        <g>
          <Band top />
          {[
            [16, 46],
            [30, 40],
            [46, 44],
            [62, 42],
            [22, 60],
            [38, 58],
            [54, 60],
            [30, 74],
            [48, 76],
            [64, 70],
            [16, 78],
          ].map(([x, y], i) => (
            <Blossom key={i} x={x} y={y} r={8} fill={i % 3 ? '#fff' : PINK} core="#e9667f" />
          ))}
        </g>
      );
    case 4: // 흑싸리: 위에서 늘어진 검은 등나무 줄기
      return (
        <g>
          <Band color={DEEP} />
          {[14, 26, 38, 50, 62].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 4 Q${x + (i % 2 ? 4 : -4)} 40 ${x + 2} ${70 + (i % 3) * 8}`} fill="none" stroke={INK} strokeWidth={1.2} />
              {Array.from({ length: 7 }, (_, k) => (
                <ellipse key={k} cx={x + (i % 2 ? 2 : -2) + (k % 2 ? 2.5 : -2.5)} cy={12 + k * 9} rx="3" ry="4.2" fill={INK} />
              ))}
            </g>
          ))}
        </g>
      );
    case 5: // 난초: 보라 붓꽃과 긴 잎
      return (
        <g>
          {[14, 26, 38, 50, 62].map((x, i) => (
            <path key={x} d={`M${x} 124 Q${x + (i % 2 ? 10 : -8)} 84 ${x + (i % 2 ? 4 : -2)} 40`} fill="none" stroke={GREEN} strokeWidth={3} strokeLinecap="round" />
          ))}
          {[
            [22, 36],
            [46, 30],
            [60, 50],
            [32, 56],
          ].map(([x, y], i) => (
            <g key={i}>
              <path d={`M${x} ${y} q-9 -4 -8 -14 q6 2 8 8 q2 -10 8 -12 q2 8 -4 14 q10 0 12 8 q-10 4 -16 -4z`} fill={PURPLE} {...ink} strokeWidth={0.9} />
              <path d={`M${x - 2} ${y - 4} q2 4 4 0`} stroke={YELLOW} strokeWidth={1.4} fill="none" />
            </g>
          ))}
        </g>
      );
    case 6: // 모란: 큰 붉은 꽃과 잎
      return (
        <g>
          {[
            [16, 96, -30],
            [62, 92, 30],
            [26, 116, -10],
            [54, 116, 12],
          ].map(([x, y, r], i) => (
            <path key={i} transform={`translate(${x} ${y}) rotate(${r})`} d="M0 -16 Q12 -6 0 16 Q-12 -6 0 -16Z" fill={GREEN} {...ink} />
          ))}
          <g transform="translate(40 70)">
            {[0, 51, 103, 154, 206, 257, 309].map((a) => (
              <ellipse key={a} cx={14 * Math.cos((a * Math.PI) / 180)} cy={12 * Math.sin((a * Math.PI) / 180)} rx="11" ry="9" fill={RED} {...ink} strokeWidth={1} />
            ))}
            <circle r="10" fill="#e8434c" {...ink} strokeWidth={1} />
            <circle r="4" fill={YELLOW} />
          </g>
        </g>
      );
    case 7: // 홍싸리: 붉은 싸리 꽃줄기
      return (
        <g>
          <Band color={DEEP} />
          {[12, 24, 36, 48, 60, 70].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 110 Q${x + (i % 2 ? 8 : -6)} 60 ${x + (i % 2 ? 2 : 6)} 12`} fill="none" stroke={INK} strokeWidth={1.1} />
              {Array.from({ length: 9 }, (_, k) => (
                <circle key={k} cx={x + (i % 2 ? 4 : 2) + (k % 2 ? 3 : -3)} cy={18 + k * 10} r="2.8" fill={RED} stroke={INK} strokeWidth={0.6} />
              ))}
            </g>
          ))}
        </g>
      );
    case 8: // 공산: 검은 언덕과 억새
      return (
        <g>
          <path d="M4 124 V70 Q40 40 76 70 V124 Z" fill={INK} />
          {[14, 24, 34, 46, 56, 66].map((x) => (
            <path key={x} d={`M${x} 70 q-3 -12 2 -20`} fill="none" stroke={INK} strokeWidth={1.4} />
          ))}
          {[18, 30, 42, 54, 64].map((x) => (
            <path key={x} d={`M${x} 118 q2 -16 -2 -30`} fill="none" stroke="#6a6458" strokeWidth={0.9} />
          ))}
        </g>
      );
    case 9: // 국화: 노란·붉은 국화
      return (
        <g>
          {[
            [16, 104, -30],
            [64, 100, 30],
          ].map(([x, y, r], i) => (
            <path key={i} transform={`translate(${x} ${y}) rotate(${r})`} d="M0 -14 Q10 -4 0 14 Q-10 -4 0 -14Z" fill={GREEN} {...ink} />
          ))}
          {[
            [28, 46, YELLOW],
            [54, 38, RED],
            [42, 76, YELLOW],
          ].map(([x, y, c], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              {Array.from({ length: 16 }, (_, k) => (
                <ellipse key={k} cx="0" cy="-8" rx="2.2" ry="7" fill={c as string} stroke={INK} strokeWidth={0.6} transform={`rotate(${k * 22.5})`} />
              ))}
              <circle r="3.6" fill="#b4561c" stroke={INK} strokeWidth={0.6} />
            </g>
          ))}
        </g>
      );
    case 10: // 단풍: 붉은 단풍잎
      return (
        <g>
          <path d="M70 4 Q50 40 56 70 Q60 96 46 124" fill="none" stroke={INK} strokeWidth={2.2} />
          {[
            [24, 26, -20],
            [50, 22, 15],
            [34, 50, 5],
            [60, 50, -10],
            [20, 72, 25],
            [46, 80, -15],
            [62, 100, 10],
          ].map(([x, y, r], i) => (
            <path
              key={i}
              transform={`translate(${x} ${y}) rotate(${r}) scale(1.5)`}
              d="M0-8l2 5 5-2-2 5 5 1-5 3 2 4-5-2-1 6-1-6-5 2 2-4-5-3 5-1-2-5 5 2z"
              fill={i % 3 === 2 ? '#e0662a' : RED}
              stroke={INK}
              strokeWidth={0.5}
            />
          ))}
        </g>
      );
    case 11: // 오동: 큰 검은 잎과 보라 꽃대
      return (
        <g>
          {kind === 'double' && <rect x="4" y="76" width="72" height="48" fill={YELLOW} />}
          {[
            [22, 96, -20],
            [52, 98, 20],
            [38, 84, 0],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
              <path d="M0 -22 Q22 -14 16 8 Q8 18 0 14 Q-8 18 -16 8 Q-22 -14 0 -22Z" fill={INK} />
              <path d="M0 -18 V12 M0 -4 L10 -10 M0 -4 L-10 -10 M0 6 L9 0 M0 6 L-9 0" stroke="#5c5a52" strokeWidth={0.8} />
            </g>
          ))}
          <path d="M40 62 V20" stroke={INK} strokeWidth={1.4} />
          {[22, 30, 38, 46, 54].map((y, i) => (
            <g key={y}>
              <circle cx={40 + (i % 2 ? 6 : -6)} cy={y} r="3.4" fill={PURPLE} stroke={INK} strokeWidth={0.6} />
              <circle cx={40 + (i % 2 ? -5 : 5)} cy={y + 3} r="2.6" fill="#b89be0" stroke={INK} strokeWidth={0.6} />
            </g>
          ))}
        </g>
      );
    default: // 비: 늘어진 버들과 빗줄기
      return (
        <g>
          {kind === 'double' ? null : (
            <>
              {[10, 22, 34].map((x, i) => (
                <path key={x} d={`M${x + 20} 4 Q${x} 40 ${x + 4} ${84 + i * 6}`} fill="none" stroke={GREEN} strokeWidth={2.2} />
              ))}
              {[
                [20, 30],
                [16, 50],
                [30, 60],
                [24, 76],
              ].map(([x, y], i) => (
                <ellipse key={i} cx={x} cy={y} rx="2" ry="6" fill={GREEN} transform={`rotate(-20 ${x} ${y})`} />
              ))}
            </>
          )}
          {[
            [56, 10],
            [66, 30],
            [50, 44],
            [70, 56],
            [8, 100],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} l-4 12`} stroke="#3a6fc4" strokeWidth={1.4} />
          ))}
        </g>
      );
  }
}

// ── 광·열끗·띠에 더해지는 주인공 ──
function Feature({ card }: { card: HCard }): ReactNode {
  const { month, kind } = card;
  if (kind === 'ribbon') {
    const color = card.ribbon === 'blue' ? '#2d5fb8' : RED;
    const text = card.ribbon === 'red' ? '홍단' : card.ribbon === 'blue' ? '청단' : undefined;
    if (month === 12)
      return (
        <g>
          <Ribbon color={RED} x={44} />
          {[30, 50, 70].map((y) => (
            <path key={y} d={`M45 ${y} L63 ${y + 4}`} stroke={INK} strokeWidth={2} />
          ))}
        </g>
      );
    return <Ribbon color={color} text={text} />;
  }
  if (kind === 'gwang') {
    switch (month) {
      case 1: // 학과 붉은 해
        return (
          <g>
            <circle cx="56" cy="30" r="15" fill={RED} {...ink} strokeWidth={1} />
            <g transform="translate(34 90)">
              <path d="M-12 8 Q-18 -4 -6 -8 Q8 -12 14 -2 Q16 8 4 12 Z" fill="#fff" {...ink} />
              <path d="M-14 2 Q-22 0 -24 8 L-10 10 Z" fill={INK} />
              <path d="M10 -6 Q14 -24 6 -36" fill="none" stroke={INK} strokeWidth={3} />
              <path d="M10 -6 Q14 -24 6 -36" fill="none" stroke="#fff" strokeWidth={1.4} />
              <ellipse cx="6" cy="-38" rx="4" ry="3" fill="#fff" {...ink} strokeWidth={0.9} />
              <circle cx="5" cy="-41" r="1.8" fill={RED} />
              <path d="M9 -38 l8 2" stroke={INK} strokeWidth={1.4} />
              <path d="M-2 12 v14 M4 12 v14" stroke={INK} strokeWidth={1.2} />
            </g>
            <Gwang x={14} y={16} />
          </g>
        );
      case 3: // 벚꽃 장막
        return (
          <g>
            <path d="M4 84 H76" stroke={INK} strokeWidth={2} />
            {Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={4 + i * 8} y="84" width="8" height="40" fill={i % 3 === 0 ? RED : i % 3 === 1 ? '#fff' : PURPLE} stroke={INK} strokeWidth={0.6} />
            ))}
            <path d="M4 84 Q40 96 76 84" fill="none" stroke={YELLOW} strokeWidth={2} />
            <Gwang x={64} y={16} />
          </g>
        );
      case 8: // 붉은 하늘에 보름달
        return (
          <g>
            <rect x="4" y="4" width="72" height="66" fill={RED} />
            <circle cx="40" cy="38" r="22" fill="#fffaf0" {...ink} strokeWidth={1} />
            <Gwang x={64} y={16} />
          </g>
        );
      case 11: // 봉황
        return (
          <g>
            <g transform="translate(40 58)">
              <path d="M-22 10 Q-30 -10 -10 -16 Q8 -22 16 -6 Q20 10 4 16 Z" fill={RED} {...ink} />
              <path d="M-10 -14 Q-4 -30 8 -30 Q14 -28 12 -20" fill={YELLOW} {...ink} />
              <circle cx="8" cy="-26" r="1.6" fill={INK} />
              <path d="M12 -24 l6 2 -6 2" fill={YELLOW} {...ink} strokeWidth={0.8} />
              {[-18, -8, 2].map((dx, i) => (
                <path key={i} d={`M${dx} 12 Q${dx - 10} 34 ${dx - 2} 46`} fill="none" stroke={[GREEN, PURPLE, YELLOW][i]} strokeWidth={4} />
              ))}
              <path d="M-6 -6 Q6 -12 12 0" fill="none" stroke={GREEN} strokeWidth={3} />
            </g>
            <Gwang x={14} y={16} />
          </g>
        );
      default: // 12월 비광: 우산 쓴 사람과 개구리
        return (
          <g>
            <path d="M4 104 Q40 96 76 106 V124 H4 Z" fill={GREEN} />
            <g transform="translate(38 62)">
              <path d="M-26 -10 Q0 -34 26 -10 Z" fill={RED} {...ink} />
              {[-18, -6, 6, 18].map((x) => (
                <path key={x} d={`M0 -24 L${x} -10`} stroke={INK} strokeWidth={0.8} />
              ))}
              <path d="M0 -10 V18" stroke={INK} strokeWidth={1.2} />
              <circle cx="-4" cy="-2" r="5" fill="#f2d2b0" {...ink} strokeWidth={0.9} />
              <path d="M-12 4 Q-4 0 4 4 L8 36 H-16 Z" fill="#fffaf0" {...ink} />
              <path d="M-12 4 L-16 36 M4 4 L8 36" stroke={INK} strokeWidth={0.8} />
              <path d="M-14 20 H6" stroke={RED} strokeWidth={2} />
            </g>
            <g transform="translate(62 108)">
              <ellipse rx="6" ry="4" fill="#7fb24a" {...ink} strokeWidth={0.8} />
              <circle cx="-3" cy="-3" r="1.4" fill={INK} />
              <circle cx="2" cy="-3" r="1.4" fill={INK} />
            </g>
            <Gwang x={64} y={16} />
          </g>
        );
    }
  }
  if (kind === 'animal') {
    switch (month) {
      case 2: // 꾀꼬리
        return <Bird x={40} y={60} body="#b7b93a" />;
      case 4: // 두견새와 초승달
        return (
          <g>
            <path d="M58 14 a10 10 0 1 0 6 18 a8 8 0 1 1 -6 -18z" fill={RED} />
            <Bird x={40} y={74} body="#3a3a3a" fly />
          </g>
        );
      case 5: // 나무다리
        return (
          <g>
            {[
              [6, 92],
              [30, 100],
              [50, 90],
            ].map(([x, y], i) => (
              <path key={i} d={`M${x} ${y} l26 -6 l2 8 l-26 6z`} fill="#b07a42" {...ink} strokeWidth={1} />
            ))}
          </g>
        );
      case 6: // 나비 두 마리
        return (
          <g>
            <Butterfly x={24} y={30} />
            <Butterfly x={56} y={44} s={0.8} />
          </g>
        );
      case 7: // 멧돼지
        return (
          <g transform="translate(40 92)">
            <path d="M-24 6 Q-26 -14 -4 -16 Q18 -18 24 -4 Q28 8 16 12 H-18 Z" fill="#6a3d22" {...ink} />
            <path d="M22 -4 l8 2 -6 4" fill="#6a3d22" {...ink} strokeWidth={0.9} />
            <circle cx="16" cy="-8" r="1.6" fill="#fff" />
            <path d="M24 2 q4 -6 0 -10" stroke="#fff" strokeWidth={1.2} fill="none" />
            <path d="M-16 12 v8 M-6 12 v8 M6 12 v8 M14 12 v8" stroke={INK} strokeWidth={2.4} />
          </g>
        );
      case 8: // 기러기 세 마리
        return (
          <g>
            {[
              [24, 20],
              [44, 30],
              [62, 18],
            ].map(([x, y], i) => (
              <path key={i} d={`M${x - 10} ${y} q5 -6 10 0 q5 -6 10 0 l-10 4z`} fill={INK} />
            ))}
          </g>
        );
      case 9: // 국화 술잔
        return (
          <g transform="translate(40 98)">
            <ellipse cx="0" cy="-10" rx="20" ry="6" fill={RED} {...ink} />
            <path d="M-20 -10 Q-16 10 0 12 Q16 10 20 -10" fill={RED} {...ink} />
            <path d="M-8 12 h16 l-3 6 h-10z" fill={RED} {...ink} strokeWidth={0.9} />
            <text x="0" y="6" textAnchor="middle" fontSize="12" fontWeight="900" fill={YELLOW} fontFamily="serif">
              壽
            </text>
          </g>
        );
      case 10: // 사슴
        return (
          <g transform="translate(36 96)">
            <path d="M-20 0 Q-18 -12 0 -12 Q16 -12 18 -2 Q18 6 10 6 H-14 Q-20 6 -20 0Z" fill="#b5713a" {...ink} />
            <path d="M14 -8 Q18 -22 26 -22 Q30 -18 24 -12 Z" fill="#b5713a" {...ink} strokeWidth={1} />
            <path d="M24 -22 l-2 -10 m2 10 l6 -8 m-12 0 l-4 -8" stroke={INK} strokeWidth={1.2} />
            {[-14, -6, 4, 12].map((x) => (
              <path key={x} d={`M${x} 6 v14`} stroke={INK} strokeWidth={1.8} />
            ))}
            {[-10, -2, 6].map((x) => (
              <circle key={x} cx={x} cy="-5" r="1.4" fill="#fff" />
            ))}
          </g>
        );
      default: // 12월 제비
        return (
          <g transform="translate(46 56)">
            <path d="M-18 -4 Q0 -10 16 0 Q4 4 -18 -4Z" fill={INK} />
            <path d="M-4 -4 L-22 -22 L-2 -8 Z M-4 0 L-20 16 L2 2Z" fill={INK} />
            <path d="M16 0 l10 -6 M16 0 l10 6" stroke={INK} strokeWidth={1.6} />
            <circle cx="12" cy="-2" r="1.6" fill={RED} />
          </g>
        );
    }
  }
  if (kind === 'double' && month === 12)
    // 비 쌍피: 번개와 북
    return (
      <g>
        <rect x="4" y="4" width="72" height="80" fill={INK} />
        <path d="M30 8 L18 40 H32 L20 76 L50 34 H36 L48 8 Z" fill={RED} />
        <circle cx="58" cy="60" r="10" fill={RED} stroke="#fffaf0" strokeWidth={1.6} />
        <path d="M58 52 a8 8 0 0 1 0 16 a4 4 0 0 1 0 -8 a4 4 0 0 0 0 -8" fill={YELLOW} />
      </g>
    );
  return null;
}

function Bird({ x, y, body, fly }: { x: number; y: number; body: string; fly?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-14 4 Q-12 -10 2 -10 Q14 -10 14 0 Q10 10 -6 10 Z" fill={body} {...ink} />
      <circle cx="9" cy="-4" r="1.5" fill={INK} />
      <path d="M14 -2 l6 1 -6 2" fill={YELLOW} stroke={INK} strokeWidth={0.6} />
      <path d={fly ? 'M-4 -6 L-14 -22 L4 -8 Z' : 'M-6 -2 Q2 -6 6 2'} fill={fly ? INK : 'none'} stroke={INK} strokeWidth={1} />
      <path d="M-14 4 l-10 4 l8 -10" fill={body} {...ink} strokeWidth={0.9} />
    </g>
  );
}

function Butterfly({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 Q-14 -14 -16 -2 Q-12 6 0 0 Q-10 10 -8 16 Q0 12 0 0Z" fill={YELLOW} {...ink} strokeWidth={1} />
      <path d="M0 0 Q14 -14 16 -2 Q12 6 0 0 Q10 10 8 16 Q0 12 0 0Z" fill={YELLOW} {...ink} strokeWidth={1} />
      <circle cx="-9" cy="-4" r="2" fill={RED} />
      <circle cx="9" cy="-4" r="2" fill={RED} />
      <path d="M0 -4 v14" stroke={INK} strokeWidth={1.6} />
    </g>
  );
}

/** 카드 앞면 그림 전체 (80×128). 틀(테두리)은 HwatuCard가 그림 */
export function HwatuArt({ card }: { card: HCard }) {
  return (
    <g>
      {/* 같은 달 피 두 장이 똑같아 보이지 않게 한 장은 좌우를 뒤집는다 */}
      <g transform={card.kind === 'pi' && card.id.endsWith('-3') ? 'translate(80 0) scale(-1 1)' : undefined}>
        <Scene month={card.month} kind={card.kind} />
      </g>
      <Feature card={card} />
      {card.kind === 'double' && <Double />}
    </g>
  );
}
