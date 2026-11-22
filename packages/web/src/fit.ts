/**
 * 화면 크기에 맞춘 배율. 게임 화면은 「기준 화면」 크기로 설계한다.
 * - 넓은 화면: 1240×760
 * - 세로·좁은 화면: 560×860
 * 실제 화면이 더 크면 그만큼 키운다 (큰 모니터·태블릿에서 작게 보이지 않게).
 * 낮은 가로 화면(휴대폰 눕힘)은 조금 줄여서 잘리지 않게 한다.
 * CSS zoom이라 레이아웃도 함께 바뀐다. 끌어 놓기 판정은 elementFromPoint로 하면 배율과 상관없다.
 */
export function fitZoom(w: number, h: number): number {
  const narrow = w < 760 || w / h < 1;
  const [bw, bh] = narrow ? [560, 860] : [1240, 760];
  const z = Math.min(w / bw, h / bh);
  if (z >= 1) return Math.min(1.7, Math.round(z * 20) / 20);
  // 줄이는 건 낮은 가로 화면만 (세로 휴대폰은 1 그대로, 정보 패널이 스크롤됨)
  if (!narrow && h < 560) return Math.max(0.8, Math.round((h / 560) * 20) / 20);
  return 1;
}
