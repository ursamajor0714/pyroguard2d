// app/api/auth/logout/route.ts
// 로그아웃 — 세션 쿠키를 지우고, 토큰을 서버에서도 무효로 하고, 이 단말의 119 승인도 함께 푼다.
import { NextRequest, NextResponse } from 'next/server';
import { getSession, SESSION_COOKIE } from '../../../../lib/server/session';
import { revoke } from '../../../../lib/server/approvals';
import { revokeSession } from '../../../../lib/server/revoked';
import { audit } from '../../../../lib/server/audit';

export async function POST(req: NextRequest) {
  const s = getSession(req);
  if (s) {
    revoke(s.sid);
    revokeSession(s.sid, s.exp);   // 쿠키만 지우면 빼돌린 토큰은 만료까지 계속 통한다
    audit('LOGOUT', { sid: s.sid });
  }
  const res = NextResponse.json({ success: true, message: '로그아웃되었습니다.' });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
