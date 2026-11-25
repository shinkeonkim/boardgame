import { describe, expect, it } from 'vitest';
import { readRulesParam } from './rules-link';

const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

describe('하우스룰 링크', () => {
  it('한글이 든 규칙도 그대로 되읽음', () => {
    const cfg = { rounds: 3, label: '우리 집 규칙', mode: 'together' };
    expect(readRulesParam(`?rules=${enc(cfg)}`)).toEqual(cfg);
  });
  it('깨진 값·배열·너무 긴 값은 무시', () => {
    expect(readRulesParam('?rules=%%%')).toBeNull();
    expect(readRulesParam(`?rules=${Buffer.from('[1,2]').toString('base64url')}`)).toBeNull();
    expect(readRulesParam(`?rules=${'a'.repeat(5000)}`)).toBeNull();
    expect(readRulesParam('')).toBeNull();
  });
});
