// hooks/useEmergencyTimer.ts
// 119 승인 상태는 서버가 정한다. 화면은 GET /api/emergency 를 주기적으로 받아 맞춘다 —
// 다른 단말에서 상황 종료했거나 유효시간이 지나면 이 화면도 곧바로 다시 마스킹된다.
import { useCallback } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { useOccupantStore, Occupant } from '../store/useOccupantStore';
import { api } from '../lib/client/api';

type EmergencyState = { approved: boolean; expiresAt?: string; occupants?: Occupant[] };

/** 서버의 승인 상태·재실자 목록을 스토어에 반영한다 */
export async function refreshEmergencyState() {
  try {
    const res = await api<EmergencyState>('/api/emergency', { cache: 'no-store' });
    useCanvasStore.getState().setOtpApproved(res.approved);
    if (res.approved) useOccupantStore.getState().setOccupants(res.occupants ?? []);
    else if (useOccupantStore.getState().occupants.length) useOccupantStore.getState().resetOccupants();
  } catch {
    // 통신 실패 시 다음 폴링에서 다시 시도 (401 이면 api() 가 로그인 화면으로 보낸다)
  }
}

export const useEmergencyTimer = () => {
  const isOtpApproved = useCanvasStore((s) => s.isOtpApproved);

  // OTP 승인 직후 — 서버에서 재실자 목록을 받아 온다
  const startOtpTimer = useCallback(() => {
    void refreshEmergencyState();
  }, []);

  // 119 상황 종료 — 서버에 해제를 알리고, 결과와 상관없이 이 화면은 즉시 다시 마스킹한다
  const revoke119Session = useCallback(async () => {
    try {
      await api('/api/emergency', { method: 'POST', json: { action: 'REVOKE' } });
    } catch {
      // 해제 요청이 실패해도 화면은 잠근다. 서버 승인은 유효시간이 지나면 풀린다.
    } finally {
      useCanvasStore.getState().setOtpApproved(false);
      useOccupantStore.getState().resetOccupants();
    }
  }, []);

  return {
    isOtpApproved,
    startOtpTimer,
    revoke119Session
  };
};
