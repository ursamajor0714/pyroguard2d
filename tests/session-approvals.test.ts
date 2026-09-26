import { beforeEach, describe, expect, it, vi } from 'vitest';
import { issueSession, verifySession } from '../lib/server/session';
import { approvalOf, approve, lockedUntil, recordFailure } from '../lib/server/approvals';
import { freshEnv } from './helpers';

beforeEach(freshEnv);

describe('세션 토큰', () => {
  it('서명한 토큰은 통과하고 변조하면 거절한다', () => {
    const { token, session } = issueSession();
    expect(verifySession(token)?.sid).toBe(session.sid);
    const [payload, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ sid: 'x', exp: Date.now() + 1e9 })).toString('base64url');
    expect(verifySession(`${forged}.${sig}`)).toBeNull();
    expect(verifySession(`${payload}.AAAA`)).toBeNull();
  });

  it('서명 키가 바뀌면 옛 토큰은 무효다', () => {
    const { token } = issueSession();
    process.env.SESSION_SECRET = 'another-secret-0123456789abcdefgh';
    expect(verifySession(token)).toBeNull();
  });
});

describe('119 승인', () => {
  it('승인은 그 세션에만 있고 유효시간이 지나면 풀린다', () => {
    vi.useFakeTimers();
    process.env.APPROVAL_TTL_MINUTES = '1';
    approve('a');
    expect(approvalOf('a')).not.toBeNull();
    expect(approvalOf('b')).toBeNull();
    vi.advanceTimersByTime(61_000);
    expect(approvalOf('a')).toBeNull();
    vi.useRealTimers();
    delete process.env.APPROVAL_TTL_MINUTES;
  });

  it('5번 연속 틀리면 잠긴다', () => {
    for (let i = 0; i < 4; i++) expect(recordFailure('s')).toBeNull();
    expect(recordFailure('s')).not.toBeNull();
    expect(lockedUntil('s')).not.toBeNull();
    expect(lockedUntil('other')).toBeNull();
  });
});
