// components/common/AlarmCenterToast.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSensorStore } from '../../store/useSensorStore';
import { FloorId } from '../../types/floor';
import { Siren, ArrowRight, X } from 'lucide-react';

export const AlarmCenterToast: React.FC = () => {
  const { setFloor, setViewMode, dismissedToastId, setDismissedToastId } = useCanvasStore();
  const { nodes, activeAlarmCount } = useSensorStore();

  // ALARM 상태인 첫 번째 센서 노드 추출
  const alarmNode = nodes.find(n => n.status === 'ALARM');

  if (activeAlarmCount === 0 || !alarmNode || alarmNode.id === dismissedToastId) {
    return null;
  }

  const handleToastClick = () => {
    // 1. 해당 경보 층으로 관제 화면 즉시 이동 (요청사항 1 반영)
    setFloor(alarmNode.floorId as FloorId);
    setViewMode('CANVAS');
    // 2. 토스트 팝업 해제 (요청사항 2 반영)
    setDismissedToastId(alarmNode.id);
  };

  const handleDismissOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedToastId(alarmNode.id);
  };

  return (
    <AnimatePresence>
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          onClick={handleToastClick}
          className="glass-panel border-2 border-red-500 bg-red-950/90 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-red-500/40 flex items-center gap-4 cursor-pointer hover:bg-red-900 transition-all duration-200 group border-glow"
        >
          {/* 사이렌 아이콘 */}
          <div className="p-2.5 rounded-xl bg-red-600 border border-red-400 text-white animate-bounce shrink-0">
            <Siren size={24} />
          </div>

          {/* 경보 정보 텍스트 */}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white text-red-600 uppercase font-mono">
                {alarmNode.floorId}
              </span>
              <h4 className="font-extrabold text-sm tracking-wide text-red-100">
                센서 이상 경보 발생! [{alarmNode.name || alarmNode.type}]
              </h4>
            </div>
            <p className="text-[11px] text-red-200 mt-0.5 font-medium flex items-center gap-1">
              <span>클릭 시 해당 <strong className="underline text-white">{alarmNode.floorId} 층 관제 도면</strong>으로 즉시 이동합니다.</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition text-white" />
            </p>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={handleDismissOnly}
            className="p-1.5 text-red-300 hover:text-white rounded-lg hover:bg-red-800/60 transition ml-2 cursor-pointer"
            title="팝업 닫기"
          >
            <X size={18} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
