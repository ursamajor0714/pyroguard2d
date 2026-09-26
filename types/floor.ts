// types/floor.ts

export type FloorId =
  | 'OUTSIDE'
  | 'ROOF'
  | '17F' | '16F' | '15F' | '14F' | '13F' | '12F' | '11F' | '10F'
  | '9F' | '8F' | '7F' | '6F' | '5F' | '4F' | '3F' | '2F' | '1F'
  | 'B1' | 'B2' | 'B3';

export type FloorType = 'EXTERIOR' | 'BASEMENT' | 'LOBBY' | 'STANDARD' | 'ROOF';

export interface FloorMeta {
  id: FloorId;
  name: string;          // 화면 표시 이름
  fullName: string;      // 전체 상세 이름
  svgPath: string;       // 도면 파일 경로
  type: FloorType;       // 층 유형 분류
  description: string;   // 주요 시설 설명
}

// 22개 관제 구역(외부·옥상·17F~1F·B1~B3) 메타데이터
// 재실자 위치는 개인정보라 여기 두지 않는다 — lib/server/occupants.ts (서버 전용)
export const FLOOR_LIST: FloorMeta[] = [
  {
    id: 'OUTSIDE',
    name: '외부',
    fullName: '건물 외부 (정문·후문 외곽 보안 구역)',
    svgPath: '/image/02.lobby_1F.svg',
    type: 'EXTERIOR',
    description: '건물 정문 광장, 후문 하역장, 외곽 담장 보안 카메라'
  },
  {
    id: 'ROOF',
    name: 'ROOF',
    fullName: '옥상층 (대피공간 & 헬리포트)',
    svgPath: '/image/10.roof_top.svg',
    type: 'ROOF',
    description: '옥상 수조실, 헬리포트, 피난 대피 광장'
  },
  // 17F ~ 2F (지상 기준층 - 층당 12~22명 현실적 배치)
  ...Array.from({ length: 16 }, (_, i) => {
    const floorNum = 17 - i;
    const floorId = `${floorNum}F` as FloorId;
    
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


    return {
      id: floorId,
      name: floorId,
      fullName: `지상 ${floorNum}층 사무실`,
      svgPath,
      type: 'STANDARD' as FloorType,
      description: desc
    };
  }),
  {
    id: '1F',
    name: '1F',
    fullName: '지상 1층 로비 & 방재실',
    svgPath: '/image/02.lobby_1F.svg',
    type: 'LOBBY',
    description: '메인 로비, 안내데스크, 종합 방재실 및 통제센터'
  },
  {
    id: 'B1',
    name: 'B1',
    fullName: '지하 1층 주차장',
    svgPath: '/image/07.basement_B1.svg',
    type: 'BASEMENT',
    description: '일반 주차장, 관리실'
  },
  {
    id: 'B2',
    name: 'B2',
    fullName: '지하 2층 주차장 & 전기차 충전소',
    svgPath: '/image/08.basement_B2.svg',
    type: 'BASEMENT',
    description: '전기차 급속 충전 구역, 알람밸브실, 전기실'
  },
  {
    id: 'B3',
    name: 'B3',
    fullName: '지하 3층 기계실 & 소화펌프실',
    svgPath: '/image/09.basement_B3.svg',
    type: 'BASEMENT',
    description: '소화 기계 펌프실, 발전기실, 저수조실'
  }
];


export const getFloorMeta = (id: FloorId): FloorMeta | undefined => {
  return FLOOR_LIST.find((f) => f.id === id);
};
