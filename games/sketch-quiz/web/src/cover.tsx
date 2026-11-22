import { SAMPLE, Sketch } from './theme';

/** 표지: 그림판에 그린 집과 해 */
export function Cover() {
  return (
    <div className="cover-stack sq-cover">
      <Sketch strokes={SAMPLE} />
    </div>
  );
}
