// components/modals/EmergencyOtpModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useEmergencyTimer } from '../../hooks/useEmergencyTimer';
import { useCanvasStore } from '../../store/useCanvasStore';
import { Button } from '../common/Button';
import { ShieldIcon, LockIcon, CheckIcon, AlertIcon } from '../common/Icons';
import { X } from 'lucide-react';

interface EmergencyOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyOtpModal: React.FC<EmergencyOtpModalProps> = ({ isOpen, onClose }) => {
  const { startOtpTimer } = useEmergencyTimer();
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // 모달이 열릴 때 첫 번째 인풋 포커스 및 초기화
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setOtpValues(Array(6).fill(''));
        setErrorMsg('');
        setIsSuccess(false);
        inputRefs.current[0]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC 키 감지 시 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.substring(value.length - 1);
    setOtpValues(newOtpValues);
    setErrorMsg('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDownInput = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    
    if (otpCode.length < 6) {
      setErrorMsg('6자리 OTP 인증코드를 모두 입력해 주십시오.');
      return;
    }

    setIsValidating(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          startOtpTimer();
          useCanvasStore.getState().setViewMode('BUILDING');
          onClose();
        }, 1000);
      } else {
        setErrorMsg(data.message || '인증번호가 일치하지 않습니다. 소방 단말기를 다시 확인하십시오.');
        setOtpValues(Array(6).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMsg('서버와 통신에 실패했습니다. (로컬 테스트 번호: 119119)');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none p-4"
      onClick={onClose}
    >
      <div 
        className="w-[450px] glass-panel border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col p-6 relative bg-[#090e1a]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 cursor-pointer"
          title="닫기 (Esc)"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-3">
            <ShieldIcon size={24} className="animate-pulse" />
          </div>
          <h2 className="text-slate-100 font-extrabold text-base tracking-wide">
            119 소방관 전용 OTP 임시 승인
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[340px] leading-relaxed">
            개인정보보호법 시행령에 의거하여 화재 발생 등 긴급 인명 구조 목적 외의 인원 정보 열람은 통제됩니다. 소방대원 단말기에 발송된 일회용 OTP 6자리를 입력하십시오.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2.5 px-4">
            {otpValues.map((val, idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el as HTMLInputElement; }}
                type="text"
                maxLength={1}
                value={val}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDownInput(idx, e)}
                disabled={isValidating || isSuccess}
                className="w-12 h-14 bg-slate-900 border-2 border-slate-800 rounded-lg text-slate-100 font-mono text-2xl font-bold text-center focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
              />
            ))}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 justify-center text-red-400 text-xs">
              <AlertIcon size={12} />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center gap-1.5 justify-center text-emerald-400 text-xs font-bold">
              <CheckIcon size={14} />
              <span>인증 성공. 인명 조망 마스킹이 해제되었습니다. (상황 종료 시까지 유지)</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 text-xs py-2.5 font-bold"
              disabled={isValidating}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1 text-xs py-2.5 font-bold"
              disabled={isValidating || isSuccess}
              icon={isSuccess ? <CheckIcon size={14} /> : <LockIcon size={14} />}
            >
              {isValidating ? '인증 코드 확인 중...' : isSuccess ? '인증 완료' : 'OTP 확인 및 권한 부여'}
            </Button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center leading-relaxed font-mono">
          로컬 테스트 인증 코드: <span className="text-blue-500 font-bold">119119</span>
        </div>
      </div>
    </div>
  );
};
