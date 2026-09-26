// 테스트 공통 — 매 테스트를 빈 임시 DATA_DIR 과 알려진 환경변수로 시작한다
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { resetSensorCache } from '../lib/server/sensorRepo';
import { resetApprovals } from '../lib/server/approvals';
import { issueSession } from '../lib/server/session';

export const TEST_OTP = '314159';

export function freshEnv() {
  process.env.OPERATOR_PASSWORD = 'test-operator-password';
  process.env.SESSION_SECRET = 'test-session-secret-0123456789abcdef';
  process.env.EMERGENCY_OTP = TEST_OTP;
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'pyroguard-test-'));
  resetSensorCache();
  resetApprovals();
}

/** 로그인한 단말 하나 — 서명된 세션 토큰을 Bearer 로 붙인 요청을 만든다 */
export function terminal() {
  const { token } = issueSession();
  return (url: string, init: { method?: string; body?: unknown; raw?: string } = {}) =>
    new NextRequest(new URL(url, 'http://localhost'), {
      method: init.method ?? 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: init.raw ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    });
}

export const anonymous = (url: string, init: { method?: string; body?: unknown } = {}) =>
  new NextRequest(new URL(url, 'http://localhost'), {
    method: init.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
