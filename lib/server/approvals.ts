// lib/server/approvals.ts
// 119 OTP 승인 — 승인은 '그 세션(단말)' 에만, 정해진 시간 동안만 준다.
// 예전에는 서버 전역 변수 하나라서 한 단말이 승인하면 모든 단말이 인명 정보를 받았다.
// 개발 서버의 모듈 재로딩에도 상태가 유지되도록 globalThis 에 둔다. 서버를 재시작하면 모든 승인이 풀린다 (안전한 쪽).
import { env } from './env';

const MAX_FAILURES = 5;            // 연속 오답 허용 횟수
const LOCK_MS = 5 * 60_000;        // 넘으면 이만큼 잠근다

interface State {
  approvals: Map<string, number>;                                  // sid → 만료 시각
  failures: Map<string, { count: number; lockedUntil: number }>;   // sid → 오답 기록
}
const g = globalThis as unknown as { __pgApprovals?: State };
const state: State = (g.__pgApprovals ??= { approvals: new Map(), failures: new Map() });

export function approvalOf(sid: string): number | null {
  const exp = state.approvals.get(sid);
  if (!exp) return null;
  if (exp < Date.now()) { state.approvals.delete(sid); return null; }
  return exp;
}

export function approve(sid: string): number {
  const exp = Date.now() + env.approvalTtlMs();
  state.approvals.set(sid, exp);
  state.failures.delete(sid);
  return exp;
}

export function revoke(sid: string): boolean {
  return state.approvals.delete(sid);
}

/** 잠겨 있으면 풀리는 시각, 아니면 null */
export function lockedUntil(sid: string): number | null {
  const f = state.failures.get(sid);
  if (!f || f.lockedUntil < Date.now()) return null;
  return f.lockedUntil;
}

/** 오답 하나를 센다. 잠기게 되면 풀리는 시각을 돌려준다 */
export function recordFailure(sid: string): number | null {
  const now = Date.now();
  const f = state.failures.get(sid);
  const count = f && f.lockedUntil < now && f.count >= MAX_FAILURES ? 1 : (f?.count ?? 0) + 1;
  const lockedUntil = count >= MAX_FAILURES ? now + LOCK_MS : 0;
  state.failures.set(sid, { count, lockedUntil });
  return lockedUntil || null;
}

/** 테스트용 초기화 */
export function resetApprovals() {
  state.approvals.clear();
  state.failures.clear();
}
