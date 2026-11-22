import { DishCard } from './theme';

/** 표지: 회전 초밥처럼 둥글게 놓인 접시들 */
const DISHES = ['salmon', 'maki2', 'tempura', 'dumpling', 'pudding', 'squid', 'sashimi', 'wasabi'] as const;
export function Cover() {
  return (
    <div className="cover-plates">
      {DISHES.map((d, i) => (
        <span key={d} style={{ transform: `rotate(${i * 45}deg) translateY(-150px) rotate(${-i * 45}deg)` }}>
          <DishCard dish={d} size="sm" />
        </span>
      ))}
      <span className="cover-plates-center">
        <DishCard dish="maki3" size="md" />
      </span>
    </div>
  );
}
