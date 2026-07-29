// store/useEvChargerStore.ts
import { create } from 'zustand';

export type ChargerStatus = 'CHARGING' | 'STANDBY' | 'MAINTENANCE' | 'DISCARDED';

export interface EvCharger {
  id: string;            // 충전기 식별자 (예: EV-01)
  name: string;          // 충전기 명칭 (예: B2-Zone A 200kW 급속충전기 #01)
  type: 'FAST' | 'SLOW'; // 급속 / 완속
  powerKw: number;       // 용량 (kW)
  status: ChargerStatus; // 작동 상태
  tempC: number;         // 쿨링 모듈 온도 (°C)
  location: string;      // 위치 (예: B2 구역 12-A)
  updatedAt: string;
}

interface EvChargerState {
  chargers: EvCharger[];
  addCharger: (charger: Omit<EvCharger, 'id' | 'updatedAt'>) => void;
  updateChargerStatus: (id: string, status: ChargerStatus) => void;
  deleteCharger: (id: string) => void;
}

const INITIAL_CHARGERS: EvCharger[] = [
  { id: 'EV-01', name: 'B2-A구역 초급속 200kW #01', type: 'FAST', powerKw: 200, status: 'CHARGING', tempC: 38.5, location: 'B2-A1', updatedAt: new Date().toISOString() },
  { id: 'EV-02', name: 'B2-A구역 초급속 200kW #02', type: 'FAST', powerKw: 200, status: 'CHARGING', tempC: 41.2, location: 'B2-A2', updatedAt: new Date().toISOString() },
  { id: 'EV-03', name: 'B2-A구역 초급속 200kW #03', type: 'FAST', powerKw: 200, status: 'CHARGING', tempC: 39.0, location: 'B2-A3', updatedAt: new Date().toISOString() },
  { id: 'EV-04', name: 'B2-B구역 급속 100kW #04', type: 'FAST', powerKw: 100, status: 'CHARGING', tempC: 35.8, location: 'B2-B1', updatedAt: new Date().toISOString() },
  { id: 'EV-05', name: 'B2-B구역 급속 100kW #05', type: 'FAST', powerKw: 100, status: 'CHARGING', tempC: 36.4, location: 'B2-B2', updatedAt: new Date().toISOString() },
  { id: 'EV-06', name: 'B2-B구역 급속 100kW #06', type: 'FAST', powerKw: 100, status: 'STANDBY', tempC: 28.1, location: 'B2-B3', updatedAt: new Date().toISOString() },
  { id: 'EV-07', name: 'B2-C구역 급속 100kW #07', type: 'FAST', powerKw: 100, status: 'CHARGING', tempC: 37.9, location: 'B2-C1', updatedAt: new Date().toISOString() },
  { id: 'EV-08', name: 'B2-C구역 급속 100kW #08', type: 'FAST', powerKw: 100, status: 'CHARGING', tempC: 38.2, location: 'B2-C2', updatedAt: new Date().toISOString() },
  { id: 'EV-09', name: 'B2-C구역 급속 100kW #09', type: 'FAST', powerKw: 100, status: 'STANDBY', tempC: 26.5, location: 'B2-C3', updatedAt: new Date().toISOString() },
  { id: 'EV-10', name: 'B2-D구역 완속 14kW #10', type: 'SLOW', powerKw: 14, status: 'STANDBY', tempC: 24.0, location: 'B2-D1', updatedAt: new Date().toISOString() },
  { id: 'EV-11', name: 'B2-D구역 완속 14kW #11', type: 'SLOW', powerKw: 14, status: 'CHARGING', tempC: 31.0, location: 'B2-D2', updatedAt: new Date().toISOString() },
  { id: 'EV-12', name: 'B2-D구역 완속 14kW #12', type: 'SLOW', powerKw: 14, status: 'STANDBY', tempC: 25.3, location: 'B2-D3', updatedAt: new Date().toISOString() },
  { id: 'EV-13', name: 'B2-E구역 급속 100kW #13', type: 'FAST', powerKw: 100, status: 'MAINTENANCE', tempC: 52.1, location: 'B2-E1', updatedAt: new Date().toISOString() },
  { id: 'EV-14', name: 'B2-E구역 급속 100kW #14', type: 'FAST', powerKw: 100, status: 'MAINTENANCE', tempC: 48.0, location: 'B2-E2', updatedAt: new Date().toISOString() },
  { id: 'EV-15', name: 'B2-F구역 완속 7kW (구형)', type: 'SLOW', powerKw: 7, status: 'DISCARDED', tempC: 0, location: 'B2-F1', updatedAt: new Date().toISOString() },
];

export const useEvChargerStore = create<EvChargerState>((set) => ({
  chargers: INITIAL_CHARGERS,

  addCharger: (chargerData) => set((state) => {
    const newId = `EV-${String(state.chargers.length + 1).padStart(2, '0')}`;
    const newCharger: EvCharger = {
      ...chargerData,
      id: newId,
      updatedAt: new Date().toISOString()
    };
    return { chargers: [...state.chargers, newCharger] };
  }),

  updateChargerStatus: (id, status) => set((state) => ({
    chargers: state.chargers.map(c => c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c)
  })),

  deleteCharger: (id) => set((state) => ({
    chargers: state.chargers.filter(c => c.id !== id)
  }))
}));
