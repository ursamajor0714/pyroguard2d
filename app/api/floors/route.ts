// app/api/floors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FLOOR_LIST } from '../../../types/floor';
import { getSensorsFromDb } from '../../../lib/aws/dynamodb';
import { SensorStatus } from '../../../types/sensor';

export async function GET(req: NextRequest) {
  try {
    // 1. DB 또는 Mock 캐시로부터 배치된 전체 센서 목록 스캔
    const allSensors = await getSensorsFromDb();

    // 2. 각 층별 현황 데이터 맵핑
    const floorStatusList = FLOOR_LIST.map((floor) => {
      const floorSensors = allSensors.filter((s) => s.floorId === floor.id);
      
      // 해당 층의 센서 개수
      const sensorCount = floorSensors.length;
      
      // 해당 층 경보 발생 여부
      const hasAlarm = floorSensors.some((s) => s.status === 'ALARM');

      // 층의 종합 대표 상태 도출 (ALARM > OFFLINE > MAINTENANCE > NORMAL 순)
      let overallStatus: SensorStatus = 'NORMAL';
      if (hasAlarm) {
        overallStatus = 'ALARM';
      } else if (floorSensors.some((s) => s.status === 'OFFLINE')) {
        overallStatus = 'OFFLINE';
      } else if (floorSensors.some((s) => s.status === 'MAINTENANCE')) {
        overallStatus = 'MAINTENANCE';
      }

      return {
        id: floor.id,
        name: floor.name,
        fullName: floor.fullName,
        svgPath: floor.svgPath,
        type: floor.type,
        description: floor.description,
        sensorCount,
        hasAlarm,
        status: overallStatus
      };
    });

    // 전체 소방 20개 층 정보 반환
    return NextResponse.json({
      success: true,
      data: floorStatusList
    });
  } catch (err) {
    console.error("층 데이터 조회 API 에러:", err);
    return NextResponse.json(
      { success: false, message: "층 현황 조회 중 서버 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
