// lib/server/audit.ts
// 감사 로그 — 누가(세션) 언제 인명 정보를 열고 닫았는지, 센서를 바꿨는지 남긴다.
// DATA_DIR/audit.log 에 한 줄에 JSON 하나(JSONL)로 덧붙이고, 서버 로그에도 같은 줄을 찍는다.
// 개인정보(재실자 위치) 자체는 기록하지 않는다 — 열람했다는 사실만 남긴다.
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

export type AuditAction =
  | 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT'
  | 'OTP_APPROVED' | 'OTP_FAILED' | 'OTP_LOCKED' | 'OTP_REJECTED_NO_ALARM' | 'OTP_REVOKED'
  | 'SENSOR_CREATED' | 'SENSOR_UPDATED' | 'SENSOR_DELETED';

export function audit(action: AuditAction, detail: { sid?: string; ip?: string; [k: string]: unknown } = {}) {
  const line = JSON.stringify({ at: new Date().toISOString(), action, ...detail, sid: detail.sid?.slice(0, 8) });
  console.info('[audit]', line);
  try {
    fs.mkdirSync(env.dataDir(), { recursive: true });
    fs.appendFileSync(path.join(env.dataDir(), 'audit.log'), line + '\n');
  } catch (err) {
    console.error('[audit] 기록 실패:', err);
  }
}

/** 요청한 쪽 주소 (프록시 뒤라면 x-forwarded-for 첫 번째) */
export const clientIp = (headers: Headers) => headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
