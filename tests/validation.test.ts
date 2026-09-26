import { describe, expect, it } from 'vitest';
import { validateNewSensor, validatePatch } from '../lib/server/validation';
import type { SensorNode } from '../types/sensor';

const base = { id: 'sensor-test-1', type: 'CCTV', floorId: '1F', x: 10, y: 20, status: 'NORMAL' };

describe('validateNewSensor', () => {
  it('정상 센서를 받는다', () => {
    const r = validateNewSensor({ ...base, name: '테스트', fov: { distance: 20, angle: 90, rotation: 0 } });
    expect(r.ok).toBe(true);
  });

  it.each([
    ['목록 밖 type', { type: 'BOGUS' }],
    ['없는 층', { floorId: '99F' }],
    ['목록 밖 status', { status: 'HACKED' }],
    ['도면 밖 x', { x: -1 }],
    ['문자열 y', { y: 'abc' }],
    ['숫자 id — DELETE ?id= 로 지울 수 없게 된다', { id: 12345 }],
    ['공백 id', { id: '   ' }],
    ['너무 긴 이름', { name: 'x'.repeat(101) }],
    ['720도 화각', { fov: { distance: 20, angle: 720, rotation: 0 } }],
  ])('%s 를 거절한다', (_, over) => {
    expect(validateNewSensor({ ...base, ...over }).ok).toBe(false);
  });

  it('스키마 밖 필드는 버린다', () => {
    const r = validateNewSensor({ ...base, evil: 'x' });
    expect(r.ok && 'evil' in r.value).toBe(false);
  });
});

describe('validatePatch — 비상문 fail-safe', () => {
  const door: SensorNode = { id: 'd', type: 'EMERGENCY_DOOR', floorId: 'B1', x: 1, y: 1, status: 'NORMAL', doorState: 'LOCKED', powerStatus: 'ON', updatedAt: '' };

  it('전원만 OFF 로 바꾸면 잠금이 풀린다', () => {
    const r = validatePatch(door, { powerStatus: 'OFF' });
    expect(r.ok && r.value.doorState).toBe('UNLOCKED');
  });

  it('전원 OFF 인 문을 LOCKED 로 저장하라는 요청은 거절한다', () => {
    expect(validatePatch(door, { powerStatus: 'OFF', doorState: 'LOCKED' }).ok).toBe(false);
  });

  it('음수 측정값을 거절한다', () => {
    expect(validatePatch(door, { value: -5 }).ok).toBe(false);
  });
});
