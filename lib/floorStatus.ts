// lib/floorStatus.ts
// 층의 대표 상태 — 서버(/api/floors)와 화면이 같은 규칙을 쓰도록 한 곳에 둔다.
// 센서가 하나도 없는 층은 NORMAL 이 아니라 UNMONITORED 다. 감시 공백을 '정상' 으로 보이면 거짓 안심이 된다.
import type { SensorNode, SensorStatus } from '../types/sensor';

export type FloorStatus = SensorStatus | 'UNMONITORED';

/** ALARM > OFFLINE > MAINTENANCE > NORMAL, 센서가 없으면 UNMONITORED */
export function floorStatusOf(sensors: Pick<SensorNode, 'status'>[]): FloorStatus {
  if (sensors.length === 0) return 'UNMONITORED';
  if (sensors.some((s) => s.status === 'ALARM')) return 'ALARM';
  if (sensors.some((s) => s.status === 'OFFLINE')) return 'OFFLINE';
  if (sensors.some((s) => s.status === 'MAINTENANCE')) return 'MAINTENANCE';
  return 'NORMAL';
}
