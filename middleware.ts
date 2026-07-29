// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const nextUrl = request.nextUrl;

  // 로컬 개발 환경(localhost / 127.0.0.1) 판단
  const isLocal = nextUrl.hostname === 'localhost' || nextUrl.hostname === '127.0.0.1';
  
  // 1. 실서비스 배포 환경 시 HTTPS 연결 강제화 및 혼합 콘텐츠 에러(Mixed Content Error) 방지 설정
  if (!isLocal) {
    if (nextUrl.protocol === 'http:') {
      const httpsUrl = nextUrl.clone();
      httpsUrl.protocol = 'https:';
      return NextResponse.redirect(httpsUrl);
    }
    // HTTPS 환경 하에 HTTP 외부 동영상/이미지 리소스 임포트 시 혼합 콘텐츠(Mixed Content) 경고 차단 보안 규격 헤더 추가
    response.headers.set('Content-Security-Policy', 'upgrade-insecure-requests');
  }

  // 2. 모바일 연동 시연(/mobile-demo) 및 외부 센서 RS-485 패킷 전송을 위한 CORS 및 프리플라이트(OPTIONS) 설정
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight(예비요청) 즉시 응답 처리
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers
    });
  }

  return response;
}

// 미들웨어가 작동할 API 및 스냅샷 정적 리소스 라우팅 매칭 규칙 정의
export const config = {
  matcher: [
    '/api/:path*',
    '/image/snapshot_best.webp',
    '/image/snapshot_fallback.webp'
  ]
};
