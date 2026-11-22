import { describe, expect, it } from 'vitest';
import { fitZoom } from './fit';

describe('fitZoom (화면 맞춤 배율)', () => {
  it('기준보다 큰 모니터는 키운다', () => {
    expect(fitZoom(1920, 1080)).toBeCloseTo(1.4, 2);
    expect(fitZoom(2560, 1440)).toBeCloseTo(1.7, 2); // 상한
  });
  it('세로 태블릿도 세로 기준으로 키운다', () => {
    expect(fitZoom(820, 1180)).toBeCloseTo(1.35, 2);
  });
  it('휴대폰 세로·일반 노트북은 그대로', () => {
    expect(fitZoom(390, 844)).toBe(1);
    expect(fitZoom(1366, 768)).toBe(1);
  });
  it('낮은 가로 화면(휴대폰 눕힘)만 조금 줄인다', () => {
    // 390/560 ≈ 0.70 이지만 글자가 너무 작아지지 않게 0.8에서 멈춘다
    expect(fitZoom(844, 390)).toBe(0.8);
    expect(fitZoom(932, 500)).toBeCloseTo(0.9, 2);
  });
});
