// lib/server/http.ts
// 라우트 핸들러 공통 — 본문 읽기(크기 제한·JSON 오류는 4xx), 오류 응답
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const MAX_BODY_BYTES = 16 * 1024;

type Parsed = { ok: true; body: Record<string, unknown> } | { ok: false; res: NextResponse };

export const fail = (status: number, message: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ success: false, message, ...extra }, { status });

/** JSON 객체 본문을 읽는다. 너무 크면 413, JSON 이 아니거나 객체가 아니면 400 */
export async function readJsonObject(req: NextRequest, limit = MAX_BODY_BYTES): Promise<Parsed> {
  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > limit) return { ok: false, res: fail(413, `요청 본문이 너무 큽니다 (최대 ${limit}바이트).`) };
  const text = await req.text();
  if (Buffer.byteLength(text) > limit) return { ok: false, res: fail(413, `요청 본문이 너무 큽니다 (최대 ${limit}바이트).`) };
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, res: fail(400, '요청 본문이 올바른 JSON 이 아닙니다.') };
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, res: fail(400, '요청 본문은 JSON 객체여야 합니다.') };
  }
  return { ok: true, body: body as Record<string, unknown> };
}

/** 예상하지 못한 오류 — 서버 로그에 남기고 500 */
export function serverError(where: string, err: unknown, message: string) {
  console.error(`[${where}]`, err);
  return fail(500, message);
}
