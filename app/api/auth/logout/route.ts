// app/api/auth/logout/route.ts
// 로그아웃 — 세션 쿠키를 지우고, 이 단말의 119 승인도 함께 푼다.
import { NextRequest, NextResponse } from 'next/server';
import { getSession, SESSION_COOKIE } from '../../../../lib/server/session';
import { revoke } from '../../../../lib/server/approvals';
import { audit } from '../../../../lib/server/audit';

export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (s) {
    revoke(s.sid);
    audit('LOGOUT', { sid: s.sid });
  }
  const res = NextResponse.json({ success: true, message: '로그아웃되었습니다.' });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
