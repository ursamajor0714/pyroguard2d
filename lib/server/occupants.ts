// lib/server/occupants.ts
// 재실자 위치 — 서버에서만 import 한다.
// 이 데이터가 화면 번들에 들어가면 OTP 승인과 상관없이 개발자도구로 전원의 위치가 보인다.
// 그래서 화면은 GET /api/emergency 가 (그 단말이 승인됐을 때만) 내려주는 목록만 쓴다.
import type { FloorId } from '../../types/floor';

export interface Occupant {
  id: string;
  floorId: FloorId;
  x: number;        // 상대 X 좌표 (%)
  y: number;        // 상대 Y 좌표 (%)
  roomName: string; // 위치 구역 (예: 1401호, 대회의실, 복도)
}

type Pos = Omit<Occupant, 'floorId'>;
const on = (floorId: FloorId, list: Pos[]): Occupant[] => list.map((o) => ({ floorId, ...o }));

// 층별 더미 재실자 (시연용)
export const OCCUPANTS: Occupant[] = [
  ...on('OUTSIDE', [
    { id: 'occ-out-1', x: 22, y: 88, roomName: '정문 진입로' },
    { id: 'occ-out-2', x: 25, y: 82, roomName: '정문 광장' },
    { id: 'occ-out-3', x: 78, y: 20, roomName: '후문 하역장' },
    { id: 'occ-out-4', x: 82, y: 18, roomName: '서비스 게이트' },
    { id: 'occ-out-5', x: 12, y: 40, roomName: '서측 담장' }
  ]),
  ...on('ROOF', [
    { id: 'occ-rf-1', x: 48, y: 20, roomName: '옥상 피난계단 출입구' },
    { id: 'occ-rf-2', x: 75, y: 65, roomName: '헬리포트 대기구역' },
    { id: 'occ-rf-3', x: 30, y: 35, roomName: '옥상 정원' }
  ]),
  // 17F ~ 2F (지상 기준층 - 층당 12~22명)
  ...Array.from({ length: 16 }, (_, i) => {
    const floorNum = 17 - i;
    const floorId = `${floorNum}F` as FloorId;
    const count = 12 + ((floorNum * 3) % 11);
    return Array.from({ length: count }, (_, oIdx): Occupant => ({
      id: `occ-${floorId.toLowerCase()}-${oIdx + 1}`,
      floorId,
      x: 18 + ((oIdx * 17) % 68),
      y: 20 + ((oIdx * 13) % 60),
      roomName: `${floorNum}0${(oIdx % 4) + 1}호 Office`
    }));
  }).flat(),
  // 1F 로비 & 방재실
  ...Array.from({ length: 22 }, (_, idx): Occupant => ({
    id: `occ-1f-${idx + 1}`,
    floorId: '1F',
    x: 15 + ((idx * 14) % 70),
    y: 25 + ((idx * 11) % 60),
    roomName: idx < 8 ? '메인 로비' : idx < 15 ? '안내 데스크' : '종합 방재실'
  })),
  ...on('B1', [
    { id: 'occ-b1-1', x: 20, y: 35, roomName: 'B1-A구역 통로' },
    { id: 'occ-b1-2', x: 42, y: 55, roomName: 'B1-B구역 주차면' },
    { id: 'occ-b1-3', x: 68, y: 40, roomName: 'B1 EV 승강장' },
    { id: 'occ-b1-4', x: 80, y: 72, roomName: 'B1 관리실' },
    { id: 'occ-b1-5', x: 30, y: 70, roomName: 'B1 출차 램프' },
    { id: 'occ-b1-6', x: 55, y: 25, roomName: 'B1 비상계단' },
    { id: 'occ-b1-7', x: 15, y: 60, roomName: 'B1-C구역' },
    { id: 'occ-b1-8', x: 72, y: 20, roomName: 'B1 재해대피소' }
  ]),
  ...on('B2', [
    { id: 'occ-b2-1', x: 42, y: 38, roomName: 'EV 충전소 01호 앞' },
    { id: 'occ-b2-2', x: 48, y: 42, roomName: 'EV 충전소 03호 앞' },
    { id: 'occ-b2-3', x: 55, y: 60, roomName: 'B2 알람밸브실' },
    { id: 'occ-b2-4', x: 20, y: 50, roomName: 'B2 비상문 입구' },
    { id: 'occ-b2-5', x: 75, y: 30, roomName: 'B2 전기실' },
    { id: 'occ-b2-6', x: 35, y: 75, roomName: 'B2 통로' }
  ]),
  ...on('B3', [
    { id: 'occ-b3-1', x: 48, y: 42, roomName: '메인 소화 펌프실' },
    { id: 'occ-b3-2', x: 26, y: 58, roomName: '비상 발전기실' },
    { id: 'occ-b3-3', x: 62, y: 32, roomName: '저수조 수위실' },
    { id: 'occ-b3-4', x: 78, y: 68, roomName: 'B3 기계실 통로' }
  ]),
];
