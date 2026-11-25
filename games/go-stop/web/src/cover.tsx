import { DECK } from '@bg/go-stop-engine';
import { HwatuCard } from './theme';

const card = (id: string) => DECK.find((c) => c.id === id)!;
/** 표지: 바닥 위 화투들 */
export function Cover() {
  const fan = ['1-0', '3-0', '8-0', '11-0', '12-0'];
  const table = ['2-0', '4-0', '8-1', '6-1', '9-1', '10-1'];
  return (
    <div className="gs-cover">
      <div className="gs-cover-fan">
        {fan.map((id, i) => (
          <span key={id} style={{ transform: `rotate(${(i - 2) * 9}deg) translateY(${Math.abs(i - 2) * 10}px)` }}>
            <HwatuCard card={card(id)} w={120} />
          </span>
        ))}
      </div>
      <div className="gs-cover-row">
        {table.map((id) => (
          <HwatuCard key={id} card={card(id)} w={86} />
        ))}
      </div>
    </div>
  );
}
