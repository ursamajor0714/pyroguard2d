// app/api/sensors/route.ts
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '../../../lib/server/session';
import { fail, readJsonObject, serverError } from '../../../lib/server/http';
import { isValidFloorId, isValidSensorId, validateNewSensor, validatePatch } from '../../../lib/server/validation';
import { createSensor, deleteSensor, getSensor, listSensors, updateSensor } from '../../../lib/server/sensorRepo';
import { audit } from '../../../lib/server/audit';

/**
 * GET: 도면에 배치된 센서 목록 조회 (예: /api/sensors?floorId=B2 또는 전체)
 * 화면이 몇 초마다 폴링하므로 ETag 를 붙인다 — 바뀐 게 없으면 304 로 본문 없이 답한다.
 */
export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (session instanceof NextResponse) return session;
  try {
    const floorId = req.nextUrl.searchParams.get('floorId');
    if (floorId !== null && !isValidFloorId(floorId)) return fail(400, `없는 층입니다: ${floorId}`);
    const body = JSON.stringify({ success: true, data: listSensors(floorId ?? undefined) });
    const etag = `"${createHash('sha1').update(body).digest('base64url')}"`;
    const headers = { ETag: etag, 'Cache-Control': 'no-cache' };
    if (req.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304, headers });
    return new NextResponse(body, { headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (err) {
    return serverError('sensors GET', err, '센서 목록 조회 중 서버 오류가 발생했습니다.');
  }
}

/** POST: 신규 센서 노드 도면 배치 등록 — 같은 id 가 이미 있으면 409 (덮어쓰지 않는다) */
export async function POST(req: NextRequest) {
  const session = requireSession(req);
  if (session instanceof NextResponse) return session;
  try {
    const parsed = await readJsonObject(req);
    if (!parsed.ok) return parsed.res;
    const v = validateNewSensor(parsed.body);
    if (!v.ok) return fail(400, '센서 정보가 올바르지 않습니다.', { errors: v.errors });
    const saved = createSensor(v.value);
    if (saved === 'exists') return fail(409, `이미 같은 id 의 센서가 있습니다: ${v.value.id}`);
    audit('SENSOR_CREATED', { sid: session.sid, sensorId: saved.id, floorId: saved.floorId, type: saved.type });
    return NextResponse.json({ success: true, message: '센서 노드가 정상 등록되었습니다.', data: saved }, { status: 201 });
  } catch (err) {
    return serverError('sensors POST', err, '센서 등록 중 서버 오류가 발생했습니다.');
  }
}

/**
 * PUT: 배치된 센서 노드 상태 갱신 (좌표 이동, 경보 작동, 수압 값 변경 등)
 * expectedUpdatedAt 을 함께 보내면, 그 사이 다른 단말이 먼저 고쳤을 때 409 로 알려 준다.
 */
export async function PUT(req: NextRequest) {
  const session = requireSession(req);
  if (session instanceof NextResponse) return session;
  try {
    const parsed = await readJsonObject(req);
    if (!parsed.ok) return parsed.res;
    const { id, expectedUpdatedAt } = parsed.body;
    if (!isValidSensorId(id)) return fail(400, '수정하려는 센서의 id 가 올바르지 않습니다.');
    if (expectedUpdatedAt !== undefined && typeof expectedUpdatedAt !== 'string') return fail(400, 'expectedUpdatedAt 은 ISO 시각 문자열이어야 합니다.');
    const existing = getSensor(id);
    if (!existing) return fail(404, '해당 ID의 센서를 찾을 수 없습니다.');
    const v = validatePatch(existing, parsed.body);
    if (!v.ok) return fail(400, '센서 정보가 올바르지 않습니다.', { errors: v.errors });

    const saved = updateSensor(id, v.value, expectedUpdatedAt);
    if (saved === 'missing') return fail(404, '해당 ID의 센서를 찾을 수 없습니다.');
    if (saved === 'stale') return fail(409, '다른 단말이 먼저 이 센서를 수정했습니다. 새로고침 후 다시 시도하세요.', { data: getSensor(id) });
    audit('SENSOR_UPDATED', { sid: session.sid, sensorId: id, fields: Object.keys(v.value) });

    // 전기차 주차구역(B2) 연기/화재 발생 시, 관제 화면을 B2 로 자동 전환하라는 신호
    if (saved.id === 'sensor-ev-smoke' && v.value.status === 'ALARM') {
      return NextResponse.json({
        success: true,
        message: '전기차 충전구역(B2) 화재 감지! 관제실 B2 자동 화면 전환 트리거 작동.',
        triggerAutoFloorChange: 'B2',
        data: saved,
      });
    }
    return NextResponse.json({ success: true, message: '센서 정보가 정상 수정되었습니다.', data: saved });
  } catch (err) {
    return serverError('sensors PUT', err, '센서 수정 중 서버 오류가 발생했습니다.');
  }
}

/** DELETE: 센서 노드 도면에서 철거 (삭제) — 없는 센서면 404 */
export async function DELETE(req: NextRequest) {
  const session = requireSession(req);
  if (session instanceof NextResponse) return session;
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return fail(400, '삭제하려는 센서의 id가 전달되지 않았습니다.');
    if (!deleteSensor(id)) return fail(404, '삭제하려는 센서 노드를 찾을 수 없습니다.');
    audit('SENSOR_DELETED', { sid: session.sid, sensorId: id });
    return NextResponse.json({ success: true, message: '센서 노드가 정상 삭제되었습니다.' });
  } catch (err) {
    return serverError('sensors DELETE', err, '센서 삭제 중 서버 오류가 발생했습니다.');
  }
}
