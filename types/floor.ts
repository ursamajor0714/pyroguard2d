// types/floor.ts

export type FloorId =
  | 'OUTSIDE'
  | 'ROOF'
  | '17F' | '16F' | '15F' | '14F' | '13F' | '12F' | '11F' | '10F'
  | '9F' | '8F' | '7F' | '6F' | '5F' | '4F' | '3F' | '2F' | '1F'
  | 'B1' | 'B2' | 'B3';

export type FloorType = 'EXTERIOR' | 'BASEMENT' | 'LOBBY' | 'STANDARD' | 'ROOF';

export interface OccupantPos {
  id: string;
  x: number;       // 상대 X 좌표 (%)
  y: number;       // 상대 Y 좌표 (%)
  roomName: string; // 위치 구역 (예: 1401호, 대회의실, 복도)
}

export interface FloorMeta {
  id: FloorId;
  name: string;          // 화면 표시 이름
  fullName: string;      // 전체 상세 이름
  svgPath: string;       // 도면 파일 경로
  type: FloorType;       // 층 유형 분류
  description: string;   // 주요 시설 설명
  occupantCount: number; // 층별 실시간 잔류 인원수 (더미데이터)
  occupants: OccupantPos[]; // 층별 사람 모형 이모지(👤) 상세 좌표
}

// 21개 관제 구역/층 정보 메타데이터 & 층별 더미 인원 데이터 전수 매핑
export const FLOOR_LIST: FloorMeta[] = [
  {
    id: 'OUTSIDE',
    name: '외부',
    fullName: '건물 외부 (정문·후문 외곽 보안 구역)',
    svgPath: '/image/02.lobby_1F.svg',
    type: 'EXTERIOR',
    description: '건물 정문 광장, 후문 하역장, 외곽 담장 보안 카메라',
    occupantCount: 5,
    occupants: [
      { id: 'occ-out-1', x: 22, y: 88, roomName: '정문 진입로' },
      { id: 'occ-out-2', x: 25, y: 82, roomName: '정문 광장' },
      { id: 'occ-out-3', x: 78, y: 20, roomName: '후문 하역장' },
      { id: 'occ-out-4', x: 82, y: 18, roomName: '서비스 게이트' },
      { id: 'occ-out-5', x: 12, y: 40, roomName: '서측 담장' }
    ]
  },
  {
    id: 'ROOF',
    name: 'ROOF',
    fullName: '옥상층 (대피공간 & 헬리포트)',
    svgPath: '/image/10.roof_top.svg',
    type: 'ROOF',
    description: '옥상 수조실, 헬리포트, 피난 대피 광장',
    occupantCount: 3,
    occupants: [
      { id: 'occ-rf-1', x: 48, y: 20, roomName: '옥상 피난계단 출입구' },
      { id: 'occ-rf-2', x: 75, y: 65, roomName: '헬리포트 대기구역' },
      { id: 'occ-rf-3', x: 30, y: 35, roomName: '옥상 정원' }
    ]
  },
  // 17F ~ 2F (지상 기준층 - 층당 12~22명 현실적 배치)
  ...Array.from({ length: 16 }, (_, i) => {
    const floorNum = 17 - i;
    const floorId = `${floorNum}F` as FloorId;
    const count = 12 + ((floorNum * 3) % 11);
    
    let svgPath = '/image/03.office_typeA.svg';
    let desc = '사무실 구역 (지상 기준층 Type A)';
    
    if (floorNum === 6 || floorNum === 12) {
      svgPath = '/image/04.office_typeA_terrace.svg';
      desc = '사무실 및 휴게 테라스 구역 (Type A Terrace)';
    } else if (floorNum % 2 === 1) {
      if (floorNum === 7 || floorNum === 13) {
        svgPath = '/image/06.office_typeB_terrace.svg';
        desc = '사무실 및 휴게 테라스 구역 (Type B Terrace)';
      } else {
        svgPath = '/image/05.office_typeB.svg';
        desc = '사무실 구역 (지상 기준층 Type B)';
      }
    }

    const mockOccupants: OccupantPos[] = Array.from({ length: count }, (_, oIdx) => ({
      id: `occ-${floorId.toLowerCase()}-${oIdx + 1}`,
      x: 18 + ((oIdx * 17) % 68),
      y: 20 + ((oIdx * 13) % 60),
      roomName: `${floorNum}0${(oIdx % 4) + 1}호 Office`
    }));

    return {
      id: floorId,
      name: floorId,
      fullName: `지상 ${floorNum}층 사무실`,
      svgPath,
      type: 'STANDARD' as FloorType,
      description: desc,
      occupantCount: count,
      occupants: mockOccupants
    };
  }),
  {
    id: '1F',
    name: '1F',
    fullName: '지상 1층 로비 & 방재실',
    svgPath: '/image/02.lobby_1F.svg',
    type: 'LOBBY',
    description: '메인 로비, 안내데스크, 종합 방재실 및 통제센터',
    occupantCount: 22,
    occupants: Array.from({ length: 22 }, (_, idx) => ({
      id: `occ-1f-${idx + 1}`,
      x: 15 + ((idx * 14) % 70),
      y: 25 + ((idx * 11) % 60),
      roomName: idx < 8 ? '메인 로비' : idx < 15 ? '안내 데스크' : '종합 방재실'
    }))
  },
  {
    id: 'B1',
    name: 'B1',
    fullName: '지하 1층 주차장',
    svgPath: '/image/07.basement_B1.svg',
    type: 'BASEMENT',
    description: '일반 주차장, 관리실',
    occupantCount: 8,
    occupants: [
      { id: 'occ-b1-1', x: 20, y: 35, roomName: 'B1-A구역 통로' },
      { id: 'occ-b1-2', x: 42, y: 55, roomName: 'B1-B구역 주차면' },
      { id: 'occ-b1-3', x: 68, y: 40, roomName: 'B1 EV 승강장' },
      { id: 'occ-b1-4', x: 80, y: 72, roomName: 'B1 관리실' },
      { id: 'occ-b1-5', x: 30, y: 70, roomName: 'B1 출차 램프' },
      { id: 'occ-b1-6', x: 55, y: 25, roomName: 'B1 비상계단' },
      { id: 'occ-b1-7', x: 15, y: 60, roomName: 'B1-C구역' },
      { id: 'occ-b1-8', x: 72, y: 20, roomName: 'B1 재해대피소' }
    ]
  },
  {
    id: 'B2',
    name: 'B2',
    fullName: '지하 2층 주차장 & 전기차 충전소',
    svgPath: '/image/08.basement_B2.svg',
    type: 'BASEMENT',
    description: '전기차 급속 충전 구역, 알람밸브실, 전기실',
    occupantCount: 6,
    occupants: [
      { id: 'occ-b2-1', x: 42, y: 38, roomName: 'EV 충전소 01호 앞' },
      { id: 'occ-b2-2', x: 48, y: 42, roomName: 'EV 충전소 03호 앞' },
      { id: 'occ-b2-3', x: 55, y: 60, roomName: 'B2 알람밸브실' },
      { id: 'occ-b2-4', x: 20, y: 50, roomName: 'B2 비상문 입구' },
      { id: 'occ-b2-5', x: 75, y: 30, roomName: 'B2 전기실' },
      { id: 'occ-b2-6', x: 35, y: 75, roomName: 'B2 통로' }
    ]
  },
  {
    id: 'B3',
    name: 'B3',
    fullName: '지하 3층 기계실 & 소화펌프실',
    svgPath: '/image/09.basement_B3.svg',
    type: 'BASEMENT',
    description: '소화 기계 펌프실, 발전기실, 저수조실',
    occupantCount: 4,
    occupants: [
      { id: 'occ-b3-1', x: 48, y: 42, roomName: '메인 소화 펌프실' },
      { id: 'occ-b3-2', x: 26, y: 58, roomName: '비상 발전기실' },
      { id: 'occ-b3-3', x: 62, y: 32, roomName: '저수조 수위실' },
      { id: 'occ-b3-4', x: 78, y: 68, roomName: 'B3 기계실 통로' }
    ]
  }
];

// 빌딩 총 잔류 인원 합계 연산
export const TOTAL_BUILDING_OCCUPANTS = FLOOR_LIST.reduce((acc, f) => acc + f.occupantCount, 0);

export const getFloorMeta = (id: FloorId): FloorMeta | undefined => {
  return FLOOR_LIST.find((f) => f.id === id);
};
