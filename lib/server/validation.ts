// lib/server/validation.ts
// 센서 입력 검증 — 서버가 받는 값은 전부 여기서 거른다.
// 예전에는 아무 값이나 저장돼서 없는 층·목록 밖 상태·5MB 이름·숫자 id(지울 수도 없는) 센서가 생겼다.
import { FLOOR_LIST } from '../../types/floor';
import type { SensorNode } from '../../types/sensor';

export const SENSOR_TYPES = ['EXTINGUISHER', 'HYDRANT', 'WATER_PRESSURE', 'ARC', 'LEAK', 'EMERGENCY_DOOR', 'CCTV', 'CUSTOM'] as const;
export const SENSOR_STATUSES = ['NORMAL', 'MAINTENANCE', 'ALARM', 'OFFLINE'] as const;
export const DOOR_STATES = ['LOCKED', 'UNLOCKED', 'OPENED', 'CLOSED'] as const;
export const FLOOR_IDS: string[] = FLOOR_LIST.map((f) => f.id);

/** 수정할 수 있는 필드 — 여기 없는 필드는 저장하지 않는다 (id·updatedAt 은 서버가 관리) */
const EDITABLE = ['type', 'name', 'floorId', 'x', 'y', 'status', 'powerStatus', 'autoCloseDelay', 'customEmoji', 'fov', 'doorState', 'value'] as const;

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const inRange = (v: unknown, min: number, max: number) => isNum(v) && v >= min && v <= max;
const oneOf = <T extends readonly string[]>(list: T, v: unknown): v is T[number] => typeof v === 'string' && list.includes(v);

export const isValidSensorId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(id);
export const isValidFloorId = (id: unknown): id is string => typeof id === 'string' && FLOOR_IDS.includes(id);

/** 한 필드씩 본다. 필드가 있으면 형식이 맞아야 한다 */
function checkFields(s: Record<string, unknown>, errors: string[]) {
  if ('type' in s && !oneOf(SENSOR_TYPES, s.type)) errors.push(`type 은 ${SENSOR_TYPES.join('/')} 중 하나여야 합니다.`);
  if ('floorId' in s && !isValidFloorId(s.floorId)) errors.push('floorId 가 없는 층입니다.');
  if ('status' in s && !oneOf(SENSOR_STATUSES, s.status)) errors.push(`status 는 ${SENSOR_STATUSES.join('/')} 중 하나여야 합니다.`);
  if ('x' in s && !inRange(s.x, 0, 100)) errors.push('x 는 0~100(%) 숫자여야 합니다.');
  if ('y' in s && !inRange(s.y, 0, 100)) errors.push('y 는 0~100(%) 숫자여야 합니다.');
  if ('name' in s && s.name !== undefined && (typeof s.name !== 'string' || s.name.length > 100)) errors.push('name 은 100자 이하 문자열이어야 합니다.');
  if ('customEmoji' in s && s.customEmoji !== undefined && (typeof s.customEmoji !== 'string' || s.customEmoji.length > 16)) errors.push('customEmoji 는 16자 이하여야 합니다.');
  if ('powerStatus' in s && s.powerStatus !== undefined && s.powerStatus !== 'ON' && s.powerStatus !== 'OFF') errors.push('powerStatus 는 ON/OFF 여야 합니다.');
  if ('autoCloseDelay' in s && s.autoCloseDelay !== undefined && !(Number.isInteger(s.autoCloseDelay) && inRange(s.autoCloseDelay, 0, 600))) errors.push('autoCloseDelay 는 0~600(초) 정수여야 합니다.');
  if ('doorState' in s && s.doorState !== undefined && !oneOf(DOOR_STATES, s.doorState)) errors.push(`doorState 는 ${DOOR_STATES.join('/')} 중 하나여야 합니다.`);
  if ('value' in s && s.value !== undefined && !inRange(s.value, 0, 100_000)) errors.push('value 는 0 이상 숫자여야 합니다.');
  if ('fov' in s && s.fov !== undefined) {
    const f = s.fov as Record<string, unknown> | null;
    if (!f || typeof f !== 'object' || !inRange(f.distance, 1, 100) || !inRange(f.angle, 1, 360) || !inRange(f.rotation, 0, 360)) {
      errors.push('fov 는 { distance 1~100, angle 1~360, rotation 0~360 } 이어야 합니다.');
    }
  }
}

/** 완성된 센서 하나가 규칙에 맞는가 (필수 필드 + 필드 간 규칙) */
function checkWhole(s: Record<string, unknown>, errors: string[]) {
  for (const k of ['type', 'floorId', 'x', 'y', 'status'] as const) if (!(k in s)) errors.push(`${k} 가 필요합니다.`);
  checkFields(s, errors);
}

const pick = (src: Record<string, unknown>) =>
  Object.fromEntries(EDITABLE.filter((k) => k in src && src[k] !== undefined).map((k) => [k, src[k]]));

/** POST — 새 센서 */
export function validateNewSensor(body: Record<string, unknown>): Result<SensorNode> {
  const errors: string[] = [];
  if (!isValidSensorId(body.id)) errors.push('id 는 영문·숫자·-·_ 1~80자 문자열이어야 합니다.');
  const fields = pick(body);
  checkWhole(fields, errors);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { ...(fields as Omit<SensorNode, 'id' | 'updatedAt'>), id: body.id as string, updatedAt: '' } };
}

/**
 * PUT — 부분 수정. 바꿀 필드만 골라 검증하고, 기존 값과 합친 결과가 규칙에 맞는지도 본다.
 * 비상문 fail-safe: 전원이 꺼지면 전자식 잠금이 풀려야 한다.
 *   · 전원만 OFF 로 바꾸면 → 잠금을 UNLOCKED 로 함께 바꾼다
 *   · 전원 OFF 인데 LOCKED 로 저장하라는 요청은 → 거절한다
 */
export function validatePatch(existing: SensorNode, body: Record<string, unknown>): Result<Partial<SensorNode>> {
  const errors: string[] = [];
  const patch = pick(body) as Partial<SensorNode>;
  checkFields(patch as Record<string, unknown>, errors);
  if (errors.length) return { ok: false, errors };
  const merged = { ...existing, ...patch };
  if (merged.type === 'EMERGENCY_DOOR' && merged.powerStatus === 'OFF') {
    if (patch.doorState === 'LOCKED') return { ok: false, errors: ['전원이 꺼진 비상문은 잠글 수 없습니다 (정전 시 fail-safe 개방).'] };
    if (merged.doorState === 'LOCKED') patch.doorState = 'UNLOCKED';
  }
  checkWhole({ ...existing, ...patch } as unknown as Record<string, unknown>, errors);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: patch };
}
