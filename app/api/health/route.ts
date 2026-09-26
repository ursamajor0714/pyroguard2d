// app/api/health/route.ts
// 상태 확인 — 외부 감시(업타임 모니터)가 두드리는 곳. 로그인 없이 열려 있으므로 데이터는 내보내지 않는다.
import { NextResponse } from 'next/server';
import { authConfigured, otpConfigured } from '../../../lib/server/env';
import { isStorageWritable } from '../../../lib/server/sensorRepo';

export async function GET() {
  const checks = { auth: authConfigured(), otp: otpConfigured(), storage: isStorageWritable() };
  const ok = checks.auth && checks.otp;
  return NextResponse.json(
    { success: ok, status: ok ? 'ok' : 'misconfigured', checks, uptimeSec: Math.round(process.uptime()), at: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
