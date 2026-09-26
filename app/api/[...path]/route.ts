// app/api/[...path]/route.ts
// 없는 API 경로 — Next 기본 404 는 HTML 페이지라서 화면·외부 장치가 오류 메시지를 읽을 수 없다. JSON 으로 답한다.
// 있는 경로(app/api/*/route.ts)가 언제나 먼저 잡히고, 여기는 아무것도 안 맞을 때만 온다.
import { fail } from '../../../lib/server/http';

const notFound = () => fail(404, '없는 API 경로입니다.');

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
