import { describe, expect, it } from 'vitest';
import { kstDate, kstDateTime } from '../lib/time';

describe('KST 표시', () => {
  it('UTC 15:30 은 한국 시간으로 다음 날 00:30', () => {
    const d = new Date('2026-03-31T15:30:00Z');  // 고정날짜 — 달 경계를 넘는 경우를 보려는 값
    expect(kstDate(d)).toBe('2026-04-01');
    expect(kstDateTime(d)).toBe('2026-04-01 00:30:00');
  });
});
