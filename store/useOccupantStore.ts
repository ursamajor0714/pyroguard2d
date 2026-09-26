// store/useOccupantStore.ts
// 재실자 위치는 서버가 이 단말이 119 승인을 받았을 때만 내려준다 (GET /api/emergency).
// 화면 코드에는 재실자 데이터가 없다 — 번들에 실리면 승인과 상관없이 누구나 볼 수 있기 때문이다.
import { create } from 'zustand';
import { FLOOR_LIST } from '../types/floor';

export interface Occupant {
  id: string;
  floorId: string;
  x: number;        // 상대 X 좌표 (%)
  y: number;        // 상대 Y 좌표 (%)
  roomName: string; // 위치 구역
}

interface OccupantState {
  occupants: Occupant[];        // 서버가 내려준 재실자 (승인 전·해제 뒤에는 빈 배열)
  rescuedOccupantIds: string[]; // 개별 클릭하여 구조 완료된 인원 ID 목록
  clearedFloorIds: string[];   // 층 단위 전체 구조 완료(클리어) 처리된 층 ID 목록

  // Actions
  setOccupants: (list: Occupant[]) => void;
  rescueOccupant: (occupantId: string) => void;
  clearFloorOccupants: (floorId: string) => void;
  resetOccupants: () => void;
  getFloorRemainingCount: (floorId: string) => number;
  getTotalBuildingRemainingCount: () => number;
}

export const useOccupantStore = create<OccupantState>((set, get) => ({
  occupants: [],
  rescuedOccupantIds: [],
  clearedFloorIds: [],

  setOccupants: (list) => set((state) => (
    // 폴링마다 같은 목록이 오므로 바뀌었을 때만 갱신한다 (불필요한 다시 그리기 방지)
    state.occupants.length === list.length && state.occupants.every((o, i) => o.id === list[i].id) ? state : { occupants: list }
  )),

  // 개별 사람 모형(👤) 클릭 시 구조 처리
  rescueOccupant: (occupantId) => set((state) => {
    if (state.rescuedOccupantIds.includes(occupantId)) return state;
    return { rescuedOccupantIds: [...state.rescuedOccupantIds, occupantId] };
  }),

  // 층 단위 전원 구조 완료(클리어) 처리
  clearFloorOccupants: (floorId) => set((state) => {
    if (state.clearedFloorIds.includes(floorId)) return state;
    return { clearedFloorIds: [...state.clearedFloorIds, floorId] };
  }),

  // 초기 상태 리셋 (상황 종료 시 재실자 목록도 지운다)
  resetOccupants: () => set({
    occupants: [],
    rescuedOccupantIds: [],
    clearedFloorIds: []
  }),

  // 특정 층의 실시간 남은 잔류 인원 연산
  getFloorRemainingCount: (floorId) => {
    const state = get();
    if (state.clearedFloorIds.includes(floorId)) return 0;
    return state.occupants.filter(o => o.floorId === floorId && !state.rescuedOccupantIds.includes(o.id)).length;
  },

  // 건물 전체 실시간 총 잔류 인원 연산
  getTotalBuildingRemainingCount: () => {
    return FLOOR_LIST.reduce((acc, f) => acc + get().getFloorRemainingCount(f.id), 0);
  }
}));
