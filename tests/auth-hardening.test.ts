// 로그인·로그아웃 보강 — QA 범용 도구가 찾은 세 가지
//   1. 로그인 잠금을 X-Forwarded-For 만 바꿔 풀 수 있었다
//   2. 로그아웃해도 토큰이 만료까지 계속 통했다
//   3. 없는 API 경로가 HTML 404 로 답했다
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import * as login from '../app/api/auth/login/route';
import * as logout from '../app/api/auth/logout/route';
import * as sensors from '../app/api/sensors/route';
import * as notFound from '../app/api/[...path]/route';
import { clientIp } from '../lib/server/audit';
import { issueSession, verifySession } from '../lib/server/session';
import { resetRevokedCache } from '../lib/server/revoked';
import { freshEnv } from './helpers';

beforeEach(() => { freshEnv(); resetRevokedCache(); (globalThis as { __pgLoginFailures?: Map<string, unknown> }).__pgLoginFailures?.clear(); });
afterEach(() => { delete process.env.TRUST_PROXY_HOPS; });

const loginReq = (password: string, xff?: string) =>
  new NextRequest(new URL('/api/auth/login', 'http://localhost'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(xff ? { 'X-Forwarded-For': xff } : {}) },
    body: JSON.stringify({ password }),
  });

describe('출발지 주소', () => {
  it('프록시를 믿지 않으면 X-Forwarded-For 를 무시한다', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4' }))).toBe('direct');
  });
  it('프록시 1대 뒤면 그 프록시가 붙인 마지막 칸만 쓴다 (앞 칸은 위조 가능)', () => {
    process.env.TRUST_PROXY_HOPS = '1';
    expect(clientIp(new Headers({ 'x-forwarded-for': '6.6.6.6, 10.0.0.7' }))).toBe('10.0.0.7');
  });
  it('잠긴 뒤 X-Forwarded-For 만 바꿔도 계속 잠겨 있다', async () => {
    for (let i = 0; i < 5; i++) await login.POST(loginReq('wrong', `198.51.100.${i}`));
    expect((await login.POST(loginReq('wrong', '203.0.113.9'))).status).toBe(429);
  });
});

describe('로그아웃', () => {
  it('로그아웃한 토큰은 더는 통하지 않는다', async () => {
    const { token } = issueSession();
    const bearer = (url: string, method = 'GET') =>
      new NextRequest(new URL(url, 'http://localhost'), { method, headers: { Authorization: `Bearer ${token}` } });
    expect((await sensors.GET(bearer('/api/sensors'))).status).toBe(200);
    expect((await logout.POST(bearer('/api/auth/logout', 'POST'))).status).toBe(200);
    expect((await sensors.GET(bearer('/api/sensors'))).status).toBe(401);
    expect(verifySession(token)).toBeNull();
  });
  it('서버를 다시 켜도(메모리를 비워도) 로그아웃이 유지된다', async () => {
    const { token, session } = issueSession();
    await logout.POST(new NextRequest(new URL('/api/auth/logout', 'http://localhost'), { method: 'POST', headers: { Authorization: `Bearer ${token}` } }));
    resetRevokedCache();
    expect(verifySession(token)).toBeNull();
    expect(session.sid).toBeTruthy();
  });
  it('다른 세션은 그대로다', async () => {
    const a = issueSession(), b = issueSession();
    await logout.POST(new NextRequest(new URL('/api/auth/logout', 'http://localhost'), { method: 'POST', headers: { Authorization: `Bearer ${a.token}` } }));
    expect(verifySession(b.token)?.sid).toBe(b.session.sid);
  });
});

describe('없는 API 경로', () => {
  it('JSON 404 로 답한다', async () => {
    const res = await notFound.GET();
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect((await res.json()).success).toBe(false);
  });
});
