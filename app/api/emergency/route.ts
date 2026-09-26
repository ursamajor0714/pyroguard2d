// app/api/emergency/route.ts
// 119 소방관 OTP — 승인은 요청한 세션(단말)에만, APPROVAL_TTL_MINUTES 동안만 유효하다.
//   · OTP 는 환경변수 EMERGENCY_OTP 에서 온다 (코드·화면에 두지 않는다)
//   · 경보가 하나도 없는 평시에는 승인하지 않는다
//   · 5번 연속 틀리면 그 세션을 5분 잠근다
//   · 재실자 위치는 승인된 세션의 GET 응답에만 실린다
import { NextRequest, NextResponse } from 'next/server';
import { requireSession, safeEqual } from '../../../lib/server/session';
import { approvalOf, approve, lockedUntil, recordFailure, revoke } from '../../../lib/server/approvals';
import { env, otpConfigured } from '../../../lib/server/env';
import { fail, readJsonObject, serverError } from '../../../lib/server/http';
import { listSensors } from '../../../lib/server/sensorRepo';
import { OCCUPANTS } from '../../../lib/server/occupants';
import { audit, clientIp } from '../../../lib/server/audit';

export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (session instanceof NextResponse) return session;
  const exp = approvalOf(session.sid);
  const headers = { 'Cache-Control': 'no-store' };
  if (!exp) {
    return NextResponse.json({
      success: true,
      approved: false,
      message: '개인정보보호법 제15조에 의거하여 인명 정보 조회가 차단되어 있습니다. 119 OTP 인증이 필요합니다.',
      peopleCount: 0,
    }, { headers });
  }
  return NextResponse.json({
    success: true,
    approved: true,
    expiresAt: new Date(exp).toISOString(),
    peopleCount: OCCUPANTS.length,
    occupants: OCCUPANTS,
  }, { headers });
}

/** POST: { otp: '<6자리 숫자>' } 로 승인, { action: 'REVOKE' } 로 이 단말의 승인 해제 (119 상황 종료) */
export async function POST(req: NextRequest) {
  const session = requireSession(req);
  if (session instanceof NextResponse) return session;
  try {
    const parsed = await readJsonObject(req, 1024);
    if (!parsed.ok) return parsed.res;
    const body = parsed.body;

    if (body.action === 'REVOKE') {
      const had = revoke(session.sid);
      if (had) audit('OTP_REVOKED', { sid: session.sid });
      return NextResponse.json({
        success: true,
        approved: false,
        message: '119 소방관 권한이 성공적으로 해제되었습니다. 인명 정보 마스킹이 재적용됩니다.',
      });
    }

    if (typeof body.otp !== 'string' || !/^\d{6}$/.test(body.otp)) return fail(400, 'OTP 는 6자리 숫자여야 합니다.');
    if (!otpConfigured()) return fail(503, '서버에 EMERGENCY_OTP(6자리)가 설정되지 않았습니다.');

    const locked = lockedUntil(session.sid);
    if (locked) {
      return fail(429, 'OTP 를 여러 번 틀려 잠겼습니다. 잠시 후 다시 시도하세요.', { retryAfter: Math.ceil((locked - Date.now()) / 1000) });
    }

    if (!safeEqual(body.otp, env.emergencyOtp())) {
      const nowLocked = recordFailure(session.sid);
      audit(nowLocked ? 'OTP_LOCKED' : 'OTP_FAILED', { sid: session.sid, ip: clientIp(req.headers) });
      return fail(401, '올바르지 않은 OTP 번호입니다. 소방 단말기를 다시 확인하십시오.');
    }

    // 화재 경보가 없는 평시에는 인명 정보를 열지 않는다
    const alarms = listSensors().filter((s) => s.status === 'ALARM').length;
    if (alarms === 0) {
      audit('OTP_REJECTED_NO_ALARM', { sid: session.sid });
      return fail(409, '현재 발생한 화재 경보가 없어 인명 정보를 열 수 없습니다.');
    }

    const exp = approve(session.sid);
    audit('OTP_APPROVED', { sid: session.sid, ip: clientIp(req.headers), alarms });
    return NextResponse.json({
      success: true,
      approved: true,
      expiresAt: new Date(exp).toISOString(),
      message: `119 소방관 OTP 인증이 완료되었습니다. ${Math.round(env.approvalTtlMs() / 60_000)}분 동안 유지되며, 상황 종료 버튼으로 즉시 해제할 수 있습니다.`,
    });
  } catch (err) {
    return serverError('emergency POST', err, 'API 처리 중 에러가 발생했습니다.');
  }
}
