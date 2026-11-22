import { DiscView } from './theme';

/** 표지: 쌓인 원판과 뒤집힌 장미·가시 */
export function Cover() {
  return (
    <div className="cover-stack">
      <div className="cover-row">
        {[0, 1, 2, 3].map((s) => (
          <span key={s} className="cover-disc-stack">
            {[0, 1, 2].map((k) => (
              <DiscView key={k} disc={null} seat={s} size={70} />
            ))}
          </span>
        ))}
      </div>
      <div className="cover-row">
        <DiscView disc="rose" seat={0} size={96} />
        <DiscView disc="thorn" seat={1} size={96} />
        <DiscView disc="rose" seat={2} size={96} />
      </div>
    </div>
  );
}
