// lib/server/revoked.ts
// 로그아웃한 세션 목록 — 토큰은 서명만 확인하므로(서버에 세션 목록이 없다) 로그아웃해도 토큰 자체는 만료 때까지 살아 있다.
// 로그아웃한 sid 를 만료 시각까지 여기 적어 두고, 세션을 확인할 때 걸러 낸다 (빼돌린 토큰을 로그아웃으로 끊을 수 있게).
// DATA_DIR/revoked-sessions.json 에 남겨 서버를 다시 켜도 유지된다. 만료가 지난 항목은 스스로 지운다.
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

const g = globalThis as unknown as { __pgRevoked?: { dir: string; map: Map<string, number> } };

const file = () => path.join(env.dataDir(), 'revoked-sessions.json');

function store(): Map<string, number> {
  const dir = env.dataDir();
  if (g.__pgRevoked?.dir === dir) return g.__pgRevoked.map;
  const map = new Map<string, number>();
  try {
    const saved = JSON.parse(fs.readFileSync(file(), 'utf8')) as Record<string, number>;
    for (const [sid, exp] of Object.entries(saved)) if (typeof exp === 'number' && exp > Date.now()) map.set(sid, exp);
  } catch { /* 처음이면 파일이 없다 */ }
  g.__pgRevoked = { dir, map };
  return map;
}

function save(map: Map<string, number>) {
  try {
    fs.mkdirSync(env.dataDir(), { recursive: true });
    const tmp = file() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(map)));
    fs.renameSync(tmp, file());
  } catch (err) {
    console.error('[revoked] 저장 실패:', err);   // 저장에 실패해도 이 프로세스 안에서는 막힌다
  }
}

/** 이 세션을 만료 시각까지 쓸 수 없게 한다 */
export function revokeSession(sid: string, exp: number) {
  const map = store();
  const now = Date.now();
  for (const [k, e] of map) if (e <= now) map.delete(k);
  map.set(sid, exp);
  save(map);
}

export function isRevoked(sid: string): boolean {
  const exp = store().get(sid);
  return exp !== undefined && exp > Date.now();
}

/** 테스트용 — 메모리를 비워 서버를 다시 켠 것처럼 만든다 (파일은 그대로) */
export function resetRevokedCache() { delete g.__pgRevoked; }
