// lib/client/api.ts
// 화면 → 서버 호출 공통. 세션이 끊기면(401) 로그인 화면으로 보낸다.
export const SENSOR_POLL_MS = 3000;   // 관제 PC·모바일이 같은 주기로 센서·승인 상태를 받아 온다

export class ApiError extends Error {
  constructor(message: string, public status: number, public body: Record<string, unknown> = {}) {
    super(message);
  }
}

/** JSON API 호출. 2xx 가 아니면 서버 메시지를 담은 ApiError 를 던진다 */
export async function api<T = Record<string, unknown>>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    credentials: 'same-origin',
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    // 컴포넌트 밖이라 router 를 쓸 수 없다 — 세션이 끊겼으니 전체를 새로 불러 상태도 비운다
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 의도적인 전체 새로고침
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (!res.ok) throw new ApiError(typeof body.message === 'string' ? body.message : `서버 오류 (${res.status})`, res.status, body);
  return body as T;
}
