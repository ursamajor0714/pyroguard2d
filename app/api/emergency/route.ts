// app/api/emergency/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 119 OTP 승인 상태 인메모리 세션 관리 (상황 종료 버튼 누를 때까지 영구 유지)
let isOtpApprovedPersistent: boolean = false;

export async function GET(req: NextRequest) {
  if (!isOtpApprovedPersistent) {
    return NextResponse.json({
      success: true,
      approved: false,
      message: "개인정보보호법 제15조에 의거하여 인명 정보 조회가 차단되어 있습니다. 119 OTP 인증이 필요합니다.",
      peopleCount: 0
    });
  }

  return NextResponse.json({
    success: true,
    approved: true,
    peopleCount: 286
  });
}

/**
 * POST: 119 OTP 검증 및 상황 종료 권한 해제
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 119 상황 종료 버튼 클릭 시 권한 해제
    if (body.action === 'REVOKE') {
      isOtpApprovedPersistent = false;
      return NextResponse.json({
        success: true,
        approved: false,
        message: "119 소방관 권한이 성공적으로 해제되었습니다. 인명 정보 마스킹이 재적용됩니다."
      });
    }

    // 119 OTP 지정 번호 (119119) 검증
    if (body.otp === '119119') {
      isOtpApprovedPersistent = true;

      return NextResponse.json({
        success: true,
        approved: true,
        message: "119 소방관 OTP 인증이 완료되었습니다. 상황 종료 버튼을 누를 때까지 승인 상태가 유지됩니다."
      });
    }

    return NextResponse.json(
      { success: false, message: "올바르지 않은 OTP 번호입니다. (로컬 테스트: 119119)" },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "API 처리 중 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
