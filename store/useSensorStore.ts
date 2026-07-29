// store/useSensorStore.ts
import { create } from 'zustand';
import { SensorNode, SensorStatus, DoorState } from '../types/sensor';

interface SensorState {
  nodes: SensorNode[];                        // 2D 도면상에 배치된 센서 목록
  activeAlarmCount: number;                   // 현재 발생한 경보(ALARM) 총 개수
  
  // Actions
  loadNodes: (nodes: SensorNode[]) => void;
  addNode: (node: SensorNode) => void;
  updateNode: (id: string, fields: Partial<Omit<SensorNode, 'id'>>) => void;
  deleteNode: (id: string) => void;
  
  // 상태 변환 편의 기능 (경보 발생 및 해결)
  triggerAlarm: (id: string, value?: number) => void;
  resolveAlarm: (id: string, status?: SensorStatus) => void;
  
  // 비상문 상태 제어
  updateDoorState: (id: string, state: DoorState) => void;
}

const calculateAlarmCount = (nodes: SensorNode[]): number => {
  return nodes.filter(node => node.status === 'ALARM').length;
};

export const useSensorStore = create<SensorState>((set) => ({
  nodes: [],
  activeAlarmCount: 0,

  loadNodes: (nodes) => set((state) => {
    // 로컬에서 방금 추가했거나 수정한 노드가 서버 응답보다 신규일 경우 보존
    const merged = [...nodes];
    state.nodes.forEach(localNode => {
      if (!merged.some(n => n.id === localNode.id)) {
        merged.push(localNode);
      }
    });

    return { 
      nodes: merged,
      activeAlarmCount: calculateAlarmCount(merged)
    };
  }),

  addNode: (node) => {
    set((state) => {
      if (state.nodes.some(n => n.id === node.id)) return {};
      const updated = [...state.nodes, node];
      return { 
        nodes: updated,
        activeAlarmCount: calculateAlarmCount(updated)
      };
    });

    // 3초 폴링 시 소멸 방지: 백엔드 API DB 동기화 (POST)
    fetch('/api/sensors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node)
    }).catch(() => {});
  },

  updateNode: (id, fields) => {
    set((state) => {
      const updated = state.nodes.map((node) => 
        node.id === id 
          ? { ...node, ...fields, updatedAt: new Date().toISOString() } 
          : node
      );
      return { 
        nodes: updated,
        activeAlarmCount: calculateAlarmCount(updated)
      };
    });

    // 백엔드 API DB 동기화 (PUT)
    fetch('/api/sensors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields })
    }).catch(() => {});
  },

  deleteNode: (id) => {
    set((state) => {
      const updated = state.nodes.filter((node) => node.id !== id);
      return { 
        nodes: updated,
        activeAlarmCount: calculateAlarmCount(updated)
      };
    });

    // 백엔드 API DB 동기화 (DELETE)
    fetch(`/api/sensors?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(() => {});
  },

  triggerAlarm: (id, value) => {
    set((state) => {
      const updated = state.nodes.map((node) => 
        node.id === id 
          ? { 
              ...node, 
              status: 'ALARM' as SensorStatus, 
              value: value !== undefined ? value : node.value,
              updatedAt: new Date().toISOString() 
            } 
          : node
      );
      return { 
        nodes: updated,
        activeAlarmCount: calculateAlarmCount(updated)
      };
    });

    fetch('/api/sensors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'ALARM', ...(value !== undefined ? { value } : {}) })
    }).catch(() => {});
  },

  resolveAlarm: (id, status = 'NORMAL') => {
    set((state) => {
      const updated = state.nodes.map((node) => 
        node.id === id 
          ? { 
              ...node, 
              status, 
              updatedAt: new Date().toISOString() 
            } 
          : node
      );
      return { 
        nodes: updated,
        activeAlarmCount: calculateAlarmCount(updated)
      };
    });

    fetch('/api/sensors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    }).catch(() => {});
  },

  updateDoorState: (id, doorState) => {
    set((state) => {
      const updated = state.nodes.map((node) => 
        node.id === id && node.type === 'EMERGENCY_DOOR'
          ? { 
              ...node, 
              doorState, 
              updatedAt: new Date().toISOString() 
            } 
          : node
      );
      return { 
        nodes: updated 
      };
    });

    fetch('/api/sensors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, doorState })
    }).catch(() => {});
  },
}));
