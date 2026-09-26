// proxy.ts (Next 16 — 예전 middleware.ts)
// 1. 배포 환경에서 http → https
// 2. CORS: 같은 출처와 CORS_ALLOWED_ORIGINS 에 적은 곳만 허용 (예전에는 '*' 라서 아무 사이트나 센서를 지울 수 있었다)
// 3. 로그인 게이트: 세션이 없으면 페이지는 /login 으로, API 는 401
//    라우트 핸들러도 각자 세션을 다시 확인한다 — proxy 만 믿지 않는다 (Next 문서 권장)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/server/session';
import { env } from './lib/server/env';

// 로그인 없이 열려 있어도 되는 곳 (이유는 README 의 API 표)
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/session', '/api/health'];

function corsHeaders(request: NextRequest): Headers | null {
  const origin = request.headers.get('origin');
  if (!origin || origin === request.nextUrl.origin) return new Headers();
  if (!env.corsAllowedOrigins().includes(origin)) return null;   // 허용 안 된 출처
  return new Headers({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  });
}

export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const isLocal = nextUrl.hostname === 'localhost' || nextUrl.hostname === '127.0.0.1';
  const forwardedHttps = request.headers.get('x-forwarded-proto') === 'https';

  if (!isLocal && nextUrl.protocol === 'http:' && !forwardedHttps) {
    const httpsUrl = nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl);
  }

  const isApi = nextUrl.pathname.startsWith('/api/');
  const cors = isApi ? corsHeaders(request) : new Headers();
  if (cors === null) {
    // 브라우저는 허용 헤더가 없으면 막는다. 예비요청은 헤더 없이 204, 실제 요청은 403.
    if (request.method === 'OPTIONS') return new NextResponse(null, { status: 204 });
    return NextResponse.json({ success: false, message: '허용되지 않은 출처입니다.' }, { status: 403 });
  }
  if (isApi && request.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers: cors });

  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + '/'));
  if (!isPublic && !getSession(request)) {
    if (isApi) return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401, headers: cors });
    const login = new URL('/login', nextUrl);
    if (nextUrl.pathname !== '/') login.searchParams.set('next', nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next();
  cors.forEach((v, k) => response.headers.set(k, v));
  return response;
}

// 정적 파일(_next/static·이미지·도면 SVG)은 로그인 없이 받아야 로그인 화면이 그려진다
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|image/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|mp4)$).*)'],
};
