// lib/server/env.ts
// 서버 설정값 — 전부 환경변수에서 읽는다. 비밀(비밀번호·OTP·서명키)을 코드에 두지 않는다.
// 로컬은 .env.local, 배포는 호스팅의 환경변수 설정에 넣는다 (.env.example 참고).
import path from 'node:path';

export const env = {
  /** 관제실 운영자 로그인 비밀번호 */
  operatorPassword: () => process.env.OPERATOR_PASSWORD || '',
  /** 세션 쿠키 서명 키 (32자 이상 무작위 문자열) */
  sessionSecret: () => process.env.SESSION_SECRET || '',
  /** 119 소방관 OTP (6자리 숫자) */
  emergencyOtp: () => process.env.EMERGENCY_OTP || '',
  /** 119 승인 유지 시간 (분) — 지나면 자동으로 다시 마스킹된다 */
  approvalTtlMs: () => Math.max(1, Number(process.env.APPROVAL_TTL_MINUTES) || 30) * 60_000,
  /** 운영자 세션 유지 시간 (시간) */
  sessionTtlMs: () => Math.max(1, Number(process.env.SESSION_TTL_HOURS) || 12) * 3_600_000,
  /** 다른 출처에서 API 를 부를 수 있게 허용할 주소 목록 (쉼표 구분). 비우면 같은 출처만 */
  corsAllowedOrigins: () => (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  /** 센서 배치·감사 로그를 저장할 폴더 */
  dataDir: () => process.env.DATA_DIR || path.join(process.cwd(), '.data'),
};

/** 로그인에 필요한 설정이 다 들어 있는가 */
export const authConfigured = () => env.operatorPassword().length > 0 && env.sessionSecret().length >= 16;
/** OTP 설정이 올바른가 */
export const otpConfigured = () => /^\d{6}$/.test(env.emergencyOtp());
