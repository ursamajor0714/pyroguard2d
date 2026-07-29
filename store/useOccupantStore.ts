// store/useOccupantStore.ts
import { create } from 'zustand';
import { FLOOR_LIST } from '../types/floor';

interface OccupantState {
  rescuedOccupantIds: string[]; // 개별 클릭하여 구조 완료된 인원 ID 목록
  clearedFloorIds: string[];   // 층 단위 전체 구조 완료(클리어) 처리된 층 ID 목록

  // Actions
  rescueOccupant: (occupantId: string) => void;
  clearFloorOccupants: (floorId: string) => void;
  resetOccupants: () => void;
  getFloorRemainingCount: (floorId: string) => number;
  getTotalBuildingRemainingCount: () => number;
}

export const useOccupantStore = create<OccupantState>((set, get) => ({
  rescuedOccupantIds: [],
  clearedFloorIds: [],

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

  // 초기 상태 리셋
  resetOccupants: () => set({
    rescuedOccupantIds: [],
    clearedFloorIds: []
  }),

  // 특정 층의 실시간 남은 잔류 인원 연산
  getFloorRemainingCount: (floorId) => {
    const state = get();
    if (state.clearedFloorIds.includes(floorId)) return 0;
    
    const floorMeta = FLOOR_LIST.find(f => f.id === floorId);
    if (!floorMeta || !floorMeta.occupants) return 0;

    const activeList = floorMeta.occupants.filter(
      o => !state.rescuedOccupantIds.includes(o.id)
    );
    return activeList.length;
  },

  // 건물 전체 실시간 총 잔류 인원 연산
  getTotalBuildingRemainingCount: () => {
    const state = get();
    return FLOOR_LIST.reduce((acc, f) => {
      if (state.clearedFloorIds.includes(f.id)) return acc;
      if (!f.occupants) return acc;
      const activeList = f.occupants.filter(
        o => !state.rescuedOccupantIds.includes(o.id)
      );
      return acc + activeList.length;
    }, 0);
  }
}));
