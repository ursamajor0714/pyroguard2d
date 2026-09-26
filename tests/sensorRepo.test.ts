import { beforeEach, describe, expect, it } from 'vitest';
import { createSensor, deleteSensor, listSensors, resetSensorCache, updateSensor } from '../lib/server/sensorRepo';
import { freshEnv } from './helpers';
import type { SensorNode } from '../types/sensor';

beforeEach(freshEnv);

const node: SensorNode = { id: 'sensor-new', type: 'CCTV', floorId: '1F', x: 1, y: 1, status: 'NORMAL', updatedAt: '' };

describe('sensorRepo', () => {
  it('처음에는 시드 92개로 시작한다', () => {
    expect(listSensors()).toHaveLength(92);
  });

  it('같은 id 는 덮어쓰지 않는다', () => {
    expect(createSensor(node)).not.toBe('exists');
    expect(createSensor({ ...node, type: 'LEAK' })).toBe('exists');
    expect(listSensors().find((s) => s.id === node.id)?.type).toBe('CCTV');
  });

  it('새 센서에 서버 시각을 찍는다', () => {
    const saved = createSensor(node);
    expect(saved !== 'exists' && saved.updatedAt).toBeTruthy();
  });

  it('다른 단말이 먼저 고쳤으면 stale 로 거절한다', () => {
    const [first] = listSensors();
    const stamp = first.updatedAt;
    updateSensor(first.id, { status: 'MAINTENANCE' });
    expect(updateSensor(first.id, { status: 'NORMAL' }, stamp)).toBe('stale');
  });

  it('없는 센서는 missing / 삭제 false', () => {
    expect(updateSensor('nope', { status: 'ALARM' })).toBe('missing');
    expect(deleteSensor('nope')).toBe(false);
  });

  it('재시작(캐시 비움) 뒤에도 파일에서 그대로 읽는다', () => {
    createSensor(node);
    deleteSensor('sensor-ev-smoke');
    resetSensorCache();
    const ids = listSensors().map((s) => s.id);
    expect(ids).toContain('sensor-new');
    expect(ids).not.toContain('sensor-ev-smoke');
  });
});
