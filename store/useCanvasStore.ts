// store/useCanvasStore.ts
import { create } from 'zustand';
import { FloorId } from '../types/floor';

export type ViewMode = 'BUILDING' | 'CANVAS';
export type LeftTab = 'FLOORS' | 'STATUS_119';

interface CanvasState {
  viewMode: ViewMode;                         // 현재 메인 뷰 모드 ('BUILDING': 건물 전체 조감도, 'CANVAS': 2D 도면 관제)
  activeLeftTab: LeftTab;                     // 좌측 메인 메뉴 탭
  selectedFloor: FloorId;                     // 현재 관제 중인 층
  zoomScale: number;                          // 캔버스 줌 배율 (0.5x ~ 5.0x)
  panX: number;                               // 캔버스 X축 평행이동 값 (px)
  panY: number;                               // 캔버스 Y축 평행이동 값 (px)
  isLocked: boolean;                          // 센서 노드 위치 수정 잠금 상태
  isOtpApproved: boolean;                     // 119 소방대원 OTP 승인 완료 상태
  otpTimeLeft: number;                        // OTP 승인 유효 남은 시간
  activeCctvId: string | null;                // 실시간 팝업 모달이 켜진 CCTV 노드의 ID
  dismissedCctvId: string | null;             // 사용자가 수동으로 닫은 CCTV 노드의 ID (자동 재팝업 루프 방지)
  isFireLogModalOpen: boolean;                // 소방점검 이력 정밀 관리페이지 모달 열림 여부
  isSensorManageModalOpen: boolean;           // 센서 상세 관리 및 커스텀 생성 모달 열림 여부
  isEvChargerModalOpen: boolean;              // B2 전기차 충전기 점검/폐기/설치 관리 모달 열림 여부
  isCctvMatrixModalOpen: boolean;             // CCTV 동시 시청 다채널 비디오월 스크린 모달 열림 여부
  dismissedToastId: string | null;            // 사용자가 클릭하여 닫은 알람 토스트 ID
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setActiveLeftTab: (tab: LeftTab) => void;
  setFloor: (floor: FloorId) => void;
  setZoomScale: (scale: number) => void;
  setPan: (x: number, y: number) => void;
  resetZoom: () => void;
  setLocked: (locked: boolean) => void;
  setOtpApproved: (approved: boolean) => void;
  setOtpTimeLeft: (time: number) => void;
  setActiveCctvId: (id: string | null) => void;
  setDismissedCctvId: (id: string | null) => void;
  setFireLogModalOpen: (open: boolean) => void;
  setSensorManageModalOpen: (open: boolean) => void;
  setEvChargerModalOpen: (open: boolean) => void;
  setCctvMatrixModalOpen: (open: boolean) => void;
  setDismissedToastId: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  viewMode: 'BUILDING',
  activeLeftTab: 'FLOORS',
  selectedFloor: '1F',
  zoomScale: 1.0,
  panX: 0,
  panY: 0,
  isLocked: true,
  isOtpApproved: false,
  otpTimeLeft: 600,
  activeCctvId: null,
  dismissedCctvId: null,
  isFireLogModalOpen: false,
  isSensorManageModalOpen: false,
  isEvChargerModalOpen: false,
  isCctvMatrixModalOpen: false,
  dismissedToastId: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),

  setFloor: (floor) => set({ 
    selectedFloor: floor,
    zoomScale: 1.0,
    panX: 0,
    panY: 0
  }),
  
  setZoomScale: (scale) => set(() => {
    const boundedScale = Math.max(0.5, Math.min(5.0, scale));
    return { zoomScale: boundedScale };
  }),
  
  setPan: (x, y) => set({ panX: x, panY: y }),
  
  resetZoom: () => set({ 
    zoomScale: 1.0, 
    panX: 0, 
    panY: 0 
  }),
  
  setLocked: (locked) => set({ isLocked: locked }),
  setOtpApproved: (approved) => set({ isOtpApproved: approved }),
  setOtpTimeLeft: (time: number) => set({ otpTimeLeft: time }),
  setActiveCctvId: (id) => set({ activeCctvId: id }),
  setDismissedCctvId: (id) => set({ dismissedCctvId: id }),
  setFireLogModalOpen: (open) => set({ isFireLogModalOpen: open }),
  setSensorManageModalOpen: (open) => set({ isSensorManageModalOpen: open }),
  setEvChargerModalOpen: (open) => set({ isEvChargerModalOpen: open }),
  setCctvMatrixModalOpen: (open) => set({ isCctvMatrixModalOpen: open }),
  setDismissedToastId: (id) => set({ dismissedToastId: id }),
}));
