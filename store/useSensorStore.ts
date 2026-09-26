// store/useSensorStore.ts
import { create } from 'zustand';
import { SensorNode, SensorStatus, DoorState } from '../types/sensor';
import { FloorId } from '../types/floor';
import { api } from '../lib/client/api';
import { useCanvasStore } from './useCanvasStore';

// 서버 응답을 기다리는 로컬 변경. node 가 null 이면 '로컬에서 지웠다'.
// seq 로 같은 센서에 연달아 보낸 요청 중 마지막 것만 정리한다.
type Pending = { node: SensorNode | null; seq: number };

interface SensorState {
  nodes: SensorNode[];                        // 2D 도면상에 배치된 센서 목록
  activeAlarmCount: number;                   // 현재 발생한 경보(ALARM) 총 개수
  pending: Record<string, Pending>;           // 서버 확인을 기다리는 로컬 변경
  syncError: string | null;                   // 마지막 저장 실패 사유 (화면 상단에 띄운다)

  // Actions
  loadNodes: (nodes: SensorNode[]) => void;
  addNode: (node: SensorNode) => void;
  updateNode: (id: string, fields: Partial<Omit<SensorNode, 'id'>>) => void;
  deleteNode: (id: string) => void;
  clearSyncError: () => void;

  // 상태 변환 편의 기능 (경보 발생 및 해결)
  triggerAlarm: (id: string, value?: number) => void;
  resolveAlarm: (id: string, status?: SensorStatus) => void;

  // 비상문 상태 제어
  updateDoorState: (id: string, state: DoorState) => void;
}

const calculateAlarmCount = (nodes: SensorNode[]): number => {
  return nodes.filter(node => node.status === 'ALARM').length;
};

let seqCounter = 0;

type SaveResponse = { data?: SensorNode; triggerAutoFloorChange?: FloorId };

export const useSensorStore = create<SensorState>((set, get) => {
  const withNodes = (nodes: SensorNode[]) => ({ nodes, activeAlarmCount: calculateAlarmCount(nodes) });

  // 낙관적 반영 → 서버 저장 → 성공이면 서버 값으로 맞추고, 실패면 되돌린 뒤 사유를 띄운다
  const sync = (id: string, next: SensorNode | null, request: () => Promise<SaveResponse>) => {
    const prev = get().nodes.find(n => n.id === id) ?? null;
    const seq = ++seqCounter;
    set((state) => {
      const rest = state.nodes.filter(n => n.id !== id);
      const nodes = next ? (prev ? state.nodes.map(n => (n.id === id ? next : n)) : [...rest, next]) : rest;
      return { ...withNodes(nodes), pending: { ...state.pending, [id]: { node: next, seq } } };
    });

    const settle = (apply: (nodes: SensorNode[]) => SensorNode[], syncError?: string) => set((state) => {
      const pending = { ...state.pending };
      if (pending[id]?.seq === seq) delete pending[id];
      return { ...withNodes(apply(state.nodes)), pending, ...(syncError !== undefined ? { syncError } : {}) };
    });

    request()
      .then((res) => {
        const saved = res.data;
        settle(nodes => (saved ? nodes.map(n => (n.id === id ? saved : n)) : nodes));
        // 서버가 '이 층으로 화면을 옮겨라' 고 알려 주면 (예: B2 전기차 화재) 도면을 그 층으로 전환한다
        if (res.triggerAutoFloorChange) {
          const canvas = useCanvasStore.getState();
          canvas.setFloor(res.triggerAutoFloorChange);
          canvas.setViewMode('CANVAS');
        }
      })
      .catch((err: Error) => {
        settle(nodes => {
          const rest = nodes.filter(n => n.id !== id);
          if (!prev) return rest;                                        // 새로 만든 것 → 없던 일로
          return nodes.some(n => n.id === id) ? nodes.map(n => (n.id === id ? prev : n)) : [...rest, prev];
        }, `저장 실패: ${err.message}`);
      });
  };

  const put = (id: string, fields: Record<string, unknown>) => () =>
    api<SaveResponse>('/api/sensors', { method: 'PUT', json: { id, ...fields } });

  const patch = (id: string, fields: Partial<Omit<SensorNode, 'id'>>) => {
    const cur = get().nodes.find(n => n.id === id);
    if (!cur) return;
    sync(id, { ...cur, ...fields, updatedAt: new Date().toISOString() }, put(id, fields));
  };

  return {
    nodes: [],
    activeAlarmCount: 0,
    pending: {},
    syncError: null,

    // 폴링 결과 반영 — 서버 목록이 기준이다.
    // 다른 단말이 지운 센서는 여기서도 사라져야 한다 (예전에는 로컬 노드를 계속 붙잡아 유령 경보가 남았다).
    // 단, 아직 서버 응답을 기다리는 이 단말의 변경만은 덮지 않는다.
    loadNodes: (serverNodes) => set((state) => {
      const merged = serverNodes
        .filter(n => !(n.id in state.pending && state.pending[n.id].node === null))
        .map(n => state.pending[n.id]?.node ?? n);
      for (const [id, p] of Object.entries(state.pending)) {
        if (p.node && !merged.some(n => n.id === id)) merged.push(p.node);
      }
      return withNodes(merged);
    }),

    addNode: (node) => {
      if (get().nodes.some(n => n.id === node.id)) return;
      sync(node.id, node, () => api<SaveResponse>('/api/sensors', { method: 'POST', json: node }));
    },

    updateNode: (id, fields) => patch(id, fields),

    deleteNode: (id) => {
      sync(id, null, () => api<SaveResponse>(`/api/sensors?id=${encodeURIComponent(id)}`, { method: 'DELETE' }));
    },

    clearSyncError: () => set({ syncError: null }),

    triggerAlarm: (id, value) => patch(id, { status: 'ALARM', ...(value !== undefined ? { value } : {}) }),

    resolveAlarm: (id, status = 'NORMAL') => patch(id, { status }),

    updateDoorState: (id, doorState) => {
      const cur = get().nodes.find(n => n.id === id);
      if (!cur || cur.type !== 'EMERGENCY_DOOR') return;
      patch(id, { doorState });
    },
  };
});
