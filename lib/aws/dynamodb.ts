// lib/aws/dynamodb.ts
import { SensorNode } from '../../types/sensor';
import { FLOOR_LIST } from '../../types/floor';

// 빌딩 21개 관제 구역 기본 센서 세팅 (최초 진입 시 전원 NORMAL 정상 상태)
const generateOfficeBuildingSensors = (): SensorNode[] => {
  const list: SensorNode[] = [];
  const now = new Date().toISOString();

  // 1. 건물 외부 (OUTSIDE)
  list.push(
    { id: 'sensor-ext-cctv-main', name: '건물 정문 외곽 진입로 CCTV', type: 'CCTV', floorId: 'OUTSIDE', x: 20, y: 85, status: 'NORMAL', fov: { distance: 35, angle: 110, rotation: 315 }, updatedAt: now },
    { id: 'sensor-ext-cctv-rear', name: '건물 후문 하역장 외곽 CCTV', type: 'CCTV', floorId: 'OUTSIDE', x: 80, y: 15, status: 'NORMAL', fov: { distance: 35, angle: 110, rotation: 135 }, updatedAt: now },
    { id: 'sensor-ext-cctv-perimeter', name: '건물 서측 외곽 담장 보안 CCTV', type: 'CCTV', floorId: 'OUTSIDE', x: 10, y: 35, status: 'NORMAL', fov: { distance: 30, angle: 90, rotation: 45 }, updatedAt: now },
    { id: 'sensor-ext-hydrant-1', name: '정문 광장 옥외 소화전', type: 'HYDRANT', floorId: 'OUTSIDE', x: 28, y: 80, status: 'NORMAL', updatedAt: now }
  );

  // 2. 옥상 (ROOF)
  list.push(
    { id: 'sensor-roof-ext-1', name: '옥상 피난광장 분말소화기', type: 'EXTINGUISHER', floorId: 'ROOF', x: 25, y: 30, status: 'NORMAL', updatedAt: now },
    { id: 'sensor-roof-press-1', name: '옥상 수조실 가압 수압계', type: 'WATER_PRESSURE', floorId: 'ROOF', x: 70, y: 25, status: 'NORMAL', value: 3.4, updatedAt: now },
    { id: 'sensor-roof-door-1', name: '옥상 피난 출입문 KFI 자동개폐기', type: 'EMERGENCY_DOOR', floorId: 'ROOF', x: 50, y: 15, status: 'NORMAL', doorState: 'LOCKED', powerStatus: 'ON', autoCloseDelay: 10, updatedAt: now },
    { id: 'sensor-roof-cctv-1', name: '옥상 헬리포트/대피광장 CCTV', type: 'CCTV', floorId: 'ROOF', x: 80, y: 70, status: 'NORMAL', fov: { distance: 28, angle: 110, rotation: 225 }, updatedAt: now }
  );

  // 3. 지상 17층 ~ 2F (16개 지상 사무실 빌딩 층)
  const officeFloors = FLOOR_LIST.filter(f => f.type === 'STANDARD').map(f => f.id);
  officeFloors.forEach((fId, idx) => {
    list.push({
      id: `sensor-${fId.toLowerCase()}-ext-1`,
      name: `${fId} 사무실 A구역 소화기`,
      type: 'EXTINGUISHER',
      floorId: fId,
      x: 25 + (idx % 3) * 5,
      y: 35,
      status: 'NORMAL',
      updatedAt: now
    });

    list.push({
      id: `sensor-${fId.toLowerCase()}-hydrant-1`,
      name: `${fId} 복도 옥내소화전`,
      type: 'HYDRANT',
      floorId: fId,
      x: 82,
      y: 25,
      status: 'NORMAL',
      updatedAt: now
    });

    list.push({
      id: `sensor-${fId.toLowerCase()}-arc-1`,
      name: `${fId} EPS실 아크 차단기`,
      type: 'ARC',
      floorId: fId,
      x: 35,
      y: 40,
      status: 'NORMAL',
      value: 0,
      updatedAt: now
    });

    list.push({
      id: `sensor-${fId.toLowerCase()}-cctv-1`,
      name: `${fId} EV홀/복도 감시 AI CCTV`,
      type: 'CCTV',
      floorId: fId,
      x: 70,
      y: 50,
      status: 'NORMAL',
      fov: { distance: 22, angle: 95, rotation: 210 },
      updatedAt: now
    });

    if (['17F', '12F', '6F', '2F'].includes(fId)) {
      list.push({
        id: `sensor-${fId.toLowerCase()}-door-1`,
        name: `${fId} 피난계단 방화문`,
        type: 'EMERGENCY_DOOR',
        floorId: fId,
        x: 48,
        y: 20,
        status: 'NORMAL',
        doorState: 'LOCKED',
        powerStatus: 'ON',
        autoCloseDelay: 10,
        updatedAt: now
      });
    }
  });

  // 4. 1층 메인 로비 (LOBBY)
  list.push(
    { id: 'sensor-1f-cctv-1', name: '1층 정문 스피드게이트 CCTV 1', type: 'CCTV', floorId: '1F', x: 50, y: 85, status: 'NORMAL', fov: { distance: 22, angle: 90, rotation: 270 }, updatedAt: now },
    { id: 'sensor-1f-cctv-2', name: '1층 종합방재실 입구 CCTV 2', type: 'CCTV', floorId: '1F', x: 18, y: 75, status: 'NORMAL', fov: { distance: 18, angle: 80, rotation: 45 }, updatedAt: now },
    { id: 'sensor-1f-press-1', name: '1층 방재실 디지털 수압계', type: 'WATER_PRESSURE', floorId: '1F', x: 15, y: 80, status: 'NORMAL', value: 3.2, updatedAt: now },
    { id: 'sensor-1f-door-1', name: '1층 로비 피난 비상구 방화문', type: 'EMERGENCY_DOOR', floorId: '1F', x: 50, y: 90, status: 'NORMAL', doorState: 'LOCKED', powerStatus: 'ON', autoCloseDelay: 10, updatedAt: now },
    { id: 'sensor-1f-hydrant-1', name: '1층 로비 옥내소화전', type: 'HYDRANT', floorId: '1F', x: 85, y: 20, status: 'NORMAL', updatedAt: now }
  );

  // 5. B1 지하 1층 주차장
  list.push(
    { id: 'sensor-b1-cctv-1', name: 'B1 주차장 진입 램프 CCTV', type: 'CCTV', floorId: 'B1', x: 40, y: 50, status: 'NORMAL', fov: { distance: 25, angle: 100, rotation: 180 }, updatedAt: now },
    { id: 'sensor-b1-door-1', name: 'B1 주차장 피난 비상문', type: 'EMERGENCY_DOOR', floorId: 'B1', x: 20, y: 30, status: 'NORMAL', doorState: 'LOCKED', powerStatus: 'ON', updatedAt: now },
    { id: 'sensor-b1-ext-1', name: 'B1 1번 기둥 분말소화기', type: 'EXTINGUISHER', floorId: 'B1', x: 70, y: 70, status: 'NORMAL', updatedAt: now }
  );

  // 6. B2 지하 2층 주차장 & 전기차 충전 구역
  list.push(
    { id: 'sensor-ev-smoke', name: 'B2 전기차 충전구역 연기감지기', type: 'ARC', floorId: 'B2', x: 45, y: 35, status: 'NORMAL', value: 0, updatedAt: now },
    { id: 'sensor-b2-press-1', name: 'B2 전기차 알람밸브 수압계', type: 'WATER_PRESSURE', floorId: 'B2', x: 55, y: 35, status: 'NORMAL', value: 3.5, updatedAt: now },
    { id: 'sensor-b2-cctv-1', name: 'B2 전기차 충전소 특화 AI CCTV', type: 'CCTV', floorId: 'B2', x: 50, y: 40, status: 'NORMAL', fov: { distance: 25, angle: 120, rotation: 90 }, updatedAt: now },
    { id: 'sensor-b2-door-1', name: 'B2 전기차 구역 피난 비상문', type: 'EMERGENCY_DOOR', floorId: 'B2', x: 15, y: 50, status: 'NORMAL', doorState: 'LOCKED', powerStatus: 'ON', autoCloseDelay: 10, updatedAt: now }
  );

  // 7. B3 지하 3층 소화 펌프실 & 기계실
  list.push(
    { id: 'sensor-b3-press-1', name: 'B3 메인 가압 펌프 수압계', type: 'WATER_PRESSURE', floorId: 'B3', x: 50, y: 40, status: 'NORMAL', value: 4.2, updatedAt: now },
    { id: 'sensor-b3-arc-1', name: 'B3 비상 발전기실 아크 차단기', type: 'ARC', floorId: 'B3', x: 25, y: 60, status: 'NORMAL', value: 0, updatedAt: now },
    { id: 'sensor-b3-door-1', name: 'B3 소화 펌프실 피난 방화문', type: 'EMERGENCY_DOOR', floorId: 'B3', x: 80, y: 70, status: 'NORMAL', doorState: 'LOCKED', powerStatus: 'ON', updatedAt: now },
    { id: 'sensor-b3-leak-1', name: 'B3 저수조실 누수 감지 테이프', type: 'LEAK', floorId: 'B3', x: 60, y: 30, status: 'NORMAL', updatedAt: now }
  );

  return list;
};

let localMemoryDb: SensorNode[] = generateOfficeBuildingSensors();

export async function getSensorsFromDb(floorId?: string): Promise<SensorNode[]> {
  if (floorId) {
    return localMemoryDb.filter(node => node.floorId === floorId);
  }
  return localMemoryDb;
}

export async function saveSensorToDb(sensor: SensorNode): Promise<boolean> {
  const index = localMemoryDb.findIndex(n => n.id === sensor.id);
  if (index >= 0) {
    localMemoryDb[index] = { ...sensor, updatedAt: new Date().toISOString() };
  } else {
    localMemoryDb.push(sensor);
  }
  return true;
}

export async function deleteSensorFromDb(id: string): Promise<boolean> {
  localMemoryDb = localMemoryDb.filter(n => n.id !== id);
  return true;
}

export async function updateSensorInDb(id: string, fields: Partial<Omit<SensorNode, 'id'>>): Promise<boolean> {
  const index = localMemoryDb.findIndex(n => n.id === id);
  if (index >= 0) {
    localMemoryDb[index] = {
      ...localMemoryDb[index],
      ...fields,
      updatedAt: new Date().toISOString()
    };
    return true;
  }
  return false;
}
