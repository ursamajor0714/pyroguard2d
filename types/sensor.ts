// types/sensor.ts

export type SensorType =
  | 'EXTINGUISHER'      // 소화기
  | 'HYDRANT'           // 소화전
  | 'WATER_PRESSURE'    // 배관 수압
  | 'ARC'               // 전기 아크
  | 'LEAK'              // 선형 누수
  | 'EMERGENCY_DOOR'    // 비상구 도어 및 자동개폐기
  | 'CCTV'              // AI 인체 탐지용 CCTV
  | 'CUSTOM';           // 사용자 정의 신규 커스텀 센서

export type SensorStatus =
  | 'NORMAL'            // 정상 (녹색/무색 링)
  | 'MAINTENANCE'       // 점검/이동 중 (황색 아이콘)
  | 'ALARM'             // 경보 발생 (빨간 점멸 + 비상음)
  | 'OFFLINE';          // 통신 장애 (회색 아이콘, 3초 무응답)

export interface FovConfig {
  distance: number;     // 시야 거리 (3m ~ 30m)
  angle: number;        // 시야 화각 (30° ~ 180°)
  rotation: number;     // 회전각 (0° ~ 360°)
}

export type DoorState =
  | 'LOCKED'            // 평시 방범 잠금
  | 'UNLOCKED'          // 화재 경보 해제 (대피 가능)
  | 'OPENED'            // 대피자 문 열림
  | 'CLOSED';           // 도어클로저 닫힘 (연기 차폐 유지)

export interface SensorNode {
  id: string;           // 센서 고유 식별자 (UUID)
  type: SensorType;     // 센서 종류
  name?: string;        // 센서 개별 커스텀 명칭
  floorId: string;      // 배치된 층 ID (B3 ~ 17F, ROOF)
  x: number;            // 캔버스 내 상대 X 좌표 (0 ~ 100 %)
  y: number;            // 캔버스 내 상대 Y 좌표 (0 ~ 100 %)
  status: SensorStatus; // 센서 현재 상태
  powerStatus?: 'ON' | 'OFF'; // 비상문/센서 전원 커넥션 상태
  autoCloseDelay?: number;    // 비상문 자동 닫힘 타이머 (초, 기본 10초)
  customEmoji?: string; // 사용자 지정 이모지/아이콘
  fov?: FovConfig;      // CCTV 전용 시야 설정
  doorState?: DoorState;// 비상구 도어 전용 상태
  value?: number;       // 실시간 측정값 (예: 수압 Bar, 아크 감지 횟수 등)
  updatedAt: string;    // 최종 갱신 시간 (ISO string)
}
