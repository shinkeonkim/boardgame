import { Board } from './Board';

/** 표지: 실제 판(13줄) 위에 대각선으로 이어진 흑 다섯과 막으려던 백 */
export function Cover() {
  const n = 13;
  const board = Array(n * n).fill(-1);
  const put = (x: number, y: number, s: 0 | 1) => (board[y * n + x] = s);
  const line: [number, number][] = [
    [3, 9],
    [4, 8],
    [5, 7],
    [6, 6],
    [7, 5],
  ];
  line.forEach(([x, y]) => put(x, y, 0));
  [
    [5, 6],
    [6, 7],
    [7, 6],
    [4, 7],
    [8, 4],
  ].forEach(([x, y]) => put(x, y, 1));
  put(6, 5, 0);
  return (
    <div className="fs-cover fs-table">
      <Board size={n} board={board} myStone={null} canPlay={false} lastMove={[7, 5]} winLine={line} onPlace={() => {}} />
    </div>
  );
}
