// app/api/floors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FLOOR_LIST } from '../../../types/floor';
import { listSensors } from '../../../lib/server/sensorRepo';
import { requireSession } from '../../../lib/server/session';
import { serverError } from '../../../lib/server/http';
import { floorStatusOf } from '../../../lib/floorStatus';

/** GET: 22개 관제 구역별 센서 수·경보 여부·대표 상태 */
export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (session instanceof NextResponse) return session;
  try {
    const allSensors = listSensors();
    const data = FLOOR_LIST.map((floor) => {
      const floorSensors = allSensors.filter((s) => s.floorId === floor.id);
      return {
        id: floor.id,
        name: floor.name,
        fullName: floor.fullName,
        svgPath: floor.svgPath,
        type: floor.type,
        description: floor.description,
        sensorCount: floorSensors.length,
        hasAlarm: floorSensors.some((s) => s.status === 'ALARM'),
        status: floorStatusOf(floorSensors),
      };
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return serverError('floors GET', err, '층 현황 조회 중 서버 에러가 발생했습니다.');
  }
}
