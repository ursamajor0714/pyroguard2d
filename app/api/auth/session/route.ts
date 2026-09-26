// app/api/auth/session/route.ts
// 로그인 여부 확인 — 로그인 화면이 이미 로그인돼 있으면 관제 화면으로 보낼 때 쓴다.
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/server/session';

export async function GET(req: NextRequest) {
  const s = getSession(req);
  return NextResponse.json({ success: true, authenticated: !!s, expiresAt: s ? new Date(s.exp).toISOString() : null });
}
