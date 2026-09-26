// lib/server/sensorRepo.ts
// 센서 배치 저장소 — DATA_DIR/sensors.json 에 저장한다.
// 예전에는 이름만 DynamoDB 인 모듈 변수라서 서버를 재시작·재배포할 때마다 배치가 초기화됐다.
//
// · 파일 쓰기는 임시 파일에 쓰고 rename 한다 — 쓰다가 죽어도 반쪽 파일이 남지 않는다.
// · 읽기·검사·쓰기를 동기 함수로 한 번에 처리한다 — Node 는 한 번에 하나씩만 돌리므로
//   같은 id 동시 등록 같은 경합이 끼어들 틈이 없다.
// · 여러 서버 인스턴스가 한 파일을 나눠 쓰는 구성은 지원하지 않는다 (README 배포 절 참고).
import fs from 'node:fs';
import path from 'node:path';
import type { SensorNode } from '../../types/sensor';
import { env } from './env';
import { generateOfficeBuildingSensors } from './seedSensors';

interface Store { nodes: SensorNode[] | null; file: string }
const g = globalThis as unknown as { __pgSensorStore?: Store };
const store: Store = (g.__pgSensorStore ??= { nodes: null, file: '' });

const fileOf = () => path.join(env.dataDir(), 'sensors.json');

// updatedAt 은 낙관적 잠금의 버전 역할도 한다. 같은 밀리초에 두 번 고쳐도 값이 달라지도록
// 이전 값보다 반드시 뒤의 시각을 준다 (같거나 이르면 1ms 씩 밀어낸다).
function nextStamp(prev?: string): string {
  const now = Date.now();
  const before = prev ? Date.parse(prev) : NaN;
  return new Date(Number.isFinite(before) && before >= now ? before + 1 : now).toISOString();
}

function load(): SensorNode[] {
  const file = fileOf();
  if (store.nodes && store.file === file) return store.nodes;
  store.file = file;
  try {
    store.nodes = JSON.parse(fs.readFileSync(file, 'utf8')) as SensorNode[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') console.error('[sensorRepo] 저장 파일을 읽지 못해 시드로 시작합니다:', err);
    store.nodes = generateOfficeBuildingSensors();
    persist();
  }
  return store.nodes;
}

function persist() {
  const file = fileOf();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store.nodes, null, 1));
    fs.renameSync(tmp, file);
  } catch (err) {
    // 쓰기 금지 파일시스템(서버리스 등)에서도 관제는 계속 돌아야 한다 — 기록만 남긴다
    console.error('[sensorRepo] 저장 실패 (메모리에서는 계속 동작):', err);
  }
}

export function isStorageWritable(): boolean {
  try {
    fs.mkdirSync(env.dataDir(), { recursive: true });
    fs.accessSync(env.dataDir(), fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function listSensors(floorId?: string): SensorNode[] {
  const nodes = load();
  return floorId ? nodes.filter((n) => n.floorId === floorId) : nodes;
}

export function getSensor(id: string): SensorNode | undefined {
  return load().find((n) => n.id === id);
}

/** 새 센서. 같은 id 가 있으면 'exists' */
export function createSensor(sensor: SensorNode): SensorNode | 'exists' {
  const nodes = load();
  if (nodes.some((n) => n.id === sensor.id)) return 'exists';
  const saved = { ...sensor, updatedAt: nextStamp() };
  nodes.push(saved);
  persist();
  return saved;
}

/**
 * 부분 수정. expectedUpdatedAt 을 주면 그 사이 다른 단말이 고쳤는지 본다 (낙관적 잠금).
 * 없으면 'missing', 다른 단말이 먼저 고쳤으면 'stale'.
 */
export function updateSensor(id: string, patch: Partial<SensorNode>, expectedUpdatedAt?: string): SensorNode | 'missing' | 'stale' {
  const nodes = load();
  const i = nodes.findIndex((n) => n.id === id);
  if (i < 0) return 'missing';
  if (expectedUpdatedAt && nodes[i].updatedAt !== expectedUpdatedAt) return 'stale';
  nodes[i] = { ...nodes[i], ...patch, id, updatedAt: nextStamp(nodes[i].updatedAt) };
  persist();
  return nodes[i];
}

export function deleteSensor(id: string): boolean {
  const nodes = load();
  const i = nodes.findIndex((n) => n.id === id);
  if (i < 0) return false;
  nodes.splice(i, 1);
  persist();
  return true;
}

/** 테스트용 — 메모리 캐시를 비워 다음 호출 때 파일(또는 시드)에서 다시 읽게 한다 */
export function resetSensorCache() {
  store.nodes = null;
  store.file = '';
}
