// 화면 스토어 — 폴링 병합과 저장 실패 처리
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSensorStore } from '../store/useSensorStore';
import type { SensorNode } from '../types/sensor';

const A: SensorNode = { id: 'a', type: 'CCTV', floorId: '1F', x: 1, y: 1, status: 'NORMAL', updatedAt: '' };
const B: SensorNode = { id: 'b', type: 'CCTV', floorId: '1F', x: 1, y: 1, status: 'ALARM', updatedAt: '' };

const respond = (status: number, body: unknown) =>
  vi.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response);

beforeEach(() => {
  useSensorStore.setState({ nodes: [], activeAlarmCount: 0, pending: {}, syncError: null });
});

describe('useSensorStore', () => {
  it('다른 단말이 지운 센서는 다음 폴링에서 사라진다 (유령 경보 없음)', () => {
    const s = useSensorStore.getState();
    s.loadNodes([A, B]);
    s.loadNodes([A]);
    expect(useSensorStore.getState().nodes.map((n) => n.id)).toEqual(['a']);
    expect(useSensorStore.getState().activeAlarmCount).toBe(0);
  });

  it('서버가 거절하면 되돌리고 사유를 남긴다', async () => {
    vi.stubGlobal('fetch', respond(400, { success: false, message: '센서 정보가 올바르지 않습니다.' }));
    useSensorStore.getState().loadNodes([A]);
    useSensorStore.getState().updateNode('a', { status: 'ALARM' });
    expect(useSensorStore.getState().nodes[0].status).toBe('ALARM');     // 낙관적 반영
    await vi.waitFor(() => expect(useSensorStore.getState().syncError).toContain('올바르지 않습니다'));
    expect(useSensorStore.getState().nodes[0].status).toBe('NORMAL');    // 되돌림
    vi.unstubAllGlobals();
  });

  it('저장을 기다리는 동안 폴링이 로컬 변경을 덮지 않는다', async () => {
    let release: (v: unknown) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise((r) => { release = r; })));
    useSensorStore.getState().loadNodes([A]);
    useSensorStore.getState().updateNode('a', { x: 50 });
    useSensorStore.getState().loadNodes([A]);                            // 옛 값이 폴링으로 도착
    expect(useSensorStore.getState().nodes[0].x).toBe(50);
    release({ ok: true, status: 200, json: async () => ({ success: true, data: { ...A, x: 50, updatedAt: 't' } }) });
    await vi.waitFor(() => expect(useSensorStore.getState().pending).toEqual({}));
    vi.unstubAllGlobals();
  });
});
