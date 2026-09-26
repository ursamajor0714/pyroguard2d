// lib/server/session.ts
// 운영자 세션 — 서명한 토큰을 HttpOnly 쿠키로 준다. 외부 장치·스크립트는 같은 토큰을 Bearer 로 보내도 된다.
// 토큰 = base64url({ sid, exp }) + '.' + HMAC-SHA256 서명. 서버에 세션 목록을 두지 않아 재시작해도 로그인이 유지된다.
// 로그아웃한 세션은 revoked.ts 가 만료 때까지 기억해 거절한다.
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from './env';
import { isRevoked } from './revoked';

export const SESSION_COOKIE = 'pg_session';

export interface Session { sid: string; exp: number }

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

/** 문자열 비교를 길이·내용에 상관없이 같은 시간에 한다 (비밀번호·OTP 추측 방지) */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac('sha256', 'cmp').update(a).digest();
  const hb = createHmac('sha256', 'cmp').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function issueSession(): { token: string; session: Session } {
  const session: Session = { sid: randomUUID(), exp: Date.now() + env.sessionTtlMs() };
  const payload = b64(JSON.stringify(session));
  return { token: `${payload}.${sign(payload, env.sessionSecret())}`, session };
}

export function verifySession(token: string | undefined | null): Session | null {
  const secret = env.sessionSecret();
  if (!token || !secret) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload, secret))) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
    if (typeof s.sid !== 'string' || typeof s.exp !== 'number' || s.exp < Date.now()) return null;
    if (isRevoked(s.sid)) return null;   // 로그아웃한 토큰
    return s;
  } catch {
    return null;
  }
}

/** 요청에서 세션을 꺼낸다 — 쿠키 우선, 없으면 Authorization: Bearer */
export function getSession(req: NextRequest): Session | null {
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value ?? bearer);
}

/** 라우트 핸들러 첫 줄에서 부른다. 세션이 없으면 401 응답을 돌려준다. */
export function requireSession(req: NextRequest): Session | NextResponse {
  const s = getSession(req);
  if (s) return s;
  return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
}
