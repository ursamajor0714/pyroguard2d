// hooks/useEmergencyTimer.ts
import { useCanvasStore } from '../store/useCanvasStore';

export const useEmergencyTimer = () => {
  const {
    isOtpApproved,
    setOtpApproved
  } = useCanvasStore();

  const startOtpTimer = () => {
    setOtpApproved(true);
  };

  // 요청사항 1: 119 상황 종료 버튼 클릭 시 권한 해제 API 연동
  const revoke119Session = async () => {
    try {
      await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REVOKE' })
      });
    } catch {
      // 119 상황 종료 해제 API 실패 시 무시 (로컬 상태는 finally에서 해제)
    } finally {
      setOtpApproved(false);
    }
  };

  return {
    isOtpApproved,
    startOtpTimer,
    revoke119Session
  };
};
