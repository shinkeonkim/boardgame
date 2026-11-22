/**
 * Pass the Plate 메뉴 그림 (자체 제작 SVG, 40 × 40). 이모지 대신 접시 위 음식을 직접 그린다.
 */
import type { Dish } from '@bg/pass-the-plate-engine';

function Maki({ x, y }: { x: number; y: number }) {
  // 김밥 한 조각 (단면)
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="6.2" fill="#1d2a1d" />
      <circle r="5" fill="#fbfaf4" />
      <circle cx="-1.6" cy="-1.2" r="1.3" fill="#e8b84a" />
      <circle cx="1.6" cy="-0.6" r="1.2" fill="#d0533f" />
      <circle cx="0" cy="1.8" r="1.2" fill="#3e9a63" />
      <circle cx="-1.4" cy="1.4" r="0.7" fill="#f08a3a" />
    </g>
  );
}

function Nigiri({ topping, stripe }: { topping: string; stripe?: string }) {
  return (
    <g>
      <ellipse cx="20" cy="25" rx="11" ry="5.5" fill="#fbfaf4" />
      <ellipse cx="20" cy="24" rx="11" ry="5" fill="#ffffff" />
      <path d="M8 22 q12 -10 24 0 q-2 4 -12 4 q-10 0 -12 -4 z" fill={topping} />
      {stripe && <path d="M12 20 q8 -5 16 0 M11 22.5 q9 -5 18 0" stroke={stripe} strokeWidth="1" fill="none" opacity="0.7" />}
      <path d="M11 20 q5 -5 10 -4" stroke="#fff" strokeWidth="1" opacity="0.6" fill="none" />
    </g>
  );
}

export function DishArt({ dish, size }: { dish: Dish; size?: number }) {
  return (
    <svg className="dcard-art" viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      {(() => {
        switch (dish) {
          case 'maki1':
            return <Maki x={20} y={21} />;
          case 'maki2':
            return (
              <>
                <Maki x={14} y={22} />
                <Maki x={26} y={20} />
              </>
            );
          case 'maki3':
            return (
              <>
                <Maki x={12} y={24} />
                <Maki x={28} y={24} />
                <Maki x={20} y={15} />
              </>
            );
          case 'tempura':
            return (
              <g>
                <path d="M8 30 q4 -18 22 -22 l3 3 q-6 18 -22 22 z" fill="#e8a23a" />
                <path d="M9 29 q5 -15 20 -19" stroke="#f6d27a" strokeWidth="2.2" strokeDasharray="1.5 1.8" fill="none" />
                <path d="M30 8 l5 -4 -1 5 4 1 -5 2 z" fill="#d0533f" />
                <path d="M10 31 q-3 2 -4 0" stroke="#d0533f" strokeWidth="1.5" fill="none" />
              </g>
            );
          case 'sashimi':
            return (
              <g>
                <path d="M8 26 q6 -12 12 -12 q-2 9 -12 12 z" fill="#e8705a" />
                <path d="M16 28 q6 -12 12 -12 q-2 9 -12 12 z" fill="#f08a6a" />
                <path d="M24 29 q6 -12 12 -12 q-2 9 -12 12 z" fill="#e8705a" />
                <path d="M11 24 l6 -7 M19 26 l6 -7 M27 27 l6 -7" stroke="#fff" strokeWidth="0.9" opacity="0.6" />
                <path d="M6 31 q14 4 28 0" stroke="#3e9a63" strokeWidth="2" fill="none" />
              </g>
            );
          case 'dumpling':
            return (
              <g>
                <path d="M7 26 q13 -18 26 0 q-13 6 -26 0 z" fill="#f6ead2" stroke="#d8c39a" strokeWidth="0.8" />
                <path d="M11 21 q2 2 4 -1 q2 2 4 -1.5 q2 2 4 -1.5 q2 2 4 -1 q2 2 3 1" stroke="#c9ad7a" strokeWidth="1" fill="none" />
                <ellipse cx="17" cy="25" rx="5" ry="1.4" fill="#fff" opacity="0.6" />
              </g>
            );
          case 'egg':
            return <Nigiri topping="#f6d24a" stripe="#d8a82a" />;
          case 'salmon':
            return <Nigiri topping="#f08a5a" stripe="#fbe2d2" />;
          case 'squid':
            return <Nigiri topping="#f3efe6" stripe="#c9bfae" />;
          case 'wasabi':
            return (
              <g>
                <path d="M11 29 q-2 -9 5 -12 q3 -6 8 -3 q6 -1 6 6 q4 5 -2 9 z" fill="#7ab648" />
                <path d="M16 20 q3 -2 6 0 M15 25 q5 -2 10 0" stroke="#5a9a30" strokeWidth="1" fill="none" />
                <ellipse cx="18" cy="19" rx="2.5" ry="1.2" fill="#b8e08a" opacity="0.8" />
              </g>
            );
          case 'chopsticks':
            return (
              <g strokeLinecap="round">
                <path d="M8 33 L32 7" stroke="#8a5a32" strokeWidth="2.4" />
                <path d="M13 34 L35 10" stroke="#a86e3e" strokeWidth="2.4" />
                <path d="M28 11.5 L32 7 M31 14.5 L35 10" stroke="#d0533f" strokeWidth="2.6" />
              </g>
            );
          case 'pudding':
            return (
              <g>
                <ellipse cx="20" cy="32" rx="12" ry="2.5" fill="#000" opacity="0.12" />
                <path d="M10 31 l3 -16 h14 l3 16 z" fill="#f2c45a" />
                <path d="M13 15 h14 l0.6 4 q-7.6 3 -15.2 0 z" fill="#7a3a12" />
                <path d="M15 17 v6" stroke="#5a2a0a" strokeWidth="1.2" strokeLinecap="round" />
                <ellipse cx="20" cy="15" rx="7" ry="1.6" fill="#8a4a1a" />
                <path d="M13 26 q2 2 4 0" stroke="#fff" strokeWidth="0.8" opacity="0.6" fill="none" />
              </g>
            );
        }
      })()}
    </svg>
  );
}
