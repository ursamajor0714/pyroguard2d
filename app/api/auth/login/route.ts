// app/api/auth/login/route.ts
// 운영자 로그인 — 비밀번호가 맞으면 서명한 세션 토큰을 HttpOnly 쿠키로 준다.
// 같은 주소에서 5번 연속 틀리면 5분 잠근다.
import { NextRequest, NextResponse } from 'next/server';
import { authConfigured, env } from '../../../../lib/server/env';
import { issueSession, safeEqual, SESSION_COOKIE } from '../../../../lib/server/session';
import { fail, readJsonObject, serverError } from '../../../../lib/server/http';
import { audit, clientIp } from '../../../../lib/server/audit';

const MAX_FAILURES = 5;
const LOCK_MS = 5 * 60_000;
const g = globalThis as unknown as { __pgLoginFailures?: Map<string, { count: number; lockedUntil: number }> };
const failures = (g.__pgLoginFailures ??= new Map());

export async function POST(req: NextRequest) {
  try {
    if (!authConfigured()) {
      return fail(503, '서버에 OPERATOR_PASSWORD·SESSION_SECRET(16자 이상)이 설정되지 않았습니다. README 의 실행 절을 보세요.');
    }
    const ip = clientIp(req.headers);
    const f = failures.get(ip);
    if (f && f.lockedUntil > Date.now()) {
      return fail(429, '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.', { retryAfter: Math.ceil((f.lockedUntil - Date.now()) / 1000) });
    }
    const parsed = await readJsonObject(req);
    if (!parsed.ok) return parsed.res;
    const password = parsed.body.password;
    if (typeof password !== 'string' || !password) return fail(400, '비밀번호를 입력하세요.');

    if (!safeEqual(password, env.operatorPassword())) {
      const count = (f && f.lockedUntil <= Date.now() && f.count >= MAX_FAILURES ? 0 : f?.count ?? 0) + 1;
      failures.set(ip, { count, lockedUntil: count >= MAX_FAILURES ? Date.now() + LOCK_MS : 0 });
      audit('LOGIN_FAILED', { ip });
      return fail(401, '비밀번호가 올바르지 않습니다.');
    }

    failures.delete(ip);
    const { token, session } = issueSession();
    audit('LOGIN', { sid: session.sid, ip });
    const res = NextResponse.json({ success: true, token, expiresAt: new Date(session.exp).toISOString() });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https',
      path: '/',
      expires: new Date(session.exp),
    });
    return res;
  } catch (err) {
    return serverError('auth/login', err, '로그인 처리 중 서버 오류가 발생했습니다.');
  }
}
