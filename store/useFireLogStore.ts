// store/useFireLogStore.ts
import { create } from 'zustand';
import { FireLogEntry } from '../types/fireLog';

interface FireLogState {
  logs: FireLogEntry[];
  addLog: (log: Omit<FireLogEntry, 'id' | 'createdAt'>) => void;
  updateLog: (id: string, updated: Partial<Omit<FireLogEntry, 'id'>>) => void;
  deleteLog: (id: string) => void;
}

const INITIAL_LOGS: FireLogEntry[] = [
  {
    id: 'log-001',
    date: '2026-07-24',
    floorId: '1F',
    inspector: '김철수 소방안전관리자',
    category: '경보설비/CCTV',
    content: '1층 로비 종합 방재실 수신기 패킷 핑(Ping) 테스트 및 AI 비전 스냅샷 암호화 보관 통과',
    result: 'PASS',
    notes: '소방법 제22조 연 1회 자체점검 대비 365일 상시 가동 100% 양호',
    createdAt: new Date().toISOString()
  },
  {
    id: 'log-002',
    date: '2026-07-24',
    floorId: 'B2',
    inspector: '이영희 설비엔지니어',
    category: '전기차/알람밸브',
    content: 'B2 전기차 급속 충전 구역 천장 연기감지기 수신기 RS-485 패킷 감지 테스트',
    result: 'PASS',
    notes: '소방 수신기 접점 신호 0.2초 이내 자동 화면 전환 정상 동작',
    createdAt: new Date().toISOString()
  },
  {
    id: 'log-003',
    date: '2026-07-23',
    floorId: 'ROOF',
    inspector: '박민수 기술과장',
    category: '피난설비/비상문',
    content: '옥상 피난광장 출입문 KFI 인증 비상문 자동개폐기 화재 신호 감지 해제 시뮬레이션',
    result: 'PASS',
    notes: '전자기 락 즉시 Unlock + 도어클로저 10초 저절로 닫힘 연기 차폐 100% 유지',
    createdAt: new Date().toISOString()
  },
  {
    id: 'log-004',
    date: '2026-07-22',
    floorId: '14F',
    inspector: '한동훈 전기기사',
    category: '전기아크/EPS',
    content: '14층 EPS실 아크 차단 감지기 미세 스파크 주파수 임계치 점검',
    result: 'WARNING',
    notes: '국소 분전반 차단 1회 발생 ➔ 단자대 증설 조치 완료 (정상 복구)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'log-005',
    date: '2026-07-20',
    floorId: '6F',
    inspector: '박민수 기술과장',
    category: '비상구 자동개폐기',
    content: '6층 피난계단 방화문 도어클로저 유압 딜레이 타이머 30초 테스트',
    result: 'PASS',
    notes: '대피자 통과 후 도어 밀폐 성능 정상 확인',
    createdAt: new Date().toISOString()
  },
  {
    id: 'log-006',
    date: '2026-07-18',
    floorId: 'B3',
    inspector: '최성훈 주임',
    category: '배관 수압계통',
    content: '지하 3층 소화 펌프실 메인 가압 펌프 수압 4.2 Bar 계측 및 무선 송신기 배터리 체크',
    result: 'PASS',
    notes: '디지털 배관 수압 센서 10년 LiSOCl2 배터리 수명 98% 잔여',
    createdAt: new Date().toISOString()
  },
  {
    id: 'log-007',
    date: '2026-07-15',
    floorId: '8F',
    inspector: '정우성 시설관리자',
    category: '선형 누수 센서',
    content: '8층 탕비실 바닥 선형 누수 감지 테이프 수분 반응 센서 점검',
    result: 'PASS',
    notes: '누수 감지 즉시 무선 게이트웨이 경보 전파 100% 검증',
    createdAt: new Date().toISOString()
  },
  {
    id: 'log-008',
    date: '2026-07-10',
    floorId: '17F',
    inspector: '김철수 소방안전관리자',
    category: '소화기/마그네틱',
    content: '지상 17층 임원진 사무실 분말소화기 10년 내용연수 마그네틱 핀 이탈 센서 검사',
    result: 'PASS',
    notes: '소화기 수명 10년 1:1 동기화 완료',
    createdAt: new Date().toISOString()
  }
];

export const useFireLogStore = create<FireLogState>((set) => ({
  logs: INITIAL_LOGS,

  addLog: (logData) => set((state) => {
    const newLog: FireLogEntry = {
      ...logData,
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    return { logs: [newLog, ...state.logs] };
  }),

  updateLog: (id, updated) => set((state) => ({
    logs: state.logs.map(log => log.id === id ? { ...log, ...updated } : log)
  })),

  deleteLog: (id) => set((state) => ({
    logs: state.logs.filter(log => log.id !== id)
  }))
}));
