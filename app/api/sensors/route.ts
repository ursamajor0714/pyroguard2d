// app/api/sensors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSensorsFromDb, saveSensorToDb, deleteSensorFromDb, updateSensorInDb } from '../../../lib/aws/dynamodb';
import { SensorNode } from '../../../types/sensor';

/**
 * GET: 도면에 배치된 센서 목록 조회
 * (예: /api/sensors?floorId=B2 또는 전체 조회)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const floorId = searchParams.get('floorId') || undefined;

    const sensors = await getSensorsFromDb(floorId);
    return NextResponse.json({ success: true, data: sensors });
  } catch (err) {
    console.error("센서 목록 조회 API 에러:", err);
    return NextResponse.json({ success: false, message: "센서 목록 조회 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}

/**
 * POST: 신규 센서 노드 도면 배치 등록
 */
export async function POST(req: NextRequest) {
  try {
    const sensor: SensorNode = await req.json();

    if (!sensor.id || !sensor.type || !sensor.floorId) {
      return NextResponse.json({ success: false, message: "필수 정보(id, type, floorId)가 누락되었습니다." }, { status: 400 });
    }

    await saveSensorToDb(sensor);
    return NextResponse.json({ success: true, message: "센서 노드가 정상 등록되었습니다." });
  } catch (err) {
    console.error("센서 등록 API 에러:", err);
    return NextResponse.json({ success: false, message: "센서 등록 중 서버 에러가 발생했습니다." }, { status: 500 });
  }
}

/**
 * PUT: 배치된 센서 노드 상태 갱신 (좌표 이동, 경보 작동, 수압 값 변경 등)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "수정하려는 센서의 id가 전달되지 않았습니다." }, { status: 400 });
    }

    const success = await updateSensorInDb(id, fields);
    
    if (success) {
      // 전기차 주차구역(B2) 연기/화재 발생 시, 2D 관제 UI 자동 카메라 전환 명세 시뮬레이션용 트리거 감지
      if (id === 'sensor-ev-smoke' && fields.status === 'ALARM') {
        return NextResponse.json({
          success: true,
          message: "전기차 충전구역(B2) 화재 감지! 관제실 B2 자동 화면 전환 트리거 작동.",
          triggerAutoFloorChange: 'B2'
        });
      }
      
      return NextResponse.json({ success: true, message: "센서 정보가 정상 수정되었습니다." });
    } else {
      return NextResponse.json({ success: false, message: "해당 ID의 센서를 찾을 수 없습니다." }, { status: 404 });
    }
  } catch (err) {
    console.error("센서 수정 API 에러:", err);
    return NextResponse.json({ success: false, message: "센서 수정 중 에러가 발생했습니다." }, { status: 500 });
  }
}

/**
 * DELETE: 센서 노드 도면에서 철거 (삭제)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: "삭제하려는 센서의 id가 전달되지 않았습니다." }, { status: 400 });
    }

    const success = await deleteSensorFromDb(id);
    if (success) {
      return NextResponse.json({ success: true, message: "센서 노드가 정상 삭제되었습니다." });
    } else {
      return NextResponse.json({ success: false, message: "삭제하려는 센서 노드를 찾을 수 없습니다." }, { status: 404 });
    }
  } catch (err) {
    console.error("센서 삭제 API 에러:", err);
    return NextResponse.json({ success: false, message: "센서 삭제 중 에러가 발생했습니다." }, { status: 500 });
  }
}
